import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getCredentials,
  initializeDroppedAssetDataObject,
  initializeWorldDataObject,
  Visitor,
  World,
} from "../utils/index.js";
import { IDroppedAsset } from "../types/DroppedAssetInterface.js";
import { VisitorInterface } from "@rtsdk/topia";

export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const world = World.create(credentials.urlSlug, { credentials });

    // If the application will make any updates to a dropped asset's data object we need to
    // first instantiate to ensure it's existence and define it's proper structure.
    // The same should be true for World, User, and Visitor data objects
    // init world data object
    await initializeDroppedAssetDataObject(droppedAsset as IDroppedAsset);
    await initializeWorldDataObject(world);

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const { isAdmin } = visitor;

    return res.json({ droppedAsset, visitor: { isAdmin }, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAssetDetails",
      message: "Error getting dropped asset instance and data object",
      req,
      res,
    });
  }
};
