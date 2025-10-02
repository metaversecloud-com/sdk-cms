import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleAddToList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { uniqueName, topLayerURL, bottomLayerURL, id, links, assetName } = req.body;

    const { world, droppedAssets } = await getWorldDataObject(credentials);

    droppedAssets[id] = { uniqueName, topLayerURL, bottomLayerURL, profileId, links, assetName };

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { droppedAssets },
      {
        analytics: [
          {
            analyticName: "content_list_adds",
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
      functionName: "handleAddToList",
      message: "Error adding dropped asset to list",
      req,
      res,
    });
  }
};
