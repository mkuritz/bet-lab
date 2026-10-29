/* Bet Lab · Today's Edge: one compact panel (all sports + filter chips). Public data: data/todays_edge_v2.json. */
(function(){
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const A=o=>o==null?"":(o>0?"+":"")+o,P=x=>x==null?"—":Math.round(x*100)+"%",D=a=>a==null?null:(a>0?1+a/100:1+100/-a);
const SN={nfl:"NFL",cfb:"CFB",nba:"NBA",nhl:"NHL",mlb:"MLB",soccer:"Soccer"};
const tm=t=>t?new Date(t).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit"})+" ET":"";
let F=localStorage.getItem("bl_te_f")||"all",B=+(localStorage.getItem("bl_te_b")||0),OPEN={};
window.TE=null;
if(!("SLATE" in window)){window.SLATE=null;fetch("data/slate_status.json?v="+Date.now()).then(r=>r.ok?r.json():null).then(d=>{window.SLATE=d;window.render&&render()}).catch(()=>{})}
window.SLD=window.SLD||(sp=>{const s=(window.SLATE||{})[sp];return s&&s.label?`<span class="sl-day" style="display:inline-block;margin-left:8px;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:600;background:rgba(148,163,184,.18);color:#cbd5e1;vertical-align:middle">${s.label}</span>`:""});
if(!("LIKELY" in window)){window.LIKELY=null;fetch("data/likely.json?v="+Date.now()).then(r=>r.ok?r.json():null).then(d=>{window.LIKELY=d;window.render&&render()}).catch(()=>{})}
window.loadTE=async()=>{try{const r=await fetch("data/todays_edge_v2.json?v="+Date.now());TE=r.ok?await r.json():null}catch(e){TE=null}};

const css=`.te{grid-column:1/-1;padding:12px 14px}.te h3{margin:0;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.te .rec{font-size:12px;color:var(--mut)}
.te .imp{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.te .imp span{font-size:11.5px;background:#53e3a614;border:1px solid #53e3a640;color:#9ff0c9;border-radius:99px;padding:2px 9px}
.te .chips button{padding:3px 10px;font-size:12px}.te .r{border-top:1px solid var(--line);padding:7px 0}.te .r1{display:flex;gap:8px;align-items:center;min-width:0;cursor:pointer}
.te .k{font-size:10px;font-weight:800;color:var(--mut);min-width:44px}.te .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.te .px{font-weight:800;min-width:52px;text-align:right}.te .ed{font-size:11px;font-weight:800;color:var(--acc);min-width:56px;text-align:right}
.te .cf{font-size:10px;padding:1px 6px;border-radius:99px;background:var(--panel2);color:var(--mut)}.te .cf.High{color:var(--acc)}.te .x{font-size:12px;color:var(--mut);padding:6px 0 2px 52px;line-height:1.45}
.te .sec{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:10px 0 2px}.te .star{color:#ffd166}
.te-diff{display:inline-block;font-size:11px;font-weight:800;padding:1px 6px;border-radius:5px;margin-left:6px}
.te-diff.pos{background:rgba(83,227,166,.15);color:#53e3a6;border:1px solid rgba(83,227,166,.35)}
.te-diff.neg{background:rgba(255,93,108,.15);color:#ff5d6c;border:1px solid rgba(255,93,108,.35)}
@media(max-width:560px){.te .t{white-space:normal;font-size:13.5px}.te .k{min-width:38px}.te .cf{display:none}.te .x{padding-left:0}}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

function playTitle(p){
  if(p.title)return p.title;
  const mk=p.market||"Prop";
  const mkLbl=mk==="Anytime Goal"?"Anytime Goal":mk==="Anytime TD"?"Anytime TD":`${p.side&&String(p.side).toLowerCase()==="under"?"Under":"Over"} ${p.line??0.5} ${mk}`;
  const mu=p.team?` (${p.team}${p.opp?" "+p.opp:""})`:"";
  return p.player?`${p.player}${mu} ${mkLbl}`:"Highlighted Spot";
}

function row(p,kind){
  const title=playTitle(p);
  const id=p.id||title,o=OPEN[id];
  const dec=D(p.price);
  const ours=p.ours??p.p_calibrated??p.p_raw??p.p??null;
  const bookP=p.book??p.p_book??p.nv??null;
  const edge=p.edge!=null?p.edge:(p.edge_pct!=null?p.edge_pct/100:(ours!=null&&bookP!=null?ours-bookP:null));
  const evRaw=p.ev!=null?p.ev:(p.ev_pct!=null?p.ev_pct/100:null);
  const ev=ours!=null&&dec?(ours*(1+(dec-1)*(1+B/100))-1):evRaw;
  const startT=p.start||p.time||"";
  const conf=p.conf||(p.conviction_score>=85?"High":p.conviction_score>=70?"Medium":"");
  const isStar=Boolean(p.star||p.official||(p.conviction_score||0)>=90);
  const bkName=p.best_book||p.book_name||"";
  const lm=p.game&&(kind=="SGP"||kind=="BLOWOUT")&&(p.sport||"soccer")=="soccer"?`<button class="lmore" data-sgp-go="${E(p.game)}">Learn more ›</button>`:"";
  const add=p.aid&&p.market?`<button class="add" data-te-add="${E(p.sport)}|${E(p.aid)}|${E(p.market)}" title="Add to slip">+</button>`:"";
  const sideStr=p.side||(/\|under\||\bunder\b/i.test((p.id||"")+" "+title)?"under":"over");
  return `<div class="r" data-te="${E(id)}"><div class="r1"><span class="k">${E(kind||SN[p.sport]||(p.sport||"").toUpperCase())}</span><span class="t">${isStar?'<span class="star">★</span> ':""}${E(title)}</span>${p.price!=null?`<span class="px">${A(p.price)}${bkName?` <small class="mut" style="font-weight:600;font-size:10px">${E(bkName.replace("Book ",""))}</small>`:""}</span>`:""}${edge!=null&&Math.abs(edge)>=0.0005?`<span class="ed">${edge>=0?"+":""}${(edge*100).toFixed(1)}%</span>`:ev!=null?`<span class="ed">EV ${ev>=0?"+":""}${(ev*100).toFixed(1)}%</span>`:""}${conf?`<span class="cf ${conf}">${conf}</span>`:""}${lm}${add}</div>${window.LR&&p.player?`<div style="padding-left:52px">${LR.tag(p.sport,p.aid||"",p.market,p.line,p.player,sideStr,startT,p.game||"")}</div>`:""}
  ${o?`<div class="x">${startT?tm(startT)+" · ":""}${ours!=null?`<b style="color:var(--acc)">Our chance ${P(ours)}</b>${p.fair_odds?` (Fair ${E(p.fair_odds)})`:""}`:""}${bookP!=null?` · market no-vig ${P(bookP)}`:""}${ev!=null?` · EV <b style="color:var(--acc)">${ev>=0?"+":""}${(ev*100).toFixed(1)}%</b>${B?" with "+B+"% boost":""}`:""}${bkName?` · Best at <b>${E(bkName)} (${A(p.price)})</b>`:""}${p.entry_timing?` · <b>${E(p.entry_timing)}</b>`:""}
  ${p.situational_setup?`<br><b style="color:var(--txt)">Situational:</b> ${E(p.situational_setup)}`:""}
  ${p.strategic_matchup?`<br><b style="color:var(--txt)">Matchup:</b> ${E(p.strategic_matchup)}`:""}
  ${p.tactical_exploits?`<br><b style="color:var(--acc)">Execution:</b> ${E(p.tactical_exploits)}`:""}
  ${p.legs?"<br>"+p.legs.map(E).join(" + ")+(kind=="SGP"?` <span class="mut">(price: ${E(p.price_note||"legs multiplied, not an SGP quote")})</span>`:""):""}${p.call?"<br>"+E(p.call):""}${!p.situational_setup&&(p.why||[]).length?"<br>"+p.why.map(E).join(" · "):""}${p.status?"<br>"+E(p.status):""}</div>`:""}</div>`;
}

const LDD=(L,sp)=>{if(sp!="nhl")return L;const d=L.reduce((m,r)=>!m||(r.start||"")<m?r.start:m,"");const s=new Set();return L.filter(r=>{if(d&&r.start!=d)return 0;const k=(r.nhl_id||r.player)+"|"+r.market;if(s.has(k))return 0;s.add(k);return 1})};
function likely(){const LK=window.LIKELY||{},sps=F=="all"?["nfl","cfb","nhl","soccer"]:[F];let L=[];const ETD=t=>{t=t||"";if(t.length<=10)return t;const d=new Date(t);return isNaN(d)?t.slice(0,10):d.toLocaleDateString("en-CA",{timeZone:"America/New_York"})},TD=ETD(new Date().toISOString());sps.forEach(sp=>LDD(LK[sp]||[],sp).filter(r=>sps.length==1||ETD(r.start||r.time)==TD).filter(r=>sp!="nhl"||r.market=="Points").slice(0,F=="all"?4:12).forEach(r=>L.push(r)));
 if(!L.length)return"";L.sort((a,b)=>b.ours-a.ours);
 return `<div class="sec">Most likely${sps.length==1?(window.SLR?SLR(sps[0],L):SLD(sps[0])):(()=>{const u=[...new Set([...new Set(L.map(r=>r.sport))].map(x=>SLD(x)))];return u.length==1?u[0]:""})()}</div>`+L.map(r=>`<div class="r"><div class="r1"><span class="k">${E(SN[r.sport]||"")}</span><span class="t">${E(r.player)} ${E(r.market=="Points"?"point":r.market=="Anytime TD"?"anytime TD":r.market=="Anytime Goal"?"anytime goal":r.market)}</span>${r.price!=null?`<span class="px">${A(r.price)}</span>`:""}<span class="ed" style="color:var(--txt)">${P(r.ours)}</span></div>${window.LR?`<div style="padding-left:52px">${LR.tag(r.sport,r.aid||"",r.market,r.line,r.player,r.side||"over",r.start||r.time||"",r.game||"")}</div>`:""}</div>`).join("")}

window.teCard=function(lite){if(!TE)return "";const all=TE.plays||[],sps=["nfl","cfb","nhl","mlb","nba","soccer"];if(F!="all"&&!sps.includes(F))F="all";
 const L=all.filter(p=>F=="all"||p.sport==F),top=L.slice(0,lite?5:12),R=TE.results||{};
 const ev=p=>{const d=D(p.price),o=p.ours??p.p??0.5;return o!=null&&d?o*(1+(d-1)*(1+B/100))-1:(p.ev??-9)};const best=L.slice().sort((a,b)=>ev(b)-ev(a))[0];
 const live=(window.__blSport&&(window.GAMES||{})[window.__blSport]?(window.GAMES||{})[window.__blSport]:Object.values(window.GAMES||{}).flat()).filter(g=>g&&g.time&&(Date.now()-new Date(g.time))/36e5>0&&(Date.now()-new Date(g.time))/36e5<2.5).length;
 const sgp=(F=="all"||F=="soccer")?(TE.sgp||[])[0]:null,lop=(F=="all"||F=="soccer")?(TE.lopsided||[])[0]:null;
 return `<div class="card te" data-sl-teaser="1"><h3>⚡ Today's Edge <span class="rec">${all.length} validated plays · <a href="./value.html" style="color:var(--acc)">Value Vault →</a> · <a href="./edge.html" style="color:var(--acc2)">Results (${R.wins||562}-${R.losses||707}) →</a></span></h3>
 ${lite?"":`<div class="chips" id="tef" style="margin:6px 0">${["all",...sps].map(k=>`<button data-tef="${k}" class="${k==F?"on":""}">${k=="all"?"All":SN[k]||k}</button>`).join("")}<span style="flex:1"></span>${[0,25,50].map(b=>`<button data-teb="${b}" class="${b==B?"on":""}" title="Profit boost you have">${b?b+"% boost":"No boost"}</button>`).join("")}</div>`}
 <div class="sec">Top plays (${L.length})</div>${top.length?top.map(p=>row(p)).join(""):`<div class="mut" style="padding:6px 0">${F=="all"?"No plays clear our bar right now.":"No "+(SN[F]||F)+" plays clear our bar right now."} We only list real edges.</div>`}
 ${!lite?likely():""}${best&&!lite?`<div class="sec">Best value${B?" with your "+B+"% boost":""}</div>${row(best,"VALUE")}`:""}
 ${sgp?`<div class="sec">Best SGP</div>${row(sgp,"SGP")}`:""}${lop?`<div class="sec">Lopsided matchup</div>${row(lop,"BLOWOUT")}`:""}
 ${live?`<div class="sec">Live</div><div class="r"><div class="r1" data-te-live="1"><span class="k">LIVE</span><span class="t">${live} game${live>1?"s":""} in progress · follow your highlights live</span><span class="ed">Open ›</span></div></div>`:""}
 ${lite?`<div style="margin-top:8px"><button class="lmore" data-zone="edge">See all of Today's Edge ›</button></div>`:""}<div class="mut" style="font-size:11px;margin-top:6px">Tap any play for Situational, Matchup &amp; Execution breakdown. 21+. Not betting advice.</div></div>`};

window.teResults=function(T){
  const R=(T||{}).results;if(!R)return"";
  const rec=R.recent||[];
  const bySt=R.by_strategy||{};
  const stBadges=Object.entries(bySt).map(([k,v])=>`<span style="display:inline-block;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:3px 8px;font-size:11.5px;margin:2px 4px 2px 0"><b>${E(k)}:</b> ${v.w}-${v.l} (${v.hit_pct}%)</span>`).join("");
  return `<div class="card" style="grid-column:1/-1">
    <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
      <h3>✅ Graded Recommendations &amp; Strategy Results</h3>
      <a href="./edge.html" style="color:var(--acc);font-weight:800;font-size:12.5px;text-decoration:none">Open Full Results Hub (${R.wins||0}-${R.losses||0}) →</a>
    </div>
    ${stBadges?`<div style="margin:6px 0 10px">${stBadges}</div>`:""}
    ${rec.slice(0,25).map(r=>{
      const isWin=r.result==="win";
      const diffOk=r.diff!=null?r.diff>0:isWin;
      const diffBadge=r.target_str&&r.actual_str
        ?`<span class="te-diff ${diffOk?"pos":"neg"}">Target: ${E(r.target_str)} · Actual: <b>${E(r.actual_str)}</b> (${E(r.diff_str||"")})</span>`
        :"";
      return `<div style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;font-size:12.5px">
        <div>${isWin?"✅":"❌"} <b>${E(r.title)}</b> <span class="mut">${E((r.sport||"").toUpperCase())} · ${E(r.strategy||"Highlighted")} · ${E(r.day||"")}</span></div>
        <div>${diffBadge} <span class="mut" style="margin-left:6px"><b>${A(r.price)}</b>${r.p?` · Us ${Math.round(r.p*100)}%`:""}</span></div>
      </div>`;
    }).join("")}
  </div>`;
};

document.addEventListener("click",async e=>{const f=e.target.closest("[data-tef]"),b=e.target.closest("[data-teb]"),a=e.target.closest("[data-te-add]"),lv=e.target.closest("[data-te-live]"),r=e.target.closest(".te [data-te] .r1");
 if(f){F=f.dataset.tef;localStorage.setItem("bl_te_f",F);window.render&&render();return}
 if(b){B=+b.dataset.teb;localStorage.setItem("bl_te_b",B);window.render&&render();return}
 if(a){e.stopPropagation();const[s,aid,m]=a.dataset.teAdd.split("|");if(window.ensure)await ensure(s);window.toggleLeg&&toggleLeg(s,aid+"|"+m);return}
 if(lv){const v=document.querySelector('#views button[data-v="live"]');v&&v.click();return}
 if(r){const id=r.parentElement.dataset.te;OPEN[id]=!OPEN[id];window.render&&render()}},true);
})();
