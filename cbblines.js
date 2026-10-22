/* CBB tab: game lines (cbb_lines.json, priced by the engine's sl_ncaamb_game_pricer) + props sub-tab (bbpx.js, ncaab_priced via the
   members gate) + CBB Watch record (cbb_clv_record.json). Display only: every number is the pricer's output, never recomputed.
   Tier chip is WATCH (amber) or nothing. There is no bet tier for CBB game lines. */
(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const am=p=>p==null?"—":p>0?"+"+p:""+p,sg=x=>x==null?"—":(x>0?"+":"")+x,pc=x=>x==null?"—":(x*100).toFixed(1)+"%",ev=x=>x==null?"—":(x>0?"+":"")+(x*100).toFixed(1)+"%";
const ET=(t,o)=>t?new Date(t).toLocaleString("en-US",Object.assign({timeZone:"America/New_York",hour:"numeric",minute:"2-digit"},o||{}))+" ET":"—";
const P=t=>t?Date.parse(t):NaN;
const WATCH_TIP="The model disagrees with the market by 4+ points. In 2025-26, closing lines moved about 1 point toward the model on these games (spreads and totals). Win rate at the open hasn't been proven above breakeven yet, so treat this as 'bet early, track CLV,' not a lock.";
const CSS=`<style id="cbl-css">#cbl{grid-column:1/-1}#cbl .cbl-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center}#cbl h3{margin:0}
#cbl .sub{color:var(--mut);font-size:12px}.cbl-chip{display:inline-block;font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;letter-spacing:.4px}
.cbl-w{background:#3a2d0b;color:#ffb020;border:1px solid #ffb020}.cbl-st{background:#3a1520;color:var(--bad)}.cbl-x{background:#3a2d0b;color:#ffcc66}
.cbl-i{display:inline-flex;width:18px;height:18px;border-radius:50%;border:1px solid var(--line);color:var(--mut);font-size:11px;align-items:center;justify-content:center;cursor:help;position:relative}
.cbl-i:hover .cbl-tt,.cbl-i:focus .cbl-tt{display:block}.cbl-tt{display:none;position:absolute;z-index:30;top:22px;left:-120px;width:280px;background:var(--panel2);border:1px solid var(--line);color:var(--txt);padding:10px;border-radius:8px;font-size:12px;line-height:1.45;font-weight:400;text-align:left}
.cbl-tabs{display:flex;gap:6px;margin:10px 0}.cbl-tabs button,.cbl-f select{background:var(--panel2);color:var(--mut);border:1px solid var(--line);padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer}.cbl-tabs button.on{background:var(--acc);color:#06210f;border-color:var(--acc)}
.cbl-f{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:6px 0 10px;font-size:12px;color:var(--mut)}.cbl-f label{display:flex;gap:5px;align-items:center}.cbl-f input{accent-color:var(--acc)}
.cbl-t{width:100%;border-collapse:collapse;font-size:13px}.cbl-t th{position:static;background:none;font-size:10px;padding:6px;text-align:left;color:var(--mut)}.cbl-t td{padding:8px 6px;border-top:1px solid var(--line);white-space:nowrap;cursor:pointer}.cbl-t tr:hover td{background:var(--panel2)}
.cbl-t td.n,.cbl-t th.n{text-align:right;font-variant-numeric:tabular-nums}.cbl-m{display:flex;align-items:center;gap:5px}.cbl-m img{width:20px;height:20px}.cbl-rk{color:var(--mut);font-size:10px}.cbl-mu{color:var(--mut);font-size:11px}
.cbl-cards{display:none}.cbl-card{border:1px solid var(--line);border-radius:10px;padding:10px;margin:8px 0;background:var(--panel2);cursor:pointer}.cbl-card .r{display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-top:4px}
.cbl-rec{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}.cbl-rec div{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:8px;text-align:center}.cbl-rec b{display:block;font-size:18px}.cbl-rec span{font-size:11px;color:var(--mut)}
#cbl-dr{position:fixed;inset:0;z-index:200;display:none}#cbl-dr.open{display:block}#cbl-dr .sh{position:absolute;inset:0;background:#0009}#cbl-dr .pn{position:absolute;right:0;top:0;bottom:0;width:min(440px,100%);background:var(--panel);border-left:1px solid var(--line);overflow:auto;padding:16px;box-sizing:border-box}
#cbl-dr h4{margin:14px 0 4px}#cbl-dr .kv{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:13px}#cbl-dr .kv span{color:var(--mut)}#cbl-dr .x{float:right;background:none;border:0;color:var(--txt);font-size:22px;cursor:pointer}
@media(max-width:760px){.cbl-tbl{display:none}.cbl-cards{display:block}.cbl-rec{grid-template-columns:repeat(2,minmax(0,1fr))}#cbl{overflow:hidden}.cbl-tt{left:-200px;width:240px}}</style>`;
let L=null,REC=null,sub=/cbb-props/.test(location.hash)?"props":"lines",F={watch:false,conf:"",top:false},loading=false,loadedAt=0;
const fj=f=>fetch("data/"+f+"?v="+Math.floor(Date.now()/6e4)).then(r=>r.ok?r.json():null).catch(()=>null);
function load(force){if(loading||(!force&&L&&Date.now()-loadedAt<5*6e4))return Promise.resolve();loading=true;return Promise.all([fj("cbb_lines.json"),fj("cbb_clv_record.json")]).then(([a,b])=>{L=a||{status:"ratings_delayed",games:[]};REC=b;loadedAt=Date.now();loading=false})}
const inSeason=d=>{const m=d.getMonth()+1,dd=d.getDate();return m>=11||m<=3||(m==4&&dd<=8)};
const mk=(g,k)=>(g.markets||[]).find(m=>m.market==k)||null;
const watch=g=>(g.markets||[]).some(m=>m.tier=="watch");
const ab=(g,s)=>esc(g[s+"_abbr"]||g[s]);
function spreadTxt(g,line){if(line==null)return"—";return line==0?"PK":line<0?ab(g,"home")+" "+line:ab(g,"away")+" "+(-line)}
function header(){const a=L&&L.ratings_as_of,age=a?(Date.now()-P(a))/36e5:null,stale=age!=null&&age>30&&inSeason(new Date());
 return `<div class="cbl-h"><h3>🏀 CBB game lines</h3><span class="cbl-i" tabindex="0" aria-label="What WATCH means">i<span class="cbl-tt"><b>WATCH</b><br>${esc(WATCH_TIP)}</span></span>
 <span class="sub" style="margin-left:auto">Ratings as of ${a?ET(a,{weekday:"short",month:"short",day:"numeric"}):"—"}${stale?' <span class="cbl-chip cbl-st" title="Ratings older than 30 hours">STALE</span>':""}</span></div>
 <div class="sub">Our line next to the book's for every D-I game with a posted line. WATCH = the model is 4+ points off the number. Watches are tracked against the close, not graded as highlights.</div>
 <div class="cbl-tabs"><button data-cbl-sub="lines" class="${sub=="lines"?"on":""}">Game lines</button><button data-cbl-sub="props" class="${sub=="props"?"on":""}">Props</button></div>`}
function rows(){let G=(L.games||[]).filter(g=>g.markets&&g.markets.length);
 if(F.watch)G=G.filter(watch);if(F.conf)G=G.filter(g=>g.home_conf==F.conf||g.away_conf==F.conf);if(F.top)G=G.filter(g=>g.home_rank||g.away_rank);
 const d=g=>{const s=mk(g,"spread")||mk(g,"total");return s?Math.abs(s.model_minus_book_pts):-1};return G.slice().sort((a,b)=>d(b)-d(a))}
function team(g,s){return `<span class="cbl-m">${g[s+"_logo"]?`<img src="${esc(g[s+"_logo"])}" alt="" loading="lazy">`:""}${g[s+"_rank"]?`<span class="cbl-rk">${g[s+"_rank"]}</span>`:""}<b>${esc(g[s])}</b></span>`}
function linesView(){if(!L||L.status=="ratings_delayed")return`<div class="card empty" style="margin:6px 0">⏳ Ratings delayed. Lines are hidden until today's ratings are in.</div>`;
 const G=L.games||[];
 if(!G.length){const s=L.season_start?new Date(L.season_start+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}):"";
  const msg=L.status=="offseason"||(s&&Date.now()<Date.parse(L.season_start+"T00:00:00-05:00"))?`No D-I games yet. Lines start on opening day${s?", "+s:""}.`:L.status=="source_delayed"?"Lines source delayed. Retrying every 30 minutes.":"No lines posted yet today. Book lines usually post the morning of the game.";
  return`<div class="card empty" style="margin:6px 0">⏳ ${msg}</div>`}
 const confs=[...new Set(G.flatMap(g=>[g.home_conf,g.away_conf]).filter(Boolean))].sort();const R=rows();
 let h=`<div class="cbl-f"><label><input type="checkbox" data-cbl-f="watch" ${F.watch?"checked":""}>Watch only</label><label><input type="checkbox" data-cbl-f="top" ${F.top?"checked":""}>Top 25</label>
 <select data-cbl-f="conf" aria-label="Conference"><option value="">All conferences</option>${confs.map(c=>`<option ${c==F.conf?"selected":""}>${esc(c)}</option>`).join("")}</select><span>${R.length} game${R.length==1?"":"s"} · sorted by |Diff|</span></div>`;
 h+=`<div class="cbl-tbl"><table class="cbl-t"><tr><th>Time (ET)</th><th>Matchup</th><th>Book line</th><th>SL line</th><th>Model line</th><th class="n">Diff</th><th>Total (book / SL)</th><th>ML fair vs book</th><th>Tier</th></tr>`+R.map(g=>{const s=mk(g,"spread"),t=mk(g,"total"),m=mk(g,"moneyline");
  return`<tr data-cbl-g="${esc(g.game_id)}"><td>${ET(g.start)}</td><td>${team(g,"away")}<span class="cbl-mu">${g.neutral?"vs":"@"}</span>${team(g,"home")}</td><td>${s?spreadTxt(g,s.book_line_home):"—"}</td><td>${s?spreadTxt(g,s.sl_line_home):"—"}</td><td>${spreadTxt(g,g.sl_model_spread_home)}</td>
  <td class="n"><b>${s?sg(s.model_minus_book_pts):"—"}</b>${t?`<div class="cbl-mu">T ${sg(t.model_minus_book_pts)}</div>`:""}</td><td>${t?t.book_line+" / "+t.sl_line:"—"}</td>
  <td>${m?`${ab(g,"home")} ${am(m.fair_home)} <span class="cbl-mu">vs ${am(m.book_home)}</span><br>${ab(g,"away")} ${am(m.fair_away)} <span class="cbl-mu">vs ${am(m.book_away)}</span>`:"—"}</td><td>${watch(g)?'<span class="cbl-chip cbl-w">WATCH</span>':""}</td></tr>`}).join("")+`</table></div>`;
 h+=`<div class="cbl-cards">`+R.map(g=>{const s=mk(g,"spread");return`<div class="cbl-card" data-cbl-g="${esc(g.game_id)}"><div class="r"><span>${team(g,"away")}</span><span class="cbl-mu">${ET(g.start)}</span></div><div class="r"><span>${team(g,"home")}</span><span>${watch(g)?'<span class="cbl-chip cbl-w">WATCH</span>':""}</span></div>
  <div class="r"><span class="cbl-mu">Book vs SL</span><span>${s?spreadTxt(g,s.book_line_home)+" · <b>"+spreadTxt(g,s.sl_line_home)+"</b>":"—"}</span></div><div class="r"><span class="cbl-mu">Diff</span><b>${s?sg(s.model_minus_book_pts):"—"}</b></div></div>`}).join("")+`</div>`;
 if(!R.length)h+=`<div class="sub" style="margin:8px 0">No games match these filters.</div>`;
 return h+`<div class="sub" style="margin-top:8px">Book line = Book A. SL line = our market-anchored line. Model line = our ratings alone. Diff = model minus book, in points (spread; T = total). ${L.updated?"Updated "+ET(L.updated,{month:"short",day:"numeric"})+".":""}</div>`}
function recCard(){const r=REC||{watches:0};const label=r.label;
 return`<div style="margin-top:14px"><h4 style="margin:0">📈 CBB Watch record ${label?`<span class="cbl-chip cbl-x">${esc(label)}</span>`:""}</h4><div class="sub">Every WATCH is logged when first flagged and checked against the closing line at tip-off.</div>
 <div class="cbl-rec"><div><b>${r.watches||0}</b><span>Watches</span></div><div><b>${r.mean_clv_pts==null?"—":sg(r.mean_clv_pts)}</b><span>Mean CLV (pts)</span></div><div><b>${r.pct_beat_close==null?"—":Math.round(r.pct_beat_close*100)+"%"}</b><span>Beat the close</span></div><div><b>${(r.w||0)+"-"+(r.l||0)+"-"+(r.p||0)}</b><span>W-L-P vs flagged line</span></div></div></div>`}
function drawer(id){const g=(L.games||[]).find(x=>x.game_id==id);if(!g)return;let d=document.getElementById("cbl-dr");if(!d){d=document.createElement("div");d.id="cbl-dr";document.body.appendChild(d)}
 const s=mk(g,"spread"),t=mk(g,"total"),m=mk(g,"moneyline"),kv=a=>`<div class="kv">${a.map(([k,v])=>`<span>${k}</span><b>${v}</b>`).join("")}</div>`;
 let h=`<div class="sh" data-cbl-x></div><div class="pn" role="dialog" aria-label="Game detail"><button class="x" data-cbl-x aria-label="Close">×</button><h3 style="margin:0 0 4px">${esc(g.away)} ${g.neutral?"vs":"at"} ${esc(g.home)}</h3><div class="sub">${ET(g.start,{weekday:"short",month:"short",day:"numeric"})} · ratings as of ${ET(g.ratings_as_of||L.ratings_as_of,{month:"short",day:"numeric"})}</div>`;
 if(s)h+=`<h4>Spread ${s.tier=="watch"?'<span class="cbl-chip cbl-w">WATCH</span>':""}</h4><div class="sub">${esc(s.reason)}</div>`+kv([["Side",s.side=="home"?esc(g.home):esc(g.away)],["Line now (Book A)",spreadTxt(g,s.book_line_home)],["Open",spreadTxt(g,s.open_line_home)],["SL line",spreadTxt(g,s.sl_line_home)],["Model minus book",sg(s.model_minus_book_pts)+" pts"],["p_cover",pc(s.p_cover)],["Fair odds",am(s.fair_odds)],["Book price",am(s.book_odds)],["EV at book price",ev(s.ev)]]);
 if(t)h+=`<h4>Total ${t.tier=="watch"?'<span class="cbl-chip cbl-w">WATCH</span>':""}</h4><div class="sub">${esc(t.reason)}</div>`+kv([["Side",t.side=="over"?"Over":"Under"],["Line now (Book A)",t.book_line],["Open",t.open_line??"—"],["SL line",t.sl_line],["Model minus book",sg(t.model_minus_book_pts)+" pts"],["p_win",pc(t.p_win)],["Fair odds",am(t.fair_odds)],["Book price",am(t.book_odds)],["EV at book price",ev(t.ev)]]);
 if(m)h+=`<h4>Moneyline</h4><div class="sub">${esc(m.reason)}</div>`+kv([["p_win "+esc(g.home),pc(m.p_home)],["Fair "+esc(g.home)+" / "+esc(g.away),am(m.fair_home)+" / "+am(m.fair_away)],["Book "+esc(g.home)+" / "+esc(g.away),am(m.book_home)+" / "+am(m.book_away)],["Book open "+esc(g.home),am(g.book_ml_home_open)]]);
 (g.other_books||[]).forEach(o=>{const os=mk(o,"spread"),ot=mk(o,"total");h+=`<h4>${esc(o.book)}</h4>`+kv([["Spread · SL line",os?spreadTxt(g,os.book_line_home)+" · "+spreadTxt(g,os.sl_line_home):"—"],["Spread EV",os?ev(os.ev):"—"],["Total · SL line",ot?ot.book_line+" · "+ot.sl_line:"—"],["Total EV",ot?ev(ot.ev):"—"]])});
 d.innerHTML=h+`<div class="sub" style="margin-top:12px">${esc(WATCH_TIP)}</div></div>`;d.classList.add("open")}
function paint(el){const c=document.getElementById("cbl")||el;let h=CSS+header();
 if(sub=="props")h+=`<div id="cbl-px"></div>`;else h+=linesView()+recCard();c.innerHTML=h;
 if(sub=="props"){const p=document.getElementById("cbl-px");if(window.renderBbPx)renderBbPx(p,"ncaamb");else p.innerHTML='<div class="sub">Props unavailable.</div>'}}
window.CBBLines={mount(D){if(!D)return;let c=document.getElementById("cbl");if(!c||!D.contains(c)){c=document.createElement("div");c.id="cbl";c.className="card";D.prepend(c)}
 const bb=document.getElementById("bbpx");if(bb&&D.contains(bb))bb.remove();   // props live under the Props sub-tab
 if(L)paint(c);else c.innerHTML=CSS+header()+'<div class="sub">Loading lines…</div>';load().then(()=>{if(c.isConnected)paint(c)})}};
document.addEventListener("click",e=>{const b=e.target.closest("[data-cbl-sub]");if(b){sub=b.dataset.cblSub;paint();return}
 const r=e.target.closest("[data-cbl-g]");if(r){drawer(r.dataset.cblG);return}if(e.target.closest("[data-cbl-x]"))document.getElementById("cbl-dr").classList.remove("open")});
document.addEventListener("change",e=>{const f=e.target.closest("[data-cbl-f]");if(!f)return;const k=f.dataset.cblF;F[k]=k=="conf"?f.value:f.checked;paint()});
document.addEventListener("keydown",e=>{if(e.key=="Escape"){const d=document.getElementById("cbl-dr");if(d)d.classList.remove("open")}});
setInterval(()=>{if(document.visibilityState=="visible"&&document.getElementById("cbl"))load(true).then(()=>{if(!document.getElementById("cbl-dr")?.classList.contains("open"))paint()})},10*6e4);
function hashGo(){if(/#cbb-(lines|props)/.test(location.hash)){sub=/props/.test(location.hash)?"props":"lines";const t=document.querySelector('#tabs button[data-s="ncaamb"]');if(t&&!t.classList.contains("on"))t.click();else if(document.getElementById("cbl"))paint()}}
addEventListener("hashchange",hashGo);addEventListener("load",()=>setTimeout(hashGo,600));
})();
