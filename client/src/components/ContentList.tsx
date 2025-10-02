import { useContext } from "react";

import { GlobalStateContext } from "@/context/GlobalContext";

import { ContentCard } from "./ContentCard";

export const ContentList = () => {
  const { contentMap = {} } = useContext(GlobalStateContext);
  const entries = Object.entries(contentMap);

  if (entries.length === 0) {
    return (
      <div className="text-center">
        <h4>Your content list is empty</h4>
        <p className="p1 mt-4">No assets have been added to your content list.</p>
      </div>
    );
  }

  return (
    <div className="card-grid space-y-2">
      {entries.map(([id, info]) => (
        <ContentCard
          key={id}
          id={id}
          uniqueName={info.uniqueName}
          topLayerURL={info.topLayerURL}
          bottomLayerURL={info.bottomLayerURL}
          links={info.links}
          assetName={info.assetName}
        />
      ))}
    </div>
  );
};
