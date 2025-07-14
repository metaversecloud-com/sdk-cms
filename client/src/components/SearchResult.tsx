import { AssetInfo } from "@context/types";

export const SearchResult = ({ uniqueName, topLayerURL, bottomLayerURL, assetId }: AssetInfo) => {
  const imageURL = topLayerURL !== "" ? topLayerURL : bottomLayerURL;

  return (
    <li className="card p-3 mb-2">
      <strong>{uniqueName}</strong>
      <img src={imageURL} alt={uniqueName} />
    </li>
  );
};
