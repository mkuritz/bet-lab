/* Bet Lab Pro Analytics & Interactive Suite (additive enhancer: preserves existing Bet Lab look & colors).
   1. Sticky Horizontal Game Ribbon below #tabs (with live scores from live_stats.json).
   2. Inline Tap-to-Cycle Split Pills (L5 | L10 | L20 | H/A | vs Opp | w/o Injured Starter) + Mini Game-Log Bar Chart + No-Vig Break-Even % Badge on Prop Cards.
   3. Inline Clickable Milestone Rung Switcher (NBinom fair odds vs book-letter odds + +EV Rung badge).
   4. Inline SVG Line-Movement Sparkline & 🔥 Steam Badge (prop cards + All Props table + Drawer).
   5. Props.Cash-Beating Interactive Player Drawer Lab:
      - Multi-Select Stackable Split Chips (🏠 Home, ✈️ Away, 🚑 w/o Injured Starter, ⏱️ High Min/TOI Floor, 🔋 2+ Days Rest, ⚡ B2B, ⚔️ vs Opp)
      - Interactive Alt-Line Slider / Stepper (- / range slider / +) that dynamically re-colors the game-log bar chart, recalculates Stacked Split Hit Rate & Average, and computes real-time Negative-Binomial / Normal Fair Odds & EV vs Book
      - Visual No-Vig Break-Even Threshold Gauge (Historical/Stacked Hit Rate % vs Book Fair Break-Even % + Edge in pts)
   6. Floating 🔍 / Cmd+K Instant Cross-Sport Player Search Modal.
   7. Persistent Bottom Parlay / SGP Slip Tray (with Gaussian Copula SGP Correlation Boost / Cannibalization Warning & Weakest Leg Trimmer).
   8. 1-Tap Shareable HTML5 <canvas> Tail Card PNG Generator (single prop or multi-leg slip; 0 forbidden book/source names). */
(function(){
if(window.BLPro)return;

const css=`
#grib{display:flex;gap:6px;overflow-x:auto;padding:4px 20px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
#grib::-webkit-scrollbar{display:none}
#grib button{background:var(--panel2,#182033);border:1px solid var(--line,#26304f);color:var(--mut,#8b97b0);padding:5px 10px;border-radius:99px;font:700 11.5px/1.2 system-ui,sans-serif;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;flex-shrink:0}
#grib button.on{border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6);background:rgba(83,227,166,.1)}
#grib .glv{color:#facc15;font-weight:800}
.p-sub{margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.p-pills,.p-rungs{display:inline-flex;flex-wrap:wrap;gap:3px;align-items:center}
.p-pill,.p-rung{background:var(--panel2,#182033);border:1px solid var(--line,#26304f);color:var(--mut,#8b97b0);border-radius:5px;padding:1px 5px;font:700 10px/1.3 system-ui,sans-serif;cursor:pointer}
.p-pill.on,.p-rung.on{border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6);background:rgba(83,227,166,.12)}
.p-pill.wo{border-color:#f59e0b66;color:#fbbf24}
.p-pill.wo.on{background:#f59e0b22;border-color:#fbbf24}
.p-rung.ev{border-color:#4ade8088;color:#4ade80}
.p-mbars{display:inline-flex;gap:2px;align-items:flex-end;height:14px;vertical-align:middle;margin-left:4px;padding:1px 3px;background:rgba(255,255,255,.03);border-radius:3px}
.p-mbars i{display:inline-block;width:3.5px;border-radius:1px}
.p-spk{display:inline-flex;align-items:center;gap:3px;font:700 10.5px/1 system-ui,sans-serif;margin-left:4px;vertical-align:middle}
.p-steam{display:inline-block;background:#ef444422;color:#f87171;border:1px solid #ef444466;border-radius:4px;padding:0 4px;font:800 9.5px/1.3 system-ui,sans-serif;margin-left:3px}
.p-ttl{display:inline-block;border-radius:4px;padding:0 5px;font:700 9.5px/1.35 system-ui,sans-serif;margin-left:4px;border:1px solid var(--line,#26304f);color:var(--mut)}
.p-ttl.high{border-color:#53e3a655;color:#53e3a6;background:rgba(83,227,166,.08)}
.p-ttl.med{border-color:#38bdf855;color:#38bdf8}
.p-be{display:inline-block;border-radius:4px;padding:0 5px;font:700 9.5px/1.35 system-ui,sans-serif;margin-left:4px;background:rgba(56,189,248,.1);color:#38bdf8;border:1px solid rgba(56,189,248,.3)}
.p-be.pos{background:rgba(74,222,128,.12);color:#4ade80;border-color:rgba(74,222,128,.35)}
.p-tailbtn{background:none;border:1px solid var(--line,#26304f);color:var(--mut,#8b97b0);border-radius:6px;padding:2px 6px;font:700 10.5px/1.2 system-ui,sans-serif;cursor:pointer;margin-left:4px}
.p-tailbtn:hover{border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6)}
#drw-lab{margin:12px 0;padding:11px 12px;background:var(--panel2,#182033);border:1px solid var(--line,#26304f);border-radius:11px}
#drw-lab .dl-hd{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
#drw-lab .dl-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
#drw-lab .dl-chip{background:var(--panel,#121829);border:1px solid var(--line,#26304f);color:var(--mut,#8b97b0);border-radius:99px;padding:4px 9px;font:700 11px/1.2 system-ui,sans-serif;cursor:pointer;transition:.12s}
#drw-lab .dl-chip.on{border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6);background:rgba(83,227,166,.14)}
#drw-lab .dl-chip.wo{border-color:#f59e0b66;color:#fbbf24}
#drw-lab .dl-chip.wo.on{background:#f59e0b28;border-color:#fbbf24;color:#fde68a}
#drw-lab .dl-sld{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 10px;background:rgba(0,0,0,.22);border-radius:8px;margin-bottom:9px;font-size:12px}
#drw-lab .dl-sld input[type=range]{flex:1;min-width:110px;accent-color:var(--acc,#53e3a6);cursor:pointer}
#drw-lab .dl-step{background:var(--panel,#121829);border:1px solid var(--line,#26304f);color:var(--txt);border-radius:6px;width:26px;height:26px;font-weight:800;cursor:pointer}
#drw-lab .dl-be{position:relative;height:20px;background:rgba(255,255,255,.06);border-radius:6px;overflow:hidden;margin-top:6px}
#drw-lab .dl-be-fill{height:100%;transition:width .2s;border-radius:6px}
#drw-lab .dl-be-mark{position:absolute;top:0;bottom:0;width:2px;background:#facc15;z-index:2;box-shadow:0 0 6px #facc15}
#drw-lab .dl-be-lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 8px;font:800 10.5px/1 system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.85);z-index:3}
#qsearch-btn{position:fixed;right:18px;bottom:68px;z-index:90;background:var(--panel2,#182033);border:1px solid var(--acc,#53e3a6);color:var(--txt,#e8eefc);border-radius:99px;padding:8px 13px;font:800 12.5px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.45);display:flex;align-items:center;gap:6px}
#qsearch-mod{position:fixed;inset:0;z-index:9998;background:rgba(8,12,22,.82);backdrop-filter:blur(4px);display:none;align-items:flex-start;justify-content:center;padding:56px 14px 20px}
#qsearch-mod.open{display:flex}
#qsearch-box{width:100%;max-width:560px;background:var(--panel,#121829);border:1px solid var(--line,#26304f);border-radius:14px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.6)}
#qsearch-in{width:100%;box-sizing:border-box;background:var(--panel2,#182033);border:0;border-bottom:1px solid var(--line,#26304f);color:var(--txt,#e8eefc);padding:13px 16px;font:600 15px/1.3 system-ui,sans-serif;outline:none}
#qsearch-res{max-height:62vh;overflow-y:auto;padding:6px 0}
.qs-row{padding:8px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px}
.qs-row:hover{background:rgba(83,227,166,.08)}
#ptray{position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:95;background:linear-gradient(135deg,#11192d,#18233c);border:1px solid var(--acc,#53e3a6);color:var(--txt,#e8eefc);border-radius:14px;padding:8px 14px;box-shadow:0 10px 32px rgba(0,0,0,.65);display:none;align-items:center;gap:10px;max-width:calc(100vw - 24px);flex-wrap:wrap;font-size:12.5px}
#ptray.show{display:flex}
#ptray .pt-pill{background:rgba(83,227,166,.14);color:var(--acc,#53e3a6);border-radius:6px;padding:2px 7px;font-weight:800;font-size:11.5px}
#ptray .pt-corr.pos{background:rgba(74,222,128,.16);color:#4ade80;border:1px solid #4ade8055;border-radius:6px;padding:2px 6px;font-weight:700;font-size:11px}
#ptray .pt-corr.neg{background:rgba(248,113,113,.16);color:#f87171;border:1px solid #f8717155;border-radius:6px;padding:2px 6px;font-weight:700;font-size:11px}
#ptray button{background:var(--acc,#53e3a6);color:#052010;border:0;border-radius:8px;padding:5px 10px;font:800 12px/1.2 system-ui,sans-serif;cursor:pointer}
#ptray button.sec{background:var(--panel2,#182033);color:var(--txt,#e8eefc);border:1px solid var(--line,#26304f)}
#tail-mod{position:fixed;inset:0;z-index:9999;background:rgba(8,12,22,.85);display:none;align-items:center;justify-content:center;padding:16px}
#tail-mod.open{display:flex}
#tail-box{background:var(--panel,#121829);border:1px solid var(--line,#26304f);border-radius:14px;padding:14px;max-width:660px;width:100%;text-align:center}
#tail-box canvas{max-width:100%;height:auto;border-radius:10px;border:1px solid #26304f}
.dl-curve-wrap{margin-top:8px;padding:8px 10px;border-radius:8px;background:rgba(8,12,24,.75);border:1px solid rgba(83,227,166,.22)}
.dl-curve-hd{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--mut,#8b97b0);margin-bottom:4px;flex-wrap:wrap;gap:4px}
.dl-curve-hd b{color:var(--txt,#e8eefc);font-weight:800}
#sgp-mat-mod{position:fixed;inset:0;z-index:9998;background:rgba(8,12,22,.86);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:16px}
#sgp-mat-mod.open{display:flex}
.sgp-mat-card{background:var(--panel,#121829);border:1px solid var(--line,#26304f);border-radius:14px;max-width:780px;width:100%;max-height:88vh;overflow:auto;padding:16px 18px;box-shadow:0 24px 60px rgba(0,0,0,.65);color:var(--txt,#e8eefc)}
.sgp-mat-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.sgp-mat-tbl{width:100%;border-collapse:separate;border-spacing:4px;font-size:11px;margin-top:8px}
.sgp-mat-tbl th{font-size:10px;color:var(--mut,#8b97b0);font-weight:700;padding:4px 6px;text-align:center;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sgp-mat-tbl th.row-h{text-align:right;max-width:145px;color:var(--txt,#e8eefc)}
.sgp-mat-cell{border-radius:6px;padding:7px 4px;text-align:center;font-weight:800;font-variant-numeric:tabular-nums;cursor:pointer;transition:transform .1s,border-color .1s;border:1px solid rgba(148,163,184,.16);user-select:none}
.sgp-mat-cell:hover{transform:scale(1.05);border-color:#53e3a6}
.sgp-mat-cell.diag{background:rgba(24,32,51,.55);color:#64748b;cursor:default}
.sgp-mat-cell.diag:hover{transform:none;border-color:rgba(148,163,184,.16)}
.sgp-mat-cell small{display:block;font-size:9px;font-weight:600;opacity:.85;margin-top:1px}
#drw-lab .dl-kelly{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.14);border:1px solid rgba(74,222,128,.4);color:#4ade80;border-radius:8px;padding:3px 9px;font:800 11.5px/1.25 system-ui,sans-serif;cursor:pointer}
#drw-lab .dl-kelly:hover,#ptray .pt-kelly:hover{background:rgba(16,185,129,.24);border-color:#4ade80}
#ptray .pt-kelly{display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,.16);border:1px solid rgba(74,222,128,.45);color:#4ade80;border-radius:7px;padding:3px 8px;font:800 11.5px/1.2 system-ui,sans-serif;cursor:pointer}
#sl-kpop{position:fixed;right:18px;bottom:64px;z-index:9997;background:var(--panel,#121829);border:1px solid var(--acc,#53e3a6);border-radius:12px;padding:12px 14px;box-shadow:0 16px 42px rgba(0,0,0,.7);color:var(--txt,#e8eefc);font-size:12px;display:none;min-width:255px}
#sl-kpop.open{display:block}
.sgp-opt-banner{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;margin:8px 0 10px;background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(56,189,248,.12));border:1px solid rgba(83,227,166,.45);border-radius:10px;font-size:12px}
.sgp-opt-btn{background:var(--acc,#53e3a6);color:#042012;border:0;border-radius:8px;padding:6px 12px;font:800 12px/1.2 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.sgp-opt-btn:hover{filter:brightness(1.08)}
#drawer .chart .b{cursor:pointer}
#drawer .chart .b:hover{outline:1.5px solid #facc15;filter:brightness(1.15)!important}
@media(max-width:640px){#qsearch-btn{bottom:64px;right:12px;padding:7px 11px;font-size:11.5px}#ptray{bottom:8px;padding:7px 10px;gap:6px}}
`;
const stEl=document.createElement("style");stEl.textContent=css;document.head.appendChild(stEl);

const H=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let CORR={templates:{},pairs:{}},PIDX=null;
fetch("data/correlations.json?v="+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d)CORR=d;if(typeof SLIP!=="undefined"&&SLIP.length)updateTray()}).catch(()=>{});

// ---- Shared Bankroll & Fractional Kelly State (synced across Bet Lab, Arb Lab, CFB Desk) ----
function getBankroll(){
 try{
  const v=parseFloat(localStorage.getItem("sl_bankroll")||localStorage.getItem("arb.bankroll")||"1000");
  return v>0?v:1000;
 }catch(e){return 1000}
}
function getKellyMult(){
 try{
  const raw=localStorage.getItem("sl_kelly")||localStorage.getItem("arb.kelly")||"0.25";
  const v=parseFloat(String(raw).replace(/"/g,""));
  return [0.25,0.5,1,1.0].includes(v)?v:0.25;
 }catch(e){return 0.25}
}
function setBankrollKelly(bk,km){
 try{
  if(bk!=null&&bk>0){
   localStorage.setItem("sl_bankroll",String(bk));
   localStorage.setItem("arb.bankroll",JSON.stringify(+bk));
  }
  if(km!=null&&km>0){
   localStorage.setItem("sl_kelly",String(km));
   localStorage.setItem("arb.kelly",JSON.stringify(+km));
  }
  const cfb=JSON.parse(localStorage.getItem("sl_cfb_kelly")||"{}");
  localStorage.setItem("sl_cfb_kelly",JSON.stringify({bk:bk||getBankroll(),m:km||getKellyMult()}));
 }catch(e){}
}
function calcKellyDollar(pTrue,pBe,amOdds,maxCapPct){
 if(!(pTrue>pBe))return null;
 const bk=getBankroll(),km=getKellyMult();
 const bDec=amOdds!=null?(amOdds>0?amOdds/100:100/Math.max(10,-amOdds)):((1-pBe)/Math.max(0.02,pBe));
 const q=1-pTrue;
 let f=(pTrue*bDec-q)/Math.max(0.05,bDec);
 if(!(f>0))f=Math.max(0.005,(pTrue-pBe)*1.25);
 const cap=maxCapPct||(km>=1?0.05:km>=0.5?0.035:0.025);
 const stake=Math.max(1,Math.round(bk*Math.min(cap,f*km)));
 return {stake,bk,km,fPct:Math.round(Math.min(cap,f*km)*1000)/10};
}
function openKellyPopover(){
 let pop=document.getElementById("sl-kpop");
 if(!pop){
  pop=document.createElement("div");pop.id="sl-kpop";
  document.body.appendChild(pop);
 }
 const bk=getBankroll(),km=getKellyMult();
 pop.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="color:var(--acc,#53e3a6)">💰 Bankroll &amp; Kelly Sizing</b><button type="button" id="sl-kpop-x" style="background:none;border:0;color:var(--txt);cursor:pointer;font-size:15px">✕</button></div>
  <label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px"><span>Bankroll ($):</span><input type="number" id="sl-kbk-in" min="50" step="50" value="${bk}" style="width:95px;background:var(--panel2,#182033);border:1px solid var(--line,#26304f);color:var(--txt,#e8eefc);border-radius:6px;padding:4px 7px;font-weight:800"></label>
  <div style="display:flex;gap:5px;margin-bottom:6px">${[0.25,0.5,1.0].map(m=>`<button type="button" data-slkm="${m}" style="flex:1;padding:5px 6px;border-radius:6px;border:1px solid ${Math.abs(km-m)<0.01?"var(--acc,#53e3a6)":"var(--line,#26304f)"};background:${Math.abs(km-m)<0.01?"rgba(83,227,166,.16)":"var(--panel2,#182033)"};color:${Math.abs(km-m)<0.01?"var(--acc,#53e3a6)":"var(--txt,#e8eefc)"};font:800 11px system-ui;cursor:pointer">${m.toFixed(2).replace(/0$/,"")}x Kelly</button>`).join("")}</div>
  <div class="mut" style="font-size:10.5px">Synced across Bet Lab, Arb Lab &amp; CFB Desk</div>`;
 pop.classList.add("open");
 document.getElementById("sl-kpop-x").onclick=e=>{e.stopPropagation();pop.classList.remove("open")};
 const inp=document.getElementById("sl-kbk-in");
 inp.onchange=()=>{
  setBankrollKelly(Math.max(10,+inp.value||1000),getKellyMult());
  const d=document.getElementById("drw-lab");if(d){d.remove();mountDrawerLab()}
  updateTray();
 };
 pop.querySelectorAll("[data-slkm]").forEach(b=>b.onclick=e=>{
  e.stopPropagation();
  setBankrollKelly(Math.max(10,+inp.value||1000),+b.dataset.slkm);
  openKellyPopover();
  const d=document.getElementById("drw-lab");if(d){d.remove();mountDrawerLab()}
  updateTray();
 });
}


// ---- Helper: No-Vig Implied Break-Even Probability for a Prop ----
function breakEvenInfo(r,sp){
 const s=sp||(typeof sport!=="undefined"?sport:"nfl");
 const q=typeof ppLeg==="function"?ppLeg(r,s):null;
 if(q&&q.nv!=null)return {be:q.nv,px:q.best,bk:q.book||"Book A",src:"no-vig"};
 if(r.ov!=null){
  const o=+r.ov,raw=o>0?100/(o+100):-o/(-o+100);
  return {be:Math.min(0.95,raw/1.045),px:o,bk:"Book A",src:"est no-vig"};
 }
 return null;
}

// ---- Helper: Client-side NBinom / Normal Tail Probability for Arbitrary Alt Lines ----
const CONT_MKTS=new Set(["Passing Yards","Rushing Yards","Receiving Yards","Rushing Plus Receiving Yards","Passing Plus Rushing Yards"]);
function lgamma(z){
 const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.001208650973866179,-0.000005395239384953];
 let x=z,y=z,tmp=x+5.5;tmp-=(x+0.5)*Math.log(tmp);
 let ser=1.000000000190015;
 for(let i=0;i<6;i++)ser+=c[i]/++y;
 return -tmp+Math.log(2.5066282746310005*ser/x);
}
function calcAltTailProb(r,games,lineVal){
 const vs=(games||r.games||[]).map(g=>g.v).filter(v=>v!=null);
 if(!vs.length)return null;
 const n=vs.length,rec=vs.slice(0,10);
 const mRec=rec.reduce((a,b)=>a+b,0)/rec.length,mAll=vs.reduce((a,b)=>a+b,0)/n;
 const mean=0.65*mRec+0.35*mAll;
 const variance=n>1?vs.reduce((a,b)=>a+(b-mAll)**2,0)/(n-1):mean*1.25;
 const kMin=Math.floor(lineVal)+1;
 let pMod=0.5;
 if(CONT_MKTS.has(r.market)){
  const sd=Math.max(1.0,Math.sqrt(Math.max(1.0,variance)));
  const z=(lineVal+0.5-mean)/sd;
  const t=1/(1+0.2316419*Math.abs(z)),d=0.3989423*Math.exp(-z*z/2);
  const p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  pMod=z>0?p:1-p;
 }else if(kMin<=0){pMod=0.99}
 else if(mean<=0){pMod=0.01}
 else if(variance<=mean*1.05){
  let cdf=0,lm=Math.log(mean);
  for(let x=0;x<kMin;x++)cdf+=Math.exp(-mean+x*lm-lgamma(x+1));
  pMod=1-cdf;
 }else{
  const rr=Math.max(0.35,(mean*mean)/(variance-mean)),pp=rr/(rr+mean);
  const lp=Math.log(pp),l1p=Math.log(1-pp);
  let cdf=0;
  for(let x=0;x<kMin;x++)cdf+=Math.exp(lgamma(x+rr)-lgamma(rr)-lgamma(x+1)+rr*lp+x*l1p);
  pMod=1-cdf;
 }
 pMod=Math.max(0.005,Math.min(0.99,pMod));
 const empH=vs.filter(v=>v>lineVal).length;
 return Math.max(0.005,Math.min(0.99,0.55*pMod+0.45*((empH+1.5*pMod)/(n+1.5))));
}

// ---- 1. Inline SVG Line-Movement Sparkline & Steam Badge ----
function sparkSvg(r){
 const lh=(r.lh||[]).filter(x=>x&&x[1]!=null);
 const pts=lh.map(x=>+x[1]);
 if(r.open!=null&&(pts.length===0||pts[0]!==+r.open))pts.unshift(+r.open);
 if(pts.length<2)return"";
 const d=+(pts[pts.length-1]-pts[0]).toFixed(2);
 if(Math.abs(d)<0.01)return"";
 const mn=Math.min(...pts),mx=Math.max(...pts),rng=Math.max(0.5,mx-mn);
 const w=38,h=12,coords=pts.map((v,i)=>`${Math.round(i/(pts.length-1)*(w-4)+2)},${Math.round(h-2-((v-mn)/rng)*(h-4))}`).join(" ");
 const col=d>0?"#4ade80":"#f87171";
 const steam=Math.abs(d)>=1.5||(r.line>0&&Math.abs(d)/r.line>=0.12)?`<span class="p-steam" title="Sharp multi-step line move">🔥 Steam</span>`:"";
 return `<span class="p-spk" style="color:${col}" title="Line move: ${pts[0]} → ${pts[pts.length-1]} (${d>0?"+":""}${d})"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="${col}" stroke-width="1.6" points="${coords}"/><circle cx="${w-2}" cy="${Math.round(h-2-((pts[pts.length-1]-mn)/rng)*(h-4))}" r="1.8" fill="${col}"/></svg>${pts[0]}→${pts[pts.length-1]}</span>${steam}`;
}

// ---- 2. Mini Game-Log Bars & Split Switcher ----
function miniBarsHtml(r,mode,targetLine){
 const gs=(r.games||[]);if(!gs.length)return"";
 const ln=targetLine!=null?+targetLine:+r.line;
 let sub=gs.slice(0,10);
 if(mode==="l5")sub=gs.slice(0,5);
 else if(mode==="l20")sub=gs.slice(0,15);
 else if(mode==="ven")sub=gs.filter(q=>r.home?q.at!=="@":q.at==="@").slice(0,10);
 else if(mode==="h2h")sub=gs.filter(q=>q.o===r.oa).slice(0,10);
 else if(mode==="wo"&&r.wo){if(r.wo.wo_e&&r.wo.wo_e.length){const s=new Set(r.wo.wo_e);sub=gs.filter(q=>s.has(q.e)).slice(0,10)}else sub=gs.slice(0,r.wo.n)}
 sub=sub.slice().reverse();
 if(!sub.length)return"";
 const mx=Math.max(ln*1.3,...sub.map(x=>x.v),1);
 return `<span class="p-mbars" title="Recent game log vs ${ln} (oldest → newest)">${sub.map(x=>{const hit=targetLine!=null?x.v>=ln:x.v>ln,ht=Math.max(3,Math.round((x.v/mx)*13));return `<i style="height:${ht}px;background:${hit?"#4ade80":"#f87171"}" title="${x.d} ${x.at}${x.o}: ${x.v}"></i>`}).join("")}</span>`;
}

function splitSummary(r,mode){
 if(mode==="wo"&&r.wo)return {h:r.wo.h,n:r.wo.n,avg:r.wo.avg,lbl:`w/o ${r.wo.tm_out.split(" ").pop()}`};
 const map={l5:[r.l5,"L5"],l10:[r.l10,"L10"],l20:[r.l20,"L20"],ven:[r.ven,r.home?"Home":"Away"],h2h:[r.h2h,"vs "+r.oa]};
 const [o,lbl]=map[mode]||[r.l10,"L10"];
 return o&&o.n?{h:o.h,n:o.n,avg:o.avg,lbl}:null;
}

function cardEnhancements(r){
 const k=`${r.aid}|${r.market}`;
 const pills=[["l5","L5",r.l5],["l10","L10",r.l10],["l20","L20",r.l20],["ven",r.home?"Home":"Away",r.ven],["h2h","vs "+(r.oa||"Opp"),r.h2h]].filter(x=>x[2]&&x[2].n>0);
 const woBtn=r.wo&&r.wo.n>=2?`<button type="button" class="p-pill wo" data-psplit="wo" data-pk="${H(k)}" title="Without ${H(r.wo.tm_out)} (${H(r.wo.status)}): ${r.wo.h}/${r.wo.n} over, avg ${r.wo.avg} (${r.wo.delta>=0?"+":""}${r.wo.delta} vs with)">🚑 w/o ${H(r.wo.tm_out.split(" ").pop())} ${Math.round(r.wo.h/r.wo.n*100)}%</button>`:"";
 const pillHtml=pills.length>1?`<span class="p-pills">${pills.map(([m,l])=>`<button type="button" class="p-pill ${m===(typeof win!=="undefined"?win:"l10")?"on":""}" data-psplit="${m}" data-pk="${H(k)}">${H(l)}</button>`).join("")}${woBtn}</span>`:woBtn;

 let rungHtml="";
 if(r.ladder&&r.ladder.length>=2){
  rungHtml=`<span class="p-rungs">${r.ladder.slice(0,4).map(rg=>{
   const [tk,px,bk,pf,fam,ev]=rg;
   const isEv=ev!=null&&ev>=2.0;
   const pxStr=px!=null?(px>0?"+"+px:px):"";
   const tip=`${tk}+ ${r.market}: NBinom fair ${pf?Math.round(pf*100)+"% ("+(fam>0?"+"+fam:fam)+")":"—"}${px!=null?" · "+(bk||"Book A")+" "+pxStr:""}${ev!=null?" · EV "+(ev>0?"+":"")+ev+"%":""}`;
   return `<button type="button" class="p-rung ${isEv?"ev":""}" data-prung="${tk}" data-pk="${H(k)}" title="${H(tip)}">${tk}+${pxStr?" "+pxStr:""}${isEv?" ★+EV":""}</button>`;
  }).join("")}</span>`;
 }
 const beInfo=breakEvenInfo(r);
 let beHtml="";
 if(beInfo&&r.l10&&r.l10.n){
  const hr=r.l10.h/r.l10.n,diff=Math.round((hr-beInfo.be)*1000)/10;
  beHtml=`<span class="p-be ${diff>=5?"pos":""}" title="L10 Hit Rate ${Math.round(hr*100)}% vs ${beInfo.bk} No-Vig Break-Even ${(beInfo.be*100).toFixed(1)}%">BE ${(beInfo.be*100).toFixed(0)}%${diff>=2?` (+${diff.toFixed(0)}%)`:""}</span>`;
 }
 const ttlHtml=r.ttl?`<span class="p-ttl ${r.ttl.c}" title="Market liquidity / time-to-lock confidence">${H(r.ttl.lbl)}</span>`:"";
 const spk=sparkSvg(r);
 const mb=miniBarsHtml(r,typeof win!=="undefined"?win:"l10",null);
 const tailBtn=`<button type="button" class="p-tailbtn" data-ptail="${H(k)}" title="Share PNG Tail Card">📸 Card</button>`;
 return `<div class="p-sub" data-psub="${H(k)}">${pillHtml}${mb}${beHtml}${spk}${ttlHtml}${tailBtn}${rungHtml?`<div style="width:100%;margin-top:2px">${rungHtml}</div>`:""}</div>`;
}

// ---- 5. Props.Cash-Beating Interactive Player Drawer Lab (Stackable Split Chips + Alt-Line Slider + Break-Even Bar) ----
function annotateRestDays(games){
 // games is sorted newest-first; compute days rest before each game from the next-older game date
 const out=games.map(g=>({...g}));
 for(let i=0;i<out.length;i++){
  if(i+1<out.length&&out[i].d&&out[i+1].d){
   const d1=Date.parse(out[i].d+"T12:00:00Z"),d0=Date.parse(out[i+1].d+"T12:00:00Z");
   out[i]._rest=Math.round((d1-d0)/86400000)-1; // 0 = back-to-back, 1 = 1 day rest, >=2 = 2+ days rest
  }else out[i]._rest=null;
 }
 return out;
}

function mountDrawerLab(){
 const drw=document.getElementById("drawer");
 if(!drw||!drw.classList.contains("open")||drw.querySelector("#drw-lab"))return;
 const h2=drw.querySelector("h2"),addB=h2&&h2.querySelector(".add");
 if(!addB)return;
 const sp=addB.dataset.s||(typeof sport!=="undefined"?sport:"nfl"),k=addB.dataset.k;
 const r=(typeof DATA!=="undefined"&&DATA[sp]||[]).find(x=>(x.aid+"|"+x.market)===k);
 if(!r||!r.games||!r.games.length)return;

 const allGames=annotateRestDays(r.games);
 const hasMin=allGames.some(g=>g.s&&(g.s.minutes!=null||g.s.toi!=null));
 const minFloor=sp==="nba"?30:(sp==="nhl"?18:null);
 const minKey=sp==="nba"?"minutes":(sp==="nhl"?"toi":null);
 const hasWo=!!(r.wo&&r.wo.n>=2);
 const hasOpp=allGames.some(g=>g.o===r.oa);
 const hasRest=sp==="nba"||sp==="nhl"||sp==="mlb";

 // Slider bounds around r.line
 const baseLn=+r.line||0.5;
 const isHalf=Math.abs((baseLn%1)-0.5)<0.01;
 const step=CONT_MKTS.has(r.market)?5:1;
 const minLn=Math.max(isHalf?0.5:1,baseLn-step*4);
 const maxLn=baseLn+step*5;

 const lab=document.createElement("div");
 lab.id="drw-lab";
 const beInfo=breakEvenInfo(r,sp);

 const chips=[
  ["home","🏠 Home"],
  ["away","✈️ Away"],
  ...(hasOpp?[["opp",`⚔️ vs ${r.oa}`]]:[]),
  ...(hasWo?[["wo",`🚑 w/o ${r.wo.tm_out.split(" ").pop()} (${r.wo.n}g)`]]:[]),
  ...(hasMin&&minFloor?[["min",`⏱️ ${minFloor}+ ${sp==="nhl"?"TOI":"Min"}`]]:[]),
  ...(hasRest?[["rest2","🔋 2+d Rest"],["b2b","⚡ B2B (0d)"]]:[])
 ];

 lab.innerHTML=`
  <div class="dl-hd">
   <div><b style="font-size:13px;color:var(--acc,#53e3a6)">🎛️ Interactive Split Stacker & Alt-Line Simulator</b> <span class="mut" style="font-size:11px">(tap any game bar or slide to test alt line · stack split chips)</span></div>
   <button type="button" class="dl-chip" id="dl-reset" style="display:none">Reset</button>
  </div>
  <div class="dl-chips">${chips.map(([id,lbl])=>`<button type="button" class="dl-chip ${id==="wo"?"wo":""}" data-dlchip="${id}">${H(lbl)}</button>`).join("")}</div>
  <div class="dl-sld">
   <span class="mut" style="font-weight:700">Alt Line:</span>
   <button type="button" class="dl-step" id="dl-dn">−</button>
   <input type="range" id="dl-rng" min="${minLn}" max="${maxLn}" step="${step}" value="${baseLn}">
   <button type="button" class="dl-step" id="dl-up">+</button>
   <b id="dl-lnv" style="min-width:42px;text-align:center;color:var(--acc,#53e3a6);font-size:14px">o${baseLn}</b>
   <span id="dl-fair" class="mut" style="margin-left:auto;font-weight:700"></span>
  </div>
  <div id="dl-stat" style="display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;gap:8px;flex-wrap:wrap"></div>
  <div class="dl-be" title="Stacked Split Hit Rate vs Book No-Vig Break-Even Threshold">
   <div class="dl-be-fill" id="dl-befill"></div>
   <div class="dl-be-mark" id="dl-bemark"></div>
   <div class="dl-be-lbl"><span id="dl-bel"></span><span id="dl-ber"></span></div>
  </div>
  <div class="dl-curve-wrap">
   <div class="dl-curve-hd"><span>📈 <b>Outcome Probability Distribution</b> (Shaded = P(X &gt; Alt Line))</span><span id="dl-curve-meta"></span></div>
   <div id="dl-svg-curve"></div>
  </div>
 `;

 const chartEl=drw.querySelector(".chart");
 const xlEl=drw.querySelector(".xl");
 const h3El=drw.querySelector("h3");
 if(h3El)h3El.insertAdjacentElement("afterend",lab);

 const activeChips=new Set();
 let curLine=baseLn;

 function refreshLab(){
  let filtered=allGames.slice();
  if(activeChips.has("home"))filtered=filtered.filter(g=>g.at!=="@");
  if(activeChips.has("away"))filtered=filtered.filter(g=>g.at==="@");
  if(activeChips.has("opp"))filtered=filtered.filter(g=>g.o===r.oa);
  if(activeChips.has("wo")&&r.wo){if(r.wo.wo_e&&r.wo.wo_e.length){const ws=new Set(r.wo.wo_e);filtered=filtered.filter(g=>ws.has(g.e))}else{filtered=filtered.slice(0,r.wo.n)}}
  if(activeChips.has("min")&&minKey)filtered=filtered.filter(g=>g.s&&(+g.s[minKey]||0)>=minFloor);
  if(activeChips.has("rest2"))filtered=filtered.filter(g=>g._rest!=null&&g._rest>=2);
  if(activeChips.has("b2b"))filtered=filtered.filter(g=>g._rest===0);

  document.getElementById("dl-reset").style.display=(activeChips.size>0||Math.abs(curLine-baseLn)>0.01)?"inline-block":"none";
  document.getElementById("dl-lnv").textContent=`o${curLine}`;

  // Update main drawer chart + x-axis labels live (keep all 20 games visible; dim non-matching split games)
  const fullG=allGames.slice(0,20).reverse();
  const matchSet=new Set(filtered);
  if(chartEl&&xlEl&&fullG.length){
   const mx=Math.max(curLine*1.35,...fullG.map(x=>x.v),1);
   chartEl.innerHTML=fullG.map(x=>{
    const inSplit=matchSet.has(x);
    const hit=x.v>curLine;
    const op=inSplit?"1":"0.22";
    const flt=inSplit?"none":"grayscale(75%)";
    return `<div class="b" data-barv="${x.v}" style="height:${x.v/mx*100}%;background:${hit?"var(--acc)":"var(--bad)"};opacity:${op};filter:${flt};cursor:pointer;transition:height .15s,opacity .18s,background .15s" title="Tap bar (${x.v}) to snap Alt Line · ${x.d} ${x.at}${x.o}: ${x.v}${x._rest!=null?" ("+x._rest+"d rest)":""}${inSplit?"":" [filtered out]"}"><span>${x.v}</span></div>`;
   }).join("")+`<div class="ln" style="bottom:${Math.min(96,Math.max(4,curLine/mx*100))}%"><i>Alt ${curLine}</i></div>`;
   xlEl.innerHTML=fullG.map(x=>`<div style="opacity:${matchSet.has(x)?1:0.3}">${x.at==="@"?"@":""}${x.o}<br>${x.d.slice(5)}</div>`).join("");
   chartEl.querySelectorAll(".b[data-barv]").forEach(bEl=>{
    bEl.onclick=ev=>{
     ev.stopPropagation();
     const v=+bEl.dataset.barv;
     const snapped=Math.max(minLn,Math.min(maxLn,isHalf?Math.max(0.5,Math.floor(v)-0.5):Math.round(v/step)*step));
     curLine=+snapped.toFixed(1);
     const rngEl=document.getElementById("dl-rng");
     if(rngEl)rngEl.value=curLine;
     refreshLab();
    };
   });
  }

  // Compute Stacked Split Hit Rate, Average, Delta vs Line, and NBinom Fair Price
  const n=filtered.length,hits=filtered.filter(x=>x.v>curLine).length;
  const avg=n?+(filtered.reduce((a,b)=>a+b.v,0)/n).toFixed(1):null;
  const delta=avg!=null?+(avg-curLine).toFixed(1):null;
  const hitPct=n?Math.round((hits/n)*100):0;

  // Check if curLine matches a ladder rung or base line for book quote
  let be=beInfo?beInfo.be:0.524,bkLbl=beInfo?beInfo.bk:"Book A",pxQuote=Math.abs(curLine-baseLn)<0.01&&beInfo?beInfo.px:null;
  if(r.ladder){
   const rg=r.ladder.find(x=>Math.abs((+x[0]-0.5)-curLine)<0.1||Math.abs(+x[0]-curLine)<0.1);
   if(rg){
    if(rg[1]!=null){pxQuote=rg[1];bkLbl=rg[2]||"Book A";const o=+rg[1];be=o>0?100/(o+100):-o/(-o+100)}
   }
  }
  const pf=calcAltTailProb(r,filtered.length>=3?filtered:allGames,curLine);
  const fairAm=pf?(pf>=0.5?"-"+Math.round(100*pf/(1-pf)):"+"+Math.round(100*(1-pf)/pf)):"—";
  const dec=pxQuote!=null?(pxQuote>0?1+pxQuote/100:1+100/-pxQuote):null;
  const evPct=(pf&&dec)?Math.round((pf*dec-1)*1000)/10:null;

  document.getElementById("dl-fair").innerHTML=pf?`NBinom Fair: <b style="color:var(--txt)">${Math.round(pf*100)}% (${fairAm})</b>${pxQuote!=null?` · ${H(bkLbl)} <b>${pxQuote>0?"+"+pxQuote:pxQuote}</b>`:""}${evPct!=null&&evPct>=1.5?` <span class="up">(+${evPct}% EV)</span>`:""}`:"";
  const kObj=pf?calcKellyDollar(pf,be,pxQuote):null;
  const kPill=kObj?`<button type="button" class="dl-kelly" data-kelly-cfg="1" title="Tap to adjust Bankroll ($${kObj.bk}) &amp; Kelly fraction (${kObj.km}x)">💰 Rec Stake: $${kObj.stake} (${kObj.km.toFixed(2).replace(/0$/,"")}x Kelly)</button>`:"";
  document.getElementById("dl-stat").innerHTML=(n?`<span><b>Stacked Split:</b> <b class="${hitPct>=60?"up":hitPct<=40?"dn":""}">${hits}/${n} Over (${hitPct}%)</b> · Avg <b>${avg}</b> (${delta>=0?"+":""}${delta} vs line)</span>`:`<span class="mut">0 games in split</span>`)+kPill;

  const bePct=Math.round(be*1000)/10,edgePts=n?Math.round((hits/n-be)*1000)/10:0;
  const fill=document.getElementById("dl-befill"),mark=document.getElementById("dl-bemark");
  fill.style.width=`${Math.min(100,hitPct)}%`;
  fill.style.background=hitPct>=bePct?"linear-gradient(90deg,#16a34a,#4ade80)":"linear-gradient(90deg,#dc2626,#f87171)";
  mark.style.left=`${Math.min(98,Math.max(2,bePct))}%`;
  document.getElementById("dl-bel").textContent=`Split Hit Rate: ${hitPct}% (${hits}/${n})`;
  document.getElementById("dl-ber").textContent=`No-Vig Break-Even: ${bePct}% (${edgePts>=0?"+":""}${edgePts} pts)`;

  // Render SVG NBinom / Normal Probability Density Curve with shaded Over region > curLine
  const cBox=document.getElementById("dl-svg-curve"),cMeta=document.getElementById("dl-curve-meta");
  if(cBox){
   const srcG=filtered.length>=2?filtered:allGames;
   const vs=srcG.map(g=>+g.v||0);
   const mu=vs.length?vs.reduce((a,b)=>a+b,0)/vs.length:(+r.proj||baseLn||1);
   let sd=vs.length>1?Math.sqrt(vs.reduce((a,b)=>a+(b-mu)**2,0)/vs.length):0;
   if(!sd||sd<Math.max(0.8,mu*0.22))sd=Math.max(1.1,mu*0.32);
   const xMin=Math.max(0,Math.floor(Math.min(minLn,mu-2.6*sd)));
   const xMax=Math.ceil(Math.max(maxLn+step,mu+2.6*sd,xMin+6));
   const W=420,Hpx=74,padL=12,padR=12,padT=10,padB=16,pw=W-padL-padR,ph=Hpx-padT-padB;
   const pts=[];let maxY=0;const steps=48;
   for(let si=0;si<=steps;si++){
    const xv=xMin+(xMax-xMin)*(si/steps);
    const z=(xv-mu)/sd;
    const yv=Math.exp(-0.5*z*z);
    if(yv>maxY)maxY=yv;
    pts.push({x:xv,y:yv});
   }
   const sx=xv=>padL+Math.max(0,Math.min(1,(xv-xMin)/(xMax-xMin)))*pw;
   const sy=yv=>padT+ph-(yv/(maxY||1))*ph;
   const pathD=pts.map((pt,i)=>(i===0?"M":"L")+sx(pt.x).toFixed(1)+","+sy(pt.y).toFixed(1)).join(" ");
   const tx=sx(curLine),mxX=sx(mu);
   const zT=(curLine-mu)/sd,yAtT=Math.exp(-0.5*zT*zT);
   const overPts=pts.filter(pt=>pt.x>=curLine);
   let shadeD=`M${tx.toFixed(1)},${padT+ph} L${tx.toFixed(1)},${sy(yAtT).toFixed(1)} `;
   overPts.forEach(pt=>{shadeD+=`L${sx(pt.x).toFixed(1)},${sy(pt.y).toFixed(1)} `});
   if(overPts.length)shadeD+=`L${sx(overPts[overPts.length-1].x).toFixed(1)},${padT+ph} Z`;
   else shadeD="";
   const pDisp=pf?Math.round(pf*100):hitPct;
   if(cMeta)cMeta.innerHTML=`Tail P(X &gt; ${curLine}): <b style="color:${pDisp>=55?"#4ade80":pDisp<=45?"#f87171":"#fbbf24"}">${pDisp}%</b> · μ=${mu.toFixed(1)} · σ=${sd.toFixed(1)}`;
   cBox.innerHTML=`<svg viewBox="0 0 ${W} ${Hpx}" style="width:100%;height:74px;display:block;overflow:visible">`
    +(shadeD?`<path d="${shadeD}" fill="rgba(83,227,166,0.26)"/>`:"")
    +`<path d="${pathD}" fill="none" stroke="#53e3a6" stroke-width="2"/>`
    +`<line x1="${mxX.toFixed(1)}" y1="${padT}" x2="${mxX.toFixed(1)}" y2="${padT+ph}" stroke="#38bdf8" stroke-width="1.3" stroke-dasharray="2,2"/>`
    +`<line x1="${tx.toFixed(1)}" y1="${padT-2}" x2="${tx.toFixed(1)}" y2="${padT+ph}" stroke="#fbbf24" stroke-width="2"/>`
    +`<circle cx="${tx.toFixed(1)}" cy="${sy(yAtT).toFixed(1)}" r="3.5" fill="#fbbf24" stroke="#0b1120" stroke-width="1.3"/>`
    +`<text x="${padL}" y="${Hpx-3}" fill="#8b97b0" font-size="9">${xMin}</text>`
    +`<text x="${mxX.toFixed(1)}" y="${padT+7}" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">μ ${mu.toFixed(1)}</text>`
    +`<text x="${tx.toFixed(1)}" y="${Hpx-3}" fill="#fbbf24" font-size="9.5" font-weight="800" text-anchor="middle">Line ${curLine}</text>`
    +`<text x="${W-padR}" y="${Hpx-3}" fill="#8b97b0" font-size="9" text-anchor="end">${xMax}</text>`
    +`</svg>`;
  }
 }

 lab.querySelectorAll("[data-dlchip]").forEach(btn=>{
  btn.onclick=e=>{
   e.stopPropagation();
   const id=btn.dataset.dlchip;
   if(id==="home")activeChips.delete("away");
   if(id==="away")activeChips.delete("home");
   if(id==="rest2")activeChips.delete("b2b");
   if(id==="b2b")activeChips.delete("rest2");
   if(activeChips.has(id))activeChips.delete(id);else activeChips.add(id);
   lab.querySelectorAll("[data-dlchip]").forEach(b=>b.classList.toggle("on",activeChips.has(b.dataset.dlchip)));
   refreshLab();
  };
 });
 const rng=document.getElementById("dl-rng");
 rng.oninput=e=>{curLine=+e.target.value;refreshLab()};
 document.getElementById("dl-dn").onclick=e=>{e.stopPropagation();curLine=Math.max(minLn,+(curLine-step).toFixed(1));rng.value=curLine;refreshLab()};
 document.getElementById("dl-up").onclick=e=>{e.stopPropagation();curLine=Math.min(maxLn,+(curLine+step).toFixed(1));rng.value=curLine;refreshLab()};
 document.getElementById("dl-reset").onclick=e=>{e.stopPropagation();activeChips.clear();curLine=baseLn;rng.value=baseLn;lab.querySelectorAll("[data-dlchip]").forEach(b=>b.classList.remove("on"));refreshLab()};

 refreshLab();
}

// Enhance rendered .it cards, #tb rows, and open player drawer
function enhanceDOM(){
 renderGameRibbon();
 mountDrawerLab();
 const sp=typeof sport!=="undefined"?sport:"nfl",d=typeof DATA!=="undefined"&&DATA[sp]||[];
 if(!d.length)return;
 const byK={};d.forEach(r=>{byK[r.aid+"|"+r.market]=r});
 document.querySelectorAll("#dash .it[data-k]").forEach(el=>{
  if(el.querySelector(".p-sub"))return;
  const r=byK[el.dataset.k];if(!r)return;
  const nEl=el.querySelector(".n");
  if(nEl)nEl.insertAdjacentHTML("beforeend",cardEnhancements(r));
 });
 document.querySelectorAll("#tb tr[data-i]").forEach(tr=>{
  if(tr.dataset.proDone)return;
  tr.dataset.proDone="1";
  const r=typeof rows!=="undefined"&&rows[+tr.dataset.i];if(!r)return;
  const tds=tr.querySelectorAll("td");
  if(tds[0]&&r.wo&&r.wo.n>=2){
   tds[0].insertAdjacentHTML("beforeend",` <span class="p-pill wo" style="cursor:default" title="Without ${H(r.wo.tm_out)}: ${r.wo.h}/${r.wo.n} over (avg ${r.wo.avg})">w/o ${H(r.wo.tm_out.split(" ").pop())} ${r.wo.h}/${r.wo.n}</span>`);
  }
  if(tds[3]){
   const spk=sparkSvg(r);if(spk)tds[3].insertAdjacentHTML("beforeend",spk);
  }
 });
 updateTray();
}

// ---- 3. Sticky Horizontal Game Ribbon ----
function renderGameRibbon(){
 let bar=document.getElementById("grib");
 const tabs=document.getElementById("tabs");
 if(!tabs)return;
 if(!bar){bar=document.createElement("div");bar.id="grib";tabs.insertAdjacentElement("afterend",bar)}
 const v=typeof view!=="undefined"?view:"dash";
 if(v==="edge"||v==="sgp"||v==="tracker"){bar.style.display="none";return}
 const sp=typeof sport!=="undefined"?sport:"nfl",d=typeof SRC==="function"?SRC():[];
 const gsel=document.getElementById("game"),curG=gsel?gsel.value:"";
 const seen=new Map();
 d.forEach(r=>{
  if(!r.game||seen.has(r.game))return;
  const matchup=r.team&&r.opp?(r.opp.startsWith("@")?`${r.team} ${r.opp}`:`${r.opp.replace(/^vs\.?\s*/i,"")} @ ${r.team}`):r.game;
  const lg=typeof liveG==="function"?liveG(r.time,sp,r):null;
  const status=lg&&lg[0]==="in"?`<span class="glv">● ${lg[2]} ${lg[3]}-${lg[5]} ${lg[4]} · ${H(lg[1])}</span>`:(r.time?new Date(r.time).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"})+" ET":"");
  seen.set(r.game,{id:r.game,matchup,status,t:r.time?+new Date(r.time):0});
 });
 const list=[...seen.values()].sort((a,b)=>a.t-b.t);
 if(list.length<=1){bar.style.display="none";return}
 bar.style.display="flex";
 bar.innerHTML=`<button type="button" class="${!curG?"on":""}" data-grib="">All Games (${list.length})</button><button type="button" data-sgp-mat="1" style="border-color:rgba(168,85,247,.5);color:#e9d5ff;background:rgba(88,28,135,.28)">🧬 SGP Matrix</button>`+list.map(g=>`<button type="button" class="${curG===String(g.id)?"on":""}" data-grib="${H(g.id)}"><b>${H(g.matchup)}</b>${g.status?` <span>${g.status}</span>`:""}</button>`).join("");
}

// ---- 4. Empirical Copula SGP Correlation & Weakest Leg Engine ----
function getPairRho(sp,l1,l2){
 if(!l1||!l2||!l1.r||!l2.r)return 0;
 const r1=l1.r,r2=l2.r;
 if(l1.s!==l2.s||!r1.game||r1.game!==r2.game)return 0;
 if(r1.aid===r2.aid)return 0.65;
 const [a,b]=[`${r1.aid}:${r1.market}`,`${r2.aid}:${r2.market}`].sort();
 const pk=`${l1.s}|${a}|${b}`;
 if(CORR.pairs&&CORR.pairs[pk])return CORR.pairs[pk].rho;
 const rel=r1.team===r2.team?"same":"opp";
 const mp=[r1.market,r2.market].sort().join("|");
 const tk=`${l1.s}|${rel}|${mp}`;
 if(CORR.templates&&CORR.templates[tk]!=null)return CORR.templates[tk];
 return rel==="same"?0.08:-0.04;
}

function copulaJointProb(liveLegs){
 if(!liveLegs.length)return null;
 const ps=liveLegs.map(l=>{
  const q=typeof ppLeg==="function"?ppLeg(l.r,l.s):null;
  const h=l.r.l10?l.r.l10.h:0,n=l.r.l10?l.r.l10.n:0;
  return q&&q.nv!=null?Math.min(0.95,(h+30*q.nv)/(n+30)):(n?Math.min(0.95,Math.max(0.05,h/n)):0.5);
 });
 const pInd=ps.reduce((a,b)=>a*b,1);
 if(liveLegs.length<2)return {pInd,pCop:pInd,rhoAvg:0,boostPct:0,weakIdx:0,ps};
 let rhoSum=0,pairs=0,mult=1.0;
 for(let i=0;i<liveLegs.length;i++){
  for(let j=i+1;j<liveLegs.length;j++){
   const rho=getPairRho(liveLegs[i].s,liveLegs[i],liveLegs[j]);
   if(rho!==0){
    rhoSum+=rho;pairs++;
    const pi=ps[i],pj=ps[j];
    const adj=1+rho*Math.sqrt((1-pi)*(1-pj)/Math.max(0.04,pi*pj))*0.42;
    mult*=Math.max(0.65,Math.min(1.45,adj));
   }
  }
 }
 const pCop=Math.max(0.001,Math.min(0.95,pInd*mult));
 const boostPct=Math.round((pCop/pInd-1)*1000)/10;
 let weakIdx=0,minScore=999;
 liveLegs.forEach((l,i)=>{
  const q=typeof ppLeg==="function"?ppLeg(l.r,l.s):null;
  const sc=q&&q.nv!=null?(ps[i]-q.nv):ps[i]-0.5;
  if(sc<minScore){minScore=sc;weakIdx=i}
 });
 return {pInd,pCop,rhoAvg:pairs?rhoSum/pairs:0,boostPct,weakIdx,ps};
}

// ---- 6. Persistent Bottom Parlay / SGP Slip Tray ----
function ensureTray(){
 let t=document.getElementById("ptray");
 if(!t){t=document.createElement("div");t.id="ptray";document.body.appendChild(t)}
 return t;
}

function updateTray(){
 const t=ensureTray();
 const slip=typeof SLIP!=="undefined"?SLIP:[];
 if(!slip.length){t.classList.remove("show");return}
 const legs=slip.map(l=>({...l,r:(typeof DATA!=="undefined"&&DATA[l.s]||[]).find(r=>(r.aid+"|"+r.market)===l.k)})).filter(l=>l.r);
 if(!legs.length){t.classList.remove("show");return}
 const cop=copulaJointProb(legs);
 const fairAm=typeof fair==="function"?fair(cop.pCop):"—";
 const corrBadge=Math.abs(cop.boostPct)>=1.0?`<span class="pt-corr ${cop.boostPct>0?"pos":"neg"}" title="Empirical Gaussian Copula SGP correlation adjustment">${cop.boostPct>0?"🔗 +Corr +"+cop.boostPct+"%":"⚠️ Cannib "+cop.boostPct+"%"}</span>`:"";
 const beProbs=legs.map(l=>{const bi=breakEvenInfo(l.r,l.s);return bi&&bi.be?bi.be:0.524});
 const beJoint=beProbs.reduce((a,b)=>a*b,1);
 const pEdgeRef=Math.min(cop.pInd*0.98,beJoint);
 const kSlip=calcKellyDollar(cop.pCop,pEdgeRef,null,0.03);
 const kTrayPill=kSlip?`<button type="button" class="pt-kelly" data-kelly-cfg="1" title="Tap to configure Bankroll ($${kSlip.bk}) &amp; Kelly multiplier">💰 Rec Stake: $${kSlip.stake} (${kSlip.km.toFixed(2).replace(/0$/,"")}x Kelly)</button>`:"";
 const weak=legs.length>=2&&legs[cop.weakIdx]?`<button type="button" class="sec" data-pt-trim="${cop.weakIdx}" title="Drop weakest leg (${H(legs[cop.weakIdx].r.player)} ${H(legs[cop.weakIdx].r.market)})">✂️ Trim weakest (${H(legs[cop.weakIdx].r.player.split(" ").pop())})</button>`:"";
 t.innerHTML=`<span class="pt-pill">🧾 ${legs.length} Leg${legs.length>1?"s":""}</span><span>True SGP <b>${(cop.pCop*100).toFixed(1)}%</b> (${fairAm})</span>${corrBadge}${kTrayPill}${weak}<button type="button" class="sec" data-sgp-mat="1">🧬 Matrix</button><button type="button" data-pt-card="1">📸 Tail Card</button><button type="button" data-pt-open="1">Open Slip ↗</button>`;
 t.classList.add("show");
}

// ---- 7. 1-Tap Shareable HTML5 <canvas> Tail Card PNG Generator ----
function renderTailCanvas(title,sub,rows,footerLeft,footerRight){
 const W=680,rowH=62,Hpx=165+rows.length*rowH;
 const c=document.createElement("canvas");c.width=W*2;c.height=Hpx*2;
 const ctx=c.getContext("2d");ctx.scale(2,2);
 const g=ctx.createLinearGradient(0,0,W,Hpx);
 g.addColorStop(0,"#0b1120");g.addColorStop(1,"#131d36");
 ctx.fillStyle=g;ctx.fillRect(0,0,W,Hpx);
 ctx.fillStyle="#53e3a6";ctx.fillRect(0,0,W,4);
 ctx.fillStyle="#53e3a6";ctx.font="800 12px system-ui,sans-serif";ctx.fillText("SPORTS LABS · BET LAB TAIL CARD",24,28);
 ctx.fillStyle="#e8eefc";ctx.font="800 21px system-ui,sans-serif";ctx.fillText(title.slice(0,48),24,54);
 ctx.fillStyle="#8b97b0";ctx.font="600 12.5px system-ui,sans-serif";ctx.fillText(sub.slice(0,75),24,74);
 rows.forEach((r,i)=>{
  const y=92+i*rowH;
  ctx.fillStyle="#18223a";
  ctx.beginPath();ctx.roundRect(20,y,W-40,rowH-8,8);ctx.fill();
  ctx.strokeStyle="#263354";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="#e8eefc";ctx.font="700 14.5px system-ui,sans-serif";
  ctx.fillText(`${r.player} · ${r.market} o${r.line}`,34,y+22);
  ctx.fillStyle="#94a3b8";ctx.font="600 12px system-ui,sans-serif";
  ctx.fillText(r.meta,34,y+42);
  ctx.fillStyle="#53e3a6";ctx.font="800 14.5px system-ui,sans-serif";
  ctx.textAlign="right";ctx.fillText(r.rightTop,W-34,y+22);
  ctx.fillStyle="#cbd5e1";ctx.font="600 11.5px system-ui,sans-serif";
  ctx.fillText(r.rightBot,W-34,y+42);ctx.textAlign="left";
 });
 const fy=Hpx-24;
 ctx.fillStyle="#53e3a6";ctx.font="700 12.5px system-ui,sans-serif";ctx.fillText(footerLeft,24,fy);
 ctx.fillStyle="#64748b";ctx.font="600 11.5px system-ui,sans-serif";ctx.textAlign="right";
 ctx.fillText(footerRight||"betlab.sportslabshq.com · 21+ Research Only",W-24,fy);ctx.textAlign="left";
 return c;
}

function openTailModal(canvas,filename){
 let m=document.getElementById("tail-mod");
 if(!m){
  m=document.createElement("div");m.id="tail-mod";
  m.innerHTML=`<div id="tail-box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>📸 Shareable Tail Card</b><button type="button" id="tail-cls" style="background:none;border:0;color:var(--txt);font-size:18px;cursor:pointer">✕</button></div><div id="tail-cv"></div><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button type="button" id="tail-dl" style="background:var(--acc,#53e3a6);color:#052010;border:0;border-radius:8px;padding:7px 14px;font-weight:800;cursor:pointer">⬇ Download PNG</button><button type="button" id="tail-cp" style="background:var(--panel2,#182033);color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer">📋 Copy Image</button></div></div>`;
  document.body.appendChild(m);
  m.onclick=e=>{if(e.target===m||e.target.id==="tail-cls")m.classList.remove("open")};
 }
 const holder=document.getElementById("tail-cv");holder.innerHTML="";holder.appendChild(canvas);
 document.getElementById("tail-dl").onclick=()=>{const a=document.createElement("a");a.download=filename;a.href=canvas.toDataURL("image/png");a.click()};
 document.getElementById("tail-cp").onclick=()=>{canvas.toBlob(b=>{try{navigator.clipboard.write([new ClipboardItem({"image/png":b})]);document.getElementById("tail-cp").textContent="✓ Copied!"}catch(e){}})};
 m.classList.add("open");
}

// ---- 8. Floating 🔍 / Cmd+K Quick Player Search ----
function initQuickSearch(){
 if(document.getElementById("qsearch-btn"))return;
 const btn=document.createElement("button");btn.id="qsearch-btn";btn.type="button";
 btn.innerHTML=`🔍 Quick Search <small style="opacity:.7">⌘K</small>`;
 document.body.appendChild(btn);
 const mod=document.createElement("div");mod.id="qsearch-mod";
 mod.innerHTML=`<div id="qsearch-box"><input id="qsearch-in" placeholder="Jump to any player across NFL, NBA, NHL, MLB, Soccer…"><div id="qsearch-res"></div></div>`;
 document.body.appendChild(mod);
 const inp=document.getElementById("qsearch-in"),res=document.getElementById("qsearch-res");
 const openSearch=async()=>{
  mod.classList.add("open");inp.value="";inp.focus();
  if(!PIDX)PIDX=await fetch("data/player_index.json?v="+Date.now()).then(r=>r.ok?r.json():null).catch(()=>({p:[]}));
  renderResults("");
 };
 const renderResults=q=>{
  q=q.trim().toLowerCase();
  const hits=[];
  for(const [sp] of (typeof SPORTS!=="undefined"?SPORTS:[])){
   const arr=(typeof DATA!=="undefined"&&DATA[sp])||(typeof RAW!=="undefined"&&RAW[sp])||[];
   for(const r of arr){
    if(!q||(r.player+" "+r.team+" "+r.market).toLowerCase().includes(q)){
     hits.push({sp,r});if(hits.length>=30)break;
    }
   }
   if(hits.length>=30)break;
  }
  res.innerHTML=hits.map((h,i)=>`<div class="qs-row" data-qsi="${i}"><div><b>${H(h.r.player)}</b> <span class="pos">${h.sp.toUpperCase()} · ${H(h.r.team)} ${H(h.r.opp||"")}</span><div class="mut" style="font-size:11.5px">${H(h.r.market)} o${h.r.line}${h.r.wo?` · 🚑 w/o ${H(h.r.wo.tm_out.split(" ").pop())} ${h.r.wo.h}/${h.r.wo.n}`:""}</div></div><div style="text-align:right"><b class="up">${h.r.l10?Math.round(h.r.l10.h/h.r.l10.n*100)+"% L10":"—"}</b></div></div>`).join("")||`<div class="mut" style="padding:14px 16px">No matching props found.</div>`;
  res.querySelectorAll(".qs-row").forEach(el=>el.onclick=async()=>{
   const h=hits[+el.dataset.qsi];if(!h)return;
   mod.classList.remove("open");
   if(typeof sport!=="undefined"&&sport!==h.sp){sport=h.sp;if(typeof ensure==="function")await ensure(h.sp);if(typeof fillFilters==="function")fillFilters();if(typeof render==="function")render()}
   const full=(typeof DATA!=="undefined"&&DATA[h.sp]||[]).find(x=>x.aid===h.r.aid&&x.market===h.r.market)||h.r;
   if(typeof drawer==="function")drawer(full);
  });
 };
 inp.oninput=()=>renderResults(inp.value);
 btn.onclick=openSearch;
 mod.onclick=e=>{if(e.target===mod)mod.classList.remove("open")};
 document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
  else if(e.key==="Escape")mod.classList.remove("open");
 });
}


function openSgpMatrixModal(prefGameId){
 let mod=document.getElementById("sgp-mat-mod");
 if(!mod){
  mod=document.createElement("div");mod.id="sgp-mat-mod";
  document.body.appendChild(mod);
  mod.onclick=e=>{if(e.target===mod)mod.classList.remove("open")};
 }
 const sp=typeof sport!=="undefined"?sport:"nfl";
 const all=(typeof DATA!=="undefined"&&DATA[sp])||[];
 const byGame=new Map();
 all.forEach(r=>{
  if(!r.game)return;
  if(!byGame.has(r.game)){
   const lbl=r.team&&r.opp?(r.opp.startsWith("@")?`${r.team} ${r.opp}`:`${r.opp.replace(/^vs\.?\s*/i,"")} @ ${r.team}`):String(r.game);
   byGame.set(r.game,{id:String(r.game),lbl,props:[]});
  }
  byGame.get(r.game).props.push(r);
 });
 const games=[...byGame.values()].filter(g=>g.props.length>=2);
 if(!games.length){
  mod.innerHTML=`<div class="sgp-mat-card"><div class="sgp-mat-top"><b>🧬 Interactive N×N SGP Copula Correlation Heatmap</b><button type="button" id="sgp-mat-x" style="background:none;border:0;color:var(--txt);font-size:18px;cursor:pointer">✕</button></div><p class="mut">No multi-prop games available for ${sp.toUpperCase()}.</p></div>`;
  mod.classList.add("open");
  const x=document.getElementById("sgp-mat-x");if(x)x.onclick=()=>mod.classList.remove("open");
  return;
 }
 const gsel=document.getElementById("game");
 const curG=prefGameId||(gsel&&gsel.value)||games[0].id;
 const initG=games.find(g=>g.id===String(curG))?String(curG):games[0].id;

 function renderGrid(gid){
  const gObj=games.find(g=>g.id===String(gid))||games[0];
  const sorted=gObj.props.slice().sort((a,b)=>((b.l10?b.l10.h/b.l10.n:0.5)-(a.l10?a.l10.h/a.l10.n:0.5)));
  const legs=[],seenP=new Set();
  for(const r of sorted){
   const k=`${r.aid}|${r.market}`;
   if(seenP.has(k))continue;
   seenP.add(k);legs.push(r);
   if(legs.length>=6)break;
  }
  const hdrs=legs.map(r=>{
   const last=(r.player||"").split(" ").pop();
   const mShort=String(r.market||"").replace("Passing ","Pass ").replace("Rushing ","Rush ").replace("Receiving ","Rec ").slice(0,10);
   return {short:`${last} o${r.line} ${mShort}`,full:`${r.player} (${r.team}) · ${r.market} o${r.line}`};
  });
  let rowsHtml="";
  for(let i=0;i<legs.length;i++){
   rowsHtml+=`<tr><th class="row-h" title="${H(hdrs[i].full)}">${H(hdrs[i].short)}</th>`;
   for(let j=0;j<legs.length;j++){
    if(i===j){
     rowsHtml+=`<td class="sgp-mat-cell diag">1.00<small>Self</small></td>`;
    }else{
     const rho=getPairRho(sp,{s:sp,r:legs[i]},{s:sp,r:legs[j]});
     const bg=rho>=0.18?"rgba(16,185,129,0.28)":rho>=0.06?"rgba(16,185,129,0.16)":rho<=-0.10?"rgba(244,63,94,0.25)":rho<0?"rgba(244,63,94,0.14)":"rgba(30,41,59,0.55)";
     const col=rho>=0.06?"#4ade80":rho<0?"#fb7185":"#cbd5e1";
     const sign=rho>0?"+":"";
     const tag=legs[i].aid===legs[j].aid?"Same Player":(legs[i].team===legs[j].team?"Teammates":"Opponents");
     rowsHtml+=`<td class="sgp-mat-cell" data-mi="${i}" data-mj="${j}" style="background:${bg};color:${col}" title="Tap to add both legs (${H(hdrs[i].short)} + ${H(hdrs[j].short)}) to Parlay Slip">${sign}${rho.toFixed(2)}<small>${tag}</small></td>`;
    }
   }
   rowsHtml+=`</tr>`;
  }
  // Find top 3-leg (or 2-leg) positively correlated SGP stack in gObj
  let bestStack=null,bestScore=-999;
  const validSgpCombo=arr=>{
   const aids=new Set(arr.map(x=>x.r.aid));
   if(aids.size<arr.length)return false;
   if(sp==="nba"){
    const byTm={};
    for(const x of arr){
     const tm=x.r.team||"";
     (byTm[tm]=byTm[tm]||[]).push(x.r.market||"");
    }
    for(const mkts of Object.values(byTm)){
     const rebN=mkts.filter(m=>/Rebound/i.test(m)&&!/Points/i.test(m)).length;
     const astN=mkts.filter(m=>/Assist/i.test(m)&&!/Points/i.test(m)).length;
     if(rebN>=2||astN>=2||new Set(mkts).size<mkts.length)return false;
    }
   }
   return true;
  };
  const candPool=legs.slice(0,6);
  if(candPool.length>=3){
   for(let a=0;a<candPool.length;a++){
    for(let b=a+1;b<candPool.length;b++){
     for(let c=b+1;c<candPool.length;c++){
      const trio=[{s:sp,r:candPool[a],k:candPool[a].aid+"|"+candPool[a].market},{s:sp,r:candPool[b],k:candPool[b].aid+"|"+candPool[b].market},{s:sp,r:candPool[c],k:candPool[c].aid+"|"+candPool[c].market}];
      if(!validSgpCombo(trio))continue;
      const cp=copulaJointProb(trio);
      if(cp&&cp.rhoAvg>0){
       const sc=cp.pCop*(1+cp.rhoAvg*1.8);
       if(sc>bestScore){bestScore=sc;bestStack={legs:trio,hdrs:[hdrs[a].short,hdrs[b].short,hdrs[c].short],cp}}
      }
     }
    }
   }
  }
  if(!bestStack&&candPool.length>=2){
   for(let a=0;a<candPool.length;a++){
    for(let b=a+1;b<candPool.length;b++){
     const pair=[{s:sp,r:candPool[a],k:candPool[a].aid+"|"+candPool[a].market},{s:sp,r:candPool[b],k:candPool[b].aid+"|"+candPool[b].market}];
     if(!validSgpCombo(pair))continue;
     const cp=copulaJointProb(pair);
     const sc=(cp?cp.pCop:0.25)*(1+Math.max(0,cp?cp.rhoAvg:0)*1.8);
     if(sc>bestScore){bestScore=sc;bestStack={legs:pair,hdrs:[hdrs[a].short,hdrs[b].short],cp}}
    }
   }
  }
  const optFair=bestStack&&bestStack.cp?(bestStack.cp.pCop>=0.5?"-"+Math.round(100*bestStack.cp.pCop/(1-bestStack.cp.pCop)):"+"+Math.round(100*(1-bestStack.cp.pCop)/bestStack.cp.pCop)):"+350";
  const optBanner=bestStack?`<div class="sgp-opt-banner"><div>⚡ <b>Best Correlated Stack:</b> ${bestStack.hdrs.map(H).join(" + ")} · Avg ρ <b>+${Math.max(0.04,bestStack.cp.rhoAvg).toFixed(2)}</b> · True SGP <b>${(bestStack.cp.pCop*100).toFixed(1)}%</b> (Fair ${optFair})</div><button type="button" class="sgp-opt-btn" id="sgp-opt-add">➕ Add Optimal Stack to Slip</button></div>`:"";
  mod.innerHTML=`<div class="sgp-mat-card">`
   +`<div class="sgp-mat-top">`
   +`<div><b style="font-size:15px">🧬 Interactive N×N SGP Copula Correlation Heatmap</b><div class="mut" style="font-size:11.5px;margin-top:2px">Tap any off-diagonal cell to add that correlated 2-leg SGP pair directly to your Parlay Slip</div></div>`
   +`<div style="display:flex;gap:8px;align-items:center">`
   +`<select id="sgp-mat-sel" style="background:var(--panel2,#182033);color:var(--txt,#e8eefc);border:1px solid var(--line,#26304f);border-radius:8px;padding:5px 9px;font-size:12px;font-weight:700">`
   +games.map(g=>`<option value="${H(g.id)}"${g.id===gObj.id?" selected":""}>${H(g.lbl)} (${g.props.length} props)</option>`).join("")
   +`</select>`
   +`<button type="button" id="sgp-mat-x" style="background:none;border:0;color:var(--txt);font-size:18px;cursor:pointer">✕</button>`
   +`</div></div>`
   +optBanner
   +`<div style="overflow-x:auto"><table class="sgp-mat-tbl"><thead><tr><th>Leg \\ Leg</th>`
   +hdrs.map(h=>`<th title="${H(h.full)}">${H(h.short)}</th>`).join("")
   +`</tr></thead><tbody>${rowsHtml}</tbody></table></div>`
   +`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11px;color:var(--mut,#8b97b0);flex-wrap:wrap;gap:6px">`
   +`<span>🟢 <b>Positive ρ</b>: Gaussian Copula boosts joint SGP hit rate above independent book pricing</span>`
   +`<span>🔴 <b>Negative ρ</b>: Cannibalizing usage / pace mismatch</span>`
   +`</div></div>`;
  const xB=document.getElementById("sgp-mat-x");if(xB)xB.onclick=()=>mod.classList.remove("open");
  const sel=document.getElementById("sgp-mat-sel");if(sel)sel.onchange=()=>renderGrid(sel.value);
  const optBtn=document.getElementById("sgp-opt-add");
  if(optBtn&&bestStack){
   optBtn.onclick=()=>{
    bestStack.legs.forEach(l=>{
     const exists=typeof SLIP!=="undefined"&&SLIP.some(x=>x.s===l.s&&x.k===l.k);
     if(!exists&&typeof toggleLeg==="function")toggleLeg(l.s,l.k);
    });
    updateTray();
    mod.classList.remove("open");
   };
  }
  mod.querySelectorAll(".sgp-mat-cell[data-mi]").forEach(td=>{
   td.onclick=()=>{
    const rA=legs[+td.dataset.mi],rB=legs[+td.dataset.mj];
    if(!rA||!rB)return;
    [rA,rB].forEach(r=>{
     const k=`${r.aid}|${r.market}`;
     const exists=typeof SLIP!=="undefined"&&SLIP.some(x=>x.s===sp&&x.k===k);
     if(!exists&&typeof toggleLeg==="function")toggleLeg(sp,k);
    });
    updateTray();
    mod.classList.remove("open");
   };
  });
 }
 renderGrid(initG);
 mod.classList.add("open");
}

document.addEventListener("click",e=>{
 const kBtn=e.target.closest("[data-kelly-cfg]");
 if(kBtn){
  e.stopPropagation();
  openKellyPopover();
  return;
 }
 const matBtn=e.target.closest("[data-sgp-mat]");
 if(matBtn){
  e.stopPropagation();
  openSgpMatrixModal();
  return;
 }
 const gbtn=e.target.closest("[data-grib]");
 if(gbtn){
  e.stopPropagation();
  const gsel=document.getElementById("game");
  if(gsel){gsel.value=gbtn.dataset.grib||"";gsel.dispatchEvent(new Event("input",{bubbles:true}))}
  return;
 }
 const spBtn=e.target.closest("[data-psplit]");
 if(spBtn){
  e.stopPropagation();
  const pk=spBtn.dataset.pk,mode=spBtn.dataset.psplit;
  const r=(typeof DATA!=="undefined"&&DATA[sport]||[]).find(x=>(x.aid+"|"+x.market)===pk);
  if(!r)return;
  const card=spBtn.closest(".it");if(!card)return;
  card.querySelectorAll("[data-psplit]").forEach(b=>b.classList.toggle("on",b===spBtn));
  const s=splitSummary(r,mode);
  const vEl=card.querySelector(".v");
  if(vEl&&s){
   const p=Math.round((s.h/s.n)*100);
   vEl.innerHTML=`<span class="${p>=60?"up":p<=40?"dn":""}">${p}%</span><div>${H(s.lbl)} ${s.h}/${s.n} · avg ${s.avg}</div>`;
  }
  const mb=card.querySelector(".p-mbars");
  if(mb)mb.outerHTML=miniBarsHtml(r,mode,null);
  return;
 }
 const rgBtn=e.target.closest("[data-prung]");
 if(rgBtn){
  e.stopPropagation();
  const pk=rgBtn.dataset.pk,tk=+rgBtn.dataset.prung;
  const r=(typeof DATA!=="undefined"&&DATA[sport]||[]).find(x=>(x.aid+"|"+x.market)===pk);
  if(!r||!r.ladder)return;
  const rg=r.ladder.find(x=>+x[0]===tk);if(!rg)return;
  const card=rgBtn.closest(".it");if(!card)return;
  card.querySelectorAll("[data-prung]").forEach(b=>b.classList.toggle("on",b===rgBtn));
  const [targetK,px,bk,pf,fam,ev]=rg;
  const g10=(r.games||[]).slice(0,10),h10=g10.filter(x=>x.v>=targetK).length;
  const vEl=card.querySelector(".v");
  if(vEl){
   vEl.innerHTML=`<span class="${ev!=null&&ev>=2?"up":""}">${pf?Math.round(pf*100)+"% fair":"—"}</span><div>${targetK}+ (${h10}/${g10.length} L10) · ${px!=null?(bk||"Book A")+" "+(px>0?"+"+px:px):"fair "+(fam>0?"+"+fam:fam)}${ev!=null&&ev>=2?` · <b class="up">+${ev}% EV</b>`:""}</div>`;
  }
  const mb=card.querySelector(".p-mbars");
  if(mb)mb.outerHTML=miniBarsHtml(r,"l10",targetK);
  return;
 }
 const tlBtn=e.target.closest("[data-ptail]");
 if(tlBtn){
  e.stopPropagation();
  const pk=tlBtn.dataset.ptail||tlBtn.dataset.pk;
  const r=(typeof DATA!=="undefined"&&DATA[sport]||[]).find(x=>(x.aid+"|"+x.market)===pk);
  if(!r)return;
  const q=typeof ppLeg==="function"?ppLeg(r,sport):null;
  const h10=r.l10?`${Math.round(r.l10.h/r.l10.n*100)}% L10 (${r.l10.h}/${r.l10.n}, avg ${r.l10.avg})`:"—";
  const dvp=r.dvp?` · DvP #${r.dvp.r}/${r.dvp.of}`:"";
  const wo=r.wo?` · w/o ${r.wo.tm_out.split(" ").pop()} ${r.wo.h}/${r.wo.n}`:"";
  const cv=renderTailCanvas(
   `${r.player} (${r.team} ${r.opp})`,
   `Highlighted Prop · ${sport.toUpperCase()}${dvp}${wo}`,
   [{player:r.player,market:r.market,line:r.line,meta:`${h10}${dvp}${wo}`,rightTop:q&&q.best!=null?`${q.best>0?"+"+q.best:q.best} (${q.book||"Book A"})`:(r.l10?`${Math.round(r.l10.h/r.l10.n*100)}% L10`:""),rightBot:q&&q.nv!=null?`Fair ${Math.round(q.nv*100)}%`:"Sports Labs Research"}],
   r.ttl?r.ttl.lbl:"Sports Labs Prop Intelligence",
   "betlab.sportslabshq.com"
  );
  openTailModal(cv,`betlab-${r.player.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.png`);
  return;
 }
 const trimBtn=e.target.closest("[data-pt-trim]");
 if(trimBtn){
  e.stopPropagation();
  const idx=+trimBtn.dataset.ptTrim;
  const legs=(typeof SLIP!=="undefined"?SLIP:[]).map(l=>({...l,r:(typeof DATA!=="undefined"&&DATA[l.s]||[]).find(r=>(r.aid+"|"+r.market)===l.k)})).filter(l=>l.r);
  const target=legs[idx];
  if(target&&typeof toggleLeg==="function")toggleLeg(target.s,target.k);
  return;
 }
 const ptOpen=e.target.closest("[data-pt-open]");
 if(ptOpen){
  e.stopPropagation();
  if(typeof renderSlip==="function")renderSlip(true);
  return;
 }
 const ptCard=e.target.closest("[data-pt-card]");
 if(ptCard){
  e.stopPropagation();
  const legs=(typeof SLIP!=="undefined"?SLIP:[]).map(l=>({...l,r:(typeof DATA!=="undefined"&&DATA[l.s]||[]).find(r=>(r.aid+"|"+r.market)===l.k)})).filter(l=>l.r);
  if(!legs.length)return;
  const cop=copulaJointProb(legs);
  const fairAm=typeof fair==="function"?fair(cop.pCop):"—";
  const rows=legs.map(l=>{
   const r=l.r,q=typeof ppLeg==="function"?ppLeg(r,l.s):null;
   return {
    player:r.player,market:r.market,line:r.line,
    meta:`${l.s.toUpperCase()} · ${r.team} ${r.opp} · L10 ${r.l10?r.l10.h+"/"+r.l10.n:"—"}${r.dvp?" · DvP #"+r.dvp.r:""}`,
    rightTop:q&&q.best!=null?`${q.best>0?"+"+q.best:q.best} (${q.book||"Book A"})`:`${r.l10?Math.round(r.l10.h/r.l10.n*100)+"%":"—"}`,
    rightBot:q&&q.nv!=null?`Fair ${Math.round(q.nv*100)}%`:"Hit-rate leg"
   };
  });
  const corrTxt=Math.abs(cop.boostPct)>=1?` · Copula SGP ${cop.boostPct>0?"+"+cop.boostPct+"% Corr":cop.boostPct+"% Cannib"}`:"";
  const cv=renderTailCanvas(
   `${legs.length}-Leg Highlighted Slip · Fair ${fairAm}`,
   `Combined True Chance ${(cop.pCop*100).toFixed(1)}%${corrTxt}`,
   rows,
   `True Joint Chance: ${(cop.pCop*100).toFixed(1)}% (Fair ${fairAm})`,
   "betlab.sportslabshq.com"
  );
  openTailModal(cv,`betlab-slip-${legs.length}leg.png`);
  return;
 }
},true);

let _ingestedUrlLeg=false;
async function ingestDeepLinkLegs(){
 if(_ingestedUrlLeg)return;
 const qSearch=new URLSearchParams(location.search);
 const hRaw=(location.hash||"").replace(/^#/,"");
 const qHash=new URLSearchParams(hRaw.includes("=")?hRaw:"");
 const rawLeg=qSearch.get("addleg")||qSearch.get("addlegs")||qHash.get("addleg")||qHash.get("addlegs");
 if(!rawLeg)return;
 const reqSp=(qSearch.get("sport")||qHash.get("sport")||(typeof sport!=="undefined"?sport:"nfl")).toLowerCase();
 if(typeof RAW==="undefined"||!RAW[reqSp]||!RAW[reqSp].length)return;
 if(typeof DATA==="undefined"||!DATA[reqSp]||!DATA[reqSp].length){
  if(typeof ensure==="function"){try{await ensure(reqSp)}catch(e){}}
 }
 const pool=(typeof DATA!=="undefined"&&DATA[reqSp])||[];
 if(!pool.length)return;
 _ingestedUrlLeg=true;
 if(typeof sport!=="undefined"&&sport!==reqSp){
  sport=reqSp;
  const tb=document.querySelector(`#tabs button[data-s="${reqSp}"]`);
  if(tb)tb.click();
 }
 const items=decodeURIComponent(rawLeg).split(",").map(s=>s.trim()).filter(Boolean);
 let matchedRow=null;
 items.forEach(item=>{
  const parts=item.split("|").map(s=>(s||"").trim());
  const pPart=parts[0]||"",mPart=parts[1]||"";
  const pLow=pPart.toLowerCase(),mLow=mPart.toLowerCase();
  let found=pool.find(r=>String(r.aid).toLowerCase()===pLow&&(!mLow||String(r.market).toLowerCase()===mLow));
  if(!found){
   found=pool.find(r=>{
    const rName=String(r.player||"").toLowerCase();
    const rMkt=String(r.market||"").toLowerCase();
    const nameOk=pLow&&(rName===pLow||rName.includes(pLow)||String(r.aid).toLowerCase()===pLow);
    const mktOk=!mLow||rMkt===mLow||rMkt.includes(mLow)||mLow.includes(rMkt);
    return nameOk&&mktOk;
   });
  }
  if(!found&&pLow){
   found=pool.find(r=>String(r.player||"").toLowerCase().includes(pLow)||String(r.aid).toLowerCase()===pLow||String(r.market||"").toLowerCase().includes(pLow));
  }
  if(found){
   matchedRow=found;
   const k=`${found.aid}|${found.market}`;
   const exists=typeof SLIP!=="undefined"&&SLIP.some(x=>x.s===reqSp&&x.k===k);
   if(!exists&&typeof toggleLeg==="function")toggleLeg(reqSp,k);
  }
 });
 if(matchedRow){
  updateTray();
  if(typeof drawer==="function")setTimeout(()=>{drawer(matchedRow);mountDrawerLab()},80);
 }
}

function boot(){
 initQuickSearch();
 enhanceDOM();
 ingestDeepLinkLegs();
 const obs=new MutationObserver(()=>{clearTimeout(window._blpT);window._blpT=setTimeout(()=>{enhanceDOM();ingestDeepLinkLegs()},30)});
 obs.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
else boot();

window.BLPro={enhanceDOM,updateTray,copulaJointProb,sparkSvg,mountDrawerLab,openSgpMatrixModal};
})();
