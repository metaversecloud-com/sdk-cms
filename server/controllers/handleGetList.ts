import { Request, Response } from "express";
import { World, DroppedAsset, errorHandler, getCredentials } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleGetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;

    const world = World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const droppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};

    // filter for the users profileId
    const userDroppedAssets = Object.fromEntries(
      Object.entries(droppedAssets).filter(([_, asset]) => asset.profileId === profileId),
    );

    // for each remaining droppedAsset (keyed by assetId), get the asset by assetId to refresh top and bottom URL preview image and repopulate the world data object with that data.
    for (const assetId of Object.keys(userDroppedAssets)) {
      console.log("assetId:  ", assetId);

      const da = await DroppedAsset.get(assetId, credentials.urlSlug, { credentials, });
      await da.fetchDroppedAssetById();
      const daWithInterface = da as DroppedAssetInterface;
      console.log("clickable link?: ", daWithInterface.clickableLink);
      console.log("toplayerurl?: ", daWithInterface.topLayerURL);

      userDroppedAssets[assetId] = {
        ...userDroppedAssets[assetId],
        topLayerURL: daWithInterface.topLayerURL ?? userDroppedAssets[assetId].topLayerURL,
        bottomLayerURL: daWithInterface.bottomLayerURL ?? userDroppedAssets[assetId].bottomLayerURL,
      };
    }

    const refreshedDroppedAssets = { ...droppedAssets, ...userDroppedAssets };

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject({ droppedAssets: refreshedDroppedAssets }, { lock: { lockId, releaseLock: true } });


    return res.json({ refreshedDroppedAssets, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetList",
      message: "Error added dropped asset to list",
      req,
      res,
    });
  }
};
