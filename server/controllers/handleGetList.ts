import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleGetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const { world, droppedAssets } = await getWorldDataObject(credentials);

    const refreshedDroppedAssets: Record<string, any> = {};

    if (Object.keys(droppedAssets).length === 0) {
      const keyAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

      for (const name of (keyAsset?.dataObject as { uniqueNames?: string[] })?.uniqueNames ?? []) {
        const assets = (await world.fetchDroppedAssetsWithUniqueName({
          uniqueName: name,
          isPartial: true,
        })) as DroppedAssetInterface[];

        const filteredAssets = assets.filter((asset) => asset.id !== assetId);

        for (const asset of filteredAssets) {
          const { id, uniqueName, topLayerURL, bottomLayerURL, clickableLinks, assetName } = asset;
          if (id) {
            refreshedDroppedAssets[id] = {
              uniqueName,
              topLayerURL,
              bottomLayerURL,
              profileId,
              links: clickableLinks,
              assetName,
            };
          }
        }
      }
    } else {
      await world.fetchDroppedAssets();
      const allDroppedAssets: { [key: string]: DroppedAssetInterface } = world.droppedAssets;
      const droppedAssetsList = Object.values(allDroppedAssets).filter(
        (asset) => asset.id && Object.keys(droppedAssets).includes(asset.id),
      );

      for (const droppedAsset of droppedAssetsList) {
        const { id, topLayerURL, bottomLayerURL, clickableLinks } = droppedAsset;
        refreshedDroppedAssets[id!] = {
          ...droppedAssets[id!],
          topLayerURL: topLayerURL ?? droppedAssets[id!].topLayerURL,
          bottomLayerURL: bottomLayerURL ?? droppedAssets[id!].bottomLayerURL,
          links: clickableLinks,
        };
      }
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
