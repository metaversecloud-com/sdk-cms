import { useContext, useEffect, useState } from "react";

import { AssetInfo } from "@context/types";
import { backendAPI, setErrorMessage } from "@utils/index";

import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

interface SearchResultProps extends AssetInfo {
  isAdded: boolean;
  assetName: string;
}

export const SearchResult = ({
  uniqueName,
  topLayerURL,
  bottomLayerURL,
  assetId,
  position,
  links,
  isAdded,
  assetName,
}: SearchResultProps) => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { contentMap = {} } = useContext(GlobalStateContext);

  const imageURL = topLayerURL !== "" ? topLayerURL : bottomLayerURL;

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(isAdded);

  // sync isAdded changes
  useEffect(() => {
    setAdded(isAdded);
  }, [isAdded]);

  const handleAddToList = async () => {
    if (added) return;
    setAdding(true);
    try {
      const resp = await backendAPI.post("/add-to-list", {
        uniqueName,
        topLayerURL,
        bottomLayerURL,
        assetId,
        position,
        links,
        assetName,
      });
      if (resp.data.success) {
        setAdded(true);
        const newMap = {
          ...contentMap,
          [assetId]: { uniqueName, topLayerURL, bottomLayerURL, position, links, assetName },
        };
        dispatch({ type: "SET_CONTENT_MAP", payload: newMap });
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
      <div className="card-image" style={{ overflow: "hidden" }}>
        {imageURL && <img src={imageURL} alt={uniqueName} />}
      </div>

      <div className="card-details">
        <h4 className="card-title">{assetName}</h4>
        <p className="card-description p2">{uniqueName}</p>

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
