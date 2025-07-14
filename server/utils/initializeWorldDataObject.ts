import { errorHandler } from "./errorHandler.js";

// change everything to world
export const initializeWorldDataObject = async () => {
  try {
    // if !world?.dataObject?.droppedAssets
    // if the above turns out to be not falsey: if (there's no keys in droppedAssets)
    if (!droppedAsset?.dataObject?.droppedAssetCount) {
      // adding a lockId and releaseLock will prevent race conditions and ensure the data object is being updated only once until either the time has passed or the operation is complete
      const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      // await world.setDataObject([droppedAssets: {}]);
      // run a test to check if we've already set with {} that this doesnt run again. Tweak line 7 if it does run again...
      await droppedAsset
        .setDataObject({ droppedAssetCount: 0 }, { lock: { lockId, releaseLock: true } })
        .catch(() => console.warn("Unable to acquire lock, another process may be updating the data object"));
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeDroppedAssetDataObject",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
