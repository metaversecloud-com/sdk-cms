import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
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

    const { world, droppedAssets } = await getWorldDataObject(credentials);

    droppedAssets[id].links = links;
    const uniqueName = droppedAssets[id].uniqueName;

    const lockId = `${world.urlSlug}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

    await world.updateDataObject(
      { droppedAssets },
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

    const assets = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName,
      isPartial: false,
    });
    const droppedAsset = assets.find((a: DroppedAssetInterface) => a.id === id);
    if (!droppedAsset) {
      console.warn(`No fetched dropped asset matched id ${id} for uniqueName "${uniqueName}"`);
      return res.json({ success: false });
    }

    const linksPayload = [];
    for (let link of links) {
      if (link.clickableLink !== "") {
        // pull linkId out so it doesn’t end up passed as linkId instead of existingLinkId
        const { linkId, ...rest } = link;
        linksPayload.push({
          ...rest,
          existingLinkId: link.linkId || undefined,
        });
      }
    }

    await droppedAsset.setClickableLinkMulti({
      clickableLinks: linksPayload,
    });

    return res.json({ newLinks: droppedAsset.clickableLinks, success: true });
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
