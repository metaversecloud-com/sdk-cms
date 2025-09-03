import { Request, Response } from "express";
import { DroppedAsset, Visitor, errorHandler, getCredentials } from "../utils/index.js";

export const handleTeleport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug, visitorId } = credentials;

    const visitor = Visitor.create(visitorId, urlSlug, { credentials });

    const { id } = req.body;

    const droppedAsset = await DroppedAsset.get(id, urlSlug, { credentials });

    await visitor.moveVisitor({
      shouldTeleportVisitor: true,
      x: droppedAsset.position.x,
      y: droppedAsset.position.y,
    });

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "teleports",
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
      functionName: "handleTeleport",
      message: "Error teleporting user",
      req,
      res,
    });
  }
};
