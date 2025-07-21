import { useContext, useEffect, useState } from "react";

// components
import { PageContainer, ContentList } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

import { AssetInfo } from "@/context/types";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext)!;
  const { hasInteractiveParams } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          setGameState(dispatch, response.data);

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
    <PageContainer isLoading={isLoading} headerText="Content" adminHeaderText="Search">
      <ContentList />
    </PageContainer>
  );
};

export default Home;
