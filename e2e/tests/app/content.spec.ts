// The featured content list every visitor sees: what it shows, how it's refreshed from the world, and teleporting.
import { expect, test } from "../../fixtures";
import { asset, card, entry, link, press } from "./cmsWorld";

const lamp = asset("a-lamp", "Lamp", {
  position: { x: 120, y: 340 },
  clickableLinks: [link("lamp-1", "l1"), link("lamp-2", "l2")],
});
const desk = asset("a-desk", "Desk", { clickableLinks: [link("desk-1", "d1")] });

test("shows each featured asset with its image, unique name and link count", async ({ page, world }) => {
  await world.seed({
    extraAssets: { [lamp.id]: lamp, [desk.id]: desk },
    worldData: { droppedAssets: { [lamp.id]: entry(lamp), [desk.id]: entry(desk) } },
  });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Featured Content" })).toBeVisible();
  await expect(card(page, "Lamp")).toContainText("cms-lamp");
  await expect(card(page, "Lamp")).toContainText("2 links attached");
  await expect(card(page, "Desk")).toContainText("1 link attached");
  await expect(card(page, "Lamp").getByRole("img", { name: "cms-lamp" })).toHaveAttribute(
    "src",
    "https://example.invalid/a-lamp.png",
  );
  expect(await world.events("analytics")).toContainEqual(
    expect.objectContaining({ analyticName: "starts", profileId: world.profileId, uniqueKey: world.profileId }),
  );
});

test("shows an empty state when nothing is featured", async ({ page, world }) => {
  await world.seed({ worldData: { droppedAssets: {} } });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Your content list is empty" })).toBeVisible();
  expect((await world.state()).dataObject).toEqual({ droppedAssets: {} });
});

test("refreshes the list from the world: removed assets drop out, links and images follow the asset", async ({
  page,
  world,
}) => {
  const renamedImage = { ...lamp, topLayerURL: "https://example.invalid/new-lamp.png", clickableLinks: [link("lamp-1", "l1")] };
  await world.seed({
    extraAssets: { [lamp.id]: renamedImage },
    // The desk was deleted from the world since it was featured.
    worldData: { droppedAssets: { [lamp.id]: entry(lamp), [desk.id]: entry(desk) } },
  });
  await page.goto(world.url("/"));

  await expect(card(page, "Lamp")).toContainText("1 link attached");
  await expect(card(page, "Lamp").getByRole("img")).toHaveAttribute("src", "https://example.invalid/new-lamp.png");
  await expect(card(page, "Desk")).toHaveCount(0);
  const { droppedAssets } = (await world.state()).dataObject;
  expect(Object.keys(droppedAssets)).toEqual([lamp.id]);
  expect(droppedAssets[lamp.id]).toMatchObject({
    assetName: "Lamp",
    topLayerURL: "https://example.invalid/new-lamp.png",
    links: [link("lamp-1", "l1")],
  });
});

test("an empty list starts from the unique names in the key asset's data object", async ({ page, world }) => {
  await world.seed({
    // The key asset itself matches "e2e" but is never listed.
    assetData: { uniqueNames: ["cms-la", "e2e"] },
    extraAssets: { [lamp.id]: lamp, [desk.id]: desk },
  });
  await page.goto(world.url("/"));

  await expect(card(page, "Lamp")).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(1);
  const { droppedAssets } = (await world.state()).dataObject;
  expect(droppedAssets).toEqual({
    [lamp.id]: {
      uniqueName: "cms-lamp",
      topLayerURL: lamp.topLayerURL,
      bottomLayerURL: "",
      profileId: world.profileId,
      links: lamp.clickableLinks,
      assetName: "Lamp",
    },
  });
});

test("teleports the visitor to a featured asset", async ({ page, world }) => {
  await world.seed({ extraAssets: { [lamp.id]: lamp }, worldData: { droppedAssets: { [lamp.id]: entry(lamp) } } });
  await page.goto(world.url("/"));

  await press(card(page, "Lamp").getByRole("button", { name: "Teleport To" }));

  await expect
    .poll(() => world.events("move"))
    .toContainEqual(expect.objectContaining({ visitorId: "42", teleport: true, moveTo: { x: 120, y: 340 } }));
  await expect
    .poll(() => world.events("analytics"))
    .toContainEqual(expect.objectContaining({ analyticName: "teleports", profileId: world.profileId }));
});

test("shows an error when teleporting fails", async ({ page, world }) => {
  await world.seed({
    extraAssets: { [lamp.id]: lamp },
    worldData: { droppedAssets: { [lamp.id]: entry(lamp) } },
    failures: { "/visitors/42/move": 500 },
  });
  await page.goto(world.url("/"));

  await press(card(page, "Lamp").getByRole("button", { name: "Teleport To" }));

  await expect(page.locator(".text-error")).toContainText("Error");
});

test("visitors see no admin controls; admins get the gear and edit buttons", async ({ page, world }) => {
  await world.seed({ extraAssets: { [lamp.id]: lamp }, worldData: { droppedAssets: { [lamp.id]: entry(lamp) } } });
  await page.goto(world.url("/"));
  await expect(card(page, "Lamp")).toBeVisible();
  await expect(page.locator("button.icon-with-rounded-border")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);

  await world.updateVisitor({ isAdmin: true });
  await page.reload();
  await expect(page.locator("button.icon-with-rounded-border")).toBeVisible();
  await expect(card(page, "Lamp").getByRole("button", { name: "Edit" })).toBeAttached();
});

test("shows an error when the world's assets can't be loaded", async ({ page, world }) => {
  await world.seed({
    extraAssets: { [lamp.id]: lamp },
    worldData: { droppedAssets: { [lamp.id]: entry(lamp) } },
    failures: { [`GET /api/v1/world/${world.urlSlug}/assets`]: 500 },
  });
  await page.goto(world.url("/"));

  await expect(page.locator(".text-error")).toContainText("Error");
  // The stored list is left alone.
  expect((await world.state()).dataObject.droppedAssets).toEqual({ [lamp.id]: entry(lamp) });
});
