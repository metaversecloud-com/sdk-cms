// Admin tools: searching assets by unique name, adding/removing them, clearing or resetting the list, and
// editing an asset's clickable links.
import { expect, test } from "../../fixtures";
import { asset, card, entry, link, openAdmin, press, search } from "./cmsWorld";

const lamp = asset("a-lamp", "Lamp", { clickableLinks: [link("lamp-1", "l1")] });
const lantern = asset("a-lantern", "Lantern");
const desk = asset("a-desk", "Desk", { clickableLinks: [link("desk-1", "d1"), link("desk-2", "d2")] });
const assets = { [lamp.id]: lamp, [lantern.id]: lantern, [desk.id]: desk };

test("search lists assets whose unique name contains the term, never the app's own asset", async ({ page, world }) => {
  await world.seed({ isAdmin: true, extraAssets: assets, asset: { uniqueName: "cms-key" } });
  await page.goto(world.url("/"));
  await openAdmin(page);

  await search(page, "cms-la");
  await expect(page.locator("li.card")).toHaveCount(2);
  await expect(page.locator("li.card").filter({ hasText: "Lamp" })).toContainText("cms-lamp");
  await expect(page.locator("li.card").filter({ hasText: "Lantern" })).toBeVisible();

  // "cms-" also matches the key asset (uniqueName "cms-key"), which is left out.
  await search(page, "cms-");
  await expect(page.locator("li.card")).toHaveCount(3);
  await expect(page.locator("li.card").filter({ hasText: "E2E Asset" })).toHaveCount(0);

  await search(page, "sofa");
  await expect(page.getByRole("heading", { name: "No results found" })).toBeVisible();
});

test("adding an asset features it for everyone", async ({ page, world }) => {
  await world.seed({ isAdmin: true, extraAssets: assets, worldData: { droppedAssets: {} } });
  await page.goto(world.url("/"));
  await openAdmin(page);
  await search(page, "cms-lamp");

  await press(page.locator("li.card").filter({ hasText: "Lamp" }).getByRole("button", { name: "Add to list" }));

  await expect(page.locator("li.card").getByRole("button", { name: "Remove from list" })).toBeAttached();
  expect((await world.state()).dataObject.droppedAssets).toEqual({
    [lamp.id]: {
      uniqueName: "cms-lamp",
      topLayerURL: lamp.topLayerURL,
      bottomLayerURL: "",
      profileId: world.profileId,
      links: lamp.clickableLinks,
      assetName: "Lamp",
    },
  });
  expect(await world.events("analytics")).toContainEqual(
    expect.objectContaining({ analyticName: "content_list_adds", profileId: world.profileId }),
  );

  // Back on the main page the asset is listed.
  await page.locator("button.icon-with-rounded-border").click();
  await expect(card(page, "Lamp")).toContainText("1 link attached");
});

test("removing an asset takes it off the list", async ({ page, world }) => {
  await world.seed({
    isAdmin: true,
    extraAssets: assets,
    worldData: { droppedAssets: { [lamp.id]: entry(lamp), [desk.id]: entry(desk) } },
  });
  await page.goto(world.url("/"));
  await expect(card(page, "Lamp")).toBeVisible();
  await openAdmin(page);
  await search(page, "cms-lamp");

  await press(page.locator("li.card").getByRole("button", { name: "Remove from list" }));

  await expect(page.locator("li.card").getByRole("button", { name: "Add to list" })).toBeAttached();
  expect(Object.keys((await world.state()).dataObject.droppedAssets)).toEqual([desk.id]);
  expect(await world.events("analytics")).toContainEqual(
    expect.objectContaining({ analyticName: "content_list_removes", profileId: world.profileId }),
  );
  await page.locator("button.icon-with-rounded-border").click();
  await expect(card(page, "Desk")).toBeVisible();
  await expect(card(page, "Lamp")).toHaveCount(0);
});

test("removing all items empties the list after confirmation and keeps the assets' links", async ({ page, world }) => {
  await world.seed({
    isAdmin: true,
    extraAssets: assets,
    worldData: { droppedAssets: { [lamp.id]: entry(lamp), [desk.id]: entry(desk) } },
  });
  await page.goto(world.url("/"));
  await openAdmin(page);

  await page.getByRole("button", { name: "Remove all items from list" }).click();
  await expect(page.getByRole("heading", { name: "Clear content list?" })).toBeVisible();
  await page.getByRole("button", { name: "No" }).click();
  expect(Object.keys((await world.state()).dataObject.droppedAssets)).toHaveLength(2);

  await page.getByRole("button", { name: "Remove all items from list" }).click();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect.poll(async () => (await world.state()).dataObject.droppedAssets).toEqual({});
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "clears" }));
  expect(await world.events("set-clickable-link-multi")).toEqual([]);
  expect((await world.state()).assets[desk.id].clickableLinks).toHaveLength(2);
  await page.locator("button.icon-with-rounded-border").click();
  await expect(page.getByRole("heading", { name: "Your content list is empty" })).toBeVisible();
});

test("resetting removes the links from every listed asset and empties the list", async ({ page, world }) => {
  const unlisted = asset("a-sofa", "Sofa", { clickableLinks: [link("sofa-1", "s1")] });
  await world.seed({
    isAdmin: true,
    extraAssets: { ...assets, [unlisted.id]: unlisted },
    worldData: { droppedAssets: { [lamp.id]: entry(lamp), [desk.id]: entry(desk) } },
  });
  await page.goto(world.url("/"));
  await openAdmin(page);

  await page.getByRole("button", { name: "Reset Content List" }).click();
  await expect(page.getByRole("heading", { name: "Reset content list?" })).toBeVisible();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect.poll(async () => (await world.state()).dataObject.droppedAssets).toEqual({});
  const { assets: after } = await world.state();
  expect(after[lamp.id].clickableLinks).toEqual([]);
  expect(after[desk.id].clickableLinks).toEqual([]);
  expect(after[unlisted.id].clickableLinks).toHaveLength(1);
  expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "resets" }));
});

test.describe("editing links", () => {
  test("adds a link that opens in the drawer and keeps the existing one", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: assets, worldData: { droppedAssets: { [lamp.id]: entry(lamp) } } });
    await page.goto(world.url("/"));
    await press(card(page, "Lamp").getByRole("button", { name: "Edit" }));

    const modal = page.locator(".modal");
    await expect(modal.getByRole("heading", { name: "Update Asset Links" })).toBeVisible();
    // Saved links show as links, not inputs.
    await expect(modal.getByRole("link", { name: "https://example.invalid/lamp-1" })).toBeVisible();

    await press(modal.locator(".mb-4 .btn-icon"));
    await modal.getByPlaceholder("https://example.com").fill("https://example.invalid/new-page");
    await modal.locator("select").nth(1).selectOption("drawer");
    await modal.getByRole("button", { name: "Update" }).click();

    await expect(modal).toHaveCount(0);
    await expect(card(page, "Lamp")).toContainText("2 links attached");
    const links = (await world.state()).assets[lamp.id].clickableLinks;
    expect(links).toEqual([
      expect.objectContaining({ clickableLink: "https://example.invalid/lamp-1", linkId: "l1" }),
      expect.objectContaining({
        clickableLink: "https://example.invalid/new-page",
        isOpenLinkInDrawer: true,
        isForceLinkInIframe: false,
        linkId: expect.stringMatching(/^link-/),
      }),
    ]);
    expect((await world.state()).dataObject.droppedAssets[lamp.id].links).toHaveLength(2);
    expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "link_updates" }));
  });

  test("deleting a link removes it from the asset", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: assets, worldData: { droppedAssets: { [desk.id]: entry(desk) } } });
    await page.goto(world.url("/"));
    await press(card(page, "Desk").getByRole("button", { name: "Edit" }));

    const modal = page.locator(".modal");
    await press(modal.locator("button.p-2").first());
    await modal.getByRole("button", { name: "Update" }).click();

    await expect(card(page, "Desk")).toContainText("1 link attached");
    expect((await world.state()).assets[desk.id].clickableLinks).toEqual([
      expect.objectContaining({ clickableLink: "https://example.invalid/desk-2", linkId: "d2" }),
    ]);
  });

  test("a URL without http(s):// can't be saved", async ({ page, world }) => {
    await world.seed({ isAdmin: true, extraAssets: assets, worldData: { droppedAssets: { [lantern.id]: entry(lantern) } } });
    await page.goto(world.url("/"));
    await press(card(page, "Lantern").getByRole("button", { name: "Edit" }));

    const modal = page.locator(".modal");
    await modal.getByPlaceholder("https://example.com").fill("example.invalid/page");

    await expect(modal.getByText("All URLs must start with “https://” or “http://”")).toBeVisible();
    await expect(modal.getByRole("button", { name: "Update" })).toBeDisabled();
    await modal.getByRole("button", { name: "Cancel" }).click();
    expect(await world.events("set-clickable-link-multi")).toEqual([]);
  });

  test("an asset takes at most 20 links", async ({ page, world }) => {
    const many = { ...lantern, clickableLinks: Array.from({ length: 19 }, (_, i) => link(`p${i}`, `x${i}`)) };
    await world.seed({ isAdmin: true, extraAssets: { [many.id]: many }, worldData: { droppedAssets: { [many.id]: entry(many) } } });
    await page.goto(world.url("/"));
    await press(card(page, "Lantern").getByRole("button", { name: "Edit" }));

    const modal = page.locator(".modal");
    const addButton = modal.locator(".mb-4 .btn-icon");
    await press(addButton);
    await expect(modal.locator("select")).toHaveCount(20);
    await expect(addButton).toHaveCount(0);
  });

  test("shows an error and keeps the modal open when saving fails", async ({ page, world }) => {
    await world.seed({
      isAdmin: true,
      extraAssets: assets,
      worldData: { droppedAssets: { [lamp.id]: entry(lamp) } },
      failures: { "/set-clickable-link-multi": 500 },
    });
    await page.goto(world.url("/"));
    await press(card(page, "Lamp").getByRole("button", { name: "Edit" }));
    const modal = page.locator(".modal");
    await press(modal.locator("button.p-2").first());
    await modal.getByRole("button", { name: "Update" }).click();

    await expect(page.locator(".text-error")).toContainText("Error");
    await expect(modal).toBeVisible();
    expect((await world.state()).assets[lamp.id].clickableLinks).toHaveLength(1);
  });
});
