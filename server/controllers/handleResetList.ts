import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAssetType } from "../types/index.js";

export const handleResetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;

    const { world, droppedAssets } = await getWorldDataObject(credentials);

    const getAssetsPromises = [];
    for (const droppedAsset of Object.values(droppedAssets) as DroppedAssetType[]) {
      getAssetsPromises.push(
        world.fetchDroppedAssetsWithUniqueName({
          uniqueName: droppedAsset.uniqueName,
          isPartial: false,
        }),
      );
    }
    const results = await Promise.all(getAssetsPromises);

    const matches: DroppedAssetInterface[] = [];
    for (const assetsArray of results) {
      for (const asset of assetsArray) {
        if (Object.keys(droppedAssets).includes(asset.id)) {
          matches.push(asset);
        }
      }
    }

    const updateAssetsPromises = [];
    for (const droppedAsset of matches) {
      updateAssetsPromises.push(
        droppedAsset.setClickableLinkMulti({
          clickableLinks: [],
        }),
      );
    }
    await Promise.all(updateAssetsPromises);

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject(
      { droppedAssets: {} },
      {
        analytics: [
          {
            analyticName: "resets",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
        lock: { lockId, releaseLock: true },
      },
    );

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetList",
      message: "Error resetting list",
      req,
      res,
    });
  }
};
