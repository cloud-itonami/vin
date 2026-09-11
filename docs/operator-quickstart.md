# operator quickstart — vin (appview `v1n0g10b`)

> **Updated 2026-09-05 (svelte→cljs migration):** the SvelteKit app was removed.
> The UI is now shadow-cljs + reagent + kotoba-ui (murakumo-studio構成), built
> from the repository root:
>
> ```bash
> npm install
> amu compile --target wasm32-browser app
> ```
>
> ```
> [:app] Build completed. (95 files, 0 errors)
> ```
>
> The build emits `web/dist/js/main.js` + `web/dist/vendor/kotoba-ui.css`, which
> `wrangler.jsonc` serves as static assets (`assets.directory: ../../web/dist`,
> `main: ./src/app.ts` — the xrpc proxy that was previously only reachable as
> `svelte/.../xrpc/[...path]/+server.ts` is now the deployed `src/app.ts`).
> The sections below describe the pre-migration SvelteKit procedure and are kept
> as the audit record.

この手順は 2026-08-14 に**実際に踏んで**書いた。踏めなかったものは
「踏めない」と書いてある（§5）。

対象は `appview/etzhayyim-wasm-vin-v1n0g10b/` の Worker だけ。
この repo の残りは設計文書で、実行するものが無い。
