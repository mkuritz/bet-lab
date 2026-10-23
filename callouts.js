/* NFL QB-receiver stack callouts + NHL power-play / line callouts (same format as the soccer split callouts). Data: data/callouts_{nfl,nhl}.json */
(function(){
const D={},MORE={},E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const L=n=>String(n||"").split(" ").slice(1).join(" ")||n;
const et=t=>{try{return new Date(t).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit"})+" ET"}catch(e){return""}};
const ord=n=>n+((n%100>=11&&n%100<=13)?"th":({1:"st",2:"nd",3:"rd"}[n%10]||"th"));
function load(sp){if(D[sp]!==undefined)return;D[sp]=null;fetch("data/callouts_"+sp+".json?v="+Date.now()).then(r=>r.ok?r.json():null).then(d=>{D[sp]=d||false;window.render&&render()}).catch(()=>{D[sp]=false})}
const live=t=>!t||Date.parse(t)>Date.now()-4*3600e3;
const CSS=`<style id="co-css">.co-r{padding:9px 0;border-top:1px solid var(--line);font-size:13px;min-width:0;overflow-wrap:anywhere}.co-r:first-of-type{border-top:0}.co-h{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}.co-ch{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);white-space:nowrap}.co-st{display:flex;flex-wrap:wrap;gap:2px 14px;font-size:12px;margin-top:3px}.co-st>span{white-space:normal}@media(max-width:640px){.co-st{flex-direction:column;gap:1px}.co-h b{flex-basis:100%}}.co-l5{font-size:11px;margin-top:3px}.co-more{margin-top:8px;background:none;border:1px solid var(--line);color:inherit;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12px}</style>`;
function nflRow(s){const ln=[s.lines.rec["Receiving Yards"]!=null?"Rec yds "+s.lines.rec["Receiving Yards"]:"",s.lines.rec["Receptions"]!=null?"Rec "+s.lines.rec["Receptions"]:"",s.lines.qb["Passing Yards"]!=null?"Pass yds "+s.lines.qb["Passing Yards"]:""].filter(Boolean).join(" · ");
 return `<div class="co-r"><div class="co-h"><b>${E(L(s.qb))} → ${E(s.rec)}</b><span class="co-ch">${E(s.pos)} · ${E(s.team)} ${E(s.opp||"")}</span><span class="mut" style="font-size:11px">${et(s.time)}</span></div>
 <div class="co-st mut"><span><b style="color:var(--txt)">${s.n}</b> games together (since ${E(s.since)})</span><span><b style="color:var(--txt)">${s.rec_n}</b> rec · <b style="color:var(--txt)">${s.yds.toLocaleString()}</b> yds · <b style="color:var(--txt)">${s.td}</b> TD</span><span>${s.ypg} yds/g</span>${s.td_share!=null?`<span>TD connection ${Math.round(s.td_share*100)}% (${s.td}/${s.qb_td})</span>`:""}<span>TD in ${s.td_games}/${s.n}</span>${s.wo?`<span>other QB: ${s.wo.ypg} yds/g in ${s.wo.n}</span>`:""}</div>
 <div class="co-l5 mut">Last ${s.l5.length} together: ${s.l5.map(g=>`${E(g[1])} ${g[2]}-${g[3]}${g[4]?" · "+g[4]+" TD":""}`).join(" | ")}${ln?` · Lines: ${E(ln)}`:""}</div>${(s.co||[]).map(c=>`<div class="corr">💡 ${E(c)}</div>`).join("")}</div>`}
function nhlRow(p){const l=p.line,pk=p.opp_pk,c=p.pp;
 return `<div class="co-r"><div class="co-h"><b>${E(p.player)}</b><span class="co-ch">${E(p.pos)} · ${E(p.team)} ${E(p.opp||"")}</span>${l&&l.L?`<span class="co-ch">${l.isD?"Pair":"Line"} ${l.L}</span>`:""}${l&&l.pp_unit?`<span class="co-ch">PP${l.pp_unit}</span>`:""}<span class="mut" style="font-size:11px">${et(p.time)}</span></div>
 ${l&&l.mates&&l.mates.length?`<div class="co-st mut"><span>With <b style="color:var(--txt)">${l.mates.map(E).join(" and ")}</b></span>${l.together?`<span>5v5 together: ${l.together.gf} GF, ${l.together.ga} GA in ${l.together.min} min · shots ${l.together.sf}-${l.together.sa}</span>`:""}${l.with?`<span>${l.with.pts} pts in ${l.with.gp} games on this ${l.isD?"pair":"line"}</span>`:""}</div>`:""}
 <div class="co-st mut"><span>PP: <b style="color:var(--txt)">${c.ppp}</b> PPP in ${c.gp} GP${c.prev_gp?` (last season ${c.prev_ppp} in ${c.prev_gp})`:""}</span>${l&&l.pp_toi?`<span>${l.pp_toi} PP min/g (last 3)</span>`:""}${pk?`<span>${E(p.oa)} PK ${ord(pk.rank)} of ${pk.of} (${pk.pk}%)</span>`:""}${p.h2h?`<span>vs ${E(p.oa)}: ${p.h2h.pts} pts, ${p.h2h.ppp} PPP in ${p.h2h.gp}</span>`:""}</div>
 ${(p.co||[]).map(x=>`<div class="corr">💡 ${E(x)}</div>`).join("")}</div>`}
function card(sp){if(sp!="nfl"&&sp!="nhl")return"";load(sp);const d=D[sp];if(!d)return"";
 const A=(sp=="nfl"?d.stacks:d.players).filter(r=>live(r.time)),C=A.filter(r=>r.co&&r.co.length);if(!A.length)return"";
 const show=MORE[sp]?A:C.slice(0,10),rows=show.map(sp=="nfl"?nflRow:nhlRow).join("");
 const t=sp=="nfl"?"🏈 QB + receiver stacks":"🏒 Power play & linemates",
  sub=sp=="nfl"?"How each QB and his receivers do together: games both played for the same team, yards and TDs in those games, and the share of the QB's TD passes that went to the receiver. 💡 = stack callouts.":"Power-play production vs tonight's opponent's penalty kill, plus each skater's current line and PP unit (last 3 games) and how that unit does at 5v5 together. 💡 = callouts.";
 return `<div class="card" style="grid-column:1/-1;min-width:0"><h3>${t}</h3><div class="sub">${sub}</div>${rows||'<div class="mut">No callouts clear the bar for this slate yet.</div>'}
 <button class="co-more" onclick="CO.more('${sp}')">${MORE[sp]?"Show callouts only":"Show all "+A.length+(sp=="nfl"?" stacks":" players")}</button><div class="mut" style="font-size:11px;margin-top:6px">${E(d.note||"")}</div></div>`}
function drawer(sp,r){const d=D[sp];if(!d||!r)return"";
 if(sp=="nfl"){const S=d.stacks.filter(s=>s.rec_aid==r.aid||s.qb_aid==r.aid);if(!S.length)return"";return `<h3 style="margin:18px 0 4px;font-size:14px">QB + receiver stacks</h3>`+S.slice(0,4).map(nflRow).join("")}
 if(sp=="nhl"){const p=d.players.find(x=>x.aid==r.aid);if(!p)return"";return `<h3 style="margin:18px 0 4px;font-size:14px">Power play & linemates</h3>`+nhlRow(p)}return""}
if(!document.getElementById("co-css"))document.head.insertAdjacentHTML("beforeend",CSS);
window.CO={card,drawer,load,more:sp=>{MORE[sp]=!MORE[sp];window.render&&render()}};
})();
