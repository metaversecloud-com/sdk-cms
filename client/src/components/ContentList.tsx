import { ContentCard } from "./ContentCard";
import type { AssetInfo } from "@/context/types";

interface ContentListProps {
  contentMap: Record<string, AssetInfo>;
}

export const ContentList = ({ contentMap }: ContentListProps) => {
  const entries = Object.entries(contentMap);

  if (entries.length === 0) {
    return (
      <>
        <h4>No results found</h4>
        <p className="p1">
          There are no assets in the world with a matching unique name
        </p>
      </>
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
        />
      ))}
    </div>
  );
};
