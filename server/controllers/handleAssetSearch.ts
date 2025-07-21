import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

import type { DroppedAssetInterface } from "@rtsdk/topia";

export const handleAssetSearch = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug } = credentials;

    // @TODO?: can I save resources by instead using the same instances created in handleGetGameState? vvv
    const world = World.create(urlSlug, { credentials });

    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};
    const search = (req.query.search as string) || "";

    if (search == "") {
      return res.json({ assets: [], success: true });
    }

    console.log("search: ", search);
    const assets = (await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: search,
      isPartial: true,
    })) as DroppedAssetInterface[];

    console.log("assets: ", assets);

    return res.json({ assets, success: true });
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
