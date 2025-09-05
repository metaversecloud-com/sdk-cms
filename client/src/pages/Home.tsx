import { useContext, useEffect, useState } from "react";

// components
import { PageContainer, ContentList } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

import { AssetInfo } from "@/context/types";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { hasInteractiveParams } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/visitor")
        .then((response) => {
          dispatch({ type: "SET_IS_ADMIN", payload: { isAdmin: response.data.isAdmin } });

          // setLoadingContentList(true);
          return backendAPI.get("/content-list");
        })
        .then((resp) => {
          if (resp.data.success) {
            const map = resp.data.refreshedDroppedAssets as Record<string, AssetInfo>;
            dispatch({ type: "SET_CONTENT_MAP", payload: map });
          } else {
            dispatch({ type: "SET_CONTENT_MAP", payload: {} });
          }
        })
        .catch((error) => setErrorMessage(dispatch, error))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasInteractiveParams, dispatch]);

  return (
    <PageContainer isLoading={isLoading} headerText="Featured Content" adminHeaderText="Search">
      <div className="mb-6">
        View the latest featured content in this world. Admins can update links and manage assets to keep it current.
      </div>
      <ContentList />
    </PageContainer>
  );
};

export default Home;
