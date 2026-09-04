# vin — the Cloudflare edge surface for `vin.etzhayyim.com`

**One Cloudflare Worker with exactly one working route: `POST /xrpc/<method>`, which
rewraps its body as an MCP `tools/call` and forwards it to an MCP router.** That is
the whole of the deployed behaviour. There is no VIN parsing, no plate handling, no
storage and no actor logic in this repository.

**The UI was migrated from SvelteKit to shadow-cljs + reagent + kotoba-ui on
2026-09-05** (murakumo-studio構成: `src/cloud_itonami/vin/{state,ui,desktop}.cljs`,
built by `npx shadow-cljs compile app` → `web/dist/`). The old SvelteKit
`+server.ts` xrpc proxy is superseded by `src/app.ts`, which is now the deployed
entrypoint (`wrangler.jsonc: main=./src/app.ts`, assets `../../web/dist`).

16 tracked files, 15,100 bytes pre-migration. Nothing under `src/` or `test/` at the
repo root.

## The single most important thing to know

**Before the 2026-09-05 migration, `src/app.ts` was not deployed and never ran.**

`wrangler.jsonc` set `main` to `svelte/.svelte-kit/cloudflare/_worker.js` — the
SvelteKit build output. `src/app.ts` was not an input to that build. Measured after
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

The deployed handler was
`appview/etzhayyim-wasm-vin-v1n0g10b/svelte/src/routes/xrpc/[...path]/+server.ts`
(the request path) and `svelte/src/routes/+page.svelte` (the one page).

**Post-migration this split is resolved:** `wrangler.jsonc` now deploys
`src/app.ts` (edge-proxy + NSID allowlist + `/health`) with the static UI from
`web/dist`. The historical audit below is kept because the two
implementations disagree about behaviour, and which one serves production is
the deploy decision recorded in `wrangler.jsonc`.

## What the old deployed handler did (pre-migration audit, kept)

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
***   Bearer PROBE-TOKEN` and `cookie: session=PROBE-COOKIE` both arrived at the sink
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
| what it is | Cloudflare edge worker | governed actor scaffold (`.cljc`) |
| deployed artifact | `src/app.ts` + `web/dist` (post-migration) | none — library + tests |
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
- **`ISO 3779` appears twice in `CLAUDE.md` and zero times in any code.** There is no
  VIN parser, no WMI split, and no check-digit validation anywhere in this repository.

## The one public page is a scaffold placeholder that contradicts its neighbour

`GET /` renders, verbatim: *"No public route is declared next to this app surface."*
and *"No public vars are declared in the nearest wrangler config."*

The `wrangler.jsonc` in the same directory declares **2 routes**
(`vin.etzhayyim.com/*`, `v1n0g10b.etzhayyim.com/*`) and **8 vars**. The page
hard-codes `"routeCount": 0, "routes": [], "vars": []`, and its `relativePath` still
reads `60-apps/etzhayyim-project-vin/…` — the pre-migration monorepo location. The
page was generated from a scan that did not see the config now sitting beside it and
has not been regenerated since. *(Preserved 1:1 in the cljs port — the placeholder
content is the measured state, not a UI bug.)*

## Layout

```
CLAUDE.md          domain design — for vin-actor's model, not this code (see above)
README.edn         {:name "com-etzhayyim-app-vin" :kind :app} — 4 keys
migration.edn      provenance: etzhayyim/root @ afe5f1d, 14 files, 14,624 bytes
NOTICE             Apache-2.0 + etzhayyim Charter Rider v3.1
docs/operator-quickstart.md
shadow-cljs.edn    :app build → web/dist/js (2026-09-05 svelte→cljs migration)
deps.edn           :cljs alias (shadow-cljs 2.28.20 / reagent 1.2.0 / appkit local/root)
src/cloud_itonami/vin/{state,ui,desktop}.cljs   the UI (murakumo-studio構成)
web/               index.html + dist build output + vendor/kotoba-ui.css
appview/etzhayyim-wasm-vin-v1n0g10b/
  wrangler.jsonc     main → ./src/app.ts, assets → ../../web/dist   ← the deploy
  src/app.ts         deployed entrypoint (edge-proxy + /health + NSID allowlist)
  package.json       react@18 for the cljs build
  kotodama.jsonld    actor descriptor; DID does not resolve
```

## Verified state (post-migration, 2026-09-05)

| what | result |
|---|---|
| `npx shadow-cljs compile app` | ✅ **Build completed. (95 files, 0 errors)** |
| local http server over `web/dist` | ✅ `/index.html`, `/js/main.js`, `/vendor/kotoba-ui.css` all HTTP 200; main.js contains the ported UI (vin-app / Public Routes / Runtime Bindings) |
| pre-migration SvelteKit audit (`npm run check` 142 files 0 errors, `wrangler dev` probes) | kept in git history and `docs/operator-quickstart.md` |

## Why the maturity scan reads this repo as empty

`src/bytes = 0` and `test/bytes = 0` in `manifest/itonami-maturity-evidence.edn` are
correct as measured and misleading as read. The scan counts `src/**` and `test/**`
*at the repository root*; all code here lives under
`appview/etzhayyim-wasm-vin-v1n0g10b/` (pre-migration). **There are genuinely no
tests** — that part is not an artefact.
