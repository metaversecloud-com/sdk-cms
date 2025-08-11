import { Credentials } from "../types/index.js";
import { errorHandler, World } from "./index.js";

export const getWorldDataObject = async (credentials: Credentials) => {
  try {
    const world = World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};

    if (!dataObject.droppedAssets) {
      const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await world.setDataObject({ droppedAssets: {} }, { lock: { lockId, releaseLock: true } });
    }

    const droppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};

    return { world, droppedAssets };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getWorldDataObject",
      message: "Error getting world and data object",
    });
  }
};
