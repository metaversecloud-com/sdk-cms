import { Request, Response } from "express";
import { World, errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";

export const handleResetList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject({ droppedAssets: {} }, { lock: { lockId, releaseLock: true } });

    // Update analytics
    const droppedAsset = await getDroppedAsset(credentials);
    await droppedAsset.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "resets",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
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
