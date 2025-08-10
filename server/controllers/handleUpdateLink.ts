import { Request, Response } from "express";
import { DroppedAsset, World, errorHandler, getCredentials } from "../utils/index.js";

import type { DroppedAssetInterface } from "@rtsdk/topia";

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
    const { id, links } = req.body as {
      id: string;
      links: ClickableLinkInfo[];
    };

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    const dataObject = (world.dataObject as any) || {};
    const currentDroppedAssets: Record<string, any> =
      typeof dataObject.droppedAssets === "object" && dataObject.droppedAssets !== null
        ? { ...dataObject.droppedAssets }
        : {};
    const uniqueName = currentDroppedAssets[id].uniqueName;

    currentDroppedAssets[id].links = links;

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { ...dataObject, droppedAssets: currentDroppedAssets },
      {
        analytics: [
          {
            analyticName: "link_updates",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
        lock: { lockId, releaseLock: true },
      },
    );

    // get asset
    const droppedAsset = DroppedAsset.create(id, urlSlug, { credentials });

    // remedy links
    for (let link of links) {
      if (link.clickableLink === "") {
        if (link.linkId) {
          // user removing existing link
          await droppedAsset.removeClickableLink({ linkId: link.linkId });
        }
        continue;
      }
      if (link.linkId) {
        // user updating old link
        // pull linkId out so it doesn’t end up passed as linkId instead of existingLinkId
        const { linkId, ...rest } = link;
        await droppedAsset.updateClickableLinkMulti({
          ...rest,
          existingLinkId: link.linkId,
        });
      } else {
        // user adding a fresh (new) link
        await droppedAsset.updateClickableLinkMulti({
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
