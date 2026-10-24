/* Sports Labs shared live results: stats-only feedback for any pre-stated pick or probability list.
   Usage: put <span data-lr="sport|id|market|line|name"></span> next to a pick (id = ESPN athlete id, or MLB id for MLB; name is the fallback).
   This script fills each span from betlab.sportslabshq.com/data/live_stats.json (refreshed every few minutes during games), re-checks every 60s.
   Output: ✓ / ✗ / ● + stat chips + clock, and a thin progress bar toward the line while live. No narrative text. */
(function(){
if(window.LR)return;
const U="https://betlab.sportslabshq.com/data/live_stats.json";let S=null,T=0;
const nm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ jr\.?| iii| ii/g,"").replace(/[^a-z]/g,"");
const css=`.lr{display:block;font:700 11.5px/1.35 system-ui,sans-serif;margin-top:2px;white-space:normal}.lr.w{color:#4ade80}.lr.l{color:#f87171}.lr.p{color:#facc15}.lr .b{display:block;height:3px;background:#ffffff1a;border-radius:2px;margin-top:2px;max-width:140px}.lr .b i{display:block;height:3px;border-radius:2px;background:currentColor}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
const H=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const v=(o,...k)=>k.reduce((s,x)=>s+(+o[x]||0),0);
// market -> [value fn, default line (strictly greater than)]
const M={"Anytime TD":[o=>v(o,"rushingTouchdowns","receivingTouchdowns"),0.5],"TD":[o=>v(o,"rushingTouchdowns","receivingTouchdowns"),0.5],
 "Passing Yards":[o=>v(o,"passingYards")],"Passing TDs":[o=>v(o,"passingTouchdowns"),0.5],"Passing TDs 1+":[o=>v(o,"passingTouchdowns"),0.5],"Rushing Yards":[o=>v(o,"rushingYards")],"Receiving Yards":[o=>v(o,"receivingYards")],"Receptions":[o=>v(o,"receptions")],
 "Rush + Rec Yards":[o=>v(o,"rushingYards","receivingYards")],
 "Points":[o=>v(o,"goals","assists"),0.5],"Anytime Goal":[o=>v(o,"goals","totalGoals"),0.5],"Goals":[o=>v(o,"goals","totalGoals"),0.5],"Shots on Goal":[o=>v(o,"shotsTotal")],"Assists":[o=>v(o,"assists","goalAssists"),0.5],"Saves":[o=>v(o,"saves")],"Power Play Points":[o=>v(o,"powerPlayGoals"),0.5],
 "Hits":[o=>v(o,"hits"),0.5],"Total Bases":[o=>v(o,"totalBases"),0.5],"HR (1+)":[o=>v(o,"homeRuns"),0.5],"Home Runs":[o=>v(o,"homeRuns"),0.5],"Hits + Runs + RBIs":[o=>v(o,"hits","runs","RBIs")],"RBIs":[o=>v(o,"RBIs"),0.5],"Runs":[o=>v(o,"runs"),0.5],"Strikeouts":[o=>v(o,"strikeouts")],"Singles Hit":[o=>v(o,"hits"),0.5],
 "Shots":[o=>v(o,"totalShots")],"Anytime Assist":[o=>v(o,"goalAssists"),0.5],"1+ Shots on Target":[o=>v(o,"shotsOnTarget"),0.5],"2+ Shots":[o=>v(o,"totalShots"),1.5],"Shots on Target":[o=>v(o,"shotsOnTarget"),0.5]};
function line(sp,o){const c=[];
 if(sp=="nhl"){if("saves" in o&&!("goals" in o))return `${o.saves} SV · ${o.goalsAgainst||0} GA`;return `${o.goals||0}G ${o.assists||0}A · ${o.shotsTotal||0} SOG`}
 if(sp=="mlb"){if("hits" in o)c.push(`${o.hits}-${o.atBats||0}`+(o.homeRuns?` · ${o.homeRuns} HR`:"")+(o.RBIs?` · ${o.RBIs} RBI`:"")+(o.runs?` · ${o.runs} R`:"")+(o.totalBases?` · ${o.totalBases} TB`:""));if("strikeouts" in o)c.push(`${o.ip||0} IP · ${o.strikeouts} K · ${o.earnedRuns||0} ER`);return c.join(" · ")}
 if(sp=="soccer")return `${o.totalGoals||0}G ${o.goalAssists||0}A · ${o.totalShots||0} SH (${o.shotsOnTarget||0} SOT)`;
 if("completions/passingAttempts" in o)c.push(`${o["completions/passingAttempts"]} · ${o.passingYards||0} pass yds · ${o.passingTouchdowns||0} TD`);
 if(o.rushingAttempts)c.push(`${o.rushingAttempts}-${o.rushingYards||0} rush`+(o.rushingTouchdowns?` · ${o.rushingTouchdowns} TD`:""));
 if("receptions" in o)c.push(`${o.receptions}-${o.receivingYards||0} rec`+(o.receivingTouchdowns?` · ${o.receivingTouchdowns} TD`:""));
 if(sp=="nba")return `${o.points||0} PTS · ${o.rebounds||0} REB · ${o.assists||0} AST`;
 return c.join(" · ")||"0 touches"}
function find(sp,id,name){if(!S)return null;let p=id&&S.p[sp+"|"+id];if(!p&&name){const a=S.n[sp+"|"+nm(name)];if(a)p=S.p[sp+"|"+a]}return p}
window.LR={
 // returns HTML (or "" when the player's game hasn't started)
 html(sp,id,market,ln,name,side,st,gid){const p=find(sp,id,name);if(!p)return"";const g=S.g[sp+"|"+p[0]];if(!g||(g[0]!="in"&&g[0]!="post"))return"";
  /* Only grade the pick's own game: same event id when known, else same start (or same ET date), and never before the pick's start. */
  if(gid&&/^4\d{8}$/.test(String(gid))&&String(gid)!=String(p[0]))return"";
  const ymd=t=>new Date(t).toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  if(st&&/^\d{4}-\d{2}-\d{2}$/.test(st)){if(!g[6]||ymd(g[6])!=st)return""}
  else if(st){const t=new Date(st).getTime();if(isNaN(t)||t>Date.now()+5*60e3)return"";if(!g[6]||Math.abs(new Date(g[6]).getTime()-t)>3*3600e3)return""}
  else{if(!g[6])return"";const gs=new Date(g[6]).getTime();if(!(g[0]=="in"||(Date.now()-gs<20*3600e3&&ymd(gs)==ymd(Date.now()))))return""}
  if(!side&&/\bunder\b|\|under\|/i.test(String(market||"")))side="under";
  const o=p[1],fin=g[0]=="post";
  const m=M[market]||M[(market||"").replace(/ over.*$/i,"")];let mark="",cls="p",bar="";
  if(m){const L=ln!=null&&ln!==""&&!isNaN(+ln)?+ln:(m[1]??0.5),x=m[0](o),under=/^(under|no|u)$/i.test(side||"");const hit=under?(x<=L):(x>L);
   if(under){cls=fin?(hit?"w":"l"):(x>L?"l":"p");mark=cls=="w"?"✓":cls=="l"?"✗":"●"}
   else{cls=hit?"w":fin?"l":"p";mark=hit?"✓":fin?"✗":"●";if(!hit&&!fin){const need=Math.floor(L)+1;bar=`<span class="b"><i style="width:${Math.min(100,Math.round(100*x/need))}%"></i></span>`}}}
  else mark=fin?"■":"●";
  return `<span class="lr ${cls}">${mark} ${H(line(sp,o))} · ${H(g[1])}${bar}</span>`},
 async pull(){try{const r=await fetch(U+"?t="+Math.floor(Date.now()/60000));if(r.ok){const j=await r.json(),p=S&&JSON.stringify(S.g);S=j;T=Date.now();if(window.render&&p!==JSON.stringify(j.g))try{window.render()}catch(e){}}}catch(e){}},
 fill(root){if(!S)return;(root||document).querySelectorAll("[data-lr]").forEach(el=>{const [sp,id,mk,ln,name,side,st,gid]=el.dataset.lr.split("|");const h=LR.html(sp,id,mk,ln,name,side,st,gid);if(el._h!==h){el._h=h;el.innerHTML=h}})},
/* side: "over"|"under"|"yes"|"no"; st: pick start (ISO or YYYY-MM-DD ET); gid: ESPN event id */
 tag(sp,id,market,ln,name,side,st,gid){const e=s=>String(s??"").replace(/[|"<>&]/g,"");return `<span data-lr="${e(sp)}|${e(id)}|${e(market)}|${e(ln)}|${e(name)}|${e(side)}|${e(st)}|${e(gid)}">${S?LR.html(sp,id,market,ln,name,side,st,gid):""}</span>`},
 get data(){return S}};
const tick=async()=>{await LR.pull();LR.fill()};tick();setInterval(tick,60000);
new MutationObserver(()=>{if(S){clearTimeout(LR._t);LR._t=setTimeout(()=>LR.fill(),50)}}).observe(document.documentElement,{childList:true,subtree:true});
})();
