window.SLGready=window.SLGready||new Promise(r=>{if(window.slGated)return r();const s=document.createElement("script");s.src="https://betlab.sportslabshq.com/slgate.js?v=1";s.onload=r;s.onerror=r;document.head.appendChild(s)});
/* NFL Game Day card + Early Injury Line Adjustment renderer (shared by Bet Lab and NFL Hub). Data: betlab data/nfl_card.json + data/early_injury_adjust.json */
window.FLready=window.FLready||new Promise(r=>{if(window.FL)return r();const s=document.createElement("script");s.src="https://betlab.sportslabshq.com/football-live.js?v=5";s.onload=r;s.onerror=r;document.head.appendChild(s)});
const flt=q=>window.FL?FL.tag(q):`<span class="fl" data-fl="${String(JSON.stringify(q)).replace(/"/g,"&quot;")}"></span><span class="fls"></span>`,fpq=(g,p)=>({g,a:p.aid,k:p.market=="Anytime TD"?"td":"ov",s:(p.stat||[]).join(","),l:p.line,m:p.market});
(function(){const B="https://betlab.sportslabshq.com/data/nfl_card.json",E_URL="https://betlab.sportslabshq.com/data/early_injury_adjust.json",esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),am=p=>p==null?"":p>0?"+"+p:""+p,pc=x=>Math.round(x*100)+"%",BN={novig:"Exchange C",prophetx:"Exchange D",pinnacle:"Book P",draftkings:"Book A",fanduel:"Book B",betmgm:"Book C",fanatics:"Book E",espnbet:"Book G","espn bet":"Book G",betrivers:"Book F",williamhill_us:"Book D","hard rock":"Book I",hardrockbet:"Book I",betparx:"Book V",bovada:"Book L",betonline:"Book O",mybookieag:"Book W"},bn=b=>BN[String(b||"").toLowerCase()]||b||"";
const tm=t=>new Date(t).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/New_York"})+" ET";
const CSS=`.nc{display:grid;gap:10px}.nc h3{margin:12px 0 2px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#8b97b0}.ncg{background:#121826;border:1px solid #243049;border-radius:12px;padding:10px 12px}
.ncw{display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap}.ncw b{font-size:16px;color:#53e3a6}.ncm{color:#8b97b0;font-size:12px}.ncp{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #243049;padding:6px 0 2px;font-size:13px;flex-wrap:wrap}.ncp .r{color:#8b97b0;font-size:11px;width:100%}.ncb{font-weight:800;font-variant-numeric:tabular-nums}.tb{display:inline-block;font-size:10px;font-weight:900;border-radius:5px;padding:1px 6px;margin-right:4px;letter-spacing:.03em}.tb.Bet{background:#53e3a6;color:#06120c}.tb.Lean{background:#3fa9ff33;color:#8fc9ff;border:1px solid #3fa9ff66}.tb.Pass{background:#ffffff10;color:#8b97b0}.ncc{background:#0f1a14;border:1px solid #2b6b4f;border-radius:12px;padding:10px 12px}
.eia-box{background:linear-gradient(145deg,#10192b,#0d1522);border:1px solid #2e4a7d;border-radius:12px;padding:12px 14px;margin-top:6px}
.eia-hd{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.eia-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.eia-tabs button{background:#162238;color:#cbd5e1;border:1px solid #2b3d5e;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:800;cursor:pointer}
.eia-tabs button.on{background:#53e3a6;color:#06120c;border-color:#53e3a6}
.eia-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:10px}
.eia-card{background:#141e30;border:1px solid #243452;border-radius:10px;padding:10px 12px;font-size:12.5px}
.eia-probs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:7px 0;text-align:center}
.eia-probs>div{background:#0d1422;border:1px solid #22304a;border-radius:7px;padding:4px 4px}
.eia-probs b{display:block;font-size:13.5px;font-variant-numeric:tabular-nums}
.eia-probs small{display:block;font-size:9.5px;color:#8b97b0;text-transform:uppercase;letter-spacing:.03em}
.eia-tag{display:inline-block;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:6px;background:#3fa9ff22;color:#8fc9ff;border:1px solid #3fa9ff55}
.eia-tag.fr{background:#53e3a622;color:#53e3a6;border-color:#53e3a655}
.eia-tag.hd{background:#facc1522;color:#fde047;border-color:#facc1555}
.eia-ben{border-top:1px dashed #263654;padding-top:5px;margin-top:5px}`;
const TB=t=>t?`<span class="tb ${esc(t)}">${esc(String(t).toUpperCase())}</span>`:"",ev=x=>x==null?"":` · EV ${(x*100>=0?"+":"")+(x*100).toFixed(1)}%`;

window.renderEarlyInjuryAdjust=function(E,tab){
 if(!E||(!E.prop_freerolls&&!E.line_opportunities))return"";
 tab=tab||window._eiaTab||"props";
 const PF=E.prop_freerolls||[],LO=E.line_opportunities||[];
 const tCls=c=>c=="DUAL_OVER_VOID_FREEROLL"?"fr":c=="DECOY_SNAP_HEDGE"?"hd":"";
 const pCards=PF.slice(0,window._eiaAll?PF.length:8).map(r=>{
  const P=r.probabilities||{},sp=r.starter_prop;
  return `<div class="eia-card">
   <div style="display:flex;justify-content:space-between;gap:6px;align-items:baseline;flex-wrap:wrap">
    <div><b style="font-size:14px;color:#fff">${esc(r.player)}</b> <span class="ncm">${esc(r.team)} ${esc(r.pos)} · vs ${esc(r.opp)}</span></div>
    <span class="eia-tag ${tCls(r.strategy_code)}">${esc(r.strategy_badge)}</span>
   </div>
   <div class="ncm" style="margin-top:2px">Status: <b style="color:#facc15">${esc(r.status)} (${esc(r.injury)})</b>${r.usage&&(r.usage.tg_g||r.usage.ca_g)?` · Baseline: ${r.usage.tg_g?r.usage.tg_g+" tgt/g ("+r.usage.tg_share_pct+"%)":""}${r.usage.tg_g&&r.usage.ca_g?", ":""}${r.usage.ca_g?r.usage.ca_g+" car/g ("+r.usage.ca_share_pct+"%)":""}${r.usage.rz_share_pct?" · "+r.usage.rz_share_pct+"% RZ":""}`:""}</div>
   <div class="eia-probs">
    <div><small>P(Play)</small><b style="color:#3fa9ff">${pc(P.p_play||0)}</b></div>
    <div><small>P(Play Well)</small><b style="color:#53e3a6">${pc(P.p_play_well||0)}</b></div>
    <div><small>P(Decoy/Lim)</small><b style="color:#facc15">${pc(P.p_decoy||0)}</b></div>
    <div><small>P(Void/Out)</small><b style="color:#ff7b88">${pc(P.p_void||0)}</b></div>
   </div>
   ${sp?`<div class="ncm">Starter Line: <b style="color:#e6ebf5">${esc(r.player)} ${sp.market=="Anytime TD"?"Anytime TD":"o/u "+esc(sp.line)+" "+esc(sp.market)} (${am(sp.price)} ${esc(bn(sp.book))})</b> · 100% Void/Refund if Inactive</div>`:""}
   <div style="margin-top:5px;color:#d1fae5;font-size:12px"><b>🎯 Execution:</b> ${esc(r.execution_plan)}</div>
   ${(r.pie||r.beneficiaries||[]).map(b=>{const bp=b.prop;return `<div class="eia-ben"><b>↗ ${esc(b.player)} (${esc(b.pos)})</b>: <span style="color:#53e3a6">${esc(b.shift_summary)}</span>${bp?` · <b>${bp.market=="Anytime TD"?"Anytime TD":"Over "+esc(bp.line)+" "+esc(bp.market)} (${am(bp.price)} ${esc(bn(bp.book))})</b>`:""}${b.est_line_bump?`<div class="ncm" style="font-size:11px">${esc(b.est_line_bump)}</div>`:""}${(b.props_all||[]).length?`<div class="ncm" style="font-size:11px">Lines: ${b.props_all.map(q=>(q.market=="Anytime TD"?"Anytime TD":"o"+esc(q.line)+" "+esc(q.market))+" ("+(q.price==null?"price pending":am(q.price)+" "+esc(bn(q.book)))+")").join(" · ")}</div>`:""}${b.pair?`<div class="ncm" style="font-size:11px">🔄 Pair: ${esc(b.pair)}</div>`:""}</div>`}).join("")}
  </div>`;
 }).join("");

 const RR=E.role_returns||[],LK=E.likely_out||[],f1=x=>x==null?"–":(Math.round(x*10)/10);
 const rCards=RR.map(r=>`<div class="eia-card">
   <div style="display:flex;justify-content:space-between;gap:6px;align-items:baseline;flex-wrap:wrap"><div><b style="font-size:14px;color:#fff">${esc(r.player)}</b> <span class="ncm">${esc(r.team)} · loses share</span></div><span class="eia-tag hd">↘ ${esc(r.returning)} returns</span></div>
   <div class="ncm" style="margin-top:2px">Carries ${f1(r.without_lead.rushingAttempts)} → <b style="color:#ff7b88">${f1(r.with_lead.rushingAttempts)}</b> · Rush yds ${f1(r.without_lead.rushingYards)} → <b style="color:#ff7b88">${f1(r.with_lead.rushingYards)}</b> (${r.n_games_with_lead} games with ${esc(r.returning)})</div>
   <div class="ncm">Overs not Highlighted · fade/under options below</div>
   <div class="ncm">${esc(r.note)}</div>
   ${(r.fades||[]).map(f=>`<div class="eia-ben">↘ Under ${esc(f.line)} ${esc(f.market)} · proj ${f1(f.proj_with_lead)} (was ${f1(f.proj_without_lead)})${f.p_under!=null?" · "+pc(f.p_under)+" under":""} · ${f.under_price==null?"price pending":am(f.under_price)+" "+esc(f.under_book)}</div>`).join("")}
  </div>`).join("");
 const lkHtml=LK.length?`<div style="margin:4px 0;font-size:12px;color:#9aa4b8"><b style="color:#ff7b88">Likely Out:</b> ${LK.map(x=>`${esc(x.player)} ${esc(x.team)} <b>${pc(x.p_inactive)}</b>${x.unconfirmed?"*":""}`).join(" · ")}${LK.some(x=>x.unconfirmed)?" <span style=\"font-size:11px\">(* unconfirmed report)</span>":""}</div>`:"";
 const lCards=LO.map(g=>`<div class="eia-card">
  <div style="display:flex;justify-content:space-between;gap:6px;align-items:baseline;flex-wrap:wrap">
   <b style="font-size:14.5px;color:#fff">${esc(g.matchup)} <span class="ncm" style="font-weight:500">· ${esc(g.window)}</span></b>
   <span class="eia-tag fr">${esc(g.line_status)}</span>
  </div>
  <div style="margin:5px 0;font-size:12.5px">Open: <b>${esc(g.spread_open)}</b> → Current: <b>${esc(g.spread_current)}</b> (O/U ${esc(g.total_current)}) · Unpriced Edge: <b style="color:#53e3a6">${esc(g.unpriced_edge_pts)}</b></div>
  <div style="background:#0c1814;border:1px solid #2b6b4f;border-radius:7px;padding:6px 8px;margin:5px 0;color:#53e3a6;font-weight:800">🏆 Actionable Front-Run: ${esc(g.action_side)}</div>
  <div class="ncm" style="color:#cbd5e1;margin-bottom:5px">${esc(g.why_take_now)}</div>
  ${(g.key_unresolved_players||[]).map(p=>`<div class="eia-ben">
   <div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap"><b>${esc(p.player)} (${esc(p.team)} ${esc(p.pos)})</b> <span style="color:#facc15;font-size:11.5px">${esc(p.status)}</span></div>
   <div class="ncm" style="font-size:11px">P(Play): <b style="color:#3fa9ff">${pc(p.p_play)}</b> · P(Play Well): <b style="color:#53e3a6">${pc(p.p_play_well)}</b> · P(Limited): <b style="color:#facc15">${pc(p.p_decoy)}</b> · P(Inactive/Out): <b style="color:#ff7b88">${pc(p.p_void)}</b></div>
   <div class="ncm" style="font-size:11px">${esc(p.impact_note)}</div>
  </div>`).join("")}
 </div>`).join("");

 return `<div class="eia-box" id="eia-root">
  <div class="eia-hd">
   <div><b style="font-size:15px;color:#53e3a6">⚡ Early Injury Line Adjustment</b> <span class="ncm">· Prop Void-Freerolls &amp; Unadjusted Team Spread/ML Front-Runs</span></div>
   <span class="ncm">Updated ${esc(E.updated_et||"")}</span>
  </div>
  <div class="ncm">${esc(E.subtitle||"")}</div>
  ${lkHtml}
  <div class="eia-tabs">
   <button type="button" data-eiatab="props" class="${tab=="props"?"on":""}">🔄 Prop Void-Freerolls &amp; Beneficiaries (${PF.length})</button>
   <button type="button" data-eiatab="lines" class="${tab=="lines"?"on":""}">📈 Unadjusted Spread &amp; ML Front-Runs (${LO.length})</button>
   ${tab=="props"&&PF.length>8?`<button type="button" data-eiaall="1" class="${window._eiaAll?"on":""}">${window._eiaAll?"Show Top 8":"Show All "+PF.length+" Cascades"}</button>`:""}
  </div>
  <div class="eia-grid">${tab=="props"?rCards+pCards:lCards}</div>
 </div>`;
};

document.addEventListener("click",e=>{
 const tb=e.target.closest("[data-eiatab]");
 if(tb){window._eiaTab=tb.dataset.eiatab;if(window._lastEia){const r=document.getElementById("eia-root");if(r)r.outerHTML=window.renderEarlyInjuryAdjust(window._lastEia,window._eiaTab)}return}
 const ab=e.target.closest("[data-eiaall]");
 if(ab){window._eiaAll=!window._eiaAll;if(window._lastEia){const r=document.getElementById("eia-root");if(r)r.outerHTML=window.renderEarlyInjuryAdjust(window._lastEia,window._eiaTab)}}
});

window.renderNflCard=function(el){if(!document.getElementById("nccss")){const s=document.createElement("style");s.id="nccss";s.textContent=CSS;document.head.appendChild(s)}
 Promise.all([
  SLGready.then(()=>slGated("nfl_card.json")),
  fetch(E_URL+"?v="+Math.floor(Date.now()/180000)).then(r=>r.ok?r.json():null).catch(()=>fetch("data/early_injury_adjust.json?v="+Math.floor(Date.now()/180000)).then(r=>r.ok?r.json():null).catch(()=>null))
 ]).then(([d,eia])=>{
  window._lastEia=eia;
  const G0=d.games||[];if(!G0.length){el.innerHTML='<div class="ncm">No NFL games today.</div>';return}let h='<div class="nc">';
  /* Next-to-kick game leads (TNF, then Sunday, then MNF): chronological by ET kickoff; a game stays "next" until ~4h after kickoff (final). */
  const KT=x=>Date.parse(x.time||0)||0,NOW=Date.now(),G=G0.slice().sort((a,b)=>KT(a)-KT(b)),NX=(G.find(x=>KT(x)+4*3600e3>NOW)||G[G.length-1]),NG=NX&&NX.game;
  const C=(d.confidence||[]).map((x,i)=>[x,i]).sort((a,b)=>((a[0].game==NG?0:1)-(b[0].game==NG?0:1))||a[1]-b[1]).map(a=>a[0]);
  h+=`<div class="ncc"><div style="font-weight:800;margin-bottom:4px">🎯 Confidence highlights <span class="ncm" style="font-weight:500">smart advantage game plays &amp; 75–100% hit-rate starter props</span></div>`+(C.length?C.map(x=>`<div class="ncp"><span>${TB(x.tier)}<b>${x.kind=="ML"?esc(x.pick_label||(x.team+" to win")):esc(x.player)+" "+(x.market=="Anytime TD"?"anytime TD":(x.side=="Under"?"under ":"over ")+esc(x.line)+" "+esc(x.market.toLowerCase()))}</b>${x.kind=="shop"?"":flt(x.kind=="ML"?{g:x.game,k:x.pick_type=="spread"?"sp":"ml",t:x.team,l:x.line}:fpq(x.game,x))} <span class="ncm">${esc(x.matchup)} · ${tm(x.time)}</span></span><span><span class="ncb">${am(x.kind=="ML"?(x.price??x.ml):x.price)}</span> <span class="ncm">${esc(bn(x.book))} · we ${pc(x.pf)}${ev(x.ev)}</span></span>${x.flags&&x.flags.length?`<span class="r">${esc(x.flags.join(" · "))}</span>`:""}</div>`).join(""):'<div class="ncm">No highlight clears the 2% EV bar right now.</div>')+`<div class="ncm" style="margin-top:4px">${esc(d.method||"")}</div></div>`;
  if(eia)h+=window.renderEarlyInjuryAdjust(eia,window._eiaTab||"props");
  /* Featured = the next-to-kick game's ET day (TNF -> Sunday -> MNF, rolls on its own). The rest of the week sits below in its own sections: Sunday (by kickoff window) and Monday Night. */
  const ED=x=>new Date(x.time).toLocaleDateString("en-CA",{timeZone:"America/New_York"}),DY=x=>new Date(x.time).toLocaleDateString("en-US",{weekday:"long",timeZone:"America/New_York"}),WL=w=>w=="Early"?"Early window":w=="Late"?"Late window":"Prime time",GRP=[];
  const FD=NX?ED(NX):"",SEC=x=>{const d=ED(x),y=DY(x);return d==FD?"":d<FD?"Earlier this week":y=="Sunday"?"Sunday":y=="Monday"?"Monday Night":y};
  const ORD=x=>{const d=ED(x);return d==FD?0:d>FD?1:2},GS=G.slice().sort((a,b)=>ORD(a)-ORD(b)||KT(a)-KT(b));
  let SC=null;for(const x of GS){const sc=SEC(x),y=DY(x),k=sc==""?(x.game==NG?"Next up · ":"")+y+" · "+WL(x.window):sc=="Sunday"?(x.window=="Night"?"Sunday Night":WL(x.window)):sc=="Monday Night"?"":y+" · "+WL(x.window);const L=GRP[GRP.length-1];if(L&&L.k==k&&L.sc==sc)L.g.push(x);else GRP.push({k,sc,g:[x]})}
  for(const {k,sc,g} of GRP){if(sc&&sc!==SC){const n=GS.filter(x=>SEC(x)==sc).length;h+=`<h3 style="font-size:15px;color:#e6ecf7;margin-top:18px">${esc(sc)} <span class="ncm" style="text-transform:none;letter-spacing:0;font-weight:500">${n} game${n>1?"s":""}${sc!="Earlier this week"?" · moves to the top once the games above finish":""}</span></h3>`}SC=sc;if(k)h+=`<h3>${esc(k)}</h3>`;
   for(const x of g){const W=x.winner;h+=`<div class="ncg"><div class="ncw"><span>${esc(x.away)} @ ${esc(x.home)} <span class="ncm">${tm(x.time)}${x.spread?" · "+esc(x.spread):""}</span></span>${W?`<span>${TB(W.tier)}🏆 <b>${esc(W.pick_label||(W.team+" to win"))}</b> <span class="ncb">${(W.price??W.ml)==null?'<span class="ncm">Price pending</span>':am(W.price??W.ml)}</span>${flt({g:x.game,k:W.pick_type=="spread"?"sp":"ml",t:W.team,l:W.line})} <span class="ncm">${esc(bn(W.book))} · we ${pc(W.p)} vs book ${pc(W.nv)}</span></span>`:'<span class="ncm">model pending</span>'}</div>${W?`<div class="ncm">${esc(W.why.join(" · "))}</div>`:""}`+
    (x.props||[]).map(p=>`<div class="ncp"><span>${TB(p.tier)}<b class="plk nfp" data-pl="nfl:${esc(p.aid)}" data-nfp="${esc(p.aid)}" role="link" tabindex="0" style="cursor:pointer" title="Open ${esc(p.player)} profile">${esc(p.player)}</b> <span class="ncm">${esc(p.team)} ${esc(p.pos||"")}</span> ${p.market=="Anytime TD"?"anytime TD":"over "+esc(p.line)+" "+esc(p.market.toLowerCase())}${flt(fpq(x.game,p))}</span><span><span class="ncb">${p.price==null?'<span class="ncm">Price pending</span>':am(p.price)}</span> <span class="ncm">${esc(bn(p.book))} · we ${pc(p.p)} vs ${pc(p.nv)}${ev(p.ev)}</span></span>${p.dvp?`<span class="r">${esc(p.dvp)}</span>`:""}</div>`).join("")+(x.props&&x.props.length?"":'<div class="ncm" style="padding-top:4px">No player prop clears our bar for this game yet.</div>')+`</div>`}}
  el.innerHTML=h+`<div class="ncm">Advantage play = Sports Labs NFL team model + injury cascade; props = verified starters with 75–100% hit rates or active streaks correlated to game script. Started games keep live results until the next slate. Not betting advice. 21+.</div></div>`;FLready.then(()=>window.FL&&FL.run(el))}).catch(e=>{el.innerHTML=e&&e.status==401&&window.slLockCard?slLockCard("NFL Game Day is for Bet Lab members","Smart spread & moneyline advantage plays for every game, Early Injury Line Adjustment prop freerolls, correlated 75–100% hit-rate starter props, and Bet/Lean tiers."):'<div class="ncm">Game Day card unavailable right now.</div>'})}})();
