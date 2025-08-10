import { Request, Response } from "express";
import { DroppedAsset, World, errorHandler, getCredentials } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleGetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const droppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};

    const refreshedDroppedAssets: Record<string, any> = {};

    const promises = [];
    for (const id of Object.keys(droppedAssets)) {
      promises.push(DroppedAsset.get(id, urlSlug, { credentials: { ...credentials, id } }));
    }
    const droppedAssetsList: DroppedAssetInterface[] = await Promise.all(promises);

    for (const droppedAsset of droppedAssetsList) {
      const { id, topLayerURL, bottomLayerURL, clickableLinks } = droppedAsset;
      refreshedDroppedAssets[id!] = {
        ...droppedAssets[id!],
        topLayerURL: topLayerURL ?? droppedAssets[id!].topLayerURL,
        bottomLayerURL: bottomLayerURL ?? droppedAssets[id!].bottomLayerURL,
        links: clickableLinks,
      };
    }

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject(
      { droppedAssets: refreshedDroppedAssets },
      {
        analytics: [
          {
            analyticName: "starts",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
        lock: { lockId, releaseLock: true },
      },
    );

    return res.json({ refreshedDroppedAssets, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetList",
      message: "Error getting list",
      req,
      res,
    });
  }
};
