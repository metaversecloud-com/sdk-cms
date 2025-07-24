import { useContext, useState } from "react";
import type { AssetInfo } from "@/context/types";
import type { ClickableLinkInfo } from "@/context/types";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

//components
import LinkModal from "./LinkModal";

interface ContentCardProps extends AssetInfo {
  assetId: string;
}

export const ContentCard = ({
  assetId,
  uniqueName,
  topLayerURL,
  bottomLayerURL,
  position,
  links,
}: ContentCardProps) => {
  const imageURL = topLayerURL || bottomLayerURL || "";
  const dispatch = useContext(GlobalDispatchContext);
  const { visitor } = useContext(GlobalStateContext);
  const usableLinks: ClickableLinkInfo[] = [];
  for (let link of links) {
    if (link) usableLinks.push(link);
  }
  const linkStrings = links.map((ln) => ln.clickableLink);
  const linksText = linkStrings.join(", ");

  const [showLinkModal, setShowLinkModal] = useState(false);

  const onTeleport = async () => {
    try {
      const resp = await backendAPI.put("/teleport", { assetId, position });

      if (resp.data.success) {
        console.log("teleported to ", assetId, " successfully");
      }
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    } finally {
    }
  };

  return (
    <>
      <div className="card small" key={assetId}>
        <div className="card-image" style={{ overflow: "hidden" }}>
          {imageURL && <img src={imageURL} alt={uniqueName} />}
        </div>

        <div className="card-details">
          <h4 className="card-title">{uniqueName}</h4>
          <p className="card-description p2">{linksText}</p>

          <div className="card-actions">
            {visitor?.isAdmin && (
              <button className="btn btn-icon" aria-label="Edit" onClick={() => setShowLinkModal(true)}>
                <img src="https://sdk-style.s3.amazonaws.com/icons/edit.svg" alt="" />
              </button>
            )}
            <button className="btn btn-icon" aria-label="Teleport To" onClick={onTeleport}>
              <img src="https://sdk-style.s3.amazonaws.com/icons/walk.svg" alt="" />
            </button>
          </div>
        </div>
      </div>

      {showLinkModal && (
        <LinkModal assetId={assetId} currentLinks={usableLinks} onClose={() => setShowLinkModal(false)} />
      )}
    </>
  );
};
