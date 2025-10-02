import { useContext, useState } from "react";

import { AssetInfo, ErrorType } from "@context/types";
import { backendAPI, setErrorMessage } from "@utils/index";

import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

interface SearchResultProps extends AssetInfo {
  assetName: string;
  areButtonsDisabled: boolean;
  setAreButtonsDisabled: (disabled: boolean) => void;
}

export const SearchResult = ({
  areButtonsDisabled,
  setAreButtonsDisabled,
  uniqueName,
  topLayerURL,
  bottomLayerURL,
  id,
  links,
  assetName,
}: SearchResultProps) => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { contentMap = {} } = useContext(GlobalStateContext);

  const imageURL = topLayerURL !== "" ? topLayerURL : bottomLayerURL;

  const [updating, setUpdating] = useState(false);

  const handleUpdateList = async () => {
    setUpdating(true);
    setAreButtonsDisabled(true);
    if (contentMap[id]) {
      await backendAPI
        .post("/remove-from-list", { id })
        .then(() => {
          delete contentMap[id];
          dispatch({ type: "SET_CONTENT_MAP", payload: contentMap });
        })
        .catch((error) => {
          setErrorMessage(dispatch, error as ErrorType);
        })
        .finally(() => {
          setUpdating(false);
          setAreButtonsDisabled(false);
        });
    } else {
      await backendAPI
        .post("/add-to-list", {
          uniqueName,
          topLayerURL,
          bottomLayerURL,
          id,
          links,
          assetName,
        })
        .then(() => {
          const newMap = {
            ...contentMap,
            [id]: { uniqueName, topLayerURL, bottomLayerURL, links, assetName },
          };
          dispatch({ type: "SET_CONTENT_MAP", payload: newMap });
        })
        .catch((error) => {
          setErrorMessage(dispatch, error as ErrorType);
        })
        .finally(() => {
          setUpdating(false);
          setAreButtonsDisabled(false);
        });
    }
  };

  return (
    <li className="card small">
      <div className="card-image" style={{ overflow: "hidden" }}>
        {imageURL && <img src={imageURL} alt={uniqueName} />}
      </div>

      <div className="card-details">
        <h4
          className="card-title"
          style={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {assetName}
        </h4>
        <p className="card-description p2">{uniqueName}</p>

        <div className="card-actions">
          <button
            className="btn btn-icon"
            disabled={updating || areButtonsDisabled}
            onClick={handleUpdateList}
            aria-label={updating ? "updating..." : contentMap[id] ? "Remove from list" : "Add to list"}
          >
            {updating ? (
              "..."
            ) : contentMap[id] ? (
              <img src="https://sdk-style.s3.amazonaws.com/icons/check.svg" alt="" />
            ) : (
              <img src="https://sdk-style.s3.amazonaws.com/icons/add.svg" alt="" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
};
