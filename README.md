# vin — the Cloudflare edge surface for `vin.etzhayyim.com`

**One SvelteKit worker with exactly one working route: `POST /xrpc/<method>`, which
rewraps its body as an MCP `tools/call` and forwards it to an MCP router.** That is
the whole of the deployed behaviour. There is no VIN parsing, no plate handling, no
storage and no actor logic in this repository.

16 tracked files, 15,100 bytes. Nothing under `src/` or `test/` at the repo root.

## The single most important thing to know

**`appview/etzhayyim-wasm-vin-v1n0g10b/src/app.ts` is not deployed and never runs.**

`wrangler.jsonc` sets `main` to `svelte/.svelte-kit/cloudflare/_worker.js` — the
SvelteKit build output. `src/app.ts` is not an input to that build. Measured after
`npm run build` by grepping the whole `.svelte-kit` tree:

| marker | unique to | files in build tree |
|---|---|---|
| `edge-proxy+agentgateway-mcp+langserver` | `src/app.ts` | **0** |
| `dispatcher.etzhayyim.com` | `src/app.ts` | **0** |
| `x-internal-trust` | `src/app.ts` | **0** |
| `com.etzhayyim.apps.vin.` | `src/app.ts` | **0** |
| `sveltekit-edge-bff` | `+server.ts` | 1 |
| `mcp.etzhayyim.com` | `+server.ts` | 1 |
| `x-etzhayyim-xrpc-method` | `+server.ts` | 1 |

The deployed handler is
`appview/etzhayyim-wasm-vin-v1n0g10b/svelte/src/routes/xrpc/[...path]/+server.ts`
(the request path) and `svelte/src/routes/+page.svelte` (the one page).

This matters because the two files disagree about behaviour that a reader of
`src/app.ts` would reasonably assume is in force. Walked against the built output
served by `npm run preview` (§3 of the quickstart):

| request | `src/app.ts` would answer | **deployed handler actually answers** |
|---|---|---|
| `GET /health` | `200` JSON with actor/nanoid/execution | **`404`** HTML error page |
| `GET /_app/meta` | `200` JSON, same body | **`404`** HTML error page |
| `OPTIONS /xrpc/…` | `404 {"error":"NotFound"}` (no OPTIONS branch) | **`204`** + `access-control-allow-origin: *` |
| `GET /xrpc/com.etzhayyim.apps.vin.vehicle` | `200` (GET merges query into body and proxies) | **`405`**, `Allow: POST, OPTIONS` |
| `POST /xrpc/com.example.totally.unrelated.tool` | `404 {"error":"NotFound","message":"vin not found"}` | **forwarded upstream** |
| upstream host | `dispatcher.etzhayyim.com` | **`mcp.etzhayyim.com`** |
| upstream protocol | plain XRPC `POST /xrpc/<nsid>` | **JSON-RPC 2.0 `tools/call`** |
| upstream auth | `x-internal-trust: <secret>` | **every inbound header, verbatim** |

So the NSID allowlist, the `/health` endpoint, and the shared-secret header that
`src/app.ts` implements do not exist in production. `src/app.ts` is the *design a
reader will believe*; `+server.ts` is the *code that answers*.

## What the deployed handler does, exactly

`POST /xrpc/<anything>` →
`POST $AGENTGATEWAY_MCP_ROUTER_URL` with body
`{"jsonrpc":"2.0","id":<uuid>,"method":"tools/call","params":{"name":"<anything>","arguments":<your JSON>}}`,
then unwraps `result.structuredContent` back to the caller.

Three properties of that, each measured against a local sink (quickstart §4):

1. **`<anything>` is unconstrained.** It is `event.params.path`, passed straight
   through as the MCP tool name. `com.example.totally.unrelated.tool` reached the
   sink as `params.name`. Whatever tools the router exposes are reachable from the
   open internet through this worker.
2. **Inbound headers are forwarded verbatim, minus `host`.** `authorization:
   Bearer PROBE-TOKEN` and `cookie: session=PROBE-COOKIE` both arrived at the sink
   unchanged. Combined with `access-control-allow-origin: *` and
   `access-control-allow-headers: content-type,authorization` on the OPTIONS
   response, any origin can drive this with an `Authorization` header of its choice.
3. **The forwarded `content-length` is the *inbound* one, but the body is a
   different, longer JSON-RPC envelope.** On Node/undici — what `npm run preview`
   runs — this means the upstream request is never delivered and the caller gets
   `408 {"error":"MCP router request failed","upstream":null}`. Adding
   `headers.delete('content-length')` next to the existing `headers.delete('host')`
   changes the same probe to `200` with the body delivered intact. That one line is
   the whole difference; see the quickstart for the exact before/after.
   ⚠️ **NOT MEASURED on workerd.** Cloudflare's runtime may recompute
   `content-length`; this repo's real upstream does not resolve (below) so there is
   no way to test production from here. Treat item 3 as *confirmed on Node,
   untested on the deployment target*.

## Nothing this repo names is currently reachable

Two resolvers (system, `1.1.1.1`), both agree:

| name | source | DNS |
|---|---|---|
| `vin.etzhayyim.com` | `wrangler.jsonc` route, `kotodama.jsonld` DID | **NXDOMAIN** |
| `v1n0g10b.etzhayyim.com` | `wrangler.jsonc` route | **NXDOMAIN** |
| `mcp.etzhayyim.com` | the deployed handler's upstream | **NXDOMAIN** |
| `dispatcher.etzhayyim.com` | `src/app.ts`'s upstream | **NXDOMAIN** |
| `etzhayyim.com` | apex | NOERROR (Cloudflare) |

The worker is not routable, and if it were, its upstream is not either. **Read this
repository as a design record and a build target, not as a running service.**

## Identity: the DID in this repo is the dead one

`kotodama.jsonld` declares `"@id": "did:web:vin.etzhayyim.com"`. A `did:web` with a
host and no path resolves to `https://vin.etzhayyim.com/.well-known/did.json`, which
cannot be fetched (NXDOMAIN above).

The identity that *does* resolve belongs to the sibling repo
[`cloud-itonami/vin-actor`](https://github.com/cloud-itonami/vin-actor):
`https://etzhayyim.com/actor/vin/did.json` returns `200` with
`"id": "did:web:etzhayyim.com:actor:vin"`, byte-for-byte the id in
`vin-actor/.well-known/did.json`.

This is the same conclusion the git history already reached — commits `0df364d`,
`86c375c` and `cea013a` (2026-08-03) removed a copy of the DID shell from this repo
with the message *"vin-actor が正しい所有者"*. **`kotodama.jsonld` was not updated at
the same time**, so this repo still asserts the identity it disclaimed. Which of the
two DIDs the appview should carry is the app owner's call and has not been made; it
is recorded here so the next reader does not have to rediscover it.

## Boundary with `cloud-itonami/vin-actor`

| | `vin` (here) | `vin-actor` |
|---|---|---|
| what it is | Cloudflare edge worker (SvelteKit) | governed actor scaffold (`.cljc`) |
| deployed artifact | `svelte/.svelte-kit/cloudflare/_worker.js` | none — library + tests |
| DID | `did:web:vin.etzhayyim.com` (unresolvable) | `did:web:etzhayyim.com:actor:vin` (live) |
| domain design doc | none (see `CLAUDE.md` caveat below) | `CLAUDE.md`, 405 lines: DID hierarchy, graph labels, seed order, plate formats |
| NSID namespace | `com.etzhayyim.apps.vin.*` | `com.etzhayyim.vin.*` |

**The two NSID namespaces do not match.** `vin`'s `kotodama.jsonld` subscribes to
`com.etzhayyim.apps.vin.{vehicle,manufacturer,shipmentVolume}`; `vin-actor`'s
`collection` function emits `com.etzhayyim.vin.<name>`. Nothing published by the
actor lands in a collection the appview is watching. Not fixed here — picking the
winner is a contract decision across both repos.

## `CLAUDE.md` describes a system this repo does not contain

Kept, not deleted: it is the best surviving record of *intended* behaviour, and the
`vin-actor` design doc elaborates the same model. But read it knowing that:

- it points at `20-actors/vin/actor-manifest.jsonld` — no such path here (that file
  lives in `vin-actor`);
- `kotodama.jsonld` points `build.businessLogic` at
  `40-engine/kotoba/…/kotodama/ingest/vin.py` and `build.bpmn` at
  `etzhayyim-root/00-contracts/bpmn/…` — both are paths in the pre-migration
  monorepo, and this repo contains no `.py` and no BPMN;
- **`ISO 3779` appears twice in `CLAUDE.md` and zero times in any code.** The string
  `vin` (case-insensitive) appears **0 times** in `+server.ts`, the only deployed
  request handler. The five occurrences in `+page.svelte` are all in generated
  title/name/path metadata. There is no VIN parser, no WMI split, and no check-digit
  validation anywhere in this repository.

## The one public page is a scaffold placeholder that contradicts its neighbour

`GET /` renders, verbatim: *"No public route is declared next to this app surface."*
and *"No public vars are declared in the nearest wrangler config."*

The `wrangler.jsonc` in the same directory declares **2 routes**
(`vin.etzhayyim.com/*`, `v1n0g10b.etzhayyim.com/*`) and **8 vars**. `+page.svelte`
hard-codes `"routeCount": 0, "routes": [], "vars": []`, and its `relativePath` still
reads `60-apps/etzhayyim-project-vin/…` — the pre-migration monorepo location. The
page was generated from a scan that did not see the config now sitting beside it and
has not been regenerated since.

## The advertised check covers only the file that never runs

`package.json` at the appview root advertises exactly one script,
`typecheck` (`tsc --noEmit`). Its `tsconfig.json` has `"include": ["src/**/*.ts"]`,
and `tsc --listFiles` confirms it compiles exactly one file: `src/app.ts`.

Measured by breaking one file at a time (quickstart §5):

| broken file | root `npm run typecheck` | `svelte/` `npm run check` |
|---|---|---|
| nothing | exit 0 | exit 0, 142 files, 0 errors |
| `src/app.ts` (not deployed) | **exit 2, 2 errors** | exit 0 — blind |
| `+server.ts` (deployed) | exit 0 — **blind** | **exit 1, 2 errors** |
| `+page.svelte` (deployed) | — | **exit 1, 1 error** |

So the check named in the root `package.json` is blind to 100% of the deployed code,
and the check that does cover it is only reachable by `cd svelte`. If you run one
command before committing, run the one in `svelte/`.

## Layout

```
CLAUDE.md          domain design — for vin-actor's model, not this code (see above)
README.edn         {:name "com-etzhayyim-app-vin" :kind :app} — 4 keys
migration.edn      provenance: etzhayyim/root @ afe5f1d, 14 files, 14,624 bytes
NOTICE             Apache-2.0 + etzhayyim Charter Rider v3.1
docs/operator-quickstart.md
appview/etzhayyim-wasm-vin-v1n0g10b/
  wrangler.jsonc     main → svelte/.svelte-kit/cloudflare/_worker.js   ← the deploy
  src/app.ts         NOT DEPLOYED (see above)
  package.json       "typecheck" — covers src/app.ts only
  kotodama.jsonld    actor descriptor; DID does not resolve
  svelte/
    src/routes/+page.svelte              the one page (placeholder)
    src/routes/xrpc/[...path]/+server.ts the one working route  ← the real handler
```

## Why the maturity scan reads this repo as empty

`src/bytes = 0` and `test/bytes = 0` in `manifest/itonami-maturity-evidence.edn` are
correct as measured and misleading as read. The scan counts `src/**` and `test/**`
*at the repository root*; all code here lives under
`appview/etzhayyim-wasm-vin-v1n0g10b/` (13,500 bytes, of which 9,436 are `.ts` /
`.svelte` / `.html`). **There are genuinely no tests** — that part is not an artefact.
Moving directories would move the score without moving anything real, so it has not
been done.
