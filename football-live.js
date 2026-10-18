/* Sports Labs shared football live tags (all NFL picks: Anytime TD, Game Day winners/props, defensive props, Value Vault).
   Put FL.tag({g:eventId,a:athleteId,k:"td"|"ov"|"ml",s:"statKey,statKey",l:line,t:team,m:market}) next to a pick.
   Fills from ESPN public summary + game rosters, matched by event id + athlete id. Re-checks every 2 min while any game is live.
   LIVE / ✓ Scored|Hit / ✗ No TD|Miss / Inactive · void, plus one gray line of only the relevant stats. */
(function(){if(window.FL)return;
const E="https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=",R=(g,t)=>`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${g}/competitions/${g}/competitors/${t}/roster?limit=100`;
const st=document.createElement("style");st.textContent=`.fl{display:inline-block;font:800 10.5px/1.4 system-ui,sans-serif;border-radius:5px;padding:1px 6px;margin-left:6px;vertical-align:1px;white-space:nowrap}.fl:empty{display:none}.fl.lv{background:#facc1522;color:#facc15;border:1px solid #facc1555}.fl.w{background:#16a34a;color:#fff}.fl.l{background:#dc262633;color:#f87171;border:1px solid #f8717166}.fl.v{background:#ffffff14;color:#9aa4b8}.fls{display:block;color:#8b97b0;font:500 11.5px/1.35 system-ui,sans-serif;margin-top:1px}.fls:empty{display:none}`;document.head.appendChild(st);
const C={};const get=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
async function load(g){const c=C[g];if(c&&(c.state=="post"||Date.now()-c.at<100e3))return c;
 const s=await get(E+g);if(!s)return c||null;const cp=s.header.competitions[0],o={at:Date.now(),state:cp.status.type.state,detail:cp.status.type.shortDetail,teams:{},box:{},roster:(c&&c.roster)||null};
 cp.competitors.forEach(x=>o.teams[x.team.abbreviation]={id:x.team.id,score:+x.score||0,ha:x.homeAway,win:x.winner});
 (s.boxscore&&s.boxscore.players||[]).forEach(t=>t.statistics.forEach(S=>S.athletes.forEach(a=>{const b=o.box[a.athlete.id]=o.box[a.athlete.id]||{};S.keys.forEach((k,i)=>{const v=a.stats[i];if(k.includes("/")){const [k1,k2]=k.split("/"),[v1,v2]=String(v).split("/");b[k1]=+v1||0;b[k2]=+v2||0}else if(k.includes("-")&&String(v).includes("-")){b[k.split("-")[0]]=parseFloat(String(v).split("-")[0])||0}else b[k]=parseFloat(v)||0})})));
 if(o.state!="pre"&&!o.roster){const rs=await Promise.all(Object.values(o.teams).map(t=>get(R(g,t.id))));if(rs.every(Boolean)){o.roster={};rs.forEach(r=>(r.entries||[]).forEach(e=>o.roster[String(e.playerId)]={dnp:!!e.didNotPlay}));o.rn=rs.map(r=>(r.entries||[]).length)}}
 return C[g]=o}
const n=x=>Math.round(x*10)/10,TDK=["rushingTouchdowns","receivingTouchdowns","kickReturnTouchdowns","puntReturnTouchdowns","fumbleRecoveryTouchdowns"];
function offLine(b,extra){const p=[];if(extra)p.push(extra);if(b.receptions||b.receivingTargets)p.push(`${b.receptions||0} rec · ${b.receivingTargets||0} tgt · ${b.receivingYards||0} yds`);if(b.rushingAttempts)p.push(`${b.rushingAttempts} att · ${b.rushingYards||0} rush yds`);const td=TDK.reduce((s,k)=>s+(b[k]||0),0);if(td)p.push(td+" TD");return p.join(" · ")}
const DEF={totalTackles:"tkl",soloTackles:"solo",sacks:"sacks",interceptions:"INT"};
function grade(o,q){const T=o.teams,score=()=>{const [a,h]=Object.entries(T).sort((x,y)=>x[1].ha=="away"?-1:1);return `${a[0]} ${a[1].score}–${h[1].score} ${h[0]} · ${o.state=="post"?"Final":o.detail}`};
 if(o.state=="pre")return null;
 if(q.k=="ml"){const me=T[q.t],op=Object.entries(T).find(([k])=>k!=q.t);if(!me||!op)return null;const sl=score();if(o.state!="post")return ["lv","LIVE",sl];return me.score==op[1].score?["v","Push",sl]:me.score>op[1].score?["w","✓ Hit",sl]:["l","✗ Miss",sl]}
 const a=String(q.a),b=o.box[a]||{},r=o.roster&&o.roster[a];
 const voided=!o.box[a]&&(r?r.dnp:(o.roster&&o.rn.every(x=>x>=40)));if(voided)return ["v","Inactive · void",""];
 if(q.k=="td"){const td=TDK.reduce((s,k)=>s+(b[k]||0),0),sl=offLine(b);return td>0?["w","✓ Scored",sl]:o.state=="post"?["l","✗ No TD",sl]:["lv","LIVE",sl]}
 const ks=String(q.s||"").split(",").filter(Boolean),v=ks.reduce((s,k)=>s+(b[k]||0),0),L=+q.l;let sl;
 if(ks.some(k=>DEF[k]))sl=ks.map(k=>`${n(b[k]||0)} ${DEF[k]||k}`).join(" · ")+` vs ${L}`;
 else if(ks[0]=="passingYards")sl=offLine(b,`${b.completions||0}/${b.passingAttempts||0} · ${b.passingYards||0} pass yds vs ${L}`);
 else sl=offLine(b)+` · ${n(v)} vs ${L}`;
 return v>L?["w","✓ Hit",sl]:o.state=="post"?["l","✗ Miss",sl]:["lv","LIVE",sl]}
const enc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let tmr=null;
window.FL={tag:q=>`<span class="fl" data-fl="${enc(JSON.stringify(q))}"></span><span class="fls"></span>`,
 status:{},
 run:async function(root){root=root||document;const els=[...root.querySelectorAll("span.fl[data-fl]")];if(!els.length)return;
  const gs=[...new Set(els.map(e=>JSON.parse(e.dataset.fl).g).filter(Boolean))];await Promise.all(gs.map(load));let live=false;
  els.forEach(e=>{const q=JSON.parse(e.dataset.fl),o=C[q.g];const r=o&&grade(o,q);if(o&&o.state=="in")live=true;const sEl=e.nextElementSibling;
   e.className="fl"+(r?" "+r[0]:"");e.textContent=r?r[1]:"";if(sEl&&sEl.classList.contains("fls"))sEl.textContent=r?r[2]:"";e.dataset.st=r?r[0]:"pre";FL.status[q.g+"|"+(q.a||q.t)+"|"+(q.m||q.k)]=r?r[0]:"pre"});
  document.dispatchEvent(new CustomEvent("fl:update"));clearTimeout(tmr);if(live||gs.some(g=>C[g]&&C[g].state=="pre"))tmr=setTimeout(()=>FL.run(root),120e3)}};
})();
