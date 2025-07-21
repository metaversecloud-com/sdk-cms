import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleResetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);

    const world = World.create(credentials.urlSlug, { credentials });

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject({ droppedAssets: {} }, { lock: { lockId, releaseLock: true } });

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
