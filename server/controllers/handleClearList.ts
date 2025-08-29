import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleClearList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject(
      { droppedAssets: {} },
      {
        analytics: [
          {
            analyticName: "clears",
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
      functionName: "handleClearList",
      message: "Error clearing list",
      req,
      res,
    });
  }
};
