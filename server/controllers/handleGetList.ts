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
    // const userDroppedAssets = Object.fromEntries(
    //   Object.entries(droppedAssets).filter(([_, asset]) => asset.profileId === profileId),
    // );

    // for each remaining droppedAsset (keyed by assetId), get the asset by assetId to refresh top and bottom URL preview image and repopulate the world data object with that data.

    // for (const assetId of Object.keys(droppedAssets)) {
    //   console.log("assetId:  ", assetId);

    //   const da = await DroppedAsset.get(assetId, credentials.urlSlug, { credentials, });
    //   await da.fetchDroppedAssetById();
    //   const daWithInterface = da as DroppedAssetInterface;
    //   console.log("clickable link?: ", daWithInterface.clickableLink);
    //   console.log("toplayerurl?: ", daWithInterface.topLayerURL);

    //   droppedAssets[assetId] = {
    //     ...droppedAssets[assetId],
    //     topLayerURL: daWithInterface.topLayerURL ?? droppedAssets[assetId].topLayerURL,
    //     bottomLayerURL: daWithInterface.bottomLayerURL ?? droppedAssets[assetId].bottomLayerURL,
    //   };
    // }

    const refreshedDroppedAssets : Record<string, any> = {};
    for (const assetId of Object.keys(droppedAssets)) {
      const uName = droppedAssets[assetId].uniqueName;
      if (uName) {
        // @TODO: weird things will happen if multiple assets w/ same uniqueName, find proper way or fix
        const assets = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: uName, isPartial: false }) as DroppedAssetInterface[];
        const { topLayerURL, bottomLayerURL } = assets[0];
        refreshedDroppedAssets[assetId] = {
          ...droppedAssets[assetId],
          topLayerURL: topLayerURL ?? droppedAssets[assetId].topLayerURL,
          bottomLayerURL: bottomLayerURL ?? droppedAssets[assetId].bottomLayerURL,
        };
      }
    }

    // const refreshedDroppedAssets = { ...droppedAssets };

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
