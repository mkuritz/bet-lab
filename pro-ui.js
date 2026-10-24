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
@media(max-width:640px){#qsearch-btn{bottom:64px;right:12px;padding:7px 11px;font-size:11.5px}#ptray{bottom:8px;padding:7px 10px;gap:6px}}
`;
const stEl=document.createElement("style");stEl.textContent=css;document.head.appendChild(stEl);

const H=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let CORR={templates:{},pairs:{}},PIDX=null;
fetch("data/correlations.json?v="+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d)CORR=d;if(typeof SLIP!=="undefined"&&SLIP.length)updateTray()}).catch(()=>{});

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
   <div><b style="font-size:13px;color:var(--acc,#53e3a6)">🎛️ Interactive Split Stacker & Alt-Line Simulator</b> <span class="mut" style="font-size:11px">(tap multiple chips to stack filters)</span></div>
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

  // Update main drawer chart + x-axis labels live
  const showG=filtered.slice(0,20).reverse();
  if(chartEl&&xlEl){
   if(showG.length){
    const mx=Math.max(curLine*1.4,...showG.map(x=>x.v),1);
    chartEl.innerHTML=showG.map(x=>`<div class="b" style="height:${x.v/mx*100}%;background:${x.v>curLine?"var(--acc)":"var(--bad)"}" title="${x.d} ${x.at}${x.o}: ${x.v}${x._rest!=null?" ("+x._rest+"d rest)":""}"><span>${x.v}</span></div>`).join("")+`<div class="ln" style="bottom:${curLine/mx*100}%"><i>${curLine}</i></div>`;
    xlEl.innerHTML=showG.map(x=>`<div>${x.at==="@"?"@":""}${x.o}<br>${x.d.slice(5)}</div>`).join("");
   }else{
    chartEl.innerHTML=`<div class="mut" style="padding:20px;align-self:center">No games match this exact filter combination.</div>`;
    xlEl.innerHTML="";
   }
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
  document.getElementById("dl-stat").innerHTML=n?`<span><b>Stacked Split:</b> <b class="${hitPct>=60?"up":hitPct<=40?"dn":""}">${hits}/${n} Over (${hitPct}%)</b> · Avg <b>${avg}</b> (${delta>=0?"+":""}${delta} vs line)</span>`:`<span class="mut">0 games in split</span>`;

  const bePct=Math.round(be*1000)/10,edgePts=n?Math.round((hits/n-be)*1000)/10:0;
  const fill=document.getElementById("dl-befill"),mark=document.getElementById("dl-bemark");
  fill.style.width=`${Math.min(100,hitPct)}%`;
  fill.style.background=hitPct>=bePct?"linear-gradient(90deg,#16a34a,#4ade80)":"linear-gradient(90deg,#dc2626,#f87171)";
  mark.style.left=`${Math.min(98,Math.max(2,bePct))}%`;
  document.getElementById("dl-bel").textContent=`Split Hit Rate: ${hitPct}% (${hits}/${n})`;
  document.getElementById("dl-ber").textContent=`No-Vig Break-Even: ${bePct}% (${edgePts>=0?"+":""}${edgePts} pts)`;
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
 bar.innerHTML=`<button type="button" class="${!curG?"on":""}" data-grib="">All Games (${list.length})</button>`+list.map(g=>`<button type="button" class="${curG===String(g.id)?"on":""}" data-grib="${H(g.id)}"><b>${H(g.matchup)}</b>${g.status?` <span>${g.status}</span>`:""}</button>`).join("");
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
 const weak=legs.length>=2&&legs[cop.weakIdx]?`<button type="button" class="sec" data-pt-trim="${cop.weakIdx}" title="Drop weakest leg (${H(legs[cop.weakIdx].r.player)} ${H(legs[cop.weakIdx].r.market)})">✂️ Trim weakest (${H(legs[cop.weakIdx].r.player.split(" ").pop())})</button>`:"";
 t.innerHTML=`<span class="pt-pill">🧾 ${legs.length} Leg${legs.length>1?"s":""}</span><span>True SGP <b>${(cop.pCop*100).toFixed(1)}%</b> (${fairAm})</span>${corrBadge}${weak}<button type="button" data-pt-card="1">📸 Tail Card</button><button type="button" data-pt-open="1">Open Slip ↗</button>`;
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

document.addEventListener("click",e=>{
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
  const pk=tlBtn.dataset.pk;
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

function boot(){
 initQuickSearch();
 enhanceDOM();
 const obs=new MutationObserver(()=>{clearTimeout(window._blpT);window._blpT=setTimeout(enhanceDOM,30)});
 obs.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
else boot();

window.BLPro={enhanceDOM,updateTray,copulaJointProb,sparkSvg,mountDrawerLab};
})();
