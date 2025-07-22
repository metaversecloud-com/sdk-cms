import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

export interface ClickableLinkInfo {
  clickableLink:            string;
  clickableLinkTitle:       string;
  isForceLinkInIframe:      boolean;
  isOpenLinkInDrawer:       boolean;
  linkId:                   string;
}

export const handleUpdateLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, interactiveNonce, interactivePublicKey, urlSlug, visitorId } = credentials;
    const { assetId, links } = req.body as {
      assetId: string;
      links: ClickableLinkInfo[];
    };

    const world = World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};
    const uniqueName = currentDroppedAssets[assetId].uniqueName

    currentDroppedAssets[assetId].links = links

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { ...dataObject, droppedAssets: currentDroppedAssets },
      { lock: { lockId, releaseLock: true } },
    );

    const assets = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: uniqueName, isPartial: false });
    for (let asset of assets) {
      for (let link of links) {
        if (link.linkId) {
          asset.updateClickableLinkMulti({
            "clickableLink": link.clickableLink,
            "existingLinkId": link.linkId,
          });
        } else {
          asset.updateClickableLinkMulti({
            "clickableLink": link.clickableLink,
          });
        }
      }
    }

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