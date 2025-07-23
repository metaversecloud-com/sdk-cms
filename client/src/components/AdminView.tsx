import { useContext, useState } from "react";

// components
import { SearchBar, SearchResult, PageFooter, ConfirmationModal } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { AssetInfo } from "@/context/types";

export const AdminView = () => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { contentMap = {} } = useContext(GlobalStateContext);
  const isAdded = (assetId: string) => assetId in contentMap;

  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState<AssetInfo[]>([]);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const onSearch = async (searchValue?: string) => {
    const trimmed = (searchValue ?? searchTerm).trim();
    if (!trimmed) return;

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
          position: a.position,
          links: a.clickableLinks,
          assetName: a.assetName,
        }));
        setAssets(paredDown);
      } else {
        setAssets([]);
      }
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    }
  };

  const handleReset = async () => {
    try {
      const resp = await backendAPI.put("/reset-list");

      if (resp.data.success) {
        console.log("Successfully reset the droppedAssets inside the world data object for CMS list");
        dispatch({ type: "SET_CONTENT_MAP", payload: {} });
      }
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    }
  };

  return (
    <>
      <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={onSearch} />

      {/* search results */}
      {assets.length > 0 ? (
        <ul className="rtsdk-results-list">
          {assets.map((asset) => (
            <SearchResult key={asset.assetId} {...asset} isAdded={isAdded(asset.assetId)} />
          ))}
        </ul>
      ) : (
        <div className="text-center">
          <h4>No results found</h4>
          <p className="p1 mt-4">There are no assets in the world with a matching unique name</p>
        </div>
      )}

      <PageFooter>
        <button className="btn btn-danger" onClick={() => setShowConfirmationModal(true)} disabled={areButtonsDisabled}>
          Reset Content List
        </button>
      </PageFooter>

      {showConfirmationModal && (
        <ConfirmationModal
          title="Reset content list?"
          message="This will clear the current content list for this world. Are you sure?"
          handleOnConfirm={handleReset}
          handleToggleShowConfirmationModal={() => setShowConfirmationModal((s) => !s)}
        />
      )}
    </>
  );
};

export default AdminView;
