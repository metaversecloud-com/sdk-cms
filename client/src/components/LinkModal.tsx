import { useState, useContext, useEffect, useRef } from "react";
import { backendAPI, setErrorMessage } from "@/utils";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import type { ClickableLinkInfo, ErrorType } from "@/context/types";

// tooltip component
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

interface LinkPreview {
  title?: string;
  description?: string;
  image?: string | null;
}

export const LinkModal = ({
  id,
  currentLinks,
  onClose,
}: {
  id: string;
  currentLinks: ClickableLinkInfo[];
  onClose: () => void;
}) => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { contentMap = {} } = useContext(GlobalStateContext);

  // max 20 links
  const maxLinks = 20;
  const [links, setLinks] = useState<ClickableLinkInfo[]>(() => {
    const head = currentLinks.slice(0, maxLinks);
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
  const [previews, setPreviews] = useState<(LinkPreview | null)[]>(Array(maxLinks).fill(null));

  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    (async () => {
      try {
        const resp = await backendAPI.put<{
          previews: { clickableLink: string; preview: LinkPreview | null }[];
        }>("/preview-links", { links });
        const fetched = resp.data.previews;

        // build fixed-length array
        const newPreviews: (LinkPreview | null)[] = Array(maxLinks)
          .fill(null)
          .map((_, i) => {
            return i < fetched.length ? fetched[i].preview : null;
          });

        setPreviews(newPreviews);
      } catch (err) {
        console.error("Failed to load link previews", err as ErrorType);
        // we won’t block the UI—just leave previews as null
      }
    })();
  }, []);

  const onUpdate = async () => {
    if (!isValid) return;
    setLoading(true);
    setDisabled(true);
    try {
      const resp = await backendAPI.put("/update-link", { id, links });
      const newLinks: ClickableLinkInfo[] = resp.data.newLinks;

      setLinks(newLinks);

      //  correct local context
      const newMap = {
        ...contentMap,
        [id]: {
          ...contentMap[id],
          links: newLinks,
        },
      };
      dispatch({ type: "SET_CONTENT_MAP", payload: newMap });
      onClose();
    } catch (err) {
      setErrorMessage(dispatch, err as ErrorType);
    } finally {
      setLoading(false);
      setDisabled(false);
    }
  };

  const addField = () => {
    if (links.length < maxLinks) {
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
      <div className="modal" style={{ overflow: "visible" }}>
        <h4>Update Asset Links</h4>

        <div className="max-h-64 overflow-y-auto space-y-4 mb-4" ref={scrollRef}>
          {links.map((ln, i) => {
            const isEditing = editingRows.has(i) || !ln.linkId;
            const preview = previews[i];

            return (
              <div key={i} className="mb-6 grid grid-cols-[1fr_auto] gap-x-2">
                <div className="flex flex-col space-y-2">
                  {!isEditing ? (
                    // Imported library for tooltips vv
                    <Tippy
                      content={
                        preview ? (
                          <div className="bg-white border rounded shadow p-2" style={{ width: 200 }}>
                            {preview.image && (
                              <img src={preview.image} alt="" className="w-full h-32 object-cover rounded" />
                            )}
                            {preview.title && <h5 className="mt-1 font-semibold text-sm">{preview.title}</h5>}
                            {preview.description && <p className="text-xs text-gray-600">{preview.description}</p>}
                          </div>
                        ) : (
                          // NO PREVIEW DATA
                          <div
                            className="bg-white border rounded shadow p-2 text-center text-sm text-gray-500"
                            style={{ width: 200 }}
                          >
                            No preview available
                          </div>
                        )
                      }
                      placement="bottom-start"
                      offset={[0, 8]}
                      interactive={false}
                      delay={[100, 50]}
                      appendTo={() => scrollRef.current!}
                    >
                      <a
                        href={ln.clickableLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="input p1 underline break-words"
                        style={{ textAlign: "left", width: "215px", minWidth: "215px", overflow: "hidden" }}
                      >
                        {ln.clickableLink}
                      </a>
                    </Tippy>
                  ) : (
                    // edit mode input
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
                    className="input"
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
                    style={{ width: "215px", minWidth: "215px" }}
                  >
                    <option value="drawer">Drawer</option>
                    <option value="modal">Modal</option>
                    <option value="newTab">New Tab</option>
                  </select>
                </div>

                {/* delete button */}
                <button className="p-2" onClick={() => onLinkDelete(i)} disabled={disabled || loading}>
                  <img src="https://sdk-style.s3.amazonaws.com/icons/delete.svg" />
                </button>
              </div>
            );
          })}
        </div>

        {links.length < maxLinks && (
          <div className="mb-4 flex justify-center">
            <button className="btn btn-icon" onClick={addField} disabled={disabled || loading}>
              <img src="https://sdk-style.s3.amazonaws.com/icons/add.svg" />
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
