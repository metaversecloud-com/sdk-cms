import { errorHandler } from "./errorHandler.js";
import { World } from "@rtsdk/topia";

export const initializeWorldDataObject = async (world: World) => {
  try {
    // if !world?.dataObject?.droppedAssets
    // if the above turns out to be not falsey: if (there's no keys in droppedAssets)
    await world.fetchDataObject();
    const dataObject = world.dataObject || {};

    if (!(dataObject as any).droppedAssets) {
      const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await world.setDataObject({ ...dataObject, droppedAssets: {} }, { lock: { lockId, releaseLock: true } });
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeWorldDataObject",
      message: "Error initializing world data object",
    });
    return await world.fetchDataObject();
  }
};
