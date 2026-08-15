# Operator quickstart — vin

Every command below was run end to end on 2026-08-16 from a clean checkout of
`cea013a`, macOS 25.3.0 / arm64, **node v26.3.0, npm 11.16.0**. Timings are from
that walk. Steps that were *not* walked are marked **⚠️ NOT WALKED** with the reason
— do not read those as verified.

Read `../README.md` first if you have not. The single fact that changes how you use
this repo is that `src/app.ts` is not the deployed code.

---

## 1. Get it and see what is actually here

```bash
git clone git@github.com:cloud-itonami/vin.git && cd vin
git ls-files | wc -l          # 16
git ls-files | xargs wc -c | tail -1   # 15100 total
git ls-files | grep -cE '^(src|test)/'  # 0 — nothing at the repo root
```

All code is under `appview/etzhayyim-wasm-vin-v1n0g10b/`. Set a shorthand; the rest
of this document uses it:

```bash
APP=appview/etzhayyim-wasm-vin-v1n0g10b
```

Confirm for yourself which file is deployed, before reading any of it:

```bash
node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8").replace(/^\s*\/\/.*$/gm,"");
         console.log(JSON.parse(s).main)' $APP/wrangler.jsonc
# svelte/.svelte-kit/cloudflare/_worker.js
```

That path is a SvelteKit build artifact. `src/app.ts` is not one of its inputs;
§2 proves it.

---

## 2. Build (this is the only build)

```bash
cd $APP/svelte
npm install --no-audit --no-fund      # 92 packages, 10s
```

npm prints `npm warn allow-scripts` for `esbuild` and `workerd` postinstalls.
**Ignore it for building** — vite 6 ships its own esbuild binary and the build below
succeeds without those scripts. It would matter for `wrangler dev`, which needs the
`workerd` binary; that path is not walked here.

```bash
# repo-wide rule: heavy builds go through the resource governor, one at a time
node /path/to/com-junkawasaki/scripts/resource-guard.mjs run build -- npm run build
```

Expect `✓ built in ~0.7s` (client), `✓ built in ~5s` (server),
`> Using @sveltejs/adapter-cloudflare  ✔ done`. Total ~8s.

Now check that `src/app.ts` is absent from what you just built:

```bash
for m in edge-proxy+agentgateway-mcp+langserver dispatcher.etzhayyim.com \
         x-internal-trust com.etzhayyim.apps.vin. ; do
  printf '%-42s %s\n' "$m" "$(grep -rl "$m" .svelte-kit 2>/dev/null | wc -l)"
done                                     # all 0
for m in sveltekit-edge-bff mcp.etzhayyim.com x-etzhayyim-xrpc-method ; do
  printf '%-42s %s\n' "$m" "$(grep -rl "$m" .svelte-kit 2>/dev/null | wc -l)"
done                                     # all 1
```

Every marker unique to `src/app.ts`: 0 files. Every marker unique to
`svelte/src/routes/xrpc/[...path]/+server.ts`: 1 file.

---

## 3. Run the real handler and watch it disagree with `src/app.ts`

```bash
npm run preview -- --port 5199      # serves the built output, ~7s to come up
```

`vite preview` with `@sveltejs/adapter-cloudflare` emulates the Cloudflare platform
and **populates `platform.env` from `wrangler.jsonc`** — so `AGENTGATEWAY_MCP_ROUTER_URL`
from that file is in effect, not the `DEFAULT_MCP_ROUTER_URL` constant in the source.
Worth knowing before you edit the wrong one (§4).

In another shell:

```bash
B=http://localhost:5199
for probe in "GET /" "GET /health" "GET /_app/meta" \
             "GET /xrpc/com.etzhayyim.apps.vin.vehicle" \
             "OPTIONS /xrpc/com.etzhayyim.apps.vin.vehicle"; do
  m=${probe%% *}; p=${probe#* }
  printf '%-46s %s\n' "$m $p" "$(curl -s -o /dev/null -w '%{http_code}' -X "$m" "$B$p")"
done
```

Walked result:

```
GET /                                          200
GET /health                                    404      ← src/app.ts returns 200 JSON
GET /_app/meta                                 404      ← src/app.ts returns 200 JSON
GET /xrpc/com.etzhayyim.apps.vin.vehicle       405      ← src/app.ts proxies GET
OPTIONS /xrpc/com.etzhayyim.apps.vin.vehicle   204      ← src/app.ts returns 404
```

```bash
curl -sI -X GET "$B/xrpc/com.etzhayyim.apps.vin.vehicle" | grep -i '^allow'
# allow: POST, OPTIONS
curl -sI -X OPTIONS "$B/xrpc/x" | grep -i '^access-control'
# access-control-allow-origin: *
# access-control-allow-methods: POST,OPTIONS
# access-control-allow-headers: content-type,authorization
# access-control-max-age: 86400
```

And the one page, next to the config it contradicts:

```bash
curl -s "$B/" | sed -e 's/<script.*//' -e 's/<[^>]*>/ /g' | tr -s ' ' | \
  grep -o 'Cloudflare appview.*Source'
# … Routes 0 … No public route is declared next to this app surface.
#   No public vars are declared in the nearest wrangler config. …

node -e 'const s=require("fs").readFileSync("../wrangler.jsonc","utf8").replace(/^\s*\/\/.*$/gm,"");
         const w=JSON.parse(s);
         console.log("routes:",w.routes.length,"vars:",Object.keys(w.vars).length)'
# routes: 2 vars: 8
```

---

## 4. See exactly what crosses to the upstream

The real upstream (`mcp.etzhayyim.com`) does not exist in DNS, so point the worker
at a local sink. **Change the wrangler var, not the source constant** — the var wins
(§3).

Sink (`/tmp/vin-sink.cljs`, nbb; this workspace does not add new `.mjs`/`.sh`):

```clojure
(ns vin-sink (:require ["node:http" :as http]))
(.listen
 (.createServer http
   (fn [req res]
     (let [chunks (atom [])]
       (.on req "data" #(swap! chunks conj (.toString % "utf8")))
       (.on req "end" (fn []
         (println "method:" (.-method req) "url:" (.-url req))
         (doseq [[k v] (sort (js->clj (.-headers req)))] (println " " k ":" v))
         (println "body:" (apply str @chunks))
         (.writeHead res 200 #js {"content-type" "application/json"})
         (.end res (js/JSON.stringify #js {"jsonrpc" "2.0" "id" "probe"
                                           "result" #js {"structuredContent"
                                                         #js {"sink" true}}})))))))
 5200 #(println "sink listening on 5200"))
```

```bash
nbb /tmp/vin-sink.cljs &
# in $APP: swap the var, rebuild, restart preview
perl -pi -e 's|"AGENTGATEWAY_MCP_ROUTER_URL": "https://[^"]*"|"AGENTGATEWAY_MCP_ROUTER_URL": "http://127.0.0.1:5200/sink"|' wrangler.jsonc
```

Then send an NSID that `src/app.ts` would answer `404 NotFound` for:

```bash
curl -s -X POST http://localhost:5199/xrpc/com.example.totally.unrelated.tool \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer PROBE-TOKEN' -H 'cookie: session=PROBE-COOKIE' \
  -d '{"probe":true}' -w ' [http %{http_code}]\n'
```

**Walked result: `408`, and the sink logs nothing.** That is not the allowlist
working — it is the bug in item 3 below. Apply this one line to
`svelte/src/routes/xrpc/[...path]/+server.ts`:

```diff
- headers.delete('host');
+ headers.delete('host'); headers.delete('content-length');
```

rebuild, restart preview, resend. **Walked result: `200 {"sink":true}`**, and the
sink logs:

```
method: POST url: /sink
  authorization : Bearer PROBE-TOKEN
  content-length : 165
  cookie : session=PROBE-COOKIE
  x-etzhayyim-bff : sveltekit-edge-bff
  x-etzhayyim-xrpc-method : com.example.totally.unrelated.tool
body: {"jsonrpc":"2.0","id":"0f94cdfd-…","method":"tools/call",
       "params":{"name":"com.example.totally.unrelated.tool","arguments":{"probe":true}}}
```

Three things that single probe establishes:

1. **No NSID allowlist.** An arbitrary caller-chosen string becomes the MCP tool
   name. `src/app.ts`'s `NSID_PREFIX` guard is not in the deployed path.
2. **`authorization` and `cookie` are forwarded verbatim** to the upstream. Only
   `host` is stripped.
3. **The copied inbound `content-length` breaks the upstream call on Node.** The
   handler sends a longer JSON-RPC envelope than the body it received but keeps the
   inbound length header. Deleting it is the whole fix — the two runs above differ by
   nothing else.

⚠️ **NOT WALKED: whether item 3 also breaks on workerd.** `vite preview` runs on
Node/undici; production runs on workerd, which may recompute `content-length`. The
real upstream does not resolve, so there is no way to check from here. Do not report
item 3 as a production outage without measuring it on workerd.

**Revert the wrangler var and the one-line diff before committing.**

---

## 5. Make your checks discriminate before you trust them

Both checks pass on a clean tree, which by itself tells you nothing:

```bash
cd $APP     && npm install --no-audit --no-fund && npm run typecheck  # exit 0
cd $APP/svelte && npm run check                                        # exit 0, 142 files, 0 errors
```

Break one file at a time and confirm the right check goes red. Walked:

| break | root `npm run typecheck` | `svelte/` `npm run check` |
|---|---|---|
| nothing | exit 0, 0 errors | exit 0, 142 files, **0** errors |
| `src/app.ts` — `const NSID_PREFIX: number = "…"` | **exit 2, 2 errors** | exit 0, **0** errors |
| `+server.ts` — `const DEFAULT_MCP_ROUTER_URL: number = …` | exit 0, **0** errors | **exit 1, 2 errors** |
| `+page.svelte` — `{app.noSuchField.deep}` | — | **exit 1, 1 error** |

Both directions matter. The middle row is the point: **the root `npm run typecheck`
is blind to the deployed handler.** Confirm its scope yourself —

```bash
cd $APP && npx tsc --noEmit --listFiles | grep -v node_modules
# …/src/app.ts        ← one file, and it is the one that never runs
```

So: *the only script named in the appview's `package.json` cannot fail because of
anything that ships.* Run `npm run check` inside `svelte/` before you commit.

There are no unit tests in this repository. `npm run check` is type checking, not
behaviour. §3 and §4 are the only behavioural evidence that exists, and they are
manual.

---

## 6. Deploy — ⚠️ NOT WALKED

```bash
cd $APP && npx wrangler deploy      # NOT RUN
```

Three reasons, each independent:

1. **No credentials were used.** Deploying is a live change to shared
   infrastructure; nothing here needed it.
2. **The routes do not exist.** `vin.etzhayyim.com` and `v1n0g10b.etzhayyim.com` are
   NXDOMAIN on two resolvers. A deploy would attach routes to hostnames with no DNS.
3. **The upstream does not exist either.** `mcp.etzhayyim.com` is NXDOMAIN, so a
   successfully deployed worker would still fail every `POST /xrpc/…`.

Check it yourself before assuming any of that has changed:

```bash
for h in vin.etzhayyim.com v1n0g10b.etzhayyim.com mcp.etzhayyim.com \
         dispatcher.etzhayyim.com etzhayyim.com; do
  printf '%-28s %s\n' "$h" "$(dig +noall +comment "$h" | grep -o 'status: [A-Z]*')"
done
```

If you do deploy: `wrangler.jsonc` `main` is a build artifact, so **§2 must run
first** or there is nothing to upload. `assets.directory` is
`./svelte/.svelte-kit/cloudflare/client`, also from §2. And the repo-wide rule
applies — deploy only from a checkout that contains `origin/main`.

---

## 7. Identity, if you touch it

```bash
curl -s https://etzhayyim.com/actor/vin/did.json | head -6
# 200 — "id": "did:web:etzhayyim.com:actor:vin"     (owned by cloud-itonami/vin-actor)
curl -s https://vin.etzhayyim.com/.well-known/did.json
# connection failure — NXDOMAIN
```

`kotodama.jsonld` here still declares `did:web:vin.etzhayyim.com`, the one that does
not resolve. Commits `0df364d`/`86c375c`/`cea013a` already removed the DID shell from
this repo on the grounds that `vin-actor` is the owner, but left `kotodama.jsonld`
asserting the old id. **Which DID this appview should carry is unresolved and is the
app owner's call** — see `../README.md`. Do not change it as a drive-by.

---

## 8. Reading this repo's maturity numbers

`manifest/itonami-maturity-evidence.edn` reports `src/bytes 0`, `test/bytes 0`.

- `test/bytes 0` is **true**: there are no tests.
- `src/bytes 0` is an **artefact**: the scan counts `src/**` at the repository root,
  and everything here is under `appview/etzhayyim-wasm-vin-v1n0g10b/` — 13,500 bytes,
  of which 9,436 are `.ts` / `.svelte` / `.html`.

Do not "fix" the second by moving directories. That moves the score without moving
anything real, and the score is supposed to be a shadow of the work.
