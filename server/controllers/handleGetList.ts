import { Request, Response } from "express";
import { World, DroppedAsset, errorHandler, getCredentials } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleGetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);

    const world = World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const droppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};

    const refreshedDroppedAssets: Record<string, any> = {};
    for (const assetId of Object.keys(droppedAssets)) {
      const uName = droppedAssets[assetId].uniqueName;
      if (uName) {
        // @TODO: weird things may happen if multiple assets w/ same uniqueName, find proper way or fix
        const assets = (await world.fetchDroppedAssetsWithUniqueName({
          uniqueName: uName,
          isPartial: false,
        })) as DroppedAssetInterface[];
        const { topLayerURL, bottomLayerURL } = assets[0];
        refreshedDroppedAssets[assetId] = {
          ...droppedAssets[assetId],
          topLayerURL: topLayerURL ?? droppedAssets[assetId].topLayerURL,
          bottomLayerURL: bottomLayerURL ?? droppedAssets[assetId].bottomLayerURL,
        };
      }
    }

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject({ droppedAssets: refreshedDroppedAssets }, { lock: { lockId, releaseLock: true } });

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
