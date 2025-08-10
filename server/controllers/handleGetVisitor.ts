import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor } from "../utils/index.js";
import { VisitorInterface } from "@rtsdk/topia";

export const handleGetVisitor = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const { isAdmin } = visitor;

    return res.json({ isAdmin, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetVisitor",
      message: "Error getting visitor",
      req,
      res,
    });
  }
};
