/* Bet Lab Deep Prop Research & Cheatsheet Suite (PropsMadness 2.0 + PropFinder killer).
   Additive module loaded after pro-ui.js: preserves Bet Lab's exact layout, colors, and neutral book rules (Book A, Book B, etc.).
   Features:
   1. All-Slate Color-Coded Prop Cheatsheet Table + 50+ Interactive Filter Bar (with actual Opponent DvP Rank Chips & Season/L5/L10 window toggle, Avg vs Median toggle, Multi-Book Odds Matrix Book A-F, Diff vs Line, and Edge % sorting).
   2. Deep Player Prop Drawer ("Every Prop, In Depth" + "Deeper Than The Box Score"):
      - Average vs. Median horizontal reference line toggle on the game-log bar chart
      - Advanced Usage Stat Overlay toggle on every game bar (Min / TOI / Rec / Targets / Carries / Shots / PA)
      - "How Similar Players Did vs. This Opponent" (real box-score logs of recent same-position players vs. this opponent)
      - Interactive Teammate On/Off ("With / Without Teammate") selector computing exact Hit %, Avg, Median & Usage delta with vs. without any teammate
      - "Deeper Than The Box Score" sport-specific breakdown strip (NFL Red Zone/Snap/Target share; NBA Shot Zones/Usage/Pace; NHL TOI Surge/SOG/PP1/Opp Skid; MLB Statcast/Park; Soccer Per-App/Comp splits)
   3. Personal Watchlist (⭐ Save) + 1-Tap Track Bet (📊 Auto-Graded in Tracker against outcomes.json / liveres.js).
*/
(function(){
if(window.BLDeep)return;

const css=`
.bld-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;margin:0 0 10px;background:var(--panel,#121826);border:1px solid var(--line,#243049);border-radius:10px}
.bld-grp{display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap;padding-right:8px;border-right:1px solid var(--line,#243049)}
.bld-grp:last-child{border-right:0;padding-right:0}
.bld-lbl{font:800 10.5px/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;color:var(--mut,#8b97b0);margin-right:2px}
.bld-chip{background:var(--panel2,#182033);border:1px solid var(--line,#243049);color:var(--mut,#8b97b0);border-radius:99px;padding:4px 9px;font:700 11.5px/1.2 system-ui,sans-serif;cursor:pointer;transition:.12s;white-space:nowrap}
.bld-chip:hover{border-color:var(--acc2,#3fa9ff);color:var(--txt,#e6ebf5)}
.bld-chip.on{background:rgba(83,227,166,.15);border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6)}
.bld-chip.star-on{background:rgba(245,196,81,.16);border-color:var(--mid,#f5c451);color:var(--mid,#f5c451)}
.bld-rk{display:inline-flex;align-items:center;gap:3px;font:800 10.5px/1.2 system-ui,sans-serif;padding:2px 6px;border-radius:6px;border:1px solid transparent;white-space:nowrap}
.bld-rk.soft{background:rgba(83,227,166,.14);color:#53e3a6;border-color:rgba(83,227,166,.35)}
.bld-rk.mid{background:rgba(63,169,255,.12);color:#7cc4ff;border-color:rgba(63,169,255,.3)}
.bld-rk.tough{background:rgba(255,93,108,.14);color:#ff5d6c;border-color:rgba(255,93,108,.35)}
.bld-bks{display:inline-flex;gap:3px;flex-wrap:wrap;align-items:center}
.bld-bk{font:700 10.5px/1.2 system-ui,sans-serif;padding:2px 5px;border-radius:5px;background:var(--panel2,#182033);border:1px solid var(--line,#243049);color:var(--mut,#8b97b0)}
.bld-bk.best{background:rgba(83,227,166,.15);border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6);font-weight:800}
.bld-star{background:none;border:1px solid var(--line,#243049);color:var(--mut,#8b97b0);border-radius:6px;width:24px;height:24px;padding:0;line-height:22px;text-align:center;cursor:pointer;font-size:13px;margin-right:4px}
.bld-star.on{color:var(--mid,#f5c451);border-color:var(--mid,#f5c451);background:rgba(245,196,81,.12)}
.bld-trk{background:var(--panel2,#182033);border:1px solid var(--line,#243049);color:var(--acc2,#3fa9ff);border-radius:6px;padding:2px 6px;font:800 10.5px/1.3 system-ui,sans-serif;cursor:pointer;margin-left:4px}
.bld-trk.done{background:rgba(83,227,166,.16);border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6)}
.bld-sec{margin-top:14px;padding:11px 12px;background:var(--panel2,#182033);border:1px solid var(--line,#243049);border-radius:11px}
.bld-sec h4{margin:0 0 6px;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.bld-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(108px,1fr));gap:6px;margin-top:6px}
.bld-box{background:var(--panel,#121826);border:1px solid var(--line,#243049);border-radius:8px;padding:7px 8px;text-align:center}
.bld-box small{display:block;font-size:10px;color:var(--mut,#8b97b0)}
.bld-box b{display:block;font-size:15px;margin-top:2px}
.bld-comp-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(255,255,255,.05);font-size:12px}
.bld-comp-row:first-of-type{border-top:0}
.bld-ovl-tag{display:block;font-size:9px;color:#38bdf8;font-weight:700;margin-top:1px}
#wl-Float{position:fixed;right:18px;bottom:112px;z-index:89;background:var(--panel2,#182033);border:1px solid var(--mid,#f5c451);color:var(--txt,#e6ebf5);border-radius:99px;padding:7px 12px;font:800 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.45);display:none;align-items:center;gap:5px}
#wl-Float.show{display:inline-flex}
.bld-mm-row{display:grid;grid-template-columns:138px 1fr 78px;align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(255,255,255,.05);font-size:11.5px}
.bld-mm-row:first-of-type{border-top:0}
.bld-mm-bar{height:8px;background:var(--panel,#121826);border:1px solid var(--line,#243049);border-radius:99px;overflow:hidden;position:relative}
.bld-mm-fill{height:100%;border-radius:99px}
.bld-sit-bar{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 8px}
.bld-sit-btn{background:var(--panel,#121826);border:1px solid var(--line,#243049);color:var(--mut,#8b97b0);border-radius:99px;padding:3px 8px;font:700 10.5px/1.2 system-ui,sans-serif;cursor:pointer}
.bld-sit-btn.on{background:rgba(63,169,255,.16);border-color:var(--acc2,#3fa9ff);color:var(--txt,#e6ebf5)}
.bld-tour-bg{position:fixed;inset:0;background:rgba(5,9,18,.78);z-index:220;display:flex;align-items:center;justify-content:center;padding:16px}
.bld-tour-card{max-width:540px;width:100%;background:var(--panel,#121826);border:1px solid var(--acc2,#3fa9ff);border-radius:14px;padding:18px 20px;box-shadow:0 18px 50px rgba(0,0,0,.65)}
.bld-spot{display:inline-flex;align-items:center;gap:3px;font:800 10px/1.25 system-ui,sans-serif;padding:2px 6px;border-radius:6px;margin-left:5px;vertical-align:middle;white-space:nowrap}
.bld-spot.execute{background:rgba(83,227,166,.15);color:#53e3a6;border:1px solid rgba(83,227,166,.4)}
.bld-spot.snipe{background:rgba(56,189,248,.16);color:#38bdf8;border:1px solid rgba(56,189,248,.45)}
.bld-spot.hold{background:rgba(245,196,81,.15);color:#f5c451;border:1px solid rgba(245,196,81,.4)}
.bld-spot.fakeout{background:rgba(255,93,108,.15);color:#ff5d6c;border:1px solid rgba(255,93,108,.45)}
.bld-spot.neutral{background:rgba(139,151,176,.1);color:#8b97b0;border:1px solid rgba(139,151,176,.25)}
.bld-spcard{margin-top:12px;padding:12px 13px;background:linear-gradient(135deg,rgba(18,24,38,.98),rgba(24,32,51,.95));border:1px solid var(--line,#243049);border-radius:11px}
.bld-spcard.execute{border-color:rgba(83,227,166,.5)}
.bld-spcard.snipe{border-color:rgba(56,189,248,.55)}
.bld-spcard.fakeout{border-color:rgba(255,93,108,.55)}
.bld-spcard.hold{border-color:rgba(245,196,81,.5)}
.bld-chk-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0;border-top:1px solid rgba(255,255,255,.05);font-size:11.5px}
.bld-chk-row:first-of-type{border-top:0}
.bld-tour-step{padding:8px 10px;margin:6px 0;background:var(--panel2,#182033);border:1px solid var(--line,#243049);border-radius:9px;font-size:12.5px;line-height:1.45}
`;
const stEl=document.createElement("style");stEl.textContent=css;document.head.appendChild(stEl);

const H=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LS_WL="betlab:v1:watchlist";

// ---- 1. Watchlist State ----
function getWatchlist(){
 try{return JSON.parse(localStorage.getItem(LS_WL)||"[]")}catch(e){return[]}
}
function isWatched(sp,k){
 return getWatchlist().some(x=>x.s===sp&&x.k===k);
}
function toggleWatch(sp,k){
 let wl=getWatchlist();
 if(wl.some(x=>x.s===sp&&x.k===k))wl=wl.filter(x=>!(x.s===sp&&x.k===k));
 else wl.push({s:sp,k,at:new Date().toISOString()});
 localStorage.setItem(LS_WL,JSON.stringify(wl));
 updateWatchFloat();
 if(typeof render==="function")render();
}
function updateWatchFloat(){
 let b=document.getElementById("wl-Float");
 if(!b){
  b=document.createElement("button");b.id="wl-Float";b.type="button";
  b.onclick=()=>{
   STATE.onlyWatch=!STATE.onlyWatch;
   if(typeof view!=="undefined"&&view!=="table"){view="table";if(typeof save==="function")save()}
   if(typeof render==="function")render();
  };
  document.body.appendChild(b);
 }
 const n=getWatchlist().length;
 b.innerHTML=`⭐ Watchlist (${n})${STATE.onlyWatch?" · Filtering":""}`;
 b.classList.toggle("show",n>0);
}

// ---- 2. Median & Usage Overlay Helpers ----
function calcMedian(arr){
 if(!arr||!arr.length)return null;
 const s=arr.slice().sort((a,b)=>a-b),m=Math.floor(s.length/2);
 return s.length%2?s[m]:+( (s[m-1]+s[m])/2 ).toFixed(2);
}
function getMedianForWindow(r,winKey){
 const gs=(r.games||[]);if(!gs.length)return null;
 let sub=gs;
 if(winKey==="l5")sub=gs.slice(0,5);
 else if(winKey==="l10")sub=gs.slice(0,10);
 else if(winKey==="l20")sub=gs.slice(0,20);
 else if(winKey==="szn"&&typeof szStart==="function"){const a=szStart(typeof sport!=="undefined"?sport:"nfl");sub=gs.filter(x=>x.d>=a)}
 return calcMedian(sub.map(x=>x.v).filter(v=>v!=null));
}
function getOverlayStatForGame(g,sp,r){
 if(!g||!g.s)return null;
 const s=g.s;
 if(sp==="nba"||sp==="ncaamb"){
  if(s.minutes!=null)return {v:Math.round(s.minutes),lbl:"MIN",full:`${s.minutes} min`};
 }
 if(sp==="nhl"){
  if(r&&r.market==="Shots on Goal"&&s.toi!=null)return {v:Number(s.toi).toFixed(1),lbl:"TOI",full:`${Number(s.toi).toFixed(1)}m TOI`};
  if(s.shotsTotal!=null&&r&&r.market!=="Shots on Goal")return {v:s.shotsTotal,lbl:"SOG",full:`${s.shotsTotal} SOG${s.toi!=null?" · "+Number(s.toi).toFixed(1)+"m":""}`};
  if(s.toi!=null)return {v:Number(s.toi).toFixed(1),lbl:"TOI",full:`${Number(s.toi).toFixed(1)}m TOI`};
 }
 if(sp==="nfl"||sp==="cfb"){
  if(r&&/Passing/i.test(r.market)&&s.passingAttempts!=null)return {v:s.passingAttempts,lbl:"ATT",full:`${s.passingAttempts} pass att`};
  if(r&&/Rushing|Carries/i.test(r.market)&&s.rushingAttempts!=null)return {v:s.rushingAttempts,lbl:"CAR",full:`${s.rushingAttempts} carries`};
  if(s.receptions!=null)return {v:s.receptions,lbl:"REC",full:`${s.receptions} rec`};
  if(s.rushingAttempts!=null)return {v:s.rushingAttempts,lbl:"CAR",full:`${s.rushingAttempts} car`};
 }
 if(sp==="mlb"){
  if(s.atBats!=null){const pa=(+s.atBats||0)+(+s.walks||0)+(+s.hitByPitch||0);return {v:pa,lbl:"PA",full:`${pa} PA (${s.atBats} AB)`}}
 }
 if(sp==="soccer"){
  if(s.shots!=null)return {v:s.shots,lbl:"SH",full:`${s.shots} shots (${s.sot||0} SOT)`};
 }
 return null;
}

// ---- 3. Dynamic Opponent DvP Rank over Season / L5 / L10 ----
const _dvpWinCache={};
function getOppWindowRank(sp,r,winMode){
 if(!r||!r.dvp)return null;
 if(!winMode||winMode==="szn")return {r:r.dvp.r,of:r.dvp.of,v:r.dvp.v,tag:r.dvp.tag,what:r.dvp.what,mode:"SZN"};
 const nGames=winMode==="l5"?5:10;
 const ck=`${sp}|${r.market}|${r.pos}|${nGames}`;
 if(!_dvpWinCache[ck]){
  const pool=(typeof DATA!=="undefined"&&DATA[sp])||[];
  const byOpp={};
  const seenGamePlayer=new Set();
  for(const p of pool){
   if(p.market!==r.market)continue;
   if(sp==="nfl"&&p.pos!==r.pos)continue;
   if(sp==="nhl"&&((p.pos==="D")!==(r.pos==="D")))continue;
   for(const g of (p.games||[])){
    if(!g.o||g.v==null)continue;
    const gk=`${p.aid}|${g.d}|${g.o}`;
    if(seenGamePlayer.has(gk))continue;
    seenGamePlayer.add(gk);
    (byOpp[g.o]=byOpp[g.o]||[]).push({d:g.d,e:g.e,v:g.v});
   }
  }
  const scores=[];
  for(const [opp,arr] of Object.entries(byOpp)){
   const byDate={};
   arr.forEach(x=>{byDate[x.d]=(byDate[x.d]||0)+x.v});
   const dates=Object.keys(byDate).sort().reverse().slice(0,nGames);
   if(!dates.length)continue;
   const avg=dates.reduce((s,d)=>s+byDate[d],0)/dates.length;
   scores.push([avg,opp]);
  }
  scores.sort((a,b)=>b[0]-a[0]);
  const map={};
  scores.forEach(([avg,opp],i)=>{
   const ofN=Math.max(scores.length,r.dvp.of||30);
   map[opp]={r:i+1,of:ofN,v:+avg.toFixed(1),tag:(i+1)<=8?"soft":(i+1)>ofN-8?"tough":"",mode:winMode.toUpperCase()};
  });
  _dvpWinCache[ck]=map;
 }
 return _dvpWinCache[ck][r.oa]||{r:r.dvp.r,of:r.dvp.of,v:r.dvp.v,tag:r.dvp.tag,mode:winMode.toUpperCase()};
}

function dvpBadgeHtml(r,sp){
 const d=getOppWindowRank(sp||sport,r,STATE.dvpWin);
 if(!d)return'<span class="mut">—</span>';
 const cls=d.tag==="soft"?"soft":d.tag==="tough"?"tough":"mid";
 const posLbl=sp==="nhl"?(r.pos==="D"?"D":"FWD"):(r.pos||"POS");
 const skid=r.dvp&&r.dvp.opp_loss_streak>=3?` · L${r.dvp.opp_loss_streak}`:"";
 return `<span class="bld-rk ${cls}" title="${H(r.oa)} Defense vs ${H(posLbl)} (${d.mode}): Rank #${d.r}/${d.of} (#1 = softest, allows ${d.v}/g)${skid}">#${d.r}/${d.of} vs ${H(posLbl)} <small style="opacity:.8">(${d.v}/g${d.mode!=="SZN"?" "+d.mode:""})</small></span>`;
}

// ---- 4. Multi-Book Odds Matrix Cell (Book A - Book F + Edge) ----
function multiBookCellHtml(r,sp){
 const q=typeof ppLeg==="function"?ppLeg(r,sp||sport):null;
 if(!q&&r.ov==null)return'<span class="mut">—</span>';
 const bks=(q&&q.bks)||{};
 const entries=Object.entries(bks);
 const fmt=v=>v>0?"+"+v:String(v);
 if(entries.length>=2){
  const bestV=Math.max(...entries.map(x=>x[1]));
  return `<span class="bld-bks">${entries.slice(0,5).map(([k,v])=>`<span class="bld-bk ${v===bestV?"best":""}" title="Book ${H(k)}: ${fmt(v)}">${H(k)} ${fmt(v)}</span>`).join("")}</span>`;
 }
 const bestPx=q&&q.best!=null?q.best:r.ov;
 const bkName=q&&q.book?q.book:"Book A";
 return `<span class="bld-bks"><span class="bld-bk best">${H(bkName.replace(/^Book /,""))} ${fmt(bestPx)}</span></span>`;
}

// ---- 5. Cheatsheet Filter & View State ----
const STATE={
 avgMode:"avg",      // "avg" | "med"
 dvpWin:"szn",       // "szn" | "l10" | "l5"
 spotFlt:"all",      // "all" | "confirmed" | "snipe" | "nofake" | "fakeout"
 matchFlt:"all",     // "all" | "soft" | "top5" | "tough"
 bookFlt:"all",      // "all" | "plus" | "edge" | "moved" | "wo" | "usage"
 onlyWatch:false,
 chartOverlay:true
};

// ---- 5A. Strategic & Tactical Spot vs. Fake-Out Client-Side Read ----
function getSpotRead(r,sp){
 sp=sp||(typeof sport!=="undefined"?sport:"nfl");
 if(r&&r.spot&&r.spot.verdict){
  if(r.spot.checks&&r.spot.checks.length>=5)return r.spot;
 }
 // Fallback / live client-side evaluation across all 5 signals
 const med10=getMedianForWindow(r,"l10");
 const mean10=r.l10&&r.l10.avg!=null?+r.l10.avg:(r.avg!=null?+r.avg:null);
 const h10=r.l10?r.l10.h:0,n10=r.l10?r.l10.n:0,hr10=n10?h10/n10:null;
 const line=+r.line||0.5;
 const yes=/Anytime TD|Anytime Goal|2\+ TDs/i.test(r.market||"");
 const q=typeof ppLeg==="function"?ppLeg(r,sp):null;
 const bestPx=q&&q.best!=null?q.best:r.ov;
 const bestBk=(q&&q.book?q.book:"Book A").replace(/^DraftKings$/i,"Book A").replace(/^FanDuel$/i,"Book B").replace(/^BetMGM$/i,"Book C").replace(/^Caesars$/i,"Book D");
 const nv=q&&q.nv!=null?q.nv:(bestPx!=null?(bestPx>0?100/(bestPx+100):-bestPx/(-bestPx+100))/1.045:0.5);
 const dS=getOppWindowRank(sp,r,"szn"),d5=getOppWindowRank(sp,r,"l5");
 let score=52,trap=null;
 const reasons=[],checks=[];
 // 1. Opportunity Floor
 let oppSt="pass",oppVal="Stable role";
 if((sp==="nba"||sp==="ncaamb")&&r.u&&r.u.min){
  const l5m=+r.u.min.l5||0,sznm=+r.u.min.szn||l5m;
  if(l5m>=25&&l5m>=sznm+1){score+=8;oppVal=`${l5m} MPG L5 (+${(l5m-sznm).toFixed(1)} vs SZN)`;reasons.push(`Expanding workload: ${l5m} MPG over L5`)}
  else if(l5m>0&&(l5m<19.5||l5m<=sznm-2.5)){score-=14;oppSt="fail";oppVal=`Minutes dip (${l5m} L5 vs ${sznm} SZN)`;if(hr10>=0.5){trap="Efficiency Mirage";reasons.push(`Efficiency mirage: ${h10}/${n10} L10 despite minutes dipping to ${l5m} MPG L5`)}}
  else oppVal=`${l5m} MPG L5`;
 }else if(sp==="nhl"&&r.u){
  const l5t=r.u.toi?+r.u.toi.l5:0,l2s=r.u.form&&r.u.form.l2_sog!=null?+r.u.form.l2_sog:5,l5s=r.u.form?+r.u.form.l5_sog:0;
  if(l2s<=2){score-=13;oppSt="fail";oppVal=`Cold volume (${l2s} SOG in L2)`;if(hr10>=0.4){trap="Efficiency Mirage";reasons.push(`Box-score fake-out: only ${l2s} SOG in L2`)}}
  else{oppVal=`${l5t}m TOI · ${l5s} SOG L5`;if(l5t>=18)score+=7}
 }else if((sp==="nfl"||sp==="cfb")&&r.u&&r.u.sn){
  const l3sn=+(r.u.sn.l3??r.u.sn.l5)||0;
  oppVal=`${l3sn}% snaps L3`;if(l3sn>=70)score+=7;else if(l3sn>0&&l3sn<45){score-=12;oppSt="fail";if(hr10>=0.45)trap="Efficiency Mirage"}
 }
 checks.push({k:"Opportunity Floor",st:oppSt,v:oppVal});
 // 2. Median vs Line
 let medSt="pass",medVal=med10!=null&&mean10!=null?`Med ${med10} · Mean ${mean10} vs o${line}`:`${h10}/${n10} L10`;
 if(!yes&&med10!=null&&mean10!=null){
  if(med10>line&&mean10>line){score+=9;medVal=`Med ${med10} & Mean ${mean10} > o${line}`}
  else if(mean10>line&&med10<line){score-=16;medSt="fail";trap=trap||"Mean > Median Skew";medVal=`Skew Trap: Mean ${mean10} > o${line}, Med ${med10} < o${line}`;reasons.push(`Mean > Median skew trap: Mean (${mean10}) inflated by outlier while Median (${med10}) < o${line}`)}
  else if(med10<line){score-=8;medSt="fail"}
  else medSt="warn";
 }
 checks.push({k:"Median vs. Line",st:medSt,v:medVal});
 // 3. Multi-Book Price & Steam
 let bkSt="pass", isSnipe=false;
 const fmt=v=>v==null?"—":(v>0?"+"+v:String(v));
 let bkVal=`${bestBk} ${fmt(bestPx)} · Fair ${Math.round(nv*100)}%`;
 const bks=(q&&q.bks)||{};const bkVals=Object.values(bks);
 if(bkVals.length>=2){
  const sBks=bkVals.slice().sort((a,b)=>b-a);
  if(sBks[0]-sBks[1]>=15&&(hr10==null||hr10>=0.55)&&!trap){isSnipe=true;score+=14;bkVal=`⚡ ${bestBk} ${fmt(bestPx)} (+${sBks[0]-sBks[1]}¢ vs next book)`}
 }else if(bestPx>=100&&bestPx<=165&&!yes&&hr10>=0.70&&med10>line&&!trap){
  isSnipe=true;score+=13;bkVal=`⚡ ${bestBk} ${fmt(bestPx)} (Plus-Money vs ${Math.round(hr10*100)}% L10)`;
 }
 checks.push({k:"Multi-Book Price & Steam",st:bkSt,v:bkVal});
 // 4. Season vs L5 DvP Alignment
 let dvpSt="pass",dvpVal="Neutral matchup";
 if(dS&&d5){
  dvpVal=`SZN #${dS.r} · L5 #${d5.r}/${dS.of}`;
  if(dS.r<=12&&d5.r>=dS.of-9){score-=14;dvpSt="fail";trap=trap||"Tough L5 DvP Shift";dvpVal=`Trap Shift: SZN #${dS.r} → L5 #${d5.r}/${dS.of}`;reasons.push(`Matchup fake-out: ${r.oa} tightened from SZN #${dS.r} to L5 #${d5.r}/${dS.of}`)}
  else if(dS.r<=12&&d5.r<=14){score+=9;dvpVal=`Confirmed Soft: SZN #${dS.r} · L5 #${d5.r}/${dS.of}`;reasons.push(`Confirmed soft matchup: ${r.oa} ranks #${dS.r} SZN and #${d5.r} L5`)}
 }
 checks.push({k:"Season vs. L5 DvP",st:dvpSt,v:dvpVal});
 // 5. Game-Script & Blowout Stress Test
 let gsSt="pass",gsVal="Competitive script";
 if(r.gs){
  if(sp==="nba"&&r.gs.sp!=null&&Math.abs(+r.gs.sp)>=12.5){score-=12;gsSt="fail";gsVal=`Blowout Risk (Spread ${r.gs.sp>0?"+"+r.gs.sp:r.gs.sp})`;if(hr10>=0.5){trap=trap||"Blowout Script Risk";reasons.push(`Blowout benching risk: ${r.gs.sp>0?"+"+r.gs.sp:r.gs.sp} spread threatens Q4 starter minutes`)}}
  else if(r.gs.itt!=null)gsVal=`${r.team} TT ${r.gs.itt}`+(r.gs.sp!=null?` · Spread ${r.gs.sp>0?"+"+r.gs.sp:r.gs.sp}`:"");
 }
 checks.push({k:"Game-Script Stress Test",st:gsSt,v:gsVal});
 if(r.spot&&r.spot.verdict){
  return Object.assign({},r.spot,{checks:r.spot.checks&&r.spot.checks.length?r.spot.checks:checks});
 }
 score=Math.max(15,Math.min(97,Math.round(score+(hr10!=null?(hr10-0.55)*26:0))));
 let verdict="neutral",badge=`📊 Standard Read (${score})`;
 if(trap){verdict="fakeout";score=Math.min(score,44);badge=`🚨 Fake-Out: ${trap}`}
 else if(isSnipe){verdict="snipe";score=Math.max(78,score);badge=`⚡ ${bestBk} Off-Market Snipe (${score})`}
 else if(score>=68&&hr10>=0.60&&medSt==="pass"){verdict="execute";score=Math.max(72,score);badge=`🎯 Confirmed Spot (${score})`}
 return {verdict,score,badge,reasons:reasons.length?reasons:[`L10 hit rate ${h10}/${n10} (Med ${med10??"—"} vs o${line})`],checks};
}

function spotBadgeCompactHtml(r,sp,showNeutral){
 const s=getSpotRead(r,sp);
 if(!s)return"";
 if(s.verdict==="neutral"&&!showNeutral)return"";
 const shortLbl=s.verdict==="execute"?`🎯 Spot (${s.score})`:s.verdict==="snipe"?`⚡ Snipe (${s.score})`:s.verdict==="hold"?`⏳ Hold`:s.badge;
 const tip=[s.badge,...(s.reasons||[])].join(" • ");
 return `<span class="bld-spot ${H(s.verdict)}" title="${H(tip)}">${H(shortLbl)}</span>`;
}

function buildSpotExecutionCard(r,sp){
 const s=getSpotRead(r,sp);
 if(!s)return"";
 const col=s.verdict==="execute"?"#53e3a6":s.verdict==="snipe"?"#38bdf8":s.verdict==="hold"?"#f5c451":s.verdict==="fakeout"?"#ff5d6c":"#8b97b0";
 const icon=st=>st==="pass"?"✅":st==="warn"?"⚠️":"🚨";
 const stCol=st=>st==="pass"?"#53e3a6":st==="warn"?"#f5c451":"#ff5d6c";
 const th=r.execution_thesis||(r.spot&&r.spot.why_edge?{
  why_edge:r.spot.why_edge,
  catalyst:r.spot.catalyst,
  trap_audit:r.spot.trap_audit,
  target_execution:r.spot.target_execution,
  script_alignment:r.spot.script_alignment
 }:null);
 return `<div class="bld-spcard ${H(s.verdict)}">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
   <span style="font:800 12.5px/1.2 system-ui,sans-serif">🎯 Execution Thesis &amp; 5-Pillar Model Insight</span>
   <span class="bld-spot ${H(s.verdict)}" style="font-size:11px;padding:3px 8px;margin:0">${H(s.badge)}</span>
  </div>
  <div style="display:flex;align-items:center;gap:8px;margin:8px 0 6px">
   <span class="mut" style="font-size:11px;white-space:nowrap">Conviction Score: <b style="color:${col}">${s.score}/99</b></span>
   <div style="flex:1;height:7px;background:var(--panel,#121826);border:1px solid var(--line,#243049);border-radius:99px;overflow:hidden">
    <div style="width:${Math.max(6,Math.min(100,s.score))}%;height:100%;background:${col};border-radius:99px"></div>
   </div>
  </div>
  ${th?`<div style="background:rgba(11,15,23,.72);border:1px solid rgba(83,227,166,.22);border-radius:8px;padding:8px 10px;margin:6px 0 8px;font-size:11.5px;line-height:1.45;display:flex;flex-direction:column;gap:4px">
   ${th.why_edge?`<div><b style="color:#53e3a6">Why The Edge Exists:</b> ${H(th.why_edge)}</div>`:""}
   ${th.catalyst?`<div><b style="color:#38bdf8">Key Catalyst:</b> ${H(th.catalyst)}</div>`:""}
   ${th.script_alignment?`<div><b style="color:#a78bfa">Game Script Fit:</b> ${H(th.script_alignment)}</div>`:""}
   ${th.trap_audit?`<div><b style="color:#f5c451">Risk &amp; Trap Audit:</b> ${H(th.trap_audit)}</div>`:""}
   ${th.target_execution?`<div style="padding-top:3px;border-top:1px dashed rgba(255,255,255,.08)"><b style="color:#53e3a6">Target Execution:</b> ${H(th.target_execution)}</div>`:""}
  </div>`:((s.reasons&&s.reasons.length)?`<ul style="margin:6px 0 8px 16px;padding:0;font-size:11.5px;line-height:1.45;color:var(--txt,#e6ebf5)">${s.reasons.map(x=>`<li>${H(x)}</li>`).join("")}</ul>`:"")}
  <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.07)">
   <div class="mut" style="font:800 10px/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">5-Pillar Golden-Source Execution Checklist</div>
   ${(s.checks||[]).map(c=>`<div class="bld-chk-row">
    <span class="mut">${icon(c.st)} ${H(c.k)}</span>
    <b style="color:${stCol(c.st)};text-align:right;font-size:11px">${H(c.v)}</b>
   </div>`).join("")}
  </div>
 </div>`;
}

function buildDrawerGameScript(r,sp){
 sp=sp||(typeof sport!=="undefined"?sport:"nfl");
 const gList=(typeof GAMES!=="undefined"&&GAMES[sp])||[];
 const g=gList.find(x=>String(x.id)===String(r.game))||gList.find(x=>(x.home===r.team||x.away===r.team));
 const gs=g&&g.game_script;
 if(!gs)return"";
 return `<div class="bld-sec" style="border-color:rgba(83,227,166,.35);background:linear-gradient(135deg,rgba(16,44,36,.35),var(--panel2,#182033) 80%)">
  <h4><span>📋 The Game Script · We Deliver The Script</span><span class="mut" style="font-size:11px">${H(gs.matchup||"")}</span></h4>
  <div style="font-weight:800;color:#53e3a6;font-size:12px;margin-bottom:4px">${H(gs.headline||"")}</div>
  <div class="mut" style="font-size:11.5px;margin-bottom:6px">${H(gs.pace_tempo||"")}</div>
  <div style="display:flex;flex-direction:column;gap:5px;background:rgba(11,15,23,.65);border:1px solid var(--line,#243049);border-radius:8px;padding:8px 10px;font-size:11.5px">
   ${(gs.flow||[]).map(f=>`<div><b style="color:#38bdf8">${H(f.phase)}:</b> ${H(f.text)}</div>`).join("")}
   ${gs.primary_mismatch?`<div style="padding-top:4px;border-top:1px dashed rgba(255,255,255,.08)"><b style="color:#f5c451">🔑 Primary Mismatch:</b> ${H(gs.primary_mismatch)}</div>`:""}
   ${gs.market_read?`<div><b style="color:#a78bfa">📊 Market Read:</b> ${H(gs.market_read)}</div>`:""}
   ${gs.trap_watch?`<div><b style="color:#ff5d6c">🛡️ Trap Audit:</b> ${H(gs.trap_watch)}</div>`:""}
   ${gs.verdict?`<div style="padding-top:4px;border-top:1px solid rgba(255,255,255,.08);color:#53e3a6"><b>🎯 Script Verdict:</b> ${H(gs.verdict)}</div>`:""}
  </div>
 </div>`;
}

function passesDeepFilters(r){
 const sp=typeof sport!=="undefined"?sport:"nfl";
 if(STATE.onlyWatch&&!isWatched(sp,`${r.aid}|${r.market}`))return false;
 if(STATE.spotFlt!=="all"){
  const sr=getSpotRead(r,sp);
  const v=sr?sr.verdict:"neutral";
  if(STATE.spotFlt==="confirmed"&&v!=="execute"&&v!=="snipe")return false;
  if(STATE.spotFlt==="snipe"&&v!=="snipe")return false;
  if(STATE.spotFlt==="nofake"&&v==="fakeout")return false;
  if(STATE.spotFlt==="fakeout"&&v!=="fakeout")return false;
 }
 if(STATE.matchFlt!=="all"){
  const d=getOppWindowRank(sp,r,STATE.dvpWin);
  if(!d)return false;
  if(STATE.matchFlt==="soft"&&d.r>10)return false;
  if(STATE.matchFlt==="top5"&&d.r>5)return false;
  if(STATE.matchFlt==="tough"&&d.r<=d.of-8)return false;
 }
 if(STATE.bookFlt==="plus"){
  const q=typeof ppLeg==="function"?ppLeg(r,sp):null;
  const px=q&&q.best!=null?q.best:r.ov;
  if(px==null||px<100)return false;
 }else if(STATE.bookFlt==="edge"){
  const q=typeof ppLeg==="function"?ppLeg(r,sp):null;
  const hr=r.l10&&r.l10.n?r.l10.h/r.l10.n:null;
  const nv=q&&q.nv!=null?q.nv:(r.ov!=null?(r.ov>0?100/(r.ov+100):-r.ov/(-r.ov+100))/1.045:null);
  if(hr==null||nv==null||(hr-nv)<0.04)return false;
 }else if(STATE.bookFlt==="moved"){
  const m=typeof mv==="function"?mv(r):null;
  if(!m||Math.abs(m)<0.5)return false;
 }else if(STATE.bookFlt==="wo"){
  if(!(r.wo&&r.wo.n>=2))return false;
 }else if(STATE.bookFlt==="usage"){
  const tr=typeof useTr==="function"?useTr(r):0;
  if(tr<=0)return false;
 }
 return true;
}

// ---- 6. "How Similar Players Did vs. This Opponent" (Positional Comps vs. Opponent) ----
function buildSimilarPlayersVsOpp(r,sp){
 if(!r||!r.oa)return"";
 const pool=(typeof DATA!=="undefined"&&DATA[sp])||[];
 const comps=[];
 const seen=new Set();
 for(const p of pool){
  if(p.aid===r.aid||p.market!==r.market)continue;
  if(sp==="nfl"&&p.pos!==r.pos)continue;
  if(sp==="nhl"&&((p.pos==="D")!==(r.pos==="D")))continue;
  if(sp==="nba"&&p.pos&&r.pos&&p.pos!==r.pos&&p.pos[0]!==r.pos[0])continue;
  for(const g of (p.games||[])){
   if(g.o!==r.oa||g.v==null)continue;
   const k=`${p.aid}|${g.d}`;
   if(seen.has(k))continue;
   seen.add(k);
   const pAvg=p.avg!=null?p.avg:(p.l10?p.l10.avg:p.line);
   const diff=pAvg!=null?+(g.v-pAvg).toFixed(1):null;
   const ov=g.v>p.line;
   comps.push({player:p.player,pos:p.pos,team:g.t||p.team,d:g.d,v:g.v,line:p.line,avg:pAvg,diff,ov,ug:getOverlayStatForGame(g,sp,p)});
  }
 }
 comps.sort((a,b)=>b.d.localeCompare(a.d));
 const top=comps.slice(0,6);
 if(!top.length)return"";
 const hits=top.filter(x=>x.ov).length;
 const avgDiff=top.filter(x=>x.diff!=null).length?+(top.reduce((s,x)=>s+(x.diff||0),0)/top.length).toFixed(1):null;
 return `<div class="bld-sec">
  <h4><span>👥 How Similar ${H(r.pos||"Positional")} Players Did vs. ${H(r.oa)}</span><span class="${hits/top.length>=0.6?"up":hits/top.length<=0.4?"dn":"mut"}" style="font-size:11.5px">${hits}/${top.length} cleared line${avgDiff!=null?` (${avgDiff>=0?"+":""}${avgDiff} vs avg)`:""}</span></h4>
  <div class="mut" style="font-size:11px;margin-bottom:4px">Most recent ${H(r.pos||"same-position")} players facing ${H(r.oa)} in ${H(r.market)} (box-score logs):</div>
  ${top.map(c=>`<div class="bld-comp-row">
   <div><b>${H(c.player)}</b> <span class="mut">${H(c.team)} · ${H(c.d.slice(5))}</span>${c.ug?` <span class="pill" style="font-size:10px;padding:1px 5px">${H(c.ug.full)}</span>`:""}</div>
   <div style="text-align:right"><b class="${c.ov?"up":"dn"}">${c.v}</b> <span class="mut" style="font-size:11px">vs o${c.line}${c.diff!=null?` (${c.diff>=0?"+":""}${c.diff} vs avg)`:""}</span></div>
  </div>`).join("")}
 </div>`;
}

// ---- 7. Interactive Teammate On/Off Split Explorer ("With / Without Any Teammate") ----
function buildTeammateOnOffExplorer(r,sp){
 const pool=(typeof DATA!=="undefined"&&DATA[sp])||[];
 const myGames=(r.games||[]).filter(g=>g.e&&g.v!=null);
 if(myGames.length<5)return"";
 // Find teammates on same team with game logs
 const byAid=new Map();
 for(const p of pool){
  if(p.team!==r.team||p.aid===r.aid||byAid.has(p.aid)||!(p.games&&p.games.length))continue;
  byAid.set(p.aid,p);
 }
 const mates=[];
 for(const [aid,tm] of byAid.entries()){
  const tmEvents=new Set((tm.games||[]).filter(g=>(g.t||tm.team)===r.team&&g.e).map(g=>String(g.e)));
  const withG=myGames.filter(g=>tmEvents.has(String(g.e)));
  const woG=myGames.filter(g=>!tmEvents.has(String(g.e)));
  if(woG.length>=1&&withG.length>=2){
   const isOut=!!(tm.unav||(r.wo&&r.wo.tm_out===tm.player));
   mates.push({aid,name:tm.player,pos:tm.pos,unav:tm.unav||(isOut?"Out":null),withG,woG});
  }
 }
 if(!mates.length&&!r.wo)return"";
 mates.sort((a,b)=>(!!b.unav-!!a.unav)||(b.woG.length-a.woG.length));
 const topMates=mates.slice(0,8);
 if(!topMates.length)return"";
 const selM=topMates[0];
 function renderSplitFor(m){
  const summarize=gs=>{
   if(!gs.length)return {h:0,n:0,pct:0,avg:0,med:0};
   const vs=gs.map(x=>x.v);
   const h=vs.filter(v=>v>r.line).length;
   const avg=+(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1);
   const med=calcMedian(vs);
   return {h,n:vs.length,pct:Math.round(h/vs.length*100),avg,med};
  };
  const wS=summarize(m.withG),woS=summarize(m.woG);
  const diff=+(woS.avg-wS.avg).toFixed(1);
  return `<div class="bld-grid" id="bld-tm-res">
   <div class="bld-box" style="border-color:rgba(245,196,81,.4)"><small>WITHOUT ${H(m.name.split(" ").pop())} (${woS.n}G)</small><b class="${woS.pct>=60?"up":woS.pct<=40?"dn":""}">${woS.pct}% (${woS.h}/${woS.n})</b><small>Avg ${woS.avg} · Med ${woS.med}</small></div>
   <div class="bld-box"><small>WITH ${H(m.name.split(" ").pop())} (${wS.n}G)</small><b>${wS.pct}% (${wS.h}/${wS.n})</b><small>Avg ${wS.avg} · Med ${wS.med}</small></div>
   <div class="bld-box"><small>On/Off Impact Δ</small><b class="${diff>0?"up":diff<0?"dn":""}">${diff>=0?"+":""}${diff} ${H(r.market.split(" ").pop())}</b><small>Hit rate ${woS.pct-wS.pct>=0?"+":""}${woS.pct-wS.pct}% w/o</small></div>
  </div>`;
 }
 window._bldMates=topMates;
 window._bldRenderMate=idx=>{
  const m=window._bldMates[idx];if(!m)return;
  const el=document.getElementById("bld-tm-res");
  if(el)el.outerHTML=renderSplitFor(m);
 };
 return `<div class="bld-sec">
  <h4><span>🔀 Teammate On/Off Split (With vs. Without Teammate)</span>
   <select onchange="window._bldRenderMate(this.selectedIndex)" style="background:var(--panel,#121826);color:var(--txt,#e6ebf5);border:1px solid var(--line,#243049);border-radius:6px;padding:3px 7px;font-size:11.5px;font-weight:700">
    ${topMates.map((m,i)=>`<option value="${i}">${H(m.name)} (${H(m.pos)}${m.unav?" · 🚑 "+H(m.unav):""}) — ${m.woG.length}G w/o</option>`).join("")}
   </select>
  </h4>
  ${renderSplitFor(selM)}
 </div>`;
}

// ---- 8. "Deeper Than The Box Score" Sport-Specific Breakdown Strip ----
function buildDeeperThanBoxScore(r,sp){
 const items=[];
 const gs=(r.games||[]);
 const vs=gs.map(x=>x.v).filter(v=>v!=null);
 if(vs.length){
  const med10=getMedianForWindow(r,"l10"),avg10=r.l10?r.l10.avg:null;
  if(med10!=null&&avg10!=null)items.push(["L10 Avg / Median",`${avg10} / ${med10}`,`Line o${r.line} (${ +(avg10-r.line).toFixed(1) } vs avg)`]);
  const sd=vs.length>1?Math.sqrt(vs.slice(0,10).reduce((a,b)=>a+(b-(avg10||0))**2,0)/Math.min(10,vs.length)):0;
  const cv=avg10>0?sd/avg10:0;
  items.push(["Consistency / Floor",cv<=0.32?"High Floor":cv<=0.55?"Moderate":"Boom / Bust",`L10 σ=${sd.toFixed(1)} · Range ${Math.min(...vs.slice(0,10))}–${Math.max(...vs.slice(0,10))}`]);
 }
 if(r.dvp){
  const dS=getOppWindowRank(sp,r,"szn"),d10=getOppWindowRank(sp,r,"l10"),d5=getOppWindowRank(sp,r,"l5");
  items.push([`${r.oa} Defense Rank`,`SZN #${dS.r} · L10 #${d10.r} · L5 #${d5.r}`,`Allows ${dS.v}/g SZN (${d5.v}/g L5) to ${r.pos}`]);
 }
 if(sp==="nfl"&&r.u){
  if(r.u.sn)items.push(["Offensive Snap Share",`${r.u.sn.l3??r.u.sn.l5}% L3`,`Season ${r.u.sn.szn}% (${r.u.sn.tr>0?"▲ Rising":r.u.sn.tr<0?"▼ Dipping":"Stable"})`]);
  if(r.u.tg)items.push(["Target Volume",`${r.u.tg.l3??r.u.tg.l5}/g L3`,`Season ${r.u.tg.szn} targets/g`]);
  if(r.u.ca)items.push(["Rush Carries",`${r.u.ca.l3??r.u.ca.l5}/g L3`,`Season ${r.u.ca.szn} carries/g`]);
 }
 if(sp==="nhl"&&r.u){
  if(r.u.toi)items.push(["Ice Time (TOI)",`${r.u.toi.l5}m L5`,r.u.toi.peak_l5?`Peak ${r.u.toi.peak_l5}m · Szn ${r.u.toi.szn}m`:`Season ${r.u.toi.szn}m`]);
  if(r.u.form)items.push(["Shot & Goal Form",`${r.u.form.l5_g}G / ${r.u.form.l5_sog} SOG L5`,`L2: ${r.u.form.l2_sog} SOG · ${(r.u.form.profile||"steady").replace("_"," ")}`]);
  if(r.u.ppp)items.push(["Power Play Rate",`${r.u.ppp.l5} PPP/g L5`,`Season ${r.u.ppp.szn} PP pts/g`]);
  if(r.u.rest)items.push(["Rest Situation",r.u.rest.team_b2b?"⚡ On B2B":"🔋 Rested",`${r.u.rest.rest_days??1}d rest · Opp ${r.u.rest.opp_b2b?"on B2B":"rested"}`]);
 }
 if((sp==="nba"||sp==="ncaamb")&&r.u&&r.u.min){
  items.push(["Minutes Workload",`${r.u.min.l5} MPG L5`,`Season ${r.u.min.szn} MPG (${r.u.min.tr>0?"▲ Expanding":"Steady"})`]);
 }
 if(r.gs){
  const parts=[];
  if(r.gs.tot!=null)parts.push(`O/U ${r.gs.tot}`);
  if(r.gs.itt!=null)parts.push(`${r.team} TT ${r.gs.itt}`);
  if(r.gs.sp!=null)parts.push(`Spread ${r.gs.sp>0?"+"+r.gs.sp:r.gs.sp}`);
  else if(r.gs.ml!=null)parts.push(`ML ${r.gs.ml>0?"+"+r.gs.ml:r.gs.ml}`);
  if(parts.length)items.push(["Game Environment",parts.slice(0,2).join(" · "),parts.slice(2).join(" · ")||"Implied script"]);
 }
 if(!items.length)return"";
 return `<div class="bld-sec">
  <h4><span>🔬 Deeper Than The Box Score · Role, Matchup &amp; Environment</span><span class="mut" style="font-size:11px">Multi-Window Diagnostics</span></h4>
  <div class="bld-grid">${items.map(([k,v,sub])=>`<div class="bld-box"><small>${H(k)}</small><b>${H(v)}</b><small>${H(sub)}</small></div>`).join("")}</div>
 </div>`;
}


// ---- 8B. Multi-Season (Up to 3 Seasons + H2H) History Strip ----
function buildMultiSeasonStrip(r,sp){
 const gs=(r.games||[]).filter(g=>g.d&&g.v!=null);
 if(gs.length<4)return"";
 const byYr={};
 for(const g of gs){
  const yr=g.d.slice(0,4);
  (byYr[yr]=byYr[yr]||[]).push(g);
 }
 const yrs=Object.keys(byYr).sort().reverse().slice(0,3);
 const h2h=gs.filter(g=>g.o===r.oa);
 const summarize=(label,arr)=>{
  if(!arr.length)return null;
  const vs=arr.map(x=>x.v);
  const h=vs.filter(v=>v>r.line).length;
  const pct=Math.round(h/vs.length*100);
  const avg=+(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1);
  const med=calcMedian(vs);
  return {label,n:vs.length,h,pct,avg,med};
 };
 const cards=[];
 yrs.forEach((yr,i)=>cards.push(summarize(i===0?`This Year (${yr})`:`${yr} Logs`,byYr[yr])));
 if(gs.length>byYr[yrs[0]].length)cards.push(summarize(`Multi-Yr (${gs.length}G)`,gs));
 if(h2h.length)cards.push(summarize(`vs ${r.oa} (H2H)`,h2h));
 const valid=cards.filter(Boolean);
 if(valid.length<2)return"";
 return `<div class="bld-sec">
  <h4><span>📅 Multi-Season &amp; Head-to-Head History (vs. o${r.line})</span><span class="mut" style="font-size:11px">Updated Daily</span></h4>
  <div class="bld-grid">${valid.map(c=>`<div class="bld-box"><small>${H(c.label)}</small><b class="${c.pct>=60?"up":c.pct<=40?"dn":""}">${c.pct}% (${c.h}/${c.n})</b><small>Avg ${c.avg} · Med ${c.med}</small></div>`).join("")}</div>
 </div>`;
}

// ---- 8C. Interactive Situational, Workload Floor & Rest Split Explorer ----
function buildSituationalWorkloadExplorer(r,sp){
 const gs=(r.games||[]).filter(g=>g.d&&g.v!=null);
 if(gs.length<5)return"";
 // Compute rest days from chronological dates
 const chron=gs.slice().sort((a,b)=>a.d.localeCompare(b.d));
 const restByDate={};
 for(let i=0;i<chron.length;i++){
  if(i===0){restByDate[chron[i].d]=3;continue}
  const d1=new Date(chron[i-1].d+"T12:00:00Z"),d2=new Date(chron[i].d+"T12:00:00Z");
  restByDate[chron[i].d]=Math.max(0,Math.round((d2-d1)/86400000)-1);
 }
 // Compute workload metric per game
 const uVals=gs.map(g=>{const u=getOverlayStatForGame(g,sp,r);return u?+u.v:null}).filter(v=>v!=null&&!isNaN(v));
 const avgUsage=uVals.length?+(uVals.reduce((a,b)=>a+b,0)/uVals.length).toFixed(1):null;
 const uLbl=gs.map(g=>getOverlayStatForGame(g,sp,r)).find(Boolean)?.lbl||"VOL";

 const splits=[
  {id:"all",lbl:`All (${gs.length}G)`,arr:gs},
  {id:"home",lbl:"🏠 Home",arr:gs.filter(g=>g.at!="@")},
  {id:"away",lbl:"✈️ Away",arr:gs.filter(g=>g.at==="@")},
 ];
 if(avgUsage!=null){
  const hiU=gs.filter(g=>{const u=getOverlayStatForGame(g,sp,r);return u&&+u.v>=avgUsage});
  const loU=gs.filter(g=>{const u=getOverlayStatForGame(g,sp,r);return u&&+u.v<avgUsage});
  if(hiU.length>=2)splits.push({id:"hiu",lbl:`🔥 ≥${avgUsage} ${uLbl} (${hiU.length}G)`,arr:hiU});
  if(loU.length>=2)splits.push({id:"lou",lbl:`📉 <${avgUsage} ${uLbl} (${loU.length}G)`,arr:loU});
 }
 const b2b=gs.filter(g=>restByDate[g.d]===0);
 const rest2=gs.filter(g=>restByDate[g.d]>=2);
 if(b2b.length>=1&&sp!=="nfl"&&sp!=="cfb")splits.push({id:"b2b",lbl:`⚡ B2B / 0d Rest (${b2b.length}G)`,arr:b2b});
 if(rest2.length>=2&&sp!=="nfl"&&sp!=="cfb")splits.push({id:"rest2",lbl:`🛌 2+d Rest (${rest2.length}G)`,arr:rest2});

 function renderSit(spObj){
  const arr=spObj.arr;
  if(!arr.length)return`<div id="bld-sit-res" class="mut">No games in this split.</div>`;
  const vs=arr.map(x=>x.v);
  const h=vs.filter(v=>v>r.line).length;
  const pct=Math.round(h/vs.length*100);
  const avg=+(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1);
  const med=calcMedian(vs);
  const diff=+(avg-r.line).toFixed(1);
  return `<div id="bld-sit-res">
   <div class="bld-grid">
    <div class="bld-box"><small>${H(spObj.lbl)} Hit Rate</small><b class="${pct>=60?"up":pct<=40?"dn":""}">${pct}% (${h}/${vs.length})</b><small>vs Line o${r.line}</small></div>
    <div class="bld-box"><small>Split Mean / Median</small><b>${avg} / ${med}</b><small class="${diff>0?"up":diff<0?"dn":"mut"}">${diff>=0?"+":""}${diff} vs line</small></div>
    <div class="bld-box"><small>Min – Max Range</small><b>${Math.min(...vs)} – ${Math.max(...vs)}</b><small>Last: ${arr.slice(0,5).map(x=>x.v).join(", ")}</small></div>
   </div>
  </div>`;
 }
 window._bldSits=splits;
 window._bldPickSit=(idx,btn)=>{
  const s=window._bldSits[idx];if(!s)return;
  const box=btn.closest(".bld-sec");
  if(box)box.querySelectorAll(".bld-sit-btn").forEach((b,i)=>b.classList.toggle("on",i===idx));
  const el=document.getElementById("bld-sit-res");
  if(el)el.outerHTML=renderSit(s);
 };
 return `<div class="bld-sec">
  <h4><span>🎛️ Situational, Workload Floor &amp; Rest Splits</span><span class="mut" style="font-size:11px">Click any split</span></h4>
  <div class="bld-sit-bar">${splits.map((s,i)=>`<button type="button" class="bld-sit-btn ${i===0?"on":""}" onclick="window._bldPickSit(${i},this)">${H(s.lbl)}</button>`).join("")}</div>
  ${renderSit(splits[0])}
 </div>`;
}

// ---- 8D. Player vs. Defense Scheme & Zone Mismatch Matrix ----
function buildSchemeMismatchMatrix(r,sp){
 const dS=getOppWindowRank(sp,r,"szn"),d5=getOppWindowRank(sp,r,"l5");
 if(!dS)return"";
 const rows=[];
 const gs=(r.games||[]).slice(0,10);
 const sList=gs.map(g=>g.s||{}).filter(s=>Object.keys(s).length);
 const avgStat=k=>sList.length?+(sList.reduce((a,s)=>a+(+s[k]||0),0)/sList.length).toFixed(1):null;
 const rkPct=Math.max(8,Math.min(96,Math.round((1-(dS.r-1)/Math.max(1,(dS.of||30)-1))*100)));
 const l5Pct=d5?Math.max(8,Math.min(96,Math.round((1-(d5.r-1)/Math.max(1,(d5.of||30)-1))*100))):rkPct;

 rows.push({
  lbl:`${r.oa} vs ${r.pos||"Pos"} (SZN)`,
  pct:rkPct,
  col:dS.r<=10?"#53e3a6":dS.r>=(dS.of||30)-8?"#ff5d6c":"#3fa9ff",
  val:`#${dS.r}/${dS.of} (${dS.v}/g)`
 });
 if(d5){
  rows.push({
   lbl:`${r.oa} Recent Form (L5)`,
   pct:l5Pct,
   col:d5.r<=10?"#53e3a6":d5.r>=(d5.of||30)-8?"#ff5d6c":"#3fa9ff",
   val:`#${d5.r}/${d5.of} (${d5.v}/g)`
  });
 }
 if(sp==="nba"||sp==="ncaamb"){
  const fg3=avgStat("fg3m"),ftm=avgStat("ftm"),pts=avgStat("points"),reb=avgStat("rebounds"),ast=avgStat("assists");
  if(pts!=null&&fg3!=null){
   const p3Share=pts>0?Math.min(100,Math.round((fg3*3/pts)*100)):0;
   const paintShare=pts>0?Math.max(0,Math.min(100,100-p3Share-Math.round(((ftm||0)/pts)*100))):50;
   rows.push({lbl:"Perimeter / 3PT Share",pct:Math.max(12,p3Share),col:"#a78bfa",val:`${p3Share}% of pts (${fg3} 3PM/g)`});
   rows.push({lbl:"Interior / 2PT Share",pct:Math.max(12,paintShare),col:"#38bdf8",val:`${paintShare}% of pts (${ftm||0} FTM/g)`});
  }
  if(reb!=null&&ast!=null){
   rows.push({lbl:"Playmaking & Glass",pct:Math.min(95,Math.round((reb+ast)*5)),col:"#53e3a6",val:`${reb} REB · ${ast} AST/g`});
  }
 }else if(sp==="nfl"||sp==="cfb"){
  if(r.u&&r.u.sn)rows.push({lbl:"Snap Workload Share",pct:Math.min(98,Math.round(r.u.sn.l3||r.u.sn.szn||50)),col:"#53e3a6",val:`${r.u.sn.l3??r.u.sn.szn}% snaps`});
  if(r.u&&r.u.tg)rows.push({lbl:"Target Funnel Role",pct:Math.min(96,Math.round((r.u.tg.l3||r.u.tg.szn||4)*9)),col:"#38bdf8",val:`${r.u.tg.l3??r.u.tg.szn} tgt/g`});
  if(r.u&&r.u.ca)rows.push({lbl:"Rush Volume Role",pct:Math.min(96,Math.round((r.u.ca.l3||r.u.ca.szn||8)*4.5)),col:"#f5c451",val:`${r.u.ca.l3??r.u.ca.szn} car/g`});
 }else if(sp==="nhl"){
  if(r.u&&r.u.toi)rows.push({lbl:"Ice Time Share (TOI)",pct:Math.min(96,Math.round((r.u.toi.l5||18)/25*100)),col:"#38bdf8",val:`${r.u.toi.l5}m L5 (Peak ${r.u.toi.peak_l5||r.u.toi.l5}m)`});
  if(r.u&&r.u.form)rows.push({lbl:"5-Game Shot Volume",pct:Math.min(96,Math.round((r.u.form.l5_sog||10)*4)),col:"#53e3a6",val:`${r.u.form.l5_sog} SOG / ${r.u.form.l5_g}G in L5`});
 }
 return `<div class="bld-sec">
  <h4><span>🎯 Player vs. Defense Mismatch &amp; Scoring Profile</span><span class="mut" style="font-size:11px">#1 = Softest Matchup</span></h4>
  ${rows.map(x=>`<div class="bld-mm-row">
   <span class="mut">${H(x.lbl)}</span>
   <div class="bld-mm-bar"><div class="bld-mm-fill" style="width:${x.pct}%;background:${x.col}"></div></div>
   <b style="text-align:right;font-size:11px">${H(x.val)}</b>
  </div>`).join("")}
 </div>`;
}

// ---- 8E. Copy Watchlist Research Slip & Quick Tour Modal ----
function copyWatchlistSlip(){
 const wl=getWatchlist();
 if(!wl.length){alert("Your Watchlist is empty — tap ★ on any prop row or card to save props first.");return}
 const lines=["📋 BET LAB PROP RESEARCH SHORTLIST"];
 for(const item of wl){
  const pool=(typeof DATA!=="undefined"&&DATA[item.s])||[];
  const r=pool.find(x=>`${x.aid}|${x.market}`===item.k);
  if(!r)continue;
  const q=typeof ppLeg==="function"?ppLeg(r,item.s):null;
  const px=q&&q.best!=null?q.best:r.ov;
  const bk=q&&q.book?q.book:"Book A";
  const d=getOppWindowRank(item.s,r,STATE.dvpWin);
  const med=getMedianForWindow(r,"l10");
  lines.push(`• [${item.s.toUpperCase()}] ${r.player} (${r.team} vs ${r.oa}) — Over ${r.line} ${r.market} @ ${px>0?"+"+px:px} (${bk}) | L10: ${r.l10?r.l10.pct+"%":"—"} | Avg ${r.avg??"—"} / Med ${med??"—"}${d?` | DvP #${d.r}/${d.of}`:""}`);
 }
 navigator.clipboard.writeText(lines.join("\n")).then(()=>{
  const b=document.querySelector("[data-cs-copywl]");
  if(b){const old=b.textContent;b.textContent="✓ Copied Slip!";setTimeout(()=>b.textContent=old,1800)}
 });
}

function showQuickTour(){
 const old=document.getElementById("bld-tour-modal");if(old){old.remove();return}
 const m=document.createElement("div");
 m.id="bld-tour-modal";m.className="bld-tour-bg";
 m.onclick=e=>{if(e.target===m)m.remove()};
 m.innerHTML=`<div class="bld-tour-card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
   <b style="font-size:16px">🧭 Bet Lab Deep Research &amp; Cheatsheet Tour</b>
   <button type="button" class="bld-chip" onclick="document.getElementById('bld-tour-modal').remove()">✕ Close</button>
  </div>
  <div class="bld-tour-step"><b>1. Multi-Window Opponent DvP Chips:</b> Switch between <b>Season DvP</b>, <b>L10 DvP</b>, and <b>L5 DvP</b> in one tap. Every row shows the exact positional rank (<b>#1 = Softest matchup</b>) and stat allowed per game without opening a modal.</div>
  <div class="bld-tour-step"><b>2. Mean (Average) ⇄ Median Mode:</b> Toggle between Mean and Median both in the Cheatsheet table and as a dashed blue reference line on every player's game-log bar chart.</div>
  <div class="bld-tour-step"><b>3. Side-by-Side Multi-Book Odds Matrix:</b> Compare live prices across <b>Book A – Book W</b> right on the row, with the best available number highlighted in green.</div>
  <div class="bld-tour-step"><b>4. Deeper Than The Box Score Drawer:</b> Tap any player to see <b>Player vs. Defense Mismatch Bars</b>, <b>Interactive Teammate On/Off Splits</b>, <b>How Similar Players Did vs. This Opponent</b>, <b>Situational/Workload/Rest Splits</b>, and <b>Multi-Season + H2H</b> history.</div>
  <div class="bld-tour-step"><b>5. Watchlist &amp; Auto-Graded Bet Tracker:</b> Tap <b>★</b> to shortlist props and <b>📋 Copy Slip</b>, or tap <b>📊 Track</b> to log plays into <b>My Bets</b> for automatic live box-score grading.</div>
 </div>`;
 document.body.appendChild(m);
}

// ---- 9. Enhanced Game-Log Bar Chart (Avg vs Median Toggle + Usage Stat Overlay on Bars) ----
function patchSpanChart(){
 if(typeof window.renderSpanChart!=="function"||window.renderSpanChart.__bld)return;
 const orig=window.renderSpanChart;
 window.renderSpanChart=function(r,sp,curSpan){
  const G=r.games||[];
  if(!G.length)return orig(r,sp,curSpan);
  const a=szStart(sp),b=szStart(sp,1),sLab=r.szLab||szLab(sp),lLab=r.lszLab||szLab(sp,1);
  const T=G.filter(x=>x.d>=a),L=G.filter(x=>x.d>=b&&x.d<a),L10=G.slice(0,10),H2H=G.filter(x=>x.o===r.oa),ALL=G.slice(0,20);
  const spans=[];
  if(T.length)spans.push(["this",`This Season (${sLab}) · ${T.length}G`,T,`${sLab} season (${T.length}G)`]);
  if(L.length)spans.push(["last",`Last Season (${lLab}) · ${L.length}G`,L,`${lLab} season (${L.length}G)`]);
  if(H2H.length)spans.push(["h2h",`vs ${r.oa} · ${H2H.length}G`,H2H,`H2H vs ${r.oa} (${H2H.length}G)`]);
  if(G.length>T.length&&L10.length)spans.push(["l10",`Last 10 · ${L10.length}G`,L10,`last ${L10.length} games`]);
  if(ALL.length>T.length&&ALL.length!==L.length)spans.push(["all",`All (L${ALL.length})`,ALL,`last ${ALL.length} games across seasons`]);
  if(!spans.length)spans.push(["all",`Last ${ALL.length}G`,ALL,`last ${ALL.length} games`]);
  const pick=spans.find(x=>x[0]===curSpan)||spans[0];
  const g=pick[2].slice().reverse();
  const vs=g.map(x=>x.v);
  const hits=g.filter(x=>x.v>r.line).length;
  const avg=+(vs.reduce((s,x)=>s+x,0)/g.length).toFixed(1);
  const med=calcMedian(vs);
  const refVal=STATE.avgMode==="med"?med:avg;
  const mx=Math.max(r.line*1.4,refVal*1.25,...vs,1);

  return `<div class="gspan-bar">
   ${spans.map(x=>`<button type="button" data-gspan="${x[0]}" class="${x[0]===pick[0]?"on":""}">${H(x[1])}</button>`).join("")}
   <button type="button" data-bld-avg="1" class="${STATE.avgMode==="med"?"on":""}" title="Switch between Mean (Average) and Median reference line">📐 ${STATE.avgMode==="med"?`Median ${med}`:`Avg ${avg}`} (⇄ ${STATE.avgMode==="med"?`Avg ${avg}`:`Med ${med}`})</button>
   <button type="button" data-bld-ovl="1" class="${STATE.chartOverlay?"on":""}" title="Overlay minutes / TOI / targets / carries / shots on each bar">📊 Usage Overlay</button>
   <span class="gspan-sum"><b style="color:var(--acc)">${hits}/${g.length} (${Math.round(hits/g.length*100)}%)</b> · Avg <b>${avg}</b> · Med <b>${med}</b></span>
  </div>`+
  `<div class="chart-wrap"><div class="chart-in" style="min-width:${Math.max(100,g.length*38)}px"><div class="chart">${g.map(x=>{
   const ug=STATE.chartOverlay?getOverlayStatForGame(x,sp,r):null;
   return `<div class="b" data-barv="${x.v}" style="height:${Math.max(4,x.v/mx*100)}%;background:${x.v>r.line?"var(--acc)":"var(--bad)"}" title="${x.d} ${x.at}${x.o}: ${x.v}${ug?" ("+ug.full+")":""}"><span>${x.v}</span></div>`;
  }).join("")}
  <div class="ln" style="bottom:${Math.min(95,Math.max(3,r.line/mx*100))}%"><i>Line ${r.line}</i></div>
  <div class="ln" style="bottom:${Math.min(95,Math.max(3,refVal/mx*100))}%;border-top-color:#38bdf8"><i style="color:#38bdf8;left:0;right:auto">${STATE.avgMode==="med"?"Med":"Avg"} ${refVal}</i></div>
  </div>`+
  `<div class="xl">${g.map(x=>{
   const ug=STATE.chartOverlay?getOverlayStatForGame(x,sp,r):null;
   return `<div title="${x.d} ${x.at}${x.o}: ${x.v}${ug?" · "+ug.full:""}"><b>${x.at==="@"?"@":""}${x.o}</b>${fmtMD(x.d)}${ug?`<span class="bld-ovl-tag">${ug.v}${ug.lbl}</span>`:""}</div>`;
  }).join("")}</div></div></div>`+
  `<p class="mut" style="font-size:11.5px;margin:4px 0 0">Green = over ${r.line}. Dashed yellow = Line (${r.line}); dashed blue = ${STATE.avgMode==="med"?"Median":"Average"} (${refVal}).</p>`;
 };
 window.renderSpanChart.__bld=1;

 const origBind=window.bindSpanChart;
 window.bindSpanChart=function(box,r,sp){
  if(origBind)origBind(box,r,sp);
  if(!box)return;
  const avgBtn=box.querySelector("[data-bld-avg]");
  if(avgBtn)avgBtn.onclick=e=>{e.stopPropagation();STATE.avgMode=STATE.avgMode==="avg"?"med":"avg";box.innerHTML=window.renderSpanChart(r,sp,window._drSpan||"this");window.bindSpanChart(box,r,sp)};
  const ovlBtn=box.querySelector("[data-bld-ovl]");
  if(ovlBtn)ovlBtn.onclick=e=>{e.stopPropagation();STATE.chartOverlay=!STATE.chartOverlay;box.innerHTML=window.renderSpanChart(r,sp,window._drSpan||"this");window.bindSpanChart(box,r,sp)};
 };
}

// ---- 10. 1-Tap Track Bet Helper ----
function quickTrackProp(r,sp){
 const q=typeof ppLeg==="function"?ppLeg(r,sp):null;
 const px=q&&q.best!=null?q.best:(r.ov!=null?r.ov:-110);
 const bk=q&&q.book?q.book:"Book A";
 const u=typeof unitSize==="function"?unitSize():10;
 const bet={
  id:"q"+Date.now().toString(36),
  at:new Date().toISOString(),
  odds:px,
  boost:null,
  stake:u,
  book:bk,
  legs:[{sport:sp,aid:r.aid,player:r.player,market:r.market,line:r.line,stat:r.stat,game:r.game,time:r.time,team:r.team,opp:r.opp,ov:px,odds:px}]
 };
 const T=typeof myBets==="function"?myBets():[];
 T.push(bet);
 localStorage.setItem("betlab:v1:taken",JSON.stringify(T));
}

// ---- 11. Inject Deep Research Sections into Drawer & Enhance Cheatsheet Table ----
function mountDrawerDeep(){
 const drw=document.getElementById("drawer");
 if(!drw||!drw.classList.contains("open")||drw.querySelector("#bld-drw-deep"))return;
 const h2=drw.querySelector("h2"),addB=h2&&h2.querySelector(".add");
 if(!addB)return;
 const sp=addB.dataset.s||(typeof sport!=="undefined"?sport:"nfl"),k=addB.dataset.k;
 const r=(typeof DATA!=="undefined"&&DATA[sp]||[]).find(x=>(x.aid+"|"+x.market)===k);
 if(!r)return;

 // Add ⭐ Watchlist & 📊 Track buttons right into drawer header
 if(!h2.querySelector(".bld-star")){
  const watched=isWatched(sp,k);
  h2.insertAdjacentHTML("beforeend",` <button type="button" class="bld-star ${watched?"on":""}" data-bld-watch="${H(sp)}|${H(k)}" title="Save to personal Watchlist">★</button><button type="button" class="bld-trk" data-bld-trk="${H(sp)}|${H(k)}" title="1-tap log this prop to your personal Bet Tracker">📊 Track</button>`);
 }

 const wrap=document.createElement("div");
 wrap.id="bld-drw-deep";
 wrap.innerHTML=buildSpotExecutionCard(r,sp)+buildDrawerGameScript(r,sp)+buildDeeperThanBoxScore(r,sp)+buildSchemeMismatchMatrix(r,sp)+buildSituationalWorkloadExplorer(r,sp)+buildMultiSeasonStrip(r,sp)+buildTeammateOnOffExplorer(r,sp)+buildSimilarPlayersVsOpp(r,sp);
 const splitEl=drw.querySelector(".split");
 if(splitEl)splitEl.insertAdjacentElement("afterend",wrap);
 else drw.appendChild(wrap);
}

function renderCheatsheetFilterBar(){
 const tctl=document.getElementById("tctl");
 if(!tctl||document.getElementById("bld-cs-bar"))return;
 const wlCount=getWatchlist().length;
 const bar=document.createElement("div");
 bar.id="bld-cs-bar";
 bar.className="bld-bar";
 bar.innerHTML=`
  <div class="bld-grp">
   <span class="bld-lbl">Tactical Spot Read:</span>
   <button type="button" class="bld-chip ${STATE.spotFlt==="all"?"on":""}" data-cs-sflt="all">All</button>
   <button type="button" class="bld-chip ${STATE.spotFlt==="confirmed"?"on":""}" data-cs-sflt="confirmed">🎯 Confirmed Spots</button>
   <button type="button" class="bld-chip ${STATE.spotFlt==="snipe"?"on":""}" data-cs-sflt="snipe">⚡ Off-Market Snipes</button>
   <button type="button" class="bld-chip ${STATE.spotFlt==="nofake"?"on":""}" data-cs-sflt="nofake">🛡️ Hide Fake-Outs</button>
   <button type="button" class="bld-chip ${STATE.spotFlt==="fakeout"?"on":""}" data-cs-sflt="fakeout">🚨 Fake-Out Traps</button>
  </div>
  <div class="bld-grp">
   <span class="bld-lbl">Stat Mode:</span>
   <button type="button" class="bld-chip ${STATE.avgMode==="avg"?"on":""}" data-cs-avg="avg">Mean (Avg)</button>
   <button type="button" class="bld-chip ${STATE.avgMode==="med"?"on":""}" data-cs-avg="med">Median</button>
  </div>
  <div class="bld-grp">
   <span class="bld-lbl">Opp DvP Window:</span>
   <button type="button" class="bld-chip ${STATE.dvpWin==="szn"?"on":""}" data-cs-dvpw="szn">Season DvP</button>
   <button type="button" class="bld-chip ${STATE.dvpWin==="l10"?"on":""}" data-cs-dvpw="l10">L10 DvP</button>
   <button type="button" class="bld-chip ${STATE.dvpWin==="l5"?"on":""}" data-cs-dvpw="l5">L5 DvP</button>
  </div>
  <div class="bld-grp">
   <span class="bld-lbl">Matchup Grade:</span>
   <button type="button" class="bld-chip ${STATE.matchFlt==="all"?"on":""}" data-cs-mflt="all">All</button>
   <button type="button" class="bld-chip ${STATE.matchFlt==="soft"?"on":""}" data-cs-mflt="soft">🟢 Soft (#1–#10)</button>
   <button type="button" class="bld-chip ${STATE.matchFlt==="top5"?"on":""}" data-cs-mflt="top5">🔥 Smash (#1–#5)</button>
   <button type="button" class="bld-chip ${STATE.matchFlt==="tough"?"on":""}" data-cs-mflt="tough">🔴 Tough</button>
  </div>
  <div class="bld-grp">
   <span class="bld-lbl">Smart Filters:</span>
   <button type="button" class="bld-chip ${STATE.bookFlt==="all"?"on":""}" data-cs-bflt="all">All</button>
   <button type="button" class="bld-chip ${STATE.bookFlt==="edge"?"on":""}" data-cs-bflt="edge">💎 +Edge vs Book</button>
   <button type="button" class="bld-chip ${STATE.bookFlt==="plus"?"on":""}" data-cs-bflt="plus">➕ Plus Money (+100)</button>
   <button type="button" class="bld-chip ${STATE.bookFlt==="usage"?"on":""}" data-cs-bflt="usage">📈 Usage/TOI Surge</button>
   <button type="button" class="bld-chip ${STATE.bookFlt==="wo"?"on":""}" data-cs-bflt="wo">🚑 Teammate Out</button>
   <button type="button" class="bld-chip ${STATE.bookFlt==="moved"?"on":""}" data-cs-bflt="moved">↕️ Line Moved</button>
   <button type="button" class="bld-chip ${STATE.onlyWatch?"star-on":""}" data-cs-watch="1">⭐ Watchlist (${wlCount})</button>
   <button type="button" class="bld-chip" data-cs-copywl="1" title="Copy saved Watchlist props as a research slip">📋 Copy Slip</button>
   <button type="button" class="bld-chip" data-cs-tour="1" title="How to read the Cheatsheet & Deep Drawer">🧭 Quick Tour</button>
  </div>
 `;
 tctl.insertAdjacentElement("afterend",bar);
}

function enhanceCheatsheetTable(){
 renderCheatsheetFilterBar();
 const sp=typeof sport!=="undefined"?sport:"nfl";
 const th=document.getElementById("th");
 if(th){
  const ouTh=th.querySelector('th[data-k="ou"]');
  if(ouTh)ouTh.innerHTML="Best &amp; Multi-Book Odds";
  const avgTh=th.querySelector('th[data-k="avg"]');
  if(avgTh)avgTh.innerHTML=(STATE.avgMode==="med"?"Median / Δ":"Szn Avg / Δ")+(sortK==="avg"?(sortD>0?" ▲":" ▼"):"");
  const dvpTh=th.querySelector('th[data-k="dvp"]');
  if(dvpTh)dvpTh.innerHTML=`Opp DvP (${STATE.dvpWin.toUpperCase()})`+(sortK==="dvp"?(sortD>0?" ▲":" ▼"):"");
 }
 document.querySelectorAll("#tb tr[data-i]").forEach(tr=>{
  if(tr.dataset.bldDone)return;
  tr.dataset.bldDone="1";
  const r=typeof rows!=="undefined"&&rows[+tr.dataset.i];if(!r)return;
  const k=`${r.aid}|${r.market}`;
  const tds=tr.querySelectorAll("td");
  // 1) Prepend ⭐ Watchlist star and append 🎯 Spot / 🚨 Fake-Out badge to Player cell
  if(tds[0]){
   const w=isWatched(sp,k);
   tds[0].insertAdjacentHTML("afterbegin",`<button type="button" class="bld-star ${w?"on":""}" data-bld-watch="${H(sp)}|${H(k)}" title="Save to Watchlist">★</button>`);
   const sb=spotBadgeCompactHtml(r,sp,false);
   if(sb)tds[0].insertAdjacentHTML("beforeend",sb);
  }
  // 2) Replace Over/Under cell with Multi-Book Odds Matrix (Book A, B, D, F, W...)
  const ouIdx=Array.from(th?th.children:[]).findIndex(c=>c.dataset.k==="ou");
  if(ouIdx>=0&&tds[ouIdx]){
   tds[ouIdx].innerHTML=multiBookCellHtml(r,sp);
  }
  // 3) Replace Matchup cell with rich DvP Rank badge showing actual rank + stat allowed + window
  const dvpIdx=Array.from(th?th.children:[]).findIndex(c=>c.dataset.k==="dvp");
  if(dvpIdx>=0&&tds[dvpIdx]){
   tds[dvpIdx].innerHTML=dvpBadgeHtml(r,sp);
  }
  // 4) Replace Avg cell with Avg or Median + Diff vs Line badge
  const avgIdx=Array.from(th?th.children:[]).findIndex(c=>c.dataset.k==="avg");
  if(avgIdx>=0&&tds[avgIdx]){
   const val=STATE.avgMode==="med"?getMedianForWindow(r,"l10"):(r.avg!=null?+r.avg.toFixed(1):(r.l10?r.l10.avg:null));
   if(val!=null){
    const diff=+(val-r.line).toFixed(1);
    tds[avgIdx].innerHTML=`<b>${val}</b> <small class="${diff>0?"up":diff<0?"dn":"mut"}">(${diff>=0?"+":""}${diff})</small>`;
   }
  }
 });
 //Also add ⭐ Watchlist button + 🎯 Spot / 🚨 Fake-Out badge to Dashboard cards
 document.querySelectorAll("#dash .it[data-k]").forEach(el=>{
  if(el.querySelector(".bld-star"))return;
  const k=el.dataset.k;
  const w=isWatched(sp,k);
  el.insertAdjacentHTML("afterbegin",`<button type="button" class="bld-star ${w?"on":""}" data-bld-watch="${H(sp)}|${H(k)}" title="Save to Watchlist">★</button>`);
  const r=(typeof DATA!=="undefined"&&DATA[sp]||[]).find(x=>`${x.aid}|${x.market}`===k);
  const nEl=el.querySelector(".n>b");
  if(r&&nEl&&!el.querySelector(".bld-spot")){
   const sb=spotBadgeCompactHtml(r,sp,false);
   if(sb)nEl.insertAdjacentHTML("afterend",sb);
  }
 });
}

// ---- Natural-Language Ask & Search Intent Parser + Decision & Game Script Brief ----
function parseAskIntent(rawQ){
 const q=String(rawQ||"").trim().toLowerCase();
 if(!q)return null;
 const isNL=/\b(script|spots?|best|snipes?|fake|traps?|injur|cascade|who|what|which|safe|highest|upset|sgp|parlay|tonight|today|over|under|how|why)\b/.test(q)||q.split(/\s+/).length>=3;
 if(!isNL)return {raw:rawQ,q,isNL:false};
 const sp=typeof sport!=="undefined"?sport:"nfl";
 const gList=(typeof GAMES!=="undefined"&&GAMES[sp])||[];
 const pool=(typeof SRC==="function"?SRC(sp):[])||[];
 const teams=[...new Set(pool.flatMap(r=>[r.team,r.oa]).filter(Boolean))];
 const matchedTeams=teams.filter(t=>new RegExp("\\b"+t.toLowerCase()+"\\b").test(q));
 const wantScript=/\b(script|how.*play|flow|pace|total|matchup)\b/.test(q);
 const wantSnipe=/\b(snipe|off-market|off market|book|value|plus money)\b/.test(q);
 const wantCascade=/\b(injur|cascade|without|out|usage|benefit|boost)\b/.test(q);
 const wantFake=/\b(fake|trap|avoid|fade|mirage|skew)\b/.test(q);
 const wantSafe=/\b(safe|highest|likely|probability|hit rate|lock|floor)\b/.test(q);
 let mktFilter=null;
 if(/\b(td|touchdown)\b/.test(q))mktFilter=/TD|Touchdown/i;
 else if(/\b(shot|sog)\b/.test(q))mktFilter=/Shot/i;
 else if(/\b(point|pts)\b/.test(q))mktFilter=/^Points$/i;
 else if(/\b(rebound|reb)\b/.test(q))mktFilter=/Rebound/i;
 else if(/\b(assist|ast)\b/.test(q))mktFilter=/Assist/i;
 else if(/\b(three|3pt|3-point)\b/.test(q))mktFilter=/3-Point/i;
 else if(/\b(pra)\b/.test(q))mktFilter=/Points, Rebounds, and Assists/i;
 else if(/\b(goal)\b/.test(q))mktFilter=/Goal/i;
 else if(/\b(rush)\b/.test(q))mktFilter=/Rushing/i;
 else if(/\b(rec|receiving)\b/.test(q))mktFilter=/Receiving|Receptions/i;
 else if(/\b(pass)\b/.test(q))mktFilter=/Passing/i;
 return {raw:rawQ,q,isNL:true,matchedTeams,wantScript,wantSnipe,wantCascade,wantFake,wantSafe,mktFilter,gList};
}

function matchesAskIntent(r,intent){
 if(!intent||!intent.isNL)return true;
 const sp=typeof sport!=="undefined"?sport:"nfl";
 if(intent.matchedTeams&&intent.matchedTeams.length){
  if(!intent.matchedTeams.includes(r.team)&&!intent.matchedTeams.includes(r.oa))return false;
 }
 if(intent.mktFilter&&!intent.mktFilter.test(r.market||""))return false;
 const sr=getSpotRead(r,sp);
 const v=sr?sr.verdict:"neutral";
 if(intent.wantFake)return v==="fakeout";
 if(intent.wantSnipe)return v==="snipe"||(sr&&sr.score>=76);
 if(intent.wantCascade)return !!(r.wo&&r.wo.n>=2)||(r.u&&((r.u.min&&r.u.min.tr>0)||(r.u.sn&&r.u.sn.tr>0)));
 if(intent.wantSafe)return (r.l10&&r.l10.n&&(r.l10.h/r.l10.n)>=0.70)&&v!=="fakeout";
 return v==="execute"||v==="snipe"||(sr&&sr.score>=68);
}

function renderAskDecisionBrief(){
 const fbar=document.getElementById("fbar");
 const qIn=document.getElementById("q");
 if(!fbar||!qIn)return;
 // Ensure Quick Prompt Strip is mounted once below #fbar
 if(!document.getElementById("bld-ask-strip")){
  const strip=document.createElement("div");
  strip.id="bld-ask-strip";
  strip.className="bar";
  strip.style.cssText="padding-top:0;padding-bottom:8px;gap:6px;align-items:center";
  strip.innerHTML=`
   <span class="bld-lbl" style="color:var(--acc,#53e3a6)">⚡ Ask / Script:</span>
   <button type="button" class="bld-chip" data-ask-pill="Best confirmed spots tonight">🎯 Best Confirmed Spots</button>
   <button type="button" class="bld-chip" data-ask-pill="What is the game script tonight?">📋 Tonight's Game Scripts</button>
   <button type="button" class="bld-chip" data-ask-pill="Best off-market book snipes">⚡ Off-Market Snipes</button>
   <button type="button" class="bld-chip" data-ask-pill="Who benefits from injury usage cascades?">🚑 Injury Usage Cascades</button>
   <button type="button" class="bld-chip" data-ask-pill="Highest probability safe floors tonight">🛡️ Highest L10 Floor</button>
   <button type="button" class="bld-chip" data-ask-pill="Which props are fake-out traps to avoid?">🚨 Fake-Out Traps</button>
   <button type="button" class="bld-chip" onclick="if(window.SL&&SL.openIntel)SL.openIntel();else if(document.getElementById('qsearch-btn'))document.getElementById('qsearch-btn').click()" style="margin-left:auto;border-color:var(--acc2,#3fa9ff);color:var(--acc2,#3fa9ff)">⌘K Full Slate Command Bar</button>
  `;
  fbar.insertAdjacentElement("afterend",strip);
 }
 let box=document.getElementById("bld-ask-brief");
 const rawQ=qIn.value.trim();
 if(!rawQ){
  if(box)box.remove();
  return;
 }
 if(!box){
  box=document.createElement("div");
  box.id="bld-ask-brief";
  box.style.cssText="margin:0 20px 12px;padding:12px 14px;background:linear-gradient(135deg,rgba(16,44,36,.52),var(--panel,#121826) 80%);border:1px solid rgba(83,227,166,.45);border-radius:12px";
  const strip=document.getElementById("bld-ask-strip")||fbar;
  strip.insertAdjacentElement("afterend",box);
 }
 const sp=typeof sport!=="undefined"?sport:"nfl";
 const intent=parseAskIntent(rawQ);
 const gList=(typeof GAMES!=="undefined"&&GAMES[sp])||[];
 const matchedGames=intent&&intent.matchedTeams&&intent.matchedTeams.length
  ?gList.filter(g=>intent.matchedTeams.includes(g.home)||intent.matchedTeams.includes(g.away))
  :gList.filter(g=>g.game_script&&(rawQ.toLowerCase().includes((g.home||"").toLowerCase())||rawQ.toLowerCase().includes((g.away||"").toLowerCase())));
 const scriptsToShow=(matchedGames.length?matchedGames:((intent&&intent.wantScript)?gList.slice(0,3):[])).map(g=>g.game_script).filter(Boolean).slice(0,3);

 const topProps=(typeof rows!=="undefined"?rows:[]).slice().sort((a,b)=>{
  const sa=getSpotRead(a,sp),sb=getSpotRead(b,sp);
  return (sb?sb.score:50)-(sa?sa.score:50);
 }).slice(0,4);

 box.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
   <div>
    <span style="font:800 11px/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#53e3a6">📋 Sports Labs Decision &amp; Game Script Intelligence</span>
    <div style="font:800 15px/1.3 system-ui,sans-serif;margin-top:2px">Query: “${H(rawQ)}” · <span class="mut" style="font-size:12px;font-weight:600">${(typeof rows!=="undefined"?rows.length:0)} matching ${sp.toUpperCase()} plays</span></div>
   </div>
   <button type="button" class="bld-chip" onclick="document.getElementById('q').value='';document.getElementById('q').dispatchEvent(new Event('input',{bubbles:true}));if(typeof render==='function')render()">✕ Clear Query</button>
  </div>
  ${scriptsToShow.length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px;margin-bottom:8px">
   ${scriptsToShow.map(gs=>`<div style="background:rgba(11,15,23,.75);border:1px solid rgba(56,189,248,.35);border-radius:9px;padding:9px 11px;font-size:11.5px">
    <div style="font-weight:800;color:#38bdf8;margin-bottom:3px">📋 ${H(gs.headline||gs.matchup)}</div>
    <div class="mut" style="margin-bottom:4px">${H(gs.pace_tempo||"")}</div>
    ${(gs.flow||[]).map(f=>`<div style="padding:1.5px 0"><b>${H(f.phase)}:</b> ${H(f.text)}</div>`).join("")}
    <div style="margin-top:4px;padding-top:4px;border-top:1px dashed rgba(255,255,255,.1);color:#53e3a6"><b>🎯 Script Verdict:</b> ${H(gs.verdict||"")}</div>
   </div>`).join("")}
  </div>`:""}
  ${topProps.length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:8px">
   ${topProps.map(r=>{
    const sr=getSpotRead(r,sp);
    const th=r.execution_thesis||{};
    const q=typeof ppLeg==="function"?ppLeg(r,sp):null;
    const px=q&&q.best!=null?q.best:r.ov;
    const bk=q&&q.book?q.book:"Book A";
    return `<div style="background:rgba(11,15,23,.72);border:1px solid var(--line,#243049);border-radius:9px;padding:8px 10px;cursor:pointer" data-ask-prop="${H(r.aid)}|${H(r.market)}">
     <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
      <b>${H(r.player)} <span class="mut" style="font-weight:500">(${H(r.team)} vs ${H(r.oa)})</span></b>
      ${spotBadgeCompactHtml(r,sp,true)}
     </div>
     <div style="font-size:12px;margin-top:3px"><b>${H(r.market)} o${r.line}</b> · <span class="up">${px!=null?(px>0?"+"+px:px):"—"} (${H(bk)})</span> · L10: <b>${r.l10?r.l10.h+"/"+r.l10.n:"—"}</b></div>
     <div class="mut" style="font-size:11px;margin-top:3px;line-height:1.35">${H(th.why_edge||(sr&&sr.reasons&&sr.reasons[0])||"")}</div>
    </div>`;
   }).join("")}
  </div>`:""}
 `;
}

// Hook filtered() so Cheatsheet filters & Natural-Language Ask Queries apply cleanly
function hookFiltered(){
 if(typeof window.filtered!=="function"||window.filtered.__bld)return;
 const orig=window.filtered;
 window.filtered=function(){
  const qEl=document.getElementById("q");
  const rawQ=qEl?qEl.value:"";
  const intent=parseAskIntent(rawQ);
  let base;
  if(intent&&intent.isNL&&qEl){
   qEl.value="";
   try{base=orig.apply(this,arguments)}finally{qEl.value=rawQ}
   base=base.filter(r=>matchesAskIntent(r,intent));
  }else{
   base=orig.apply(this,arguments);
  }
  return base.filter(passesDeepFilters);
 };
 window.filtered.__bld=1;
}

document.addEventListener("click",e=>{
 const wBtn=e.target.closest("[data-bld-watch]");
 if(wBtn){
  e.stopPropagation();
  const [s,k1,k2]=wBtn.dataset.bldWatch.split("|");
  toggleWatch(s,`${k1}|${k2}`);
  return;
 }
 const tBtn=e.target.closest("[data-bld-trk]");
 if(tBtn){
  e.stopPropagation();
  const [s,k1,k2]=tBtn.dataset.bldTrk.split("|");
  const r=(typeof DATA!=="undefined"&&DATA[s]||[]).find(x=>`${x.aid}|${x.market}`===`${k1}|${k2}`);
  if(r){
   quickTrackProp(r,s);
   tBtn.classList.add("done");
   tBtn.textContent="✓ Tracked in My Bets";
  }
  return;
 }
 const avgC=e.target.closest("[data-cs-avg]");
 if(avgC){e.stopPropagation();STATE.avgMode=avgC.dataset.csAvg;const b=document.getElementById("bld-cs-bar");if(b)b.remove();if(typeof render==="function")render();return}
 const dvpC=e.target.closest("[data-cs-dvpw]");
 if(dvpC){e.stopPropagation();STATE.dvpWin=dvpC.dataset.csDvpw;const b=document.getElementById("bld-cs-bar");if(b)b.remove();if(typeof render==="function")render();return}
 const sfC=e.target.closest("[data-cs-sflt]");
 if(sfC){e.stopPropagation();STATE.spotFlt=sfC.dataset.csSflt;const b=document.getElementById("bld-cs-bar");if(b)b.remove();if(typeof render==="function")render();return}
 const mfC=e.target.closest("[data-cs-mflt]");
 if(mfC){e.stopPropagation();STATE.matchFlt=mfC.dataset.csMflt;const b=document.getElementById("bld-cs-bar");if(b)b.remove();if(typeof render==="function")render();return}
 const bfC=e.target.closest("[data-cs-bflt]");
 if(bfC){e.stopPropagation();STATE.bookFlt=bfC.dataset.csBflt;const b=document.getElementById("bld-cs-bar");if(b)b.remove();if(typeof render==="function")render();return}
 const cpC=e.target.closest("[data-cs-copywl]");if(cpC){e.stopPropagation();copyWatchlistSlip();return}
 const trC=e.target.closest("[data-cs-tour]");if(trC){e.stopPropagation();showQuickTour();return}
 const askPill=e.target.closest("[data-ask-pill]");
 if(askPill){
  e.stopPropagation();
  const qIn=document.getElementById("q");
  if(qIn){qIn.value=askPill.dataset.askPill;if(typeof render==="function")render();renderAskDecisionBrief()}
  return;
 }
 const askProp=e.target.closest("[data-ask-prop]");
 if(askProp){
  e.stopPropagation();
  const [aid,mkt]=askProp.dataset.askProp.split("|");
  const sp=typeof sport!=="undefined"?sport:"nfl";
  const r=(typeof DATA!=="undefined"&&DATA[sp]||[]).find(x=>String(x.aid)===String(aid)&&x.market===mkt);
  if(r&&typeof drawer==="function")drawer(r);
  return;
 }
 const wtC=e.target.closest("[data-cs-watch]");
 if(wtC){e.stopPropagation();STATE.onlyWatch=!STATE.onlyWatch;const b=document.getElementById("bld-cs-bar");if(b)b.remove();updateWatchFloat();if(typeof render==="function")render();return}
},true);

function runAll(){
 patchSpanChart();
 renderAskDecisionBrief();
 hookFiltered();
 updateWatchFloat();
 mountDrawerDeep();
 enhanceCheatsheetTable();
}

const obs=new MutationObserver(()=>{clearTimeout(window._bldT);window._bldT=setTimeout(runAll,25)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{runAll();obs.observe(document.body,{childList:true,subtree:true})});
else{runAll();obs.observe(document.body,{childList:true,subtree:true})}

window.BLDeep={STATE,runAll,getOppWindowRank,calcMedian,getSpotRead};
})();
