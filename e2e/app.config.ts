// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.

/**
 * Bugs a route still has, each set to its tracking reason (e.g. "EXP-429: ..."). The matching
 * platform test is marked test.fail: it passes while the bug exists and fails once it's fixed, so
 * the entry is removed together with the fix. Leave out what the route doesn't have.
 */
export type KnownBugs = {
  /** The response contains the interactive secret or a signed InteractiveJWT. */
  leaksSecret?: string;
  /** A request without session credentials succeeds. */
  acceptsMissingCredentials?: string;
  /** Credentials signed for another app's public key are accepted. */
  acceptsForeignCredentials?: string;
  /** Bad credentials fail later on a Topia call instead of with a credential error. */
  unnamedCredentialError?: string;
  /**
   * A request without session credentials takes the app process down (e.g. getCredentials throws
   * outside any try/catch, and @rtsdk/topia's unhandledRejection hook calls process.exit(1)). The
   * missing-credentials test then runs against a private app instance (helpers/privateServer.ts)
   * instead of the shared one, so it can't kill the server mid-suite, and fails while the bug exists.
   * If the suite collapses with ECONNREFUSED right after a "rejects a request without session
   * credentials" test, that route needs this.
   */
  crashesServer?: string;
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under basePath, without the query string. */
  path: string;
  /** Where the router is mounted. Default "/api"; e.g. "/webhook" for a separate webhook router. */
  basePath?: string;
  /**
   * Where the route reads the session credentials. "query" (default) is the iframe's backendAPI call.
   * "body": webhooks (asset clicks, zone events) get them as top-level fields of the JSON body, and
   * read them with getCredentials(req.body). The platform tests then merge them into `data`.
   */
  credentialsIn?: "query" | "body";
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

// getCredentials (protected file) returns { error } instead of throwing, so every route that
// uses it has this bug until it's fixed there.
const GET_CREDENTIALS_DOESNT_THROW = "EXP-428 #6: getCredentials doesn't throw";

/**
 * API routes that read the session credentials (getCredentials). Each one must reject missing or
 * foreign credentials and must never send the interactive secret to the browser. List them all.
 *
 * Except server-sent-event streams (e.g. GET /sse): with valid credentials the response never ends, so
 * the platform tests can't read its body and time out. Cover an SSE route's credential checks in
 * tests/app instead (open it with page.request or fetch + AbortController and check the status).
 */
const UNNAMED = { unnamedCredentialError: GET_CREDENTIALS_DOESNT_THROW };
// With getCredentials not throwing, an empty search answers before any Topia call could fail.
const EMPTY_SEARCH = "EXP-428 #6: getCredentials doesn't throw; an empty search answers before any Topia call";
// The link-preview route never reads the session credentials: anyone can make the server fetch any URL.
const PREVIEW_NO_CREDENTIALS = "EXP-461: /preview-links has no credential check (server fetches any URL)";

export const CREDENTIALED_ROUTES: RouteSpec[] = [
  { method: "get", path: "/visitor", knownBugs: UNNAMED },
  {
    method: "get",
    path: "/asset-search",
    knownBugs: { ...UNNAMED, acceptsMissingCredentials: EMPTY_SEARCH, acceptsForeignCredentials: EMPTY_SEARCH },
  },
  { method: "get", path: "/content-list", knownBugs: UNNAMED },
  { method: "put", path: "/teleport", data: { id: "key-asset" }, knownBugs: UNNAMED },
  { method: "put", path: "/update-link", data: { id: "key-asset", links: [] }, knownBugs: UNNAMED },
  { method: "put", path: "/clear-list", knownBugs: UNNAMED },
  { method: "put", path: "/reset-list", knownBugs: UNNAMED },
  {
    method: "put",
    path: "/preview-links",
    data: { links: [] },
    knownBugs: {
      ...UNNAMED,
      acceptsMissingCredentials: PREVIEW_NO_CREDENTIALS,
      acceptsForeignCredentials: PREVIEW_NO_CREDENTIALS,
    },
  },
  { method: "post", path: "/add-to-list", data: { id: "key-asset", uniqueName: "e2e-asset" }, knownBugs: UNNAMED },
  { method: "post", path: "/remove-from-list", data: { id: "key-asset" }, knownBugs: UNNAMED },
]

/**
 * Page the app opens in its iframe; the platform tests load it with valid credentials. null if the app
 * has no page (no client/, driven only by webhooks): the platform tests that load a page are skipped.
 */
export const ENTRY_PAGE: string | null = "/";

/** Bugs seen when loading ENTRY_PAGE (only leaksSecret applies). */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> = {};

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';

/**
 * Bugs of the health endpoint (GET /api/system/health), e.g. { incompleteContract: "EXP-123: no
 * COMMIT_HASH/BUILD_TIME in envs" } for apps forked before the contract had them. Marks the contract
 * test test.fail instead of changing app code in the e2e PR.
 */
export const HEALTH_KNOWN_BUGS: { incompleteContract?: string } = {};

/**
 * Bugs of the app process as a whole.
 * exitsOnUnhandledRejection: a promise rejection nobody handles exits the process, so any route that
 * forgets a try/catch lets one request restart the server for every player. @rtsdk/topia registers an
 * unhandledRejection hook that calls process.exit(1) when it's imported, which runs even when the app
 * registers its own logging handler. Fix: process.removeAllListeners("unhandledRejection") before
 * registering the app's handler.
 */
export const PROCESS_KNOWN_BUGS: { exitsOnUnhandledRejection?: string } = {
  exitsOnUnhandledRejection:
    "@rtsdk/topia's unhandledRejection hook calls process.exit(1); server/index.ts's handler doesn't stop it",
};

/**
 * Extra environment for the app under test (merged over the defaults in appEnv.ts; also passed to
 * private instances and the Docker image). A function gets the mock's address as the app reaches it
 * ({ host: "localhost:3101" or "host.docker.internal:3101", url: "http://<host>" }), for fakes of
 * external APIs served by mock-topia. Fake S3 opt-in: { S3_BUCKET: FAKE_S3_BUCKET } (constants.ts).
 * Blank every variable that would point the app at a real service.
 */
export const APP_ENV: Record<string, string> | ((mock: { host: string; url: string }) => Record<string, string>) = {
  // server/utils/addNewRowToGoogleSheets.ts (unused today) would append to a real sheet.
  GOOGLESHEETS_SHEET_ID: "",
};
