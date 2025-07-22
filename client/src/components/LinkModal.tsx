import { useState, useContext } from "react";
import { backendAPI, setErrorMessage } from "@/utils";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import type { ClickableLinkInfo } from "@/context/types";

export const LinkModal = ({
  assetId,
  currentLinks,
  onClose,
}: {
  assetId: string;
  currentLinks: ClickableLinkInfo[];
  onClose: () => void;
}) => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { contentMap = {} } = useContext(GlobalStateContext);

  // max 5 links
  const [links, setLinks] = useState<ClickableLinkInfo[]>(() => {
    const head = currentLinks.slice(0, 5);
    return head.length > 0
      ? head
      : [
          {
            clickableLink: "",
            clickableLinkTitle: "",
            isForceLinkInIframe: false,
            isOpenLinkInDrawer: false,
            linkId: "",
          },
        ];
  });

  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // make sure link is ok
  const isValid = links.every((ln) => {
    const t = ln.clickableLink.trim().toLowerCase();
    return t.startsWith("https://") || t.startsWith("http://");
  });

  const onUpdate = async () => {
    if (!isValid) return;
    setLoading(true);
    setDisabled(true);
    try {
      await backendAPI.put("/update-link", { assetId, links });
      const newMap = {
        ...contentMap,
        [assetId]: {
          ...contentMap[assetId],
          links,
        },
      };
      dispatch({ type: "SET_CONTENT_MAP", payload: newMap });
      onClose();
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    } finally {
      setLoading(false);
      setDisabled(false);
    }
  };

  const addField = () => {
    if (links.length < 5) {
      setLinks([
        ...links,
        {
          clickableLink: "",
          clickableLinkTitle: "",
          isForceLinkInIframe: false,
          isOpenLinkInDrawer: false,
          linkId: "",
        },
      ]);
    }
  };

  const onLinkDelete = async (index: number) => {
    const toDelete = links[index];

    // ui correct
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);

    // update globaL context and backend
    try {
      if (toDelete.linkId) {
        await backendAPI.delete("/delete-link", {
          params: { assetId, linkId: toDelete.linkId },
        });
      }

      const newMap = {
        ...contentMap,
        [assetId]: {
          ...contentMap[assetId],
          links: updatedLinks,
        },
      };
      dispatch({ type: "SET_CONTENT_MAP", payload: newMap });
    } catch (err: any) {
      // roll back UI
      setLinks(links);
      setErrorMessage(dispatch, err);
    }
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <h4>Update Asset Links</h4>

        {links.map((ln, i) => (
          <div key={i} className="mb-4 flex items-center">
            <input
              type="text"
              className="input flex-grow"
              value={ln.clickableLink}
              onChange={(e) => {
                const copy = [...links];
                copy[i] = { ...copy[i], clickableLink: e.target.value };
                setLinks(copy);
              }}
              placeholder="https://example.com"
            />
            <button className="btn btn-icon" onClick={() => onLinkDelete(i)} disabled={disabled || loading}>
              <img src="https://sdk-style.s3.amazonaws.com/icons/delete.svg" alt="Delete link" width={20} height={20} />
            </button>
          </div>
        ))}

        {/* add btn below ! */}
        {links.length < 5 && (
          <div className="mb-4 flex justify-center">
            <button className="btn btn-icon" onClick={addField} disabled={disabled || loading}>
              <img
                src="https://sdk-style.s3.amazonaws.com/icons/chevronDown.svg"
                alt="Add link"
                width={20}
                height={20}
              />
            </button>
          </div>
        )}

        {!isValid && <p className="p3 text-error">All URLs must start with “https://” or “http://”</p>}

        <div className="actions">
          <button className="btn" onClick={onUpdate} disabled={disabled || loading || links.length === 0 || !isValid}>
            {loading ? "Updating…" : "Update"}
          </button>
          <button className="btn btn-outline" onClick={onClose} disabled={disabled || loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;
