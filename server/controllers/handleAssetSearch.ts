import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

import type { DroppedAssetInterface } from "@rtsdk/topia";

export const handleAssetSearch = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug } = credentials;

    const search = (req.query.search as string) || "";

    if (search == "") return res.json({ assets: [], success: true });

    const world = World.create(urlSlug, { credentials });

    const assets = (await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: search,
      isPartial: true,
    })) as DroppedAssetInterface[];

    const filteredAssets = assets.filter((asset) => asset.id !== assetId);

    return res.json({ assets: filteredAssets, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAssetSearch",
      message: "Error searching dropped assets",
      req,
      res,
    });
  }
};
