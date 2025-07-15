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

  const [contentMap, setContentMap] = useState<Record<string, AssetInfo>>({});
  // const [loadingContentList, setLoadingContentList] = useState(false);

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          setGameState(dispatch, response.data);

          // setLoadingContentList(true);
          // return backendAPI.get("/content-list");
        })
        // .then((resp) => {
        //   if (resp.data.success) {
        //     const map = resp.data.refreshedDroppedAssets as Record<string, AssetInfo>;
        //     setContentMap(map);
        //   } else {
        //     setContentMap({});
        //   }
        // })
        .catch((error) => setErrorMessage(dispatch, error))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasInteractiveParams]);

  return (
    <PageContainer isLoading={isLoading} headerText="Content Manager">
      content list
    </PageContainer>
  );
};

export default Home;
