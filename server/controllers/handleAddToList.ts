import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleAddToList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { uniqueName, topLayerURL, bottomLayerURL, id, position, links, assetName } = req.body;

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};

    currentDroppedAssets[id] = { uniqueName, topLayerURL, bottomLayerURL, position, profileId, links, assetName };

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { ...dataObject, droppedAssets: currentDroppedAssets },
      {
        analytics: [
          {
            analyticName: "content_list_adds",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
        lock: { lockId, releaseLock: true },
      },
    );

    return res.json({ id, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAddToList",
      message: "Error adding dropped asset to list",
      req,
      res,
    });
  }
};
