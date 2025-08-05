import { Request, Response } from "express";
import { World, errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";

import type { DroppedAssetInterface, DroppedAsset } from "@rtsdk/topia";

export interface ClickableLinkInfo {
  clickableLink: string;
  clickableLinkTitle: string;
  isForceLinkInIframe: boolean;
  isOpenLinkInDrawer: boolean;
  linkId: string;
}

export const handleUpdateLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { assetId, links } = req.body as {
      assetId: string;
      links: ClickableLinkInfo[];
    };

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};
    const uniqueName = currentDroppedAssets[assetId].uniqueName;

    currentDroppedAssets[assetId].links = links;

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { ...dataObject, droppedAssets: currentDroppedAssets },
      { lock: { lockId, releaseLock: true } },
    );

    // get asset
    const assets = (await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: uniqueName,
      isPartial: false,
    })) as (DroppedAsset & DroppedAssetInterface)[];
    const asset = assets.find((a) => a.assetId === assetId);
    if (!asset) {
      console.warn(`No fetched asset matched ID ${assetId} for uniqueName "${uniqueName}"`);
      return res.json({ success: false });
    }

    // remedy links
    for (let link of links) {
      if (link.clickableLink === "") {
        if (link.linkId) {
          // user removing existing link
          await asset.removeClickableLink({ linkId: link.linkId });
        }
        continue;
      }
      if (link.linkId) {
        // user updating old link
        // pull linkId out so it doesn’t end up passed as linkId instead of existingLinkId
        const { linkId, ...rest } = link;
        await asset.updateClickableLinkMulti({
          ...rest,
          existingLinkId: link.linkId,
        });
      } else {
        // user adding a fresh (new) link
        await asset.updateClickableLinkMulti({
          clickableLink: link.clickableLink,
          isForceLinkInIframe: true,
          isOpenLinkInDrawer: false,
        });
      }
    }

    const newAssets = (await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: uniqueName,
      isPartial: false,
    })) as DroppedAssetInterface[];
    const newLinks = (newAssets[0] as any).clickableLinks;

    // Update analytics
    const droppedAsset = await getDroppedAsset(credentials);

    await droppedAsset.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "link_updates",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    return res.json({ newLinks, success: true });
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
