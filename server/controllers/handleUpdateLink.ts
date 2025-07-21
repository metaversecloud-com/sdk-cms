import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

import { DroppedAssetClickType } from "@rtsdk/topia";


export const handleUpdateLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, interactiveNonce, interactivePublicKey, urlSlug, visitorId } = credentials;
    const { assetId, link } = req.body as {
      assetId: string;
      link: string;
    };

    const world = World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};
    const uniqueName = currentDroppedAssets[assetId].uniqueName

    currentDroppedAssets[assetId].link = link

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { ...dataObject, droppedAssets: currentDroppedAssets },
      { lock: { lockId, releaseLock: true } },
    );

    // @TODO: also update the actual asset vv
    const assets = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: uniqueName, isPartial: false });
    for (let asset of assets) {
      asset.updateClickType({
        "clickType": "link" as DroppedAssetClickType,
        "clickableLink": link,
        "clickableLinkTitle": "link",
      });
    }

    await world.fetchDataObject();
    const newDataObject = (world.dataObject as any) || {};
    console.log("newDataObject: ", newDataObject);

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateLink",
      message: "Error updating an assets link",
      req,
      res,
    });
  }
};