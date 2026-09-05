goog.provide('byoubu.facts');
/**
 * The two inks a backdrop may ask content to use. Not pure #fff / #000:
 *   the light ink is very slightly cool and the dark ink very slightly warm,
 *   which is what keeps large text off a backdrop from vibrating.
 */
byoubu.facts.ink_candidates = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"light","light",1918998747),"#f4f2fa",new cljs.core.Keyword(null,"dark","dark",1818973999),"#12100f"], null);
/**
 * The weighted mix named by `:byoubu/content-band` — what the author claims
 *   a reader sees behind body content.
 */
byoubu.facts.declared_content_color = (function byoubu$facts$declared_content_color(backdrop){
return byoubu.color.mix((function (){var iter__5480__auto__ = (function byoubu$facts$declared_content_color_$_iter__22633(s__22634){
return (new cljs.core.LazySeq(null,(function (){
var s__22634__$1 = s__22634;
while(true){
var temp__5825__auto__ = cljs.core.seq(s__22634__$1);
if(temp__5825__auto__){
var s__22634__$2 = temp__5825__auto__;
if(cljs.core.chunked_seq_QMARK_(s__22634__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__22634__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__22636 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__22635 = (0);
while(true){
if((i__22635 < size__5479__auto__)){
var vec__22637 = cljs.core._nth(c__5478__auto__,i__22635);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22637,(0),null);
var w = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22637,(1),null);
cljs.core.chunk_append(b__22636,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(backdrop,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("byoubu","palette","byoubu/palette",851879321),k], null)),w], null));

var G__22725 = (i__22635 + (1));
i__22635 = G__22725;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__22636),byoubu$facts$declared_content_color_$_iter__22633(cljs.core.chunk_rest(s__22634__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__22636),null);
}
} else {
var vec__22640 = cljs.core.first(s__22634__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22640,(0),null);
var w = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22640,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(backdrop,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("byoubu","palette","byoubu/palette",851879321),k], null)),w], null),byoubu$facts$declared_content_color_$_iter__22633(cljs.core.rest(s__22634__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword("byoubu","content-band","byoubu/content-band",-1665630238).cljs$core$IFn$_invoke$arity$1(backdrop));
})());
});
/**
 * tier -> content-band color, for every tier that has been *measured*, plus
 *   `:declared` as the fallback.
 * 
 *   Measurement matters because the declared weighting was wrong. The first
 *   four entries were authored as ground-dominated mixes; sampling the rendered
 *   poster showed the content band is mostly *sky*, three to nineteen times
 *   brighter than declared, and one backdrop (`:cobalt-dune`) sat at 3.97:1 —
 *   under AA — while its declared facts claimed 15.42:1. Facts derived from an
 *   authored guess are a guess with a number printed on it.
 */
byoubu.facts.tier_colors = (function byoubu$facts$tier_colors(backdrop){
var m = new cljs.core.Keyword("byoubu","measured","byoubu/measured",-610808208).cljs$core$IFn$_invoke$arity$1(backdrop);
var G__22644 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"declared","declared",92336021),byoubu.facts.declared_content_color(backdrop)], null);
var G__22644__$1 = (cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plate","plate",-1920178141),new cljs.core.Keyword(null,"content-color","content-color",1294205929)], null)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__22644,new cljs.core.Keyword(null,"plate","plate",-1920178141),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plate","plate",-1920178141),new cljs.core.Keyword(null,"content-color","content-color",1294205929)], null))):G__22644);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"poster","poster",-1616913550),new cljs.core.Keyword(null,"content-color","content-color",1294205929)], null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__22644__$1,new cljs.core.Keyword(null,"poster","poster",-1616913550),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"poster","poster",-1616913550),new cljs.core.Keyword(null,"content-color","content-color",1294205929)], null)));
} else {
return G__22644__$1;
}
});
/**
 * The single color that best represents what a reader sees behind body
 *   content: the measured poster band if there is one, else the measured plate
 *   band, else the declared mix.
 */
byoubu.facts.content_color = (function byoubu$facts$content_color(backdrop){
var t = byoubu.facts.tier_colors(backdrop);
var or__5002__auto__ = new cljs.core.Keyword(null,"poster","poster",-1616913550).cljs$core$IFn$_invoke$arity$1(t);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"plate","plate",-1920178141).cljs$core$IFn$_invoke$arity$1(t);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"declared","declared",92336021).cljs$core$IFn$_invoke$arity$1(t);
}
}
});
/**
 * The ink that maximizes the *minimum* contrast across every tier, as
 *   [key hex min-ratio].
 * 
 *   Worst case rather than representative case, because a client does not
 *   choose its tier: a cold load gets the gradient plate, a warm one gets the
 *   poster, and the same text has to be readable on both. Picking ink from one
 *   tier and shipping the other is how a page ends up legible in review and
 *   not in production.
 */
byoubu.facts.best_ink = (function byoubu$facts$best_ink(colors){
return cljs.core.first(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p__22646){
var vec__22647 = p__22646;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22647,(0),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22647,(1),null);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22647,(2),null);
return (- r);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__22650){
var vec__22653 = p__22650;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22653,(0),null);
var hex = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22653,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,hex,cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.min,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__22645_SHARP_){
var or__5002__auto__ = byoubu.color.contrast_ratio(hex,p1__22645_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return 0.0;
}
}),colors))], null);
}),byoubu.facts.ink_candidates)));
});
/**
 * How much material content needs between itself and the backdrop. A busier
 *   backdrop needs a thicker glass surface to stay readable — this is the
 *   token liquid-glass-ui already understands, not a new vocabulary.
 */
byoubu.facts.texture__GT_surface = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"calm","calm",-533989756),new cljs.core.Keyword(null,"thin","thin",-1454429647),new cljs.core.Keyword(null,"moderate","moderate",-1039163165),new cljs.core.Keyword(null,"regular","regular",-1153375582),new cljs.core.Keyword(null,"busy","busy",-328286801),new cljs.core.Keyword(null,"thick","thick",-1141078578)], null);
/**
 * Backdrop -> the facts a UI needs to place content on it:
 * 
 *  :byoubu.facts/content-color    weighted mix behind body content
 *  :byoubu.facts/luminance        its WCAG relative luminance, 0.0-1.0
 *  :byoubu.facts/appearance       :dark | :light — which HIG appearance
 *                                 content should resolve to
 *  :byoubu.facts/ink              recommended text color
 *  :byoubu.facts/contrast         WCAG ratio of that ink on that mix
 *  :byoubu.facts/accent           the palette's accent hex (the backdrop's
 *                                 own chromatic note, for :hig/color :tint)
 *  :byoubu.facts/accent-hue       its hue in degrees, for queries
 *  :byoubu.facts/glass-surface    :thin | :regular | :thick
 * 
 *   `:contrast` is the WORST ratio across every measured tier plus the declared
 *   fallback, not the ratio on the representative color — see `best-ink`.
 *   `:tier-contrasts` reports them individually so a caller can see which tier
 *   is the tight one.
 * 
 *   `:appearance` follows the ink, not the luminance threshold directly: the
 *   question a consumer actually has is "which appearance keeps my text
 *   readable", and that is exactly the ink comparison.
 */
byoubu.facts.derive_facts = (function byoubu$facts$derive_facts(backdrop){
var tiers = byoubu.facts.tier_colors(backdrop);
var bg = byoubu.facts.content_color(backdrop);
var vec__22676 = byoubu.facts.best_ink(cljs.core.vals(tiers));
var ink_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22676,(0),null);
var ink = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22676,(1),null);
var ratio = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22676,(2),null);
var accent = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(backdrop,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("byoubu","palette","byoubu/palette",851879321),new cljs.core.Keyword("byoubu","accent","byoubu/accent",553460268).cljs$core$IFn$_invoke$arity$1(backdrop)], null));
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("byoubu.facts","contrast","byoubu.facts/contrast",-386835292),new cljs.core.Keyword("byoubu.facts","accent-hue","byoubu.facts/accent-hue",924335652),new cljs.core.Keyword("byoubu.facts","content-color","byoubu.facts/content-color",324221864),new cljs.core.Keyword("byoubu.facts","luminance","byoubu.facts/luminance",1166207497),new cljs.core.Keyword("byoubu.facts","glass-surface","byoubu.facts/glass-surface",-1696773134),new cljs.core.Keyword("byoubu.facts","accent","byoubu.facts/accent",-875976237),new cljs.core.Keyword("byoubu.facts","ink","byoubu.facts/ink",567836213),new cljs.core.Keyword("byoubu.facts","appearance","byoubu.facts/appearance",-1138027971),new cljs.core.Keyword("byoubu.facts","tier-contrasts","byoubu.facts/tier-contrasts",216154782)],[ratio,byoubu.color.hue(accent),bg,byoubu.color.relative_luminance(bg),cljs.core.get.cljs$core$IFn$_invoke$arity$3(byoubu.facts.texture__GT_surface,new cljs.core.Keyword("byoubu","texture","byoubu/texture",1576630445).cljs$core$IFn$_invoke$arity$1(backdrop),new cljs.core.Keyword(null,"regular","regular",-1153375582)),accent,ink,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ink_key,new cljs.core.Keyword(null,"light","light",1918998747)))?new cljs.core.Keyword(null,"dark","dark",1818973999):new cljs.core.Keyword(null,"light","light",1918998747)),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(function (){var iter__5480__auto__ = (function byoubu$facts$derive_facts_$_iter__22679(s__22680){
return (new cljs.core.LazySeq(null,(function (){
var s__22680__$1 = s__22680;
while(true){
var temp__5825__auto__ = cljs.core.seq(s__22680__$1);
if(temp__5825__auto__){
var s__22680__$2 = temp__5825__auto__;
if(cljs.core.chunked_seq_QMARK_(s__22680__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__22680__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__22682 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__22681 = (0);
while(true){
if((i__22681 < size__5479__auto__)){
var vec__22683 = cljs.core._nth(c__5478__auto__,i__22681);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22683,(0),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22683,(1),null);
cljs.core.chunk_append(b__22682,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [t,byoubu.color.contrast_ratio(ink,c)], null));

var G__22752 = (i__22681 + (1));
i__22681 = G__22752;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__22682),byoubu$facts$derive_facts_$_iter__22679(cljs.core.chunk_rest(s__22680__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__22682),null);
}
} else {
var vec__22688 = cljs.core.first(s__22680__$2);
var t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22688,(0),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22688,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [t,byoubu.color.contrast_ratio(ink,c)], null),byoubu$facts$derive_facts_$_iter__22679(cljs.core.rest(s__22680__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(tiers);
})())]);
});
/**
 * WCAG 2.x AA for body-size text. `byoubu.spec/problems` refuses to accept a
 *   backdrop whose derived ink does not clear this against its own content
 *   band — the catalog cannot contain a backdrop that is unreadable by its own
 *   recommendation.
 */
byoubu.facts.wcag_aa_body = 4.5;
/**
 * Does the derived ink clear AA body contrast on this backdrop?
 */
byoubu.facts.readable_QMARK_ = (function byoubu$facts$readable_QMARK_(backdrop){
return ((function (){var or__5002__auto__ = new cljs.core.Keyword("byoubu.facts","contrast","byoubu.facts/contrast",-386835292).cljs$core$IFn$_invoke$arity$1(byoubu.facts.derive_facts(backdrop));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return 0.0;
}
})() >= byoubu.facts.wcag_aa_body);
});

//# sourceMappingURL=byoubu.facts.js.map
