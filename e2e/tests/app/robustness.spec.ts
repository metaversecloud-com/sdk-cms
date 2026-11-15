// Concurrent edits, out-of-order responses, failures the admin should see, and link previews.
import { expect, test } from "../../fixtures";
import { asset, entry, openAdmin, search } from "./cmsWorld";

const lamp = asset("a-lamp", "Lamp");
const lantern = asset("a-lantern", "Lantern");
const desk = asset("a-desk", "Desk");
const assets = { [lamp.id]: lamp, [lantern.id]: lantern, [desk.id]: desk };

test("two admins featuring assets at the same time both end up on the list", async ({ request, world }) => {
  test.fail(true, "EXP-461: list writes replace the whole droppedAssets map read earlier (lost update)");
  await world.seed({
    isAdmin: true,
    otherVisitors: { 43: { isAdmin: true } },
    extraAssets: assets,
    worldData: { droppedAssets: {} },
    // Both requests read the list before either writes it back (writes held longer than reads).
    delays: { "/get-data-object": 200, "/update-data-object": 600 },
  });

  const responses = await Promise.all([
    request.post(world.api("/add-to-list"), { data: { ...entry(lamp), id: lamp.id } }),
    request.post(world.apiAs(43, "/add-to-list"), { data: { ...entry(desk), id: desk.id } }),
  ]);

  for (const response of responses) expect(response.ok()).toBe(true);
  expect(Object.keys((await world.state()).dataObject.droppedAssets).sort()).toEqual([desk.id, lamp.id]);
});

test("a visitor opening the app while an admin features an asset doesn't undo it", async ({ request, world }) => {
  test.fail(true, "EXP-461: list writes replace the whole droppedAssets map read earlier (lost update)");
  await world.seed({
    isAdmin: true,
    otherVisitors: { 43: {} },
    extraAssets: assets,
    worldData: { droppedAssets: { [lamp.id]: entry(lamp) } },
    // The visitor's page load reads the list, then spends a while fetching the world's assets.
    delays: { [`GET /api/v1/world/${world.urlSlug}/assets`]: 1500 },
  });

  const load = request.get(world.apiAs(43, "/content-list"));
  await new Promise((resolve) => setTimeout(resolve, 300));
  const add = await request.post(world.api("/add-to-list"), { data: { ...entry(desk), id: desk.id } });
  expect(add.ok()).toBe(true);
  expect((await load).ok()).toBe(true);

  expect(Object.keys((await world.state()).dataObject.droppedAssets).sort()).toEqual([desk.id, lamp.id]);
});

test("search results always match what's in the search box", async ({ page, world }) => {
  test.fail(true, "EXP-461: a slow response for an earlier search term overwrites the newer results");
  await world.seed({
    isAdmin: true,
    extraAssets: assets,
    // The first, longer term answers after the second one.
    delays: { "assets-with-unique-name/cms-lantern": 800 },
  });
  await page.goto(world.url("/"));
  await openAdmin(page);

  const slow = page.waitForResponse((r) => r.url().includes("search=cms-lantern"));
  await search(page, "cms-lantern");
  await search(page, "cms-la");
  await expect(page.locator("li.card")).toHaveCount(2);
  await slow;
  await page.waitForTimeout(300);

  await expect(page.getByPlaceholder("Search by unique name...")).toHaveValue("cms-la");
  expect(await page.locator("li.card").count()).toBe(2);
});

test("an admin sees why featuring an asset failed", async ({ page, world }) => {
  test.fail(true, "EXP-461: errors from the admin view are stored but only rendered on the main view");
  await world.seed({ isAdmin: true, extraAssets: assets, worldData: { droppedAssets: {} } });
  await page.goto(world.url("/"));
  await openAdmin(page);
  await search(page, "cms-lamp");
  await world.seed({
    isAdmin: true,
    extraAssets: assets,
    worldData: { droppedAssets: {} },
    failures: { "/update-data-object": 500 },
  });

  await page.locator("li.card").getByRole("button", { name: "Add to list" }).dispatchEvent("click");

  await expect(page.locator("li.card").getByRole("button", { name: "Add to list" })).toBeAttached();
  await expect(page.locator(".text-error")).toContainText("Error");
});

test("link previews come back empty for blank and unreachable links", async ({ request, world }) => {
  await world.seed();

  const response = await request.put(world.api("/preview-links"), {
    data: { links: [{ clickableLink: "" }, { clickableLink: "https://example.invalid/page" }] },
  });

  expect(await response.json()).toEqual({
    success: true,
    previews: [
      { clickableLink: "", preview: null },
      { clickableLink: "https://example.invalid/page", preview: null },
    ],
  });
});
