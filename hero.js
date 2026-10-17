/* Sports Labs hero: official top picks, recent hits, proven numbers. Shared by Bet Lab, Edge Tracker, MLB Lab, Sports Labs home. */
(function(){
const BL="https://betlab.sportslabshq.com/data/",ML="https://mlblab.sportslabshq.com/data/";
const css=`.slh{font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e6ebf5;background:linear-gradient(135deg,#0f1a2e,#0b1220);border:1px solid #2a3a5c;border-radius:16px;padding:16px;margin:12px auto;max-width:1150px;box-sizing:border-box}
.slh *{box-sizing:border-box}.slh h2{margin:0 0 2px;font-size:19px}.slh h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#8b97b0;margin:14px 0 6px}
.slh .sub{color:#8b97b0;font-size:12px}.slh .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px}
.slh .c{background:#121a2c;border:1px solid #243049;border-radius:12px;padding:10px 12px;min-width:0}.slh .c b{display:block}.slh .c small{color:#8b97b0;font-size:11.5px}
.slh .win{border-color:#53e3a655;background:#53e3a60d}.slh .slh-tag{font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px;background:#53e3a622;color:#53e3a6;white-space:nowrap}
.slh .big{font-size:20px;font-weight:800;color:#53e3a6}.slh a{color:#53e3a6}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
const e=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const j=u=>fetch(u+"?t="+Date.now()).then(r=>r.ok?(u.endsWith(".jsonl")?r.text().then(t=>t.trim().split("\n").filter(Boolean).map(JSON.parse)):r.json()):null).catch(()=>null);
const am=d=>!d?"":d>=2?"+"+Math.round((d-1)*100):"-"+Math.round(100/(d-1));
const pc=x=>(x*100).toFixed(1)+"%",sg=x=>(x>0?"+":"")+(x*100).toFixed(1)+"%";
const today=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
const ONLY=new Set(["mlb","nhl","nba","soccer","cfb"]);let CACHE=null;
async function render(el){const SP=el.dataset.sport||"";if(SP==="analyst"){el.hidden=true;el.innerHTML="";return}
  CACHE=CACHE||Promise.all([j(BL+"edge_tiers.json"),j(BL+"edge_log.jsonl"),j(BL+"edge_grades.json"),j(BL+"edge_stats.json"),j(BL+"called_it.json"),j(ML+"called_it_mlb.json"),j(BL+"chat_calls.json")]);const [tiers,log,grades,stats,cBL,cML,cCH]=await CACHE;if((el.dataset.sport||"")!==SP)return;
  const L={};(log||[]).forEach(x=>L[x.id]=x);
  const YD=new Date(Date.now()-864e5).toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  const mlbHits=(cML||[]).filter(c=>(c.date||"")>=YD).map(c=>({t:c.title,s:c.stat,p:c.pick,d:c.date,lab:"Official · posted pre-game"}));
  const rec=Object.entries(tiers||{}).filter(([k,v])=>v.tier==="recommended"&&L[k]);
  const days=[...new Set(rec.map(([k,v])=>v.day||L[k].start.slice(0,10)))].sort();const day=days.includes(today)?today:days[days.length-1];
  const top=rec.filter(([k,v])=>(v.day||L[k].start.slice(0,10))===day&&(!ONLY.has(SP)||L[k].sport===SP)).sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0,5);
  if(ONLY.has(SP)&&!top.length){el.hidden=true;el.innerHTML="";return}el.hidden=false;
  const hitT=new Set(mlbHits.map(h=>h.t.split(": ").pop()));
  let h=`<h2>🎯 Sports Labs Recommended</h2><div class="sub">Our top picks, locked in before the game at a real market price. Updated ${stats?new Date(stats.updated).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET":""}</div>`;
  h+=`<h3>${day===today?"Today's top picks":"Latest top picks ("+e(day||"—")+")"}</h3><div class="grid">`;
  const tm=x=>new Date(x).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  h+=top.length?top.map(([k,v])=>{const x=L[k],g=(grades||{})[k],won=(g&&g.result==="win")||[...hitT].some(n=>x.title.startsWith(n)),our=v.p_cal||x.p_model,ln=x.ref&&x.ref.line!=null?(x.market.includes("HR")?"Yes (1+ HR)":"Over "+x.ref.line):"";
    return `<div class="c${won?" win":""}"><b>${e(x.title)}</b><small>${e(x.market)}${ln?" · line "+e(ln):""} · <b style="display:inline">${am(x.price_dec)}</b> at ${e((x.price_src||"book").replace(/\s*\(.*\)/,""))}</small><div style="display:flex;gap:10px;margin:6px 0;flex-wrap:wrap"><span><small>Book (no-vig)</small><br><b style="display:inline">${pc(x.implied)}</b></span><span><small>Ours</small><br><b style="display:inline">${pc(our)}</b></span><span><small>Edge</small><br><b style="display:inline;color:#53e3a6">${((our-x.implied)*100>0?"+":"")+((our-x.implied)*100).toFixed(1)} pts</b></span></div><small>as of ${tm(x.logged_at)} ET</small>${won?' <span class="slh-tag">✅ HIT</span>':g&&g.result==="loss"?' <small>· missed</small>':""}</div>`}).join(""):`<div class="c"><small>Today's Recommended picks post before first pitch / puck drop.</small></div>`;
  h+=`</div>`;
  const hits=mlbHits.slice(0,4).concat((cCH||[]).filter(c=>(c.start||"")>=YD).slice(0,2).map(c=>({t:c.title,s:c.result_line,d:"",lab:c.label+" (not in official record)"})));
  if(ONLY.has(SP)){el.innerHTML=h;return}
  h+=`${hits.length?`<h3>✅ Yesterday's hits</h3>`:""}<div class="grid">`+hits.map(x=>`<div class="c win"><b>${e(x.t)}</b><small>${e(x.s)}</small><br><small>${e(x.lab)}${x.d?" · "+e(x.d):""}</small></div>`).join("")+`</div>`;
  const o=stats&&stats.official;if(o&&o.n)h+=`<h3>📈 Official record</h3><div class="grid"><div class="c"><span class="big">${o.wins}-${o.losses}</span><b>Official Recommended record</b><small>${o.n} graded</small></div></div>`;   // only present when public_flags.show_overall_record is on
  h+=`<div class="sub" style="margin-top:10px">Results from MLB Stats API and ESPN box scores. Not betting advice. 21+. Problem? 1-800-GAMBLER.</div>`;
  el.innerHTML=h;
}
function boot(){document.querySelectorAll("[data-slhero]:not(.slh)").forEach(el=>{el.className="slh";if(window.__blSport)el.dataset.sport=window.__blSport;el.innerHTML='<span class="sub">Loading top picks…</span>';render(el).catch(()=>el.innerHTML='<span class="sub">Top picks unavailable right now.</span>')})}
window.SLHero=boot;window.SLHeroSport=sp=>{window.__blSport=sp;document.querySelectorAll("[data-slhero].slh").forEach(el=>{if(el.dataset.sport===sp)return;el.dataset.sport=sp;render(el).catch(()=>{})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
