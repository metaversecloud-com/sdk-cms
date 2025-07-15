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
    <li className="card p-3 mb-2">
      <strong>{uniqueName}</strong>
      {imageURL && (<img src={imageURL} alt={uniqueName}/>)}

      <button
        className="btn btn-primary mt-3"
        onClick={handleAddToList}
        disabled={adding || added}
      >
        {adding ? "Adding…" : added ? "Added" : "Add To List"}
      </button>
    </li>
  );
};
