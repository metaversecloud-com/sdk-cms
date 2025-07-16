import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";


export const handleAssetSearch = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);

    // await visitor.moveVisitor({
    //   shouldTeleportVisitor: true,
    //   x: 100,
    //   y: 100,
    // });

    return res.json({ success: true });
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
