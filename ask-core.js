/* Sports Labs Ask: shared core (browser + Cloudflare Worker).
   parse(q) -> query spec (rule-based; same JSON schema the optional LLM parser must return)
   validate(spec) -> {ok, errors}; hash(spec) -> stable key; run(spec, data, opts) -> deterministic result.
   The parser never produces numbers shown to users; every number comes from published Bet Lab data. */
(function (root) {
"use strict";
var VERSION = "ask-1";
var SPORTS = ["nfl", "cfb", "nba", "nhl", "mlb", "soccer"];
var MARKET_TYPES = ["props", "SGP", "totals", "anytime TD", "anytime goal", "edges", "injury", "goalie", "shots", "arb", "games"];
var SORTS = ["edge", "upside", "hit_rate", "CLV"];
var POS_GROUPS = { DB: ["CB", "S", "FS", "SS", "DB"], FRONT: ["DE", "DT", "NT", "DL", "LB", "ILB", "OLB", "MLB", "EDGE"], WR: ["WR"], RB: ["RB", "HB", "FB"], TE: ["TE"], QB: ["QB"], OL: ["OT", "OG", "G", "T", "C", "OL"], G: ["G"], D: ["D"], F: ["C", "LW", "RW", "F"] };
var STATUSES = ["Out", "Doubtful", "Questionable", "Injured Reserve", "any"];
var SCHEMA = { sport: "enum", games: "array<{slot|team|when}>", market_types: "array<enum>", legs: "int 2-6|null", filters: "{injury:{position,status}|null,min_edge:num|null,odds:{min,max}|null,player:str|null,team:str|null}", sort: "enum", limit: "int 1-25" };
// ---------- parse (rules) ----------
var TEAMS = { nfl: { ARI: "cardinals|arizona", ATL: "falcons|atlanta", BAL: "ravens|baltimore", BUF: "bills|buffalo", CAR: "panthers|carolina", CHI: "bears|chicago", CIN: "bengals|cincinnati", CLE: "browns|cleveland", DAL: "cowboys|dallas", DEN: "broncos|denver", DET: "lions|detroit", GB: "packers|green bay", HOU: "texans|houston", IND: "colts|indianapolis", JAX: "jaguars|jacksonville", KC: "chiefs|kansas city", LAC: "chargers", LAR: "rams", LV: "raiders|las vegas", MIA: "dolphins|miami", MIN: "vikings|minnesota", NE: "patriots|new england", NO: "saints|new orleans", NYG: "giants", NYJ: "jets", PHI: "eagles|philadelphia|philly", PIT: "steelers|pittsburgh", SEA: "seahawks|seattle", SF: "49ers|niners|san francisco", TB: "buccaneers|bucs|tampa", TEN: "titans|tennessee", WSH: "commanders|washington" } };
var NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
var QWORDS = /\b(show|find|best|which|who|should|what|give|top|any|list|how|why|me)\b/i;
function norm(s) { return String(s || "").toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim(); }
function isQuestion(q, exactName) {
  var n = norm(q); if (n.length < 3) return false; if (exactName) return false;
  if (/\b(show|find|best|which|who|should)\b/.test(n)) return true;
  return n.split(" ").length > 4;
}
function parse(q, ctx) {
  ctx = ctx || {}; var n = " " + norm(q).replace(/[?!.,]/g, " ") + " ", s = {};
  var sp = null;
  if (/\b(mnf|monday night|snf|sunday night|tnf|thursday night|nfl|touchdown|td|tds|qb|receiv|rushing|passing|defensive back|cornerback|safety|safeties|secondary)/.test(n)) sp = "nfl";
  if (/\b(college football|cfb|ncaaf)\b/.test(n)) sp = "cfb";
  if (/\b(nba|basketball|rebounds|threes)\b/.test(n)) sp = "nba";
  if (/\b(nhl|hockey|goalie|goalies|save pct|power play|puck)\b/.test(n)) sp = "nhl";
  if (/\b(mlb|baseball|home run|homer|hr king|strikeouts|pitcher)\b/.test(n)) sp = "mlb";
  if (/\b(soccer|goal ?scorer|premier league|epl|champions league|la liga|serie a|anytime goal)\b/.test(n)) sp = "soccer";
  s.sport = sp || (SPORTS.indexOf(ctx.sport) >= 0 ? ctx.sport : null);
  var games = [];
  if (/\b(mnf|monday night)\b/.test(n)) games.push({ slot: "MNF" });
  if (/\b(snf|sunday night)\b/.test(n)) games.push({ slot: "SNF" });
  if (/\b(tnf|thursday night)\b/.test(n)) games.push({ slot: "TNF" });
  if (/\b(tonight|tonights|today|todays)\b/.test(n)) games.push({ when: "today" });
  var T = TEAMS[s.sport || "nfl"] || {}, teams = [];
  Object.keys(T).forEach(function (ab) { var re = new RegExp("\\b(" + T[ab] + "|" + ab.toLowerCase() + ")\\b"); if (ab.length > 2 && re.test(n) || new RegExp("\\b(" + T[ab] + ")\\b").test(n)) teams.push(ab); });
  teams.forEach(function (t) { games.push({ team: t }); });
  s.games = games;
  var mt = [];
  if (/\b(sgp|sgps|same game|same-game|parlay|parlays)\b/.test(n)) mt.push("SGP");
  if (/\b(anytime td|anytime touchdown|td scorer|touchdown scorer)/.test(n)) mt.push("anytime TD");
  if (/\b(anytime goal|goal ?scorer)/.test(n)) mt.push("anytime goal");
  if (/\b(prop|props)\b/.test(n)) mt.push("props");
  if (/\b(total|totals|over under|o\/u)\b/.test(n)) mt.push("totals");
  if (/\b(cascade|who is out|whos out|injury report|injuries)\b/.test(n) && !mt.length) mt.push("injury");
  if (/\b(goalie|goalies|goaltender)\b/.test(n)) mt.push("goalie");
  if (/\b(shot chart|shot map|shots map)\b/.test(n)) mt.push("shots");
  if (/\b(arb|arbs|arbitrage)\b/.test(n)) mt.push("arb");
  if (/\b(edge|edges|value)\b/.test(n) && !mt.length) mt.push("edges");
  if (/\b(games|slate|schedule|matchups)\b/.test(n) && !mt.length) mt.push("games");
  s.market_types = mt;
  var lm = /\b(\d|one|two|three|four|five|six)[- ]?(leg|legger|man|pick)/.exec(n);
  s.legs = mt.indexOf("SGP") >= 0 ? Math.max(2, Math.min(6, lm ? (+lm[1] || NUMW[lm[1]]) : 3)) : null;
  var f = { injury: null, min_edge: null, odds: null, player: null, team: null };
  var pos = null;
  if (/\b(defensive backs?|dbs?|secondary|cornerbacks?|cbs?|safety|safeties)\b/.test(n)) pos = "DB";
  else if (/\b(pass rush|front seven|edge rusher|linebackers?|defensive line)\b/.test(n)) pos = "FRONT";
  else if (/\b(wide receivers?|wr1|wr2|wrs?) (out|injur)/.test(n)) pos = "WR";
  else if (/\b(running backs?|rb1|rbs?) (out|injur)/.test(n)) pos = "RB";
  else if (/\b(offensive line|o-line|oline)\b/.test(n)) pos = "OL";
  if (pos || /\binjur/.test(n)) f.injury = { position: pos || "any", status: /\bquestionable\b/.test(n) ? "Questionable" : /\bdoubtful\b/.test(n) ? "Doubtful" : "Out" };
  var me = /\bedge (?:of |over |above |at least |>=? ?)?(\d+(?:\.\d+)?) ?(%|pct|percent|points?)/.exec(n) || /\b(\d+(?:\.\d+)?) ?(%|pct|percent)\+? edge/.exec(n);
  if (me) f.min_edge = Math.min(0.5, +me[1] / 100);
  var od = /([+-]\d{3,4}) ?(?:to|-|and) ?([+-]?\d{3,4})/.exec(n), om = /\b(?:odds )?(?:over|above|longer than|at least) ([+]\d{3,5})/.exec(n);
  if (od) f.odds = { min: Math.min(+od[1], +od[2].replace(/^(\d)/, "+$1")), max: Math.max(+od[1], +od[2].replace(/^(\d)/, "+$1")) };
  else if (om) f.odds = { min: +om[1], max: null };
  if (teams.length === 1 && !games.some(function (g) { return g.slot; })) f.team = teams[0];
  if (ctx.player) f.player = ctx.player;
  s.filters = f;
  s.sort = /\b(upside|high-upside|longshots?|long shots?|biggest payouts?|big payouts?|lotto|moonshots?)\b/.test(n) ? "upside" : /\b(hit rate|safest|most likely|likeliest|highest probability|best chance)\b/.test(n) ? "hit_rate" : /\bclv|closing line\b/.test(n) ? "CLV" : "edge";
  var lim = /\btop (\d{1,2})\b/.exec(n); s.limit = Math.max(1, Math.min(25, lim ? +lim[1] : s.market_types.indexOf("SGP") >= 0 ? 5 : 10));
  if (!s.market_types.length && sp && (s.filters.injury || s.games.length)) s.market_types = s.filters.injury ? ["injury"] : ["props"];
  return canon(s);
}
function canon(s) {
  var o = { sport: s.sport || null, games: (s.games || []).map(function (g) { var x = {}; ["slot", "team", "when"].forEach(function (k) { if (g[k]) x[k] = g[k]; }); return x; }),
    market_types: (s.market_types || []).filter(function (m, i, a) { return MARKET_TYPES.indexOf(m) >= 0 && a.indexOf(m) === i; }),
    legs: s.legs == null ? null : Math.round(+s.legs),
    filters: { injury: s.filters && s.filters.injury ? { position: s.filters.injury.position || "any", status: s.filters.injury.status || "Out" } : null,
      min_edge: s.filters && s.filters.min_edge != null ? +(+s.filters.min_edge).toFixed(4) : null,
      odds: s.filters && s.filters.odds ? { min: s.filters.odds.min == null ? null : +s.filters.odds.min, max: s.filters.odds.max == null ? null : +s.filters.odds.max } : null,
      player: s.filters && s.filters.player ? String(s.filters.player).slice(0, 60) : null, team: s.filters && s.filters.team ? String(s.filters.team).slice(0, 8).toUpperCase() : null },
    sort: SORTS.indexOf(s.sort) >= 0 ? s.sort : "edge", limit: Math.max(1, Math.min(25, +s.limit || 10)) };
  return o;
}
function validate(s) {
  var e = [];
  if (!s || typeof s !== "object") return { ok: false, errors: ["not an object"] };
  if (SPORTS.indexOf(s.sport) < 0) e.push("sport");
  if (!Array.isArray(s.games)) e.push("games");
  if (!Array.isArray(s.market_types) || !s.market_types.length || s.market_types.some(function (m) { return MARKET_TYPES.indexOf(m) < 0; })) e.push("market_types");
  if (s.legs != null && !(s.legs >= 2 && s.legs <= 6)) e.push("legs");
  if (s.market_types && s.market_types.indexOf("SGP") >= 0 && s.legs == null) e.push("legs");
  var f = s.filters || {};
  if (f.injury && (!(f.injury.position in POS_GROUPS) && f.injury.position !== "any" || STATUSES.indexOf(f.injury.status) < 0)) e.push("filters.injury");
  if (f.min_edge != null && !(f.min_edge >= 0 && f.min_edge <= 0.5)) e.push("filters.min_edge");
  if (SORTS.indexOf(s.sort) < 0) e.push("sort");
  if (!(s.limit >= 1 && s.limit <= 25)) e.push("limit");
  return { ok: !e.length, errors: e };
}
function stable(o) { if (Array.isArray(o)) return "[" + o.map(stable).join(",") + "]"; if (o && typeof o === "object") return "{" + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(o[k]); }).join(",") + "}"; return JSON.stringify(o); }
function hash(o) { var s = stable(o), h1 = 0x811c9dc5, h2 = 0x01000193; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 2246822519) >>> 0; } return ("0000000" + h1.toString(16)).slice(-8) + ("0000000" + h2.toString(16)).slice(-8); }
var EXAMPLES = {
  nfl: ["Show me high-upside Monday Night Football SGPs factoring in recent defensive back injuries", "Best anytime TD props tonight", "Who benefits from injuries this week?", "Top 10 NFL prop edges"],
  nba: ["Best NBA prop edges tonight", "Which NBA props have the highest hit rate?"],
  nhl: ["Show me tonight's goalies", "Best NHL prop edges tonight"],
  mlb: ["Best MLB prop edges today"],
  soccer: ["Best anytime goal scorer props today", "Soccer prop edges with the highest hit rate"],
  cfb: ["Best college football anytime TD props"]
};
function suggestions(sport) { var o = []; (EXAMPLES[sport] || []).concat(EXAMPLES.nfl).forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o.slice(0, 4); }
// ---------- pricing (mirrors bet-lab-engine/scripts/pricing.py + search.js ourChance + discord_sgp RHO) ----------
var PX = { ev_min: 0.02, ev_min_experimental: 0.04, haircut: 0.02, max_credible_ev: 0.15, shrink: 30, cap: 0.97, rho_same_team: 0.04, stale_odds_min: 15 };
var EXPERIMENTAL = /^(2\+ TDs|Passing TDs [34]\+|Assists|Tackles|Tackles Plus Assists|Sacks|Extra Points Made|Field Goals Made|Kicking Points|Longest)/;
var YES = { "Anytime TD": 1, "Anytime Goal": 1 };
function toDec(a) { return a > 0 ? 1 + a / 100 : 1 + 100 / -a; }
function decAm(d) { return d >= 2 ? "+" + Math.round((d - 1) * 100) : "-" + Math.round(100 / (d - 1)); }
function pAm(p) { return p >= 0.5 ? "-" + Math.round(100 * p / (1 - p)) : "+" + Math.round(100 * (1 - p) / p); }
function evNet(p, dec) { return p * (1 + (dec - 1) * (1 - PX.haircut)) - 1; }
function ppNorm(s) { return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(" jr", "").replace(" sr", "").replace(/[^a-z]/g, ""); }
function priceKey(sp, r) { var ln = YES[r.market] ? "" : (Number.isInteger(+r.line) ? (+r.line) + ".0" : String(+r.line)); return [sp, r.market, ppNorm(r.player), ln].join("|"); }
function legOf(sp, r, R) {
  var q = R[priceKey(sp, r)]; if (!q || q.nv == null || q.best == null) return null;
  var x = r.x || {}, l10 = x.l10 || null, h = l10 ? l10[0] : 0, n = l10 ? l10[1] : 0;
  var p = Math.min((h + PX.shrink * q.nv) / (n + PX.shrink), PX.cap), dec = toDec(q.best), exp = EXPERIMENTAL.test(r.market);
  return { id: [r.aid, r.market, r.line].join("~"), aid: String(r.aid), player: r.player, team: r.team, pos: r.pos, opp: r.opp, game: r.game, time: r.time, market: r.market, line: r.line, yes: !!YES[r.market],
    p: p, best: q.best, dec: dec, book: q.book, nv: q.nv, odds_t: q.t, ev: evNet(p, dec), exp: exp, l10: l10 ? [l10[0], l10[1]] : null, l5: x.l5 ? [x.l5[0], x.l5[1]] : null, stat: r.stat, u: r.u || null, inj: r.inj || [], grp: r.grp };
}
function gate(ev, exp) { return ev >= (exp ? PX.ev_min_experimental : PX.ev_min) && ev <= PX.max_credible_ev; }
function sgpPrice(legs) {
  var pi = 1, dec = 1, byT = {}; legs.forEach(function (l) { pi *= l.p; dec *= l.dec; byT[l.team] = (byT[l.team] || 0) + 1; });
  var pairs = 0; Object.keys(byT).forEach(function (t) { var k = byT[t]; pairs += k * (k - 1) / 2; });
  var pj = Math.min(Math.min.apply(null, legs.map(function (l) { return l.p; })), pi * Math.pow(1 + PX.rho_same_team, pairs));
  return { p: pj, p_ind: pi, dec: dec, ev: evNet(pj, dec), pairs: pairs };
}
// ---------- slot / game selection ----------
function etParts(iso) { var d = new Date(iso); var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hour12: false, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d), o = {}; f.forEach(function (p) { o[p.type] = p.value; }); return { wd: o.weekday, h: +o.hour % 24, day: o.year + "-" + o.month + "-" + o.day }; }
function slotOf(iso) { var e = etParts(iso); if (e.wd === "Mon" && e.h >= 18) return "MNF"; if (e.wd === "Sun" && e.h >= 19) return "SNF"; if (e.wd === "Thu" && e.h >= 19) return "TNF"; return null; }
function fmtET(iso) { if (!iso) return ""; return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET"; }
// ---------- run ----------
function run(spec, D, opt) {
  opt = opt || {}; var now = opt.now ? +new Date(opt.now) : Date.now(), sp = spec.sport, f = spec.filters || {};
  var games = (D.games || []).filter(function (g) { return g && g.time; });
  var started = function (g) { return +new Date(g.time) <= now; };
  var sel = games.filter(function (g) {
    if (started(g)) return false;
    if (!spec.games.length) return true;
    return spec.games.some(function (q) { if (q.slot) return slotOf(g.time) === q.slot; if (q.team) return g.home === q.team || g.away === q.team; if (q.when === "today") return etParts(g.time).day === etParts(new Date(now).toISOString()).day; return true; });
  });
  var gid = {}; sel.forEach(function (g) { gid[String(g.id)] = g; });
  var srcs = ["Bet Lab props", "Bet Lab prices"], comps = [], notes = [];
  var R = (D.prices && D.prices.rows) || {};
  var all = (D.props || []).filter(function (r) { return gid[String(r.game)]; }).map(function (r) { return legOf(sp, r, R); }).filter(Boolean);
  if (f.team) all = all.filter(function (l) { return l.team === f.team || (l.opp || "").replace(/^@/, "") === f.team; });
  if (f.player) { var pn = ppNorm(f.player); all = all.filter(function (l) { return ppNorm(l.player).indexOf(pn) >= 0; }); }
  // injury tags: opponent defensive starters out (impact tracker) + own-team cascade (usage shift)
  var flags = ((D.impact && D.impact.flags) || []).filter(function (x) { return gid[String(x.game || "")] || sel.some(function (g) { return g.home === x.team || g.away === x.team; }); });
  if (flags.length || (D.analyst && D.analyst.inj_cascades)) srcs.push("injury tracker");
  var POSF = f.injury && f.injury.position !== "any" ? f.injury.position : null;
  var injFlags = flags.filter(function (x) { if (!f.injury) return /^DEF-/.test(x.kind) || /^(WR1|RB1|TE1|QB)$/.test(x.kind); if (POSF === "DB") return x.kind === "DEF-DB"; if (POSF === "FRONT") return x.kind === "DEF-FRONT"; if (POSF) return x.kind.indexOf(POSF) === 0; return /^DEF-|^(WR1|RB1|TE1|QB|OL)$/.test(x.kind); });
  var casc = ((D.analyst && D.analyst.inj_cascades) || []).filter(function (c) { return sel.some(function (g) { return g.home === c.team || g.away === c.team; }) && (!f.injury || f.injury.status === "any" || c.status === f.injury.status || (f.injury.status === "Out" && /Out|Injured Reserve|Doubtful/.test(c.status))) && (!POSF || (POS_GROUPS[POSF] || []).indexOf(c.pos) >= 0); });
  function why(l) {
    var t = [];
    injFlags.forEach(function (x) { var a = x.aff || {}; if (a.team && a.team !== l.team) return; if (a.markets && a.markets.indexOf(l.market) < 0) return; if (a.pos && a.pos.indexOf(l.pos) < 0) return; if (a.names && a.names.indexOf(l.player) < 0) return;
      var who = (x.text.split("—")[1] || x.text).trim(); var m = /secondary|front seven/.exec(x.text);
      var use = l.u && l.u.tg && l.u.tg.l3 != null && /Rec|TD|Receiv/.test(l.market) && l.pos !== "QB" ? " · " + l.u.tg.l3 + " tgt/g L3" : "";
      t.push({ kind: x.kind, text: (m ? x.opp + " " + (x.kind === "DEF-DB" ? "DB" : "front") + " out: " + who.replace(/ \((Out|Injured Reserve)\)/g, "") : x.text) + " → " + x.dir.replace(/^helps /, "helps ") + use, db: x.kind === "DEF-DB" }); });
    casc.forEach(function (c) { (c.affected || []).forEach(function (a) { if (a.player !== l.player) return; var d = a.d_tg != null && Math.abs(a.d_tg) >= 0.3 ? (a.d_tg > 0 ? "+" : "") + a.d_tg + " tgt/g" : a.d_ca != null && Math.abs(a.d_ca) >= 1 ? (a.d_ca > 0 ? "+" : "") + a.d_ca + " car/g" : null; if (d) t.push({ kind: "CASCADE", text: (c.role || c.pos) + " " + c.player.split(" ").slice(-1)[0] + " out → " + d + " (" + (a.without && a.without.g || 0) + " g sample)", db: false }); }); });
    return t;
  }
  all.forEach(function (l) { l.why = why(l); });
  var snapT = (D.prices && D.prices.as_of) || null, mt = spec.market_types;
  function stale(legs) {
    var r = [];
    legs.forEach(function (l) { if (l.odds_t && now - +new Date(l.odds_t) > PX.stale_odds_min * 6e4) { if (r.indexOf("odds > 15 min old") < 0) r.push("odds > 15 min old"); } (l.inj || []).length; });
    var tms = {}; legs.forEach(function (l) { tms[l.team] = 1; });
    var inj = (D.injuries && D.injuries.list) || {};
    Object.keys(tms).forEach(function (t) { (inj[t] || []).forEach(function (x) { if (x.status === "Questionable" && x.grp !== "OL" && r.indexOf("injury pending") < 0 && legs.some(function (l) { return l.player === x.name; })) r.push("injury pending"); }); if (!(inj[t] || []).some(function (x) { return x.note === "inactive"; }) && r.indexOf("lineups not confirmed") < 0) r.push("lineups not confirmed"); });
    return r;
  }
  var oddsOk = function (am) { var o = f.odds; if (!o) return true; return (o.min == null || am >= o.min) && (o.max == null || am <= o.max); };
  var minE = f.min_edge;
  if (mt.indexOf("SGP") >= 0) {
    var L = spec.legs || 3, byG = {}, cards = [];
    all.forEach(function (l) { if (l.p < 0.08) return; (byG[l.game] = byG[l.game] || []).push(l); });
    Object.keys(byG).forEach(function (g) {
      // pool: best legs by EV, one market per player, keep injury-tagged legs in the pool
      var by = {}; byG[g].slice().sort(function (a, b) { return b.ev - a.ev || (a.id < b.id ? -1 : 1); }).forEach(function (l) { if (!by[l.aid]) by[l.aid] = l; });
      var pool = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.ev - a.ev || (a.id < b.id ? -1 : 1); }).slice(0, 16);
      var combos = []; (function rec(st, a) { if (a.length === L) { combos.push(a.slice()); return; } for (var i = st; i < pool.length; i++) { a.push(pool[i]); rec(i + 1, a); a.pop(); } })(0, []);
      combos.forEach(function (c) {
        var tagged = c.filter(function (l) { return l.why.some(function (w) { return POSF ? (POSF === "DB" ? w.db : w.kind.indexOf(POSF) >= 0 || w.kind === "DEF-" + POSF) : true; }) && l.why.length; });
        if (f.injury && !tagged.length) return;
        var px = sgpPrice(c), exp = c.some(function (l) { return l.exp; });
        if (!gate(px.ev, exp) || (minE != null && px.ev < minE) || !oddsOk(+decAm(px.dec))) return;
        if (spec.sort === "upside" && px.ev <= 0) return;
        combos.length; cards.push({ legs: c, px: px, exp: exp, game: gid[g], tagged: tagged.length });
      });
    });
    var key = { edge: function (c) { return -c.px.ev; }, upside: function (c) { return -1 / c.px.p; }, hit_rate: function (c) { return -c.px.p; }, CLV: function (c) { return -c.px.ev; } }[spec.sort];
    cards.sort(function (a, b) { return key(a) - key(b) || (a.legs.map(function (l) { return l.id; }).join() < b.legs.map(function (l) { return l.id; }).join() ? -1 : 1); });
    // diversity: at most 2 shared legs with an already-chosen card
    var out = [];
    for (var i = 0; i < cards.length && out.length < spec.limit; i++) { var c = cards[i], ids = c.legs.map(function (l) { return l.id; }); if (out.some(function (o) { var sh = o.legs.filter(function (l) { return ids.indexOf(l.id) >= 0; }).length; return sh >= L - 1; })) continue; out.push(c); }
    out.forEach(function (c, ci) {
      var gpool = (byG[c.legs[0].game] || []);
      c.swaps = c.legs.map(function (l, li) {
        var alts = gpool.filter(function (a) { return !c.legs.some(function (b) { return b.aid === a.aid; }); }).map(function (a) { var nl = c.legs.slice(); nl[li] = a; var px = sgpPrice(nl), ex = nl.some(function (z) { return z.exp; }); return { leg: a, px: px, pass: gate(px.ev, ex) }; });
        alts.sort(function (a, b) { return (b.pass - a.pass) || b.px.ev - a.px.ev || (a.leg.id < b.leg.id ? -1 : 1); }); return alts.slice(0, 5);
      });
      c.pending = stale(c.legs);
    });
    if (spec.sort === "CLV") notes.push("CLV sort uses edge at current prices: closing-line value is only known after kickoff, so it is graded in the Bet Lab tracker.");
    comps.push({ type: "SGPCard", items: out.map(cardOut) });
    if (!out.length) notes.push(sel.length ? "No same-game parlay in the selected games passes Bet Lab's EV bar" + (f.injury ? " with an injury-tagged leg" : "") + "." : "No upcoming games match. Edges are never shown for games that have started.");
  }
  if (mt.indexOf("props") >= 0 || mt.indexOf("anytime TD") >= 0 || mt.indexOf("anytime goal") >= 0 || mt.indexOf("edges") >= 0) {
    var rows = all.filter(function (l) { if (mt.indexOf("anytime TD") >= 0 && l.market !== "Anytime TD") return false; if (mt.indexOf("anytime goal") >= 0 && l.market !== "Anytime Goal") return false; return gate(l.ev, l.exp) && (minE == null || l.ev >= minE) && oddsOk(l.best) && (!f.injury || l.why.length); });
    var k2 = { edge: function (l) { return -l.ev; }, upside: function (l) { return -l.dec; }, hit_rate: function (l) { return -(l.l10 ? l.l10[0] / Math.max(1, l.l10[1]) : 0) - l.p / 100; }, CLV: function (l) { return -l.ev; } }[spec.sort];
    rows.sort(function (a, b) { return k2(a) - k2(b) || (a.id < b.id ? -1 : 1); }); rows = rows.slice(0, spec.limit);
    comps.push({ type: mt.indexOf("edges") >= 0 ? "EdgeList" : "PropTable", items: rows.map(function (l) { return legOut(l, stale([l])); }) });
  }
  if (mt.indexOf("injury") >= 0 || (f.injury && mt.indexOf("SGP") >= 0)) {
    comps.push({ type: "InjuryCascadeCard", items: injFlags.map(function (x) { return { team: x.team, opp: x.opp, kind: x.kind, text: x.text, dir: x.dir, sev: x.sev }; }).concat(casc.slice(0, 8).map(function (c) { return { team: c.team, kind: "CASCADE", text: c.team + " " + (c.role || c.pos) + " " + c.player + " (" + c.status + ")", dir: (c.affected || []).filter(function (a) { return a.d_tg != null || a.d_ca != null; }).slice(0, 3).map(function (a) { return a.player + (a.d_tg ? " " + (a.d_tg > 0 ? "+" : "") + a.d_tg + " tgt/g" : "") + (a.d_ca && Math.abs(a.d_ca) >= 1 ? " " + (a.d_ca > 0 ? "+" : "") + a.d_ca + " car/g" : ""); }).join(" · "), sev: 0 }; })) });
  }
  if (mt.indexOf("games") >= 0 || mt.indexOf("totals") >= 0 || !comps.length) comps.push({ type: "GameCard", items: sel.map(function (g) { return { id: g.id, away: g.away, home: g.home, time: g.time, slot: slotOf(g.time), spread: g.details || null, total: g.total || null }; }) });
  if (mt.indexOf("goalie") >= 0 || mt.indexOf("shots") >= 0 || mt.indexOf("arb") >= 0) { var ty = mt.indexOf("goalie") >= 0 ? "GoalieCard" : mt.indexOf("shots") >= 0 ? "PlayerShotChart" : "ArbRow"; comps.push({ type: ty, items: (D.extra && D.extra[ty]) || [] }); if (ty === "ArbRow") srcs.push("Arb Lab"); else srcs.push("NHL Lab"); }
  function legOut(l, pend) { return { id: l.id, aid: l.aid, player: l.player, team: l.team, pos: l.pos, opp: l.opp, game: l.game, time: l.time, market: l.market, line: l.line, yes: l.yes, stat: l.stat, p: r4(l.p), book_odds: l.best, fair_odds: pAm(l.p), ev: r4(l.ev), exp: l.exp, l10: l.l10, l5: l.l5, why: l.why.map(function (w) { return w.text; }), why_db: l.why.some(function (w) { return w.db; }), pending: pend || [] }; }
  function cardOut(c) { return { key: c.legs.map(function (l) { return l.id; }).join("+"), game: { id: c.game.id, away: c.game.away, home: c.game.home, time: c.game.time, slot: slotOf(c.game.time) }, legs: c.legs.map(function (l) { return legOut(l); }), book_dec: r4(c.px.dec), book_odds: decAm(c.px.dec), p: r4(c.px.p), p_ind: r4(c.px.p_ind), fair_odds: pAm(c.px.p), ev: r4(c.px.ev), exp: c.exp, db_tag: c.legs.some(function (l) { return l.why.some(function (w) { return w.db; }); }), pending: c.pending,
    swaps: c.swaps.map(function (a) { return a.map(function (z) { return { leg: legOut(z.leg), book_odds: decAm(z.px.dec), fair_odds: pAm(z.px.p), p: r4(z.px.p), ev: r4(z.px.ev), pass: z.pass }; }); }) }; }
  function r4(x) { return Math.round(x * 1e4) / 1e4; }
  return { v: VERSION, spec: spec, hash: hash(spec), as_of: snapT, as_of_et: fmtET(snapT), sources: srcs.filter(function (x, i, a) { return a.indexOf(x) === i; }), games: sel.map(function (g) { return g.away + " @ " + g.home; }), components: comps, notes: notes,
    count: comps.reduce(function (a, c) { return a + c.items.length; }, 0), gates: { ev_min: PX.ev_min, ev_min_experimental: PX.ev_min_experimental, max_credible_ev: PX.max_credible_ev, haircut: PX.haircut, rho_same_team: PX.rho_same_team } };
}
var API = { VERSION: VERSION, parse: parse, canon: canon, validate: validate, hash: hash, stable: stable, run: run, isQuestion: isQuestion, suggestions: suggestions, EXAMPLES: EXAMPLES, SCHEMA: SCHEMA, PX: PX, sgpPrice: sgpPrice, decAm: decAm, pAm: pAm, toDec: toDec, slotOf: slotOf, fmtET: fmtET };
if (typeof module !== "undefined" && module.exports) module.exports = API; else root.SLAskCore = API;
})(typeof self !== "undefined" ? self : this);
