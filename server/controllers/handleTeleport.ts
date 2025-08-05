import { Request, Response } from "express";
import { Visitor, errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";

export const handleTeleport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, interactiveNonce, interactivePublicKey, urlSlug, visitorId } = credentials;

    const visitor = Visitor.create(visitorId, urlSlug, {
      credentials: { interactiveNonce, interactivePublicKey, assetId: credentials.assetId, urlSlug, visitorId },
    });

    const { position } = req.body as {
      assetId: string;
      position: { x: number; y: number };
    };

    if (!position || typeof position.x !== "number" || typeof position.y !== "number") {
      return res.status(400).json({ error: "Missing or invalid position" });
    }

    await visitor.moveVisitor({
      shouldTeleportVisitor: true,
      x: position.x,
      y: position.y,
    });

    // Update analytics
    const droppedAsset = await getDroppedAsset(credentials);

    await droppedAsset.updateDataObject(
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
