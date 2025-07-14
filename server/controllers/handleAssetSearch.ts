// import dotenv from "dotenv";
// dotenv.config({ path: "../.env" });

// const config = {
//   interactiveSecret: process.env.INTERACTIVE_SECRET,
// };

import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";
import type { IDroppedAsset } from "../types/DroppedAssetInterface.js";
//import type { DroppedAsset } from "@rtsdk/topia";
import { DroppedAssetFactory } from "@rtsdk/topia";
// import type { DroppedAsset } from "@rtsdk/topia";
import { DroppedAsset } from "../utils/topiaInit.js";
//import { getWithUniqueName } from "@rtsdk/topia";

export const handleAssetSearch = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log("entering asset search");
    const credentials = getCredentials(req.query);
    const { urlSlug} = credentials;
    const world = World.create(credentials.urlSlug, { credentials });
    const search = ((req.query.search as string) || "").trim();

    console.log("search: ", typeof search );
    const assets = await world.fetchDroppedAssetsWithUniqueName( { uniqueName: 'h', isPartial: true, } );
    // const assets = Object.values(world.droppedAssets); 
    //await world.fetchDroppedAssets();
    console.log(assets);
    //const assets = Object.values(world.droppedAssets);

    // const asset = await DroppedAsset.getWithUniqueName(search, urlSlug, interactiveSecret, credentials)

    // const first: DroppedAsset = assets[0];
    // if (!first) {
    //   console.log("no first");
    //   return res.json({ assets, success: true });
    // }
    // console.log(assets);

    // for (let asset of assets) {
    //   // asset.fetchAssetById();
    //   console.log("asset");
    //   console.log((asset as any).assetId);
    //   console.log((asset as any).creationDatetime);
    // }
    // await first.fetchDroppedAssetById();
    // const firstTyped = first as unknown as IDroppedAsset;
    // console.log("first uniqueName: " + (first as any).uniqueName);

    // const newAssets = assets as IDroppedAsset[];

    // console.log("found assets: " + newAssets);

    // for (let asset of newAssets) {
    //   console.log(asset.uniqueName);
    // }

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
