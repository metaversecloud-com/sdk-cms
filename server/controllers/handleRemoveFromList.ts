import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleRemoveFromList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { id } = req.body;

    const { world, droppedAssets } = await getWorldDataObject(credentials);

    delete droppedAssets[id];

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { droppedAssets },
      {
        analytics: [
          {
            analyticName: "content_list_removes",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
        lock: { lockId, releaseLock: true },
      },
    );

    return res.json({ id, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRemoveFromList",
      message: "Error removing dropped asset from list",
      req,
      res,
    });
  }
};
