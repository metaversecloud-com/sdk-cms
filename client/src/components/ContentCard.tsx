import { useContext } from "react";
import type { AssetInfo } from "@/context/types";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface ContentCardProps extends AssetInfo {
  assetId: string;
}

export const ContentCard = ({ assetId, uniqueName, topLayerURL, bottomLayerURL }: ContentCardProps) => {
  const imageURL = topLayerURL || bottomLayerURL || "";
  const dispatch = useContext(GlobalDispatchContext);

  const onTeleport = async () => {
    try {
      const resp = await backendAPI.get("/asset-search");

      if (resp.data.success) {

      } else {

      }
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    } finally {

    }
  };

  return (
    <div className="card small" key={assetId}>
      <div className="card-image">{imageURL && <img src={imageURL} alt={uniqueName} />}</div>

      <div className="card-details">
        <h4 className="card-title">{uniqueName}</h4>
        <p className="card-description p2">ID: {assetId}</p>

        <div className="card-actions">
          {/* example action buttons—swap in your own icons/handlers */}
          <button className="btn btn-icon" aria-label="Edit">
            <img src="https://sdk-style.s3.amazonaws.com/icons/edit.svg" alt="" />
          </button>
          <button className="btn btn-icon" aria-label="Teleport To" onClick={onTeleport}>
            <img src="https://sdk-style.s3.amazonaws.com/icons/walk.svg" alt="" />
          </button>
        </div>
      </div>
    </div>
  );
};