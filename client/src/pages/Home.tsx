import { useContext, useEffect, useState } from "react";

// components
import { PageContainer, DroppedAssetDetails, SearchBar, SearchResult } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

import { AssetInfo } from "@/context/types";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          setGameState(dispatch, response.data);
        })
        .catch((error) => setErrorMessage(dispatch, error))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasInteractiveParams]);

  const onSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      console.log("about to call asset-search");
      const resp = await backendAPI.get("/asset-search", {
        params: { search: searchTerm.trim() },
      });
      console.log("asset-search response:", resp.status, resp.data);
      if (resp.data.success) {
        // transform each full DroppedAsset into only the fields we need
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
    <PageContainer isLoading={isLoading} headerText="Content Manager">
      {/* Search bar */}
      <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={onSearch} isSearching={searching} />

      {/* Results */}
      {assets.length > 0 ? (
        <ul className="rtsdk-results-list">
          {assets.map((asset) => (
            <SearchResult key={asset.assetId} {...asset} />
          ))}
        </ul>
      ) : (
        <p>No assets found.</p>
      )}
    </PageContainer>
  );
};

export default Home;
