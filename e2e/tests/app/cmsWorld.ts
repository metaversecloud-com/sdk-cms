// Seed helpers for the content manager: dropped assets admins can feature, and the list the app keeps in
// the world data object (droppedAssets: { [assetId]: entry }).
import type { Locator, Page } from "@playwright/test";

export type Link = {
  clickableLink: string;
  clickableLinkTitle: string;
  isForceLinkInIframe: boolean;
  isOpenLinkInDrawer: boolean;
  linkId: string;
};

export const link = (path: string, linkId: string, mode: "drawer" | "modal" | "newTab" = "newTab"): Link => ({
  // .invalid never resolves, so the server's link preview fails fast instead of reaching the internet.
  clickableLink: `https://example.invalid/${path}`,
  clickableLinkTitle: "",
  isForceLinkInIframe: mode === "modal",
  isOpenLinkInDrawer: mode === "drawer",
  linkId,
});

/** A dropped asset in the world with a unique name the admin can search for. */
export const asset = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  assetName: name,
  uniqueName: `cms-${name.toLowerCase()}`,
  topLayerURL: `https://example.invalid/${id}.png`,
  bottomLayerURL: "",
  position: { x: 100, y: 200 },
  clickableLinks: [] as Link[],
  ...extra,
});

/** The list entry the app stores for an asset in the world data object. */
export const entry = (a: ReturnType<typeof asset>, profileId = "admin-profile") => ({
  uniqueName: a.uniqueName,
  topLayerURL: a.topLayerURL,
  bottomLayerURL: a.bottomLayerURL,
  profileId,
  links: a.clickableLinks,
  assetName: a.assetName,
});

export const card = (page: Page, assetName: string) => page.locator(".card").filter({ hasText: assetName });

/** Opens the admin view (gear button). */
export const openAdmin = async (page: Page) => {
  await page.locator("button.icon-with-rounded-border").click();
  await page.getByRole("heading", { name: "Search" }).waitFor();
};

export const search = async (page: Page, term: string) => {
  await page.getByPlaceholder("Search by unique name...").fill(term);
};

/**
 * Clicks an icon-only button (edit, teleport, add, delete). Their only content is a CDN icon, which the
 * test browser never loads (fixtures.ts aborts non-localhost requests), so the button has no size and a
 * normal click would wait for it to become visible.
 */
export const press = (button: Locator) => button.dispatchEvent("click");
