(ns cloud-itonami.vin.state
  "App state for the vin appview UI. Ported 1:1 from the former
  appview/etzhayyim-wasm-vin-v1n0g10b/svelte/src/routes/+page.svelte
  template shell — a single static screen describing the app surface
  (title / project / routes / bindings / source path). Single reagent
  atom, murakumo-studio構成."
  (:require [reagent.core :as r]))

(defonce state
  (r/atom
   {:app {:title "Vin V1n0g10b"
          :project "etzhayyim-project-vin"
          :name "etzhayyim-wasm-vin-v1n0g10b"
          :kind "appview"
          :route-count 0
          :routes []
          :vars []
          :xrpc? true
          :relative-path "60-apps/etzhayyim-project-vin/appview/etzhayyim-wasm-vin-v1n0g10b/svelte/src/routes/+page.svelte"}}))
