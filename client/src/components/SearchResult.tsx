import { useContext, useEffect, useState } from "react";

import { AssetInfo } from "@context/types";
import { backendAPI, setErrorMessage } from "@utils/index";

import { GlobalDispatchContext } from "@/context/GlobalContext";

export const SearchResult = ({ uniqueName, topLayerURL, bottomLayerURL, assetId }: AssetInfo) => {
  const dispatch = useContext(GlobalDispatchContext);
  const imageURL = topLayerURL !== "" ? topLayerURL : bottomLayerURL;

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToList = async () => {
    setAdding(true);
    try {
      const resp = await backendAPI.post("/add-to-list", { uniqueName, topLayerURL, bottomLayerURL, assetId });
      if (resp.data.success) {
        setAdded(true);
      } else {
        console.warn("Add to list failed:", resp.data);
      }
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <li className="card small">
      <div className="card-image">{imageURL && <img src={imageURL} alt={uniqueName} />}</div>

      <div className="card-details">
        <h4 className="card-title">{uniqueName}</h4>
        <p className="card-description p2">ID: {assetId}</p>

        <div className="card-actions">
          <button
            className="btn btn-icon"
            onClick={handleAddToList}
            disabled={adding || added}
            aria-label={adding ? "Adding..." : added ? "Added to list" : "Add to list"}
          >
            {adding ? (
              "..."
            ) : added ? (
              <img src="https://sdk-style.s3.amazonaws.com/icons/check.svg" alt="" />
            ) : (
              <img src="https://sdk-style.s3.amazonaws.com/icons/star.svg" alt="" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
};
