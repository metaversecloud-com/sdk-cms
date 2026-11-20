// What a visitor who isn't an admin can do by calling the API directly, and what the API hands back.
import { INTERACTIVE_SECRET } from "../../constants";
import { expect, test } from "../../fixtures";
import { asset, entry, link } from "./cmsWorld";

const ADMIN_CHECK = "EXP-461: CMS write and search routes have no admin check";

const lamp = asset("a-lamp", "Lamp", { clickableLinks: [link("lamp-1", "l1")] });
const desk = asset("a-desk", "Desk", { clickableLinks: [link("desk-1", "d1")] });
const listed = { [lamp.id]: entry(lamp) };

test("asset search never returns the interactive secret or a signed JWT", async ({ request, world }) => {
  await world.seed({ isAdmin: true, extraAssets: { [lamp.id]: lamp } });

  const response = await request.get(`${world.api("/asset-search")}&search=cms`);

  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("cms-lamp");
  for (const marker of [INTERACTIVE_SECRET, "interactiveSecret", "InteractiveJWT"]) expect(body).not.toContain(marker);
});

test("error responses never carry the interactive secret", async ({ request, world }) => {
  await world.seed({ isAdmin: true, failures: { "/set-clickable-link-multi": 500 }, extraAssets: { [lamp.id]: lamp }, worldData: { droppedAssets: listed } });

  const bodies = [
    await request.put(world.api("/teleport"), { data: { id: "no-such-asset" } }),
    await request.put(world.api("/update-link"), { data: { id: lamp.id, links: [] } }),
    await request.put(world.api("/update-link"), { data: { id: "not-listed", links: [] } }),
  ];

  for (const response of bodies) {
    expect(response.ok()).toBe(false);
    const body = await response.text();
    for (const marker of [INTERACTIVE_SECRET, "interactiveSecret", "InteractiveJWT"]) expect(body).not.toContain(marker);
  }
});

test.describe("a visitor who isn't an admin", () => {
  test.beforeEach(async ({ world }) => {
    await world.seed({ isAdmin: false, extraAssets: { [lamp.id]: lamp, [desk.id]: desk }, worldData: { droppedAssets: listed } });
  });

  test("can't search the world's assets", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const response = await request.get(`${world.api("/asset-search")}&search=cms`);

    expect(response.status()).toBe(403);
  });

  test("can't feature an asset", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const response = await request.post(world.api("/add-to-list"), { data: { ...entry(desk), id: desk.id } });

    expect(response.status()).toBe(403);
    expect((await world.state()).dataObject.droppedAssets).toEqual(listed);
  });

  test("can't take an asset off the list", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const response = await request.post(world.api("/remove-from-list"), { data: { id: lamp.id } });

    expect(response.status()).toBe(403);
    expect((await world.state()).dataObject.droppedAssets).toEqual(listed);
  });

  test("can't clear the list", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const response = await request.put(world.api("/clear-list"));

    expect(response.status()).toBe(403);
    expect((await world.state()).dataObject.droppedAssets).toEqual(listed);
  });

  test("can't reset the list and strip the assets' links", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const response = await request.put(world.api("/reset-list"));

    expect(response.status()).toBe(403);
    expect((await world.state()).assets[lamp.id].clickableLinks).toEqual(lamp.clickableLinks);
  });

  test("can't point an asset's link somewhere else", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const phishing = { ...link("login", ""), clickableLink: "https://phishing.invalid/login" };
    const response = await request.put(world.api("/update-link"), { data: { id: lamp.id, links: [phishing] } });

    expect(response.status()).toBe(403);
    expect((await world.state()).assets[lamp.id].clickableLinks).toEqual(lamp.clickableLinks);
  });

  test("can't put links on any asset in the world by featuring it first", async ({ request, world }) => {
    test.fail(true, ADMIN_CHECK);
    const phishing = { ...link("login", ""), clickableLink: "https://phishing.invalid/login" };
    await request.post(world.api("/add-to-list"), { data: { id: desk.id } });
    await request.put(world.api("/update-link"), { data: { id: desk.id, links: [phishing] } });

    expect((await world.state()).assets[desk.id].clickableLinks).toEqual(desk.clickableLinks);
  });
});
