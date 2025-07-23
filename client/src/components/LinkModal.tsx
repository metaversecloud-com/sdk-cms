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
    const s = ln.clickableLink.trim();
    if (s === "") return true; // allow empty → treated as deletion

    // 1) must start with http:// or https://
    const m = s.match(/^(https?):\/\/([^\/]+)(\/.*)?$/i);
    if (!m) return false;

    const host = m[2];
    // 2) disallow dangling dot
    if (host.endsWith(".")) return false;

    const parts = host.split(".");
    if (parts.length === 1) {
      // single‐label host: must start with a letter
      return /^[A-Za-z][A-Za-z0-9-]*$/.test(parts[0]);
    }

    // multi‐label host: each segment can start with letter or digit
    return parts.every((seg) => /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(seg));
  });

  const onUpdate = async () => {
    if (!isValid) return;
    setLoading(true);
    setDisabled(true);
    try {
      const resp = await backendAPI.put("/update-link", { assetId, links });
      const newLinks: ClickableLinkInfo[] = resp.data.newLinks;

      setLinks(newLinks);

      //  correct local context
      const newMap = {
        ...contentMap,
        [assetId]: {
          ...contentMap[assetId],
          links: newLinks,
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

  // ui only action
  const onLinkDelete = (index: number) => {
    setLinks((prev) =>
      prev.map((ln, i) =>
        i === index
          ? { ...ln, clickableLink: "" } // clear the URL
          : ln,
      ),
    );
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
            <button className=" ml-2 p-2" onClick={() => onLinkDelete(i)} disabled={disabled || loading}>
              <img src="https://sdk-style.s3.amazonaws.com/icons/delete.svg" width={20} height={20} />
            </button>
          </div>
        ))}

        {links.length < 5 && (
          <div className="mb-4 flex justify-center">
            <button className="btn btn-icon" onClick={addField} disabled={disabled || loading}>
              <img src="https://sdk-style.s3.amazonaws.com/icons/chevronDown.svg" width={20} height={20} />
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
