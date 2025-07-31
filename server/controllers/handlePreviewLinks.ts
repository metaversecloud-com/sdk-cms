import { Request, Response } from "express";
import { getLinkPreview } from "link-preview-js";
import { errorHandler } from "../utils/index.js";

interface ClickableLinkInfo {
  clickableLink: string;
  clickableLinkTitle: string;
  isForceLinkInIframe: boolean;
  isOpenLinkInDrawer: boolean;
  linkId: string;
}

export interface LinkPreviewData {
  clickableLink: string;
  preview: {
    title?: string;
    description?: string;
    image?: string | null;
  } | null;
}

export const handlePreviewLinks = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { links } = req.body as { links: ClickableLinkInfo[] };

    // fetch each preview per link
    const previews: LinkPreviewData[] = await Promise.all(
      links.map(async ({ clickableLink }) => {
        if (!clickableLink.trim()) {
          return { clickableLink, preview: null };
        }

        try {
          const data = (await getLinkPreview(clickableLink)) as any;
          return {
            clickableLink,
            preview: {
              title: data.title,
              description: data.description,
              image: data.images?.[0] ?? null,
            },
          };
        } catch (err) {
          console.warn(`Preview failed for ${clickableLink}:`, err);
          return { clickableLink, preview: null };
        }
      }),
    );

    return res.json({ previews, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handlePreviewLinks",
      message: "Error generating link previews",
      req,
      res,
    });
  }
};
