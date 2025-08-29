import { useContext, useState } from "react";

// components
import { SearchBar, SearchResult, PageFooter, ConfirmationModal } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { AssetInfo, ErrorType } from "@/context/types";

export const AdminView = () => {
  const dispatch = useContext(GlobalDispatchContext)!;

  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState<AssetInfo[]>([]);

  const [showClearConfirmationModal, setShowClearConfirmationModal] = useState(false);
  const [showResetConfirmationModal, setShowResetConfirmationModal] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const onSearch = async (searchValue?: string) => {
    const trimmed = (searchValue ?? searchTerm).trim();
    if (!trimmed) return;

    try {
      const resp = await backendAPI.get("/asset-search", {
        params: { search: trimmed },
      });

      if (resp.data.success) {
        const paredDown: AssetInfo[] = resp.data.assets.map((a: AssetInfo) => ({
          id: a.id,
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
    } catch (err) {
      setErrorMessage(dispatch, err as ErrorType);
    }
  };

  const handleClear = async () => {
    setAreButtonsDisabled(true);

    await backendAPI
      .put("/clear-list")
      .then((response) => {
        if (response.data.success) {
          console.log("Successfully cleared the droppedAssets inside the world data object for CMS list");
          dispatch({ type: "SET_CONTENT_MAP", payload: {} });
        }
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const handleReset = async () => {
    setAreButtonsDisabled(true);

    await backendAPI
      .put("/reset-list")
      .then((response) => {
        if (response.data.success) {
          console.log("Successfully reset the droppedAssets inside the world data object for CMS list");
          dispatch({ type: "SET_CONTENT_MAP", payload: {} });
        }
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  return (
    <>
      <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={onSearch} />

      {searchTerm === "" ? (
        <div className="my-2">
          <h5>Add a New Asset to the Content Manager</h5>
          <p>Search by the asset’s unique name to get started.</p>
          <br />
          <p>
            Once added, the asset will appear on the main page, where you can attach and edit linked content anytime.
          </p>
        </div>
      ) : assets.length > 0 ? (
        /* they typed something and we have matches */
        <ul className="my-2">
          {assets.map((asset) => (
            <SearchResult
              key={asset.id}
              {...asset}
              areButtonsDisabled={areButtonsDisabled}
              setAreButtonsDisabled={setAreButtonsDisabled}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center">
          <h4>No results found</h4>
          <div className="my-5">
            <p>There are no assets in the world with a matching unique name. To update or edit a unique name:</p>
            <ol className="text-left list-decimal pl-6 pt-4 p1">
              <li>Enter builder mode</li>
              <li>Click an asset</li>
              <li>
                On the edit menu that opens on the right side of the screen, enter a unique name in the designated
                field.
              </li>
            </ol>
          </div>
        </div>
      )}

      <PageFooter>
        <button
          className="btn btn-danger-outline mb-2"
          onClick={() => setShowClearConfirmationModal(true)}
          disabled={areButtonsDisabled}
        >
          Remove all items from list
        </button>
        <button
          className="btn btn-danger"
          onClick={() => setShowResetConfirmationModal(true)}
          disabled={areButtonsDisabled}
        >
          Reset Content List
        </button>
      </PageFooter>

      {showClearConfirmationModal && (
        <ConfirmationModal
          title="Clear content list?"
          message="This will clear the current content list for this world. All links will remain unchanged. Are you sure?"
          handleOnConfirm={handleClear}
          handleToggleShowConfirmationModal={() => setShowClearConfirmationModal((s) => !s)}
        />
      )}
      {showResetConfirmationModal && (
        <ConfirmationModal
          title="Reset content list?"
          message="This will reset the current content list for this world. All links will be removed. Are you sure?"
          handleOnConfirm={handleReset}
          handleToggleShowConfirmationModal={() => setShowResetConfirmationModal((s) => !s)}
        />
      )}
    </>
  );
};

export default AdminView;
