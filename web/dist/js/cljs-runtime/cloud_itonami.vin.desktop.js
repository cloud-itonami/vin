goog.provide('cloud_itonami.vin.desktop');
if((typeof cloud_itonami !== 'undefined') && (typeof cloud_itonami.vin !== 'undefined') && (typeof cloud_itonami.vin.desktop !== 'undefined') && (typeof cloud_itonami.vin.desktop.root !== 'undefined')){
} else {
cloud_itonami.vin.desktop.root = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
cloud_itonami.vin.desktop.mount_BANG_ = (function cloud_itonami$vin$desktop$mount_BANG_(){
var el = document.getElementById("app");
if(cljs.core.truth_(cljs.core.deref(cloud_itonami.vin.desktop.root))){
} else {
cljs.core.reset_BANG_(cloud_itonami.vin.desktop.root,reagent.dom.client.create_root(el));
}

return reagent.dom.client.render.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cloud_itonami.vin.desktop.root),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cloud_itonami.vin.ui.root], null));
});
cloud_itonami.vin.desktop.init_BANG_ = (function cloud_itonami$vin$desktop$init_BANG_(){
return cloud_itonami.vin.desktop.mount_BANG_();
});

//# sourceMappingURL=cloud_itonami.vin.desktop.js.map
