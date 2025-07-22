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
    <div className="card-grid">
      {entries.map(([assetId, info]) => (
        <ContentCard
          key={assetId}
          assetId={assetId}
          uniqueName={info.uniqueName}
          topLayerURL={info.topLayerURL}
          bottomLayerURL={info.bottomLayerURL}
          position={info.position}
          links={info.links}
          assetName={info.assetName}
        />
      ))}
    </div>
  );
};
