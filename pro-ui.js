/* Bet Lab Pro Analytics & Interactive Suite (additive enhancer: preserves existing Bet Lab look & colors).
   1. Sticky Horizontal Game Ribbon below #tabs (with live scores from live_stats.json).
   2. Inline Tap-to-Cycle Split Pills (L5 | L10 | L20 | H/A | vs Opp | w/o Injured Starter) + Mini Game-Log Bar Chart on Prop Cards.
   3. Inline Clickable Milestone Rung Switcher (NBinom fair odds vs book-letter odds + +EV Rung badge).
   4. Inline SVG Line-Movement Sparkline & 🔥 Steam Badge (prop cards + All Props table + Drawer).
   5. Floating 🔍 / Cmd+K Instant Cross-Sport Player Search Modal.
   6. Persistent Bottom Parlay / SGP Slip Tray (with Gaussian Copula SGP Correlation Boost / Cannibalization Warning & Weakest Leg Trimmer).
   7. 1-Tap Shareable HTML5 <canvas> Tail Card PNG Generator (single prop or multi-leg slip; 0 forbidden book/source names). */
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
.p-tailbtn{background:none;border:1px solid var(--line,#26304f);color:var(--mut,#8b97b0);border-radius:6px;padding:2px 6px;font:700 10.5px/1.2 system-ui,sans-serif;cursor:pointer;margin-left:4px}
.p-tailbtn:hover{border-color:var(--acc,#53e3a6);color:var(--acc,#53e3a6)}
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
fetch("data/correlations.json?v="+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d)CORR=d;if(SLIP&&SLIP.length)updateTray()}).catch(()=>{});

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
 const pillHtml=pills.length>1?`<span class="p-pills">${pills.map(([m,l])=>`<button type="button" class="p-pill ${m===(win||"l10")?"on":""}" data-psplit="${m}" data-pk="${H(k)}">${H(l)}</button>`).join("")}${woBtn}</span>`:woBtn;

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
 const ttlHtml=r.ttl?`<span class="p-ttl ${r.ttl.c}" title="Market liquidity / time-to-lock confidence">${H(r.ttl.lbl)}</span>`:"";
 const spk=sparkSvg(r);
 const mb=miniBarsHtml(r,win||"l10",null);
 const tailBtn=`<button type="button" class="p-tailbtn" data-ptail="${H(k)}" title="Share PNG Tail Card">📸 Card</button>`;
 return `<div class="p-sub" data-psub="${H(k)}">${pillHtml}${mb}${spk}${ttlHtml}${tailBtn}${rungHtml?`<div style="width:100%;margin-top:2px">${rungHtml}</div>`:""}</div>`;
}

// Enhance rendered .it cards and #tb rows without altering Bet Lab's core functions
function enhanceDOM(){
 renderGameRibbon();
 const sp=sport||"nfl",d=DATA&&DATA[sp]||[];
 if(!d.length)return;
 const byK={};d.forEach(r=>{byK[r.aid+"|"+r.market]=r});
 document.querySelectorAll("#dash .it[data-k]").forEach(el=>{
  if(el.querySelector(".p-sub"))return;
  const r=byK[el.dataset.k];if(!r)return;
  const nEl=el.querySelector(".n");
  if(nEl)nEl.insertAdjacentHTML("beforeend",cardEnhancements(r));
 });
 // Add sparklines and w/o badges into All Props table rows (#tb)
 document.querySelectorAll("#tb tr[data-i]").forEach(tr=>{
  if(tr.dataset.proDone)return;
  tr.dataset.proDone="1";
  const r=rows&&rows[+tr.dataset.i];if(!r)return;
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
 const v=view||"dash";
 if(v==="edge"||v==="sgp"||v==="tracker"){bar.style.display="none";return}
 const sp=sport||"nfl",d=typeof SRC==="function"?SRC():[];
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
 if(r1.aid===r2.aid)return 0.65; // same player alt markets
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
    // First-order Gaussian copula joint tail correction
    const pi=ps[i],pj=ps[j];
    const adj=1+rho*Math.sqrt((1-pi)*(1-pj)/Math.max(0.04,pi*pj))*0.42;
    mult*=Math.max(0.65,Math.min(1.45,adj));
   }
  }
 }
 const pCop=Math.max(0.001,Math.min(0.95,pInd*mult));
 const boostPct=Math.round((pCop/pInd-1)*1000)/10;
 // Weakest leg = lowest edge vs market (or lowest hit rate)
 let weakIdx=0,minScore=999;
 liveLegs.forEach((l,i)=>{
  const q=typeof ppLeg==="function"?ppLeg(l.r,l.s):null;
  const sc=q&&q.nv!=null?(ps[i]-q.nv):ps[i]-0.5;
  if(sc<minScore){minScore=sc;weakIdx=i}
 });
 return {pInd,pCop,rhoAvg:pairs?rhoSum/pairs:0,boostPct,weakIdx,ps};
}

// ---- 5. Persistent Bottom Parlay / SGP Slip Tray ----
function ensureTray(){
 let t=document.getElementById("ptray");
 if(!t){
  t=document.createElement("div");t.id="ptray";
  document.body.appendChild(t);
 }
 return t;
}

function updateTray(){
 const t=ensureTray();
 const slip=SLIP||[];
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

// ---- 6. 1-Tap Shareable HTML5 <canvas> Tail Card PNG Generator ----
function renderTailCanvas(title,sub,rows,footerLeft,footerRight){
 const W=680,rowH=62,Hpx=165+rows.length*rowH;
 const c=document.createElement("canvas");c.width=W*2;c.height=Hpx*2;
 const ctx=c.getContext("2d");ctx.scale(2,2);
 // Dark navy gradient background
 const g=ctx.createLinearGradient(0,0,W,Hpx);
 g.addColorStop(0,"#0b1120");g.addColorStop(1,"#131d36");
 ctx.fillStyle=g;ctx.fillRect(0,0,W,Hpx);
 // Accent top bar
 ctx.fillStyle="#53e3a6";ctx.fillRect(0,0,W,4);
 // Header
 ctx.fillStyle="#53e3a6";ctx.font="800 12px system-ui,sans-serif";ctx.fillText("SPORTS LABS · BET LAB TAIL CARD",24,28);
 ctx.fillStyle="#e8eefc";ctx.font="800 21px system-ui,sans-serif";ctx.fillText(title.slice(0,48),24,54);
 ctx.fillStyle="#8b97b0";ctx.font="600 12.5px system-ui,sans-serif";ctx.fillText(sub.slice(0,75),24,74);
 // Rows
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
 // Footer
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

// ---- 7. Floating 🔍 / Cmd+K Quick Player Search ----
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
  for(const [sp] of (SPORTS||[])){
   const arr=(DATA&&DATA[sp])||(RAW&&RAW[sp])||[];
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
   if(sport!==h.sp){sport=h.sp;if(typeof ensure==="function")await ensure(h.sp);if(typeof fillFilters==="function")fillFilters();if(typeof render==="function")render()}
   const full=(DATA&&DATA[h.sp]||[]).find(x=>x.aid===h.r.aid&&x.market===h.r.market)||h.r;
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

// ---- Global Event Delegation for Inline Pills, Rungs, Game Ribbon & Tail Cards ----
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
  const r=(DATA&&DATA[sport]||[]).find(x=>(x.aid+"|"+x.market)===pk);
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
  const r=(DATA&&DATA[sport]||[]).find(x=>(x.aid+"|"+x.market)===pk);
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
  const r=(DATA&&DATA[sport]||[]).find(x=>(x.aid+"|"+x.market)===pk);
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
  const legs=(SLIP||[]).map(l=>({...l,r:(typeof DATA!=="undefined"&&DATA[l.s]||[]).find(r=>(r.aid+"|"+r.market)===l.k)})).filter(l=>l.r);
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
  const legs=(SLIP||[]).map(l=>({...l,r:(typeof DATA!=="undefined"&&DATA[l.s]||[]).find(r=>(r.aid+"|"+r.market)===l.k)})).filter(l=>l.r);
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

window.BLPro={enhanceDOM,updateTray,copulaJointProb,sparkSvg};
})();
