/* Bet Lab · Today's Edge: one compact panel (all sports + filter chips). Public data: data/todays_edge.json (picks + plain results only). */
(function(){
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const A=o=>o==null?"":(o>0?"+":"")+o,P=x=>x==null?"—":Math.round(x*100)+"%",D=a=>a==null?null:(a>0?1+a/100:1+100/-a);
const SN={nfl:"NFL",cfb:"CFB",nba:"NBA",nhl:"NHL",mlb:"MLB",soccer:"Soccer"};
const tm=t=>new Date(t).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit"})+" ET";
let F=localStorage.getItem("bl_te_f")||"all",B=+(localStorage.getItem("bl_te_b")||0),OPEN={};
window.TE=null;
window.loadTE=async()=>{try{const r=await fetch("data/todays_edge.json?v="+Date.now());TE=r.ok?await r.json():null}catch(e){TE=null}};
const css=`.te{grid-column:1/-1;padding:12px 14px}.te h3{margin:0;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.te .rec{font-size:12px;color:var(--mut)}
.te .imp{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.te .imp span{font-size:11.5px;background:#53e3a614;border:1px solid #53e3a640;color:#9ff0c9;border-radius:99px;padding:2px 9px}
.te .chips button{padding:3px 10px;font-size:12px}.te .r{border-top:1px solid var(--line);padding:7px 0}.te .r1{display:flex;gap:8px;align-items:center;min-width:0;cursor:pointer}
.te .k{font-size:10px;font-weight:800;color:var(--mut);min-width:44px}.te .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.te .px{font-weight:800;min-width:44px;text-align:right}.te .ed{font-size:11px;font-weight:800;color:var(--acc);min-width:52px;text-align:right}
.te .cf{font-size:10px;padding:1px 6px;border-radius:99px;background:var(--panel2);color:var(--mut)}.te .cf.High{color:var(--acc)}.te .x{font-size:12px;color:var(--mut);padding:6px 0 2px 52px}
.te .sec{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:10px 0 2px}.te .star{color:#ffd166}
@media(max-width:560px){.te .t{white-space:normal;font-size:13.5px}.te .k{min-width:38px}.te .cf{display:none}.te .x{padding-left:0}}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
function row(p,kind){const id=p.id||p.title,o=OPEN[id];const dec=D(p.price);
 const ev=p.ours!=null&&dec?(p.ours*(1+(dec-1)*(1+B/100))-1):null;
 const add=p.aid&&p.market?`<button class="add" data-te-add="${E(p.sport)}|${E(p.aid)}|${E(p.market)}" title="Add to slip">+</button>`:"";
 return `<div class="r" data-te="${E(id)}"><div class="r1"><span class="k">${E(kind||SN[p.sport]||"")}</span><span class="t">${p.star?'<span class="star">★</span> ':""}${E(p.title)}</span>${p.price!=null?`<span class="px">${A(p.price)}</span>`:""}${p.edge!=null?`<span class="ed">+${(p.edge*100).toFixed(1)}%</span>`:""}${p.conf?`<span class="cf ${p.conf}">${p.conf}</span>`:""}${add}</div>
 ${o?`<div class="x">${p.start?tm(p.start)+" · ":""}${p.ours!=null?"Our chance "+P(p.ours):""}${p.book!=null?" · market "+P(p.book):""}${ev!=null?` · value ${ev>=0?"+":""}${(ev*100).toFixed(0)}%${B?" with "+B+"% boost":""}`:""}${p.legs?"<br>"+p.legs.map(E).join(" + "):""}${p.call?"<br>"+E(p.call):""}${(p.why||[]).length?"<br>"+p.why.map(E).join(" · "):""}${p.status?"<br>"+E(p.status):""}</div>`:""}</div>`}
window.teCard=function(){if(!TE)return "";const all=TE.plays||[],sps=[...new Set(all.map(p=>p.sport))];if(F!="all"&&!sps.includes(F))F="all";
 const L=all.filter(p=>F=="all"||p.sport==F),top=L.slice(0,5),R=TE.results||{};
 const ev=p=>{const d=D(p.price);return p.ours!=null&&d?p.ours*(1+(d-1)*(1+B/100))-1:-9};const best=L.slice().sort((a,b)=>ev(b)-ev(a))[0];
 const live=Object.values(window.GAMES||{}).flat().filter(g=>g&&g.time&&(Date.now()-new Date(g.time))/36e5>0&&(Date.now()-new Date(g.time))/36e5<2.5).length;
 const sgp=(F=="all"||F=="soccer")?(TE.sgp||[])[0]:null,lop=(F=="all"||F=="soccer")?(TE.lopsided||[])[0]:null;
 return `<div class="card te" data-sl-teaser="1"><h3>⚡ Today's Edge</h3>${R.wins+R.losses?`<div class="rec">Official picks <b>${R.wins}-${R.losses}</b> · ${R.units>=0?"+":""}${R.units}u</div>`:""}
 ${(TE.improved||[]).length?`<div class="imp">${TE.improved.map(i=>`<span title="${E(i.why)}">📈 <b>${E(i.head)}</b> · ${E(i.why)}</span>`).join("")}</div>`:""}
 <div class="chips" id="tef" style="margin:6px 0">${["all",...sps].map(k=>`<button data-tef="${k}" class="${k==F?"on":""}">${k=="all"?"All":SN[k]||k}</button>`).join("")}<span style="flex:1"></span>${[0,25,50].map(b=>`<button data-teb="${b}" class="${b==B?"on":""}" title="Profit boost you have">${b?b+"% boost":"No boost"}</button>`).join("")}</div>
 <div class="sec">Top plays</div>${top.length?top.map(p=>row(p)).join(""):'<div class="mut" style="padding:6px 0">No plays clear our bar right now. We only list real edges.</div>'}
 ${best?`<div class="sec">Best value${B?" with your "+B+"% boost":""}</div>${row(best,"VALUE")}`:""}
 ${sgp?`<div class="sec">Best SGP</div>${row(sgp,"SGP")}`:""}${lop?`<div class="sec">Lopsided matchup</div>${row(lop,"BLOWOUT")}`:""}
 ${live?`<div class="sec">Live</div><div class="r"><div class="r1" data-te-live="1"><span class="k">LIVE</span><span class="t">${live} game${live>1?"s":""} in progress · track your slips live</span><span class="ed">Open ›</span></div></div>`:""}
 <div class="mut" style="font-size:11px;margin-top:6px">Tap a play for details. 21+. Not betting advice.</div></div>`};
window.teResults=function(T){const R=(T||{}).results;if(!R)return"";
 return `<div class="card"><h3>✅ Recent results</h3><div class="sub">Official record <b>${R.wins}-${R.losses}</b> · ${R.units>=0?"+":""}${R.units}u</div>${(R.recent||[]).map(r=>`<div style="padding:5px 0;border-top:1px solid var(--line)">${r.result=="win"?"✅":"❌"} ${E(r.title)} <span class="mut">${A(r.price)}</span></div>`).join("")}</div>`};
document.addEventListener("click",async e=>{const f=e.target.closest("[data-tef]"),b=e.target.closest("[data-teb]"),a=e.target.closest("[data-te-add]"),lv=e.target.closest("[data-te-live]"),r=e.target.closest(".te [data-te] .r1");
 if(f){F=f.dataset.tef;localStorage.setItem("bl_te_f",F);window.render&&render();return}
 if(b){B=+b.dataset.teb;localStorage.setItem("bl_te_b",B);window.render&&render();return}
 if(a){e.stopPropagation();const[s,aid,m]=a.dataset.teAdd.split("|");if(window.ensure)await ensure(s);window.toggleLeg&&toggleLeg(s,aid+"|"+m);return}
 if(lv){const v=document.querySelector('#views button[data-v="lslips"]');v&&v.click();return}
 if(r){const id=r.parentElement.dataset.te;OPEN[id]=!OPEN[id];window.render&&render()}},true);
})();
