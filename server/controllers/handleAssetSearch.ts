import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";
import type { IDroppedAsset } from "../types/DroppedAssetInterface.js";
//import type { DroppedAsset } from "@rtsdk/topia";
import { DroppedAssetFactory } from "@rtsdk/topia";
// import type { DroppedAsset } from "@rtsdk/topia";
import { DroppedAsset } from "../utils/topiaInit.js";
//import { getWithUniqueName } from "@rtsdk/topia";
import type { DroppedAssetInterface } from "@rtsdk/topia";

export const handleAssetSearch = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log("entering asset search");
    const credentials = getCredentials(req.query);
    const { urlSlug } = credentials;
    // @TODO?: save resources by instead using the same instances created in handleGetGameState? vvv
    const world = World.create(credentials.urlSlug, { credentials });
    const search = (req.query.search as string) || "";

    console.log("search: ", typeof world);
    const assets = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: search, isPartial: true });

    console.log(assets);

    const a = assets[0];
    await a.fetchDroppedAssetById();
    console.log("clickable link: ", a.clickableLink);

    // assets.forEach((a: DroppedAssetInterface) => {
    //   console.log("link:", a.clickableLink);
    // });


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
