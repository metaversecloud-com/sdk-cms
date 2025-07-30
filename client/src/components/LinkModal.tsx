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

  // max 20 links
  const [links, setLinks] = useState<ClickableLinkInfo[]>(() => {
    const head = currentLinks.slice(0, 20);
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
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // make sure link is ok
  const isValid = links.every((ln) => {
    const s = ln.clickableLink.trim();
    if (s === "") return true; // allow empty bc treated as deletion

    // http:// or https://
    const m = s.match(/^(https?):\/\/([^\/]+)(\/.*)?$/i);
    if (!m) return false;

    const host = m[2];
    if (host.endsWith(".")) return false;

    const parts = host.split(".");
    if (parts.length === 1) {
      return /^[A-Za-z][A-Za-z0-9-]*$/.test(parts[0]);
    }
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
    if (links.length < 20) {
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
    setEditingRows((prev) => new Set(prev).add(index));
    setLinks((prev) => prev.map((ln, i) => (i === index ? { ...ln, clickableLink: "" } : ln)));
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <h4>Update Asset Links</h4>

        <div className="max-h-64 overflow-y-auto space-y-4 mb-4">
          {links.map((ln, i) => {
            const isEditing = editingRows.has(i) || !ln.linkId;

            return (
              <div key={i} className="mb-6 grid grid-cols-[1fr_auto] gap-x-2">
                <div className="flex flex-col space-y-2">
                  {!isEditing ? (
                    // DISPLAY MODE: show a real clickable link
                    <a
                      href={ln.clickableLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="input p1 underline break-words"
                      style={{ textAlign: "left", maxWidth: "225px", overflow: "hidden" }}
                    >
                      {ln.clickableLink}
                    </a>
                  ) : (
                    // EDIT MODE: show the URL input
                    <input
                      type="text"
                      className="input w-full"
                      value={ln.clickableLink}
                      onChange={(e) => {
                        const copy = [...links];
                        copy[i] = { ...copy[i], clickableLink: e.target.value };
                        setLinks(copy);
                      }}
                      placeholder="https://example.com"
                    />
                  )}

                  {/* dropdown menu */}
                  <select
                    className="input w-full"
                    value={ln.isOpenLinkInDrawer ? "drawer" : ln.isForceLinkInIframe ? "modal" : "newTab"}
                    onChange={(e) => {
                      const mode = e.target.value;
                      const copy = [...links];
                      copy[i] = {
                        ...copy[i],
                        isOpenLinkInDrawer: mode === "drawer",
                        isForceLinkInIframe: mode === "modal",
                      };
                      setLinks(copy);
                    }}
                    style={{ maxWidth: "225px", overflow: "hidden" }}
                  >
                    <option value="drawer">Drawer</option>
                    <option value="modal">Modal</option>
                    <option value="newTab">New Tab</option>
                  </select>
                </div>

                {/* Right column: delete button, vertically centered */}
                <button className="p-2" onClick={() => onLinkDelete(i)} disabled={disabled || loading}>
                  <img
                    src="https://sdk-style.s3.amazonaws.com/icons/delete.svg"
                    width={20}
                    height={20}
                    alt="Delete link"
                  />
                </button>
              </div>
            );
          })}
        </div>

        {links.length < 20 && (
          <div className="mb-4 flex justify-center">
            <button className="btn btn-icon" onClick={addField} disabled={disabled || loading}>
              <img src="https://sdk-style.s3.amazonaws.com/icons/plus.svg" width={20} height={20} />
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
