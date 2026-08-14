<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# CMS (Content Management System)

## Introduction / Summary

CMS is an admin-curated content module for a Topia world. World admins click the key asset to open a drawer, search dropped assets in the world by unique name, and pin a subset of them to a "featured content" list. Each pinned asset gets up to 20 clickable links (opened in the drawer, in a modal, or in a new tab) attached via the SDK's `setClickableLinkMulti` — the same links then work when a visitor clicks the asset in the scene, not only from the drawer. Visitors see the same list in the drawer, can view the attached links, and teleport to any pinned asset in one click.

The whole content list is stored on the **world** data object; the key asset itself only needs to exist. If an optional `uniqueNames` array is set on the key asset's data object, the first drawer open seeds the list by searching those partial unique names in-world.

## Key Features

### Canvas elements & interactions

- **Key asset:** the dropped asset the visitor/admin clicks to open the iframe drawer. Its `assetId` is passed as an interactive param and identifies which app instance is active. No fixed unique name is required.
- **Featured dropped assets:** any dropped asset in the world can be pinned to the list. When pinned, its `clickableLinks` are (re-)written via the SDK, so clicking the asset in the scene opens the configured link exactly like the drawer does.

### Drawer content

- **Featured content grid:** cards for every pinned asset showing thumbnail (`topLayerURL` → `bottomLayerURL` fallback), `assetName`, `uniqueName`, and attached link count.
- **Per-card actions:** teleport to the asset (visitors + admins); edit link modal (admins only).
- **Link modal:** up to 20 rows per asset. Each row has URL, display mode (Drawer / Modal / New Tab), and a link-preview tooltip (title, description, image) fetched server-side via `link-preview-js`. `http://` and `https://` URLs are accepted; anything else is rejected client-side.
- **Empty state:** friendly copy when no assets are pinned yet.

### Admin features

- **Access:** admins see an extra icon in the drawer header. Toggling it switches the drawer to the Search view.
- **Asset search:** live partial-match search over dropped-asset unique names (`fetchDroppedAssetsWithUniqueName({ uniqueName, isPartial: true })`). The key asset itself is filtered out of results.
- **Add / remove:** toggle any result into or out of the list from the search result card.
- **Remove all items from list:** clears the world data object's `droppedAssets` map. Any links already written onto the assets themselves stay.
- **Reset Content List:** clears the map **and** wipes clickable links from every asset that was in the list (fetches by `uniqueName`, then calls `setClickableLinkMulti({ clickableLinks: [] })` on each match).

### Themes

None. This app has no theme system or template switcher.

## Required Assets with Unique Names

| Unique Name | Required | Description                                                                                                                                                                                             |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(none)_    | —        | No unique name is required. The key asset is identified by `credentials.assetId` (the asset the visitor clicked). Any other dropped asset in the world can be pinned to the list from the admin search. |

**Optional bootstrap:** if the key asset's data object contains `{ uniqueNames: string[] }` before the first admin ever opens the drawer, the first `GET /content-list` seeds the list by running a partial-match search for each name and pinning everything it finds (excluding the key asset itself).

## Technical Architecture

Server-first: the client (`client/backendAPI.ts`) forwards every action to Express routes (`server/routes.ts` → `server/controllers/*`), which run all `@rtsdk/topia` calls. Nothing calls the SDK directly from React.

### Data Objects

#### World

Single source of truth for the featured content list.

```ts
{
  droppedAssets: {
    [droppedAssetId: string]: {
      uniqueName: string;
      topLayerURL: string;
      bottomLayerURL: string;
      assetName: string;
      profileId: string;                    // Admin who last wrote the entry
      links?: ClickableLinkType[];          // Cached snapshot of clickable links
      clickableLinks?: ClickableLinkType[]; // Same shape, read from the SDK
    };
  };
}
```

`ClickableLinkType`:

```ts
{
  clickableLink: string; // URL, must be http(s)://
  clickableLinkTitle: string; // Display label
  isForceLinkInIframe: boolean; // true = Modal
  isOpenLinkInDrawer: boolean; // true = Drawer (wins over Modal)
  linkId: string; // Existing link id from the SDK (blank on create)
}
```

Every write uses a minute-bucketed lock id: `` `${world.urlSlug}-${new Date(Math.round(Date.now() / 60000) * 60000)}` ``.

#### Key Asset (DroppedAsset)

Optional. Only read on first bootstrap.

```ts
{
  uniqueNames?: string[]; // Partial unique names to seed the list from on first open
}
```

Example:

```json
{ "uniqueNames": ["learning"] }
```

#### Visitor

Not used for storage. `PUT /teleport` calls `visitor.updateDataObject({}, { analytics: [...] })` purely to record the `teleports` analytics event — no fields are read from or persisted on the visitor.

## API Endpoints

All routes mount under `/api`. `getCredentials` requires `interactiveNonce`, `interactivePublicKey`, `urlSlug`, and `visitorId` in the query string; if `INTERACTIVE_KEY !== query.interactivePublicKey` the request is rejected.

| Method | Route               | Description                                                                                                                                                           |
| ------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `GET`  | `/`                 | Hello ping.                                                                                                                                                           |
| `GET`  | `/system/health`    | Returns `appVersion`, `status`, `serverStartDate`, and a snapshot of `NODE_ENV`, `INSTANCE_DOMAIN`, `INTERACTIVE_KEY`, `S3_BUCKET`.                                   |
| `GET`  | `/visitor`          | Returns `{ isAdmin }` for the current visitor.                                                                                                                        |
| `GET`  | `/asset-search`     | `?search=` partial-match on `uniqueName`. Filters the key asset out of the results.                                                                                   |
| `GET`  | `/content-list`     | Returns `refreshedDroppedAssets` (the pinned list, re-hydrated from live dropped-asset state). On first run seeds from the key asset's `uniqueNames`, if any.         |
| `PUT`  | `/teleport`         | Body: `{ id }`. Moves the visitor to the pinned asset's `position` via `visitor.moveVisitor`.                                                                         |
| `PUT`  | `/update-link`      | Body: `{ id, links }`. Persists `links` on the world data object **and** writes them onto the asset via `droppedAsset.setClickableLinkMulti`. Empty URLs are dropped. |
| `PUT`  | `/clear-list`       | Empties `droppedAssets` on the world data object. Does not touch assets in the scene.                                                                                 |
| `PUT`  | `/reset-list`       | Empties `droppedAssets` **and** calls `setClickableLinkMulti({ clickableLinks: [] })` on every pinned asset (matched by `uniqueName`).                                |
| `PUT`  | `/preview-links`    | Body: `{ links }`. Server-side `link-preview-js` fetch. Returns `{ previews: [{ clickableLink, preview: { title, description, image }                                 | null }] }`. Non-blocking. |
| `POST` | `/add-to-list`      | Body: `{ id, uniqueName, topLayerURL, bottomLayerURL, links, assetName }`. Adds the asset to the world data object.                                                   |
| `POST` | `/remove-from-list` | Body: `{ id }`. Removes one asset from the world data object.                                                                                                         |

## Analytics

All analytics events are fired via the `analytics` option on `updateDataObject`. Every event is keyed by `profileId` (`uniqueKey: profileId`) and carries the current `urlSlug`.

| Event                  | Fired when                                           | Where                    |
| ---------------------- | ---------------------------------------------------- | ------------------------ |
| `starts`               | Any visitor opens the drawer (list bootstraps).      | `GET /content-list`      |
| `content_list_adds`    | Admin pins an asset to the list.                     | `POST /add-to-list`      |
| `content_list_removes` | Admin unpins an asset from the list.                 | `POST /remove-from-list` |
| `link_updates`         | Admin saves changes in the Update Asset Links modal. | `PUT /update-link`       |
| `clears`               | Admin runs "Remove all items from list".             | `PUT /clear-list`        |
| `resets`               | Admin runs "Reset Content List".                     | `PUT /reset-list`        |
| `teleports`            | Anyone taps the teleport icon on a content card.     | `PUT /teleport`          |

> A `server/utils/addNewRowToGoogleSheets.ts` helper exists (reads `GOOGLESHEETS_CLIENT_EMAIL`, `GOOGLESHEETS_PRIVATE_KEY`, `GOOGLESHEETS_SHEET_ID`, `GOOGLESHEETS_SHEET_RANGE`) but is not wired into any controller in this app. It is not exported from `server/utils/index.ts` and no route calls it — no analytics reach Google Sheets unless a future controller imports it.

## Environment Variables

Create a `.env` file at the repo root. See `.env-example` for a template.

| Variable             | Description                                                                                                                               | Required |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`    | Topia interactive app public key. Also used to validate `interactivePublicKey` on every request.                                          | Yes      |
| `INTERACTIVE_SECRET` | Topia interactive app secret. Signs the JWT used by the SDK.                                                                              | Yes      |
| `INSTANCE_DOMAIN`    | Topia API domain (`api.topia.io` for prod, `api-stage.topia.io` for staging). Defaults to `api.topia.io`.                                 | No       |
| `INSTANCE_PROTOCOL`  | `https` for prod/staging, `http` for local. Defaults to `https`.                                                                          | No       |
| `PORT`               | Server port. Defaults to `3000`.                                                                                                          | No       |
| `NODE_ENV`           | `development` enables permissive CORS for `localhost:3000` / `localhost:5173`; anything else serves the built client from `client/build`. | No       |
| `S3_BUCKET`          | Surfaced in `/system/health` only. Not used by this app for uploads.                                                                      | No       |

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

```bash
# from the app root
npm install
cd client && npm install && cd ..

# create .env at the app root (see Environment Variables above)
cp .env-example .env

# run client + server together
npm run dev
```

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Server-first SDK access:** every SDK call runs in `server/controllers/*`. The client only talks to Express through `client/src/utils/backendAPI.ts`.
- **Credential validation:** `server/utils/getCredentials.ts` requires `interactiveNonce`, `interactivePublicKey`, `urlSlug`, `visitorId` on the query string and rejects mismatched public keys.
- **World-level locks:** every world data object write uses a minute-bucketed `lockId` with `releaseLock: true`, so concurrent admins collapse to one write per minute per world.
- **Link previews are best-effort:** `PUT /preview-links` returns `preview: null` for URLs that fail to fetch — the modal still renders the row.
- **Payload scrubbing:** the Express response middleware runs `cleanReturnPayload` (`server/utils/cleanReturnPayload.ts`) to strip `topia`, `credentials`, `jwt`, and `requestOptions` from all outgoing JSON, so SDK objects can be returned directly without leaking auth.
- **Client bootstrap:** `client/src/pages/Home.tsx` calls `GET /visitor` then `GET /content-list` once on mount to populate the admin flag and the content map — the drawer never re-fetches on subsequent interactions.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/cms-dev), [Prod](https://topia.io/cms-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/CMS-24b40e35bdb9809c8600ecdc658376c7?v=71f6c3828d3b4f33960326f9bde24781)
