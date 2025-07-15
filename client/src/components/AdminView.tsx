import { useContext, useState } from "react";

// components
import {
  SearchBar,
  SearchResult,
  PageFooter,
  ConfirmationModal,
} from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { AssetInfo } from "@/context/types";

export const AdminView = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { droppedAsset } = useContext(GlobalStateContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [searching, setSearching] = useState(false);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);


  const onSearch = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setSearching(true);
    try {
      const resp = await backendAPI.get("/asset-search", {
        params: { search: trimmed },
      });

      if (resp.data.success) {
        const paredDown: AssetInfo[] = resp.data.assets.map((a: any) => ({
          assetId: a.assetId,
          uniqueName: a.uniqueName,
          topLayerURL: a.topLayerURL,
          bottomLayerURL: a.bottomLayerURL,
        }));
        setAssets(paredDown);
      } else {
        setAssets([]);
      }
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={onSearch}
        isSearching={searching}
      />

      {/* search results */}
      {assets.length > 0 ? (
        <ul className="rtsdk-results-list">
          {assets.map((asset) => (
            <SearchResult key={asset.assetId} {...asset} />
          ))}
        </ul>
      ) : (
        <p>No assets found.</p>
      )}
    </>
  );
};

export default AdminView;
