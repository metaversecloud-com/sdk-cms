import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

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

    const userDroppedAssetsList = Object.fromEntries(
      Object.entries(droppedAssets).filter(([_, asset]) => asset.profileId === profileId),
    );

    return res.json({ userDroppedAssetsList, success: true });
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
