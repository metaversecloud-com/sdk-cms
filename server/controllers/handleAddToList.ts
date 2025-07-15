import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleAddToList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { uniqueName, topLayerURL, bottomLayerURL, assetId } = req.body;

    const world = World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};

    currentDroppedAssets[assetId] = { uniqueName, topLayerURL, bottomLayerURL, profileId };

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { ...dataObject, droppedAssets: currentDroppedAssets },
      { lock: { lockId, releaseLock: true } },
    );

    await world.fetchDataObject();
    const newDataObject = (world.dataObject as any) || {};
    console.log("updated world data object: ", newDataObject);

    return res.json({ assetId, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAddToList",
      message: "Error added dropped asset to list",
      req,
      res,
    });
  }
};
