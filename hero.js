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
  CACHE=CACHE||Promise.all([j(BL+"edge_tiers.json"),j(BL+"edge_log.jsonl"),j(BL+"edge_grades.json"),j(BL+"edge_stats.json"),j(BL+"called_it.json"),j(ML+"called_it_mlb.json"),j(BL+"chat_calls.json"),j(ML+"slate.json")]);const [tiers,log,grades,stats,cBL,cML,cCH,mSl]=await CACHE;if((el.dataset.sport||"")!==SP)return;
  const L={};(log||[]).forEach(x=>L[x.id]=x);
  const YD=new Date(Date.now()-864e5).toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  const mlbHits=(cML||[]).filter(c=>(c.date||"")>=YD).map(c=>({t:c.title,s:c.stat,p:c.pick,d:c.date,lab:"Official · posted pre-game"}));
  const rec=Object.entries(tiers||{}).filter(([k,v])=>v.tier==="recommended"&&L[k]);
  const days=[...new Set(rec.map(([k,v])=>v.day||L[k].start.slice(0,10)))].sort();const day=days.includes(today)?today:days[days.length-1];
  const NOW=Date.now(),asOf=x=>{const m=/as of ([0-9T:+\-Z]+)/.exec(x.price_src||"");const t=Date.parse(m?m[1]:x.logged_at||"");return isNaN(t)?null:t};
  // Today's open picks only: not graded, not started, and the price is under 12 hours old.
  // MLB picks must belong to a game on MLB Lab's phase-filtered slate (remaining postseason games only; none in the offseason).
  const MPK=mSl&&Array.isArray(mSl.games)?new Set(mSl.games.map(g=>String(g.pk))):null,mlbOk=x=>!x.id.startsWith("mlb|")||!MPK||MPK.has(x.id.split("|")[3]);
  const top=rec.filter(([k,v])=>mlbOk(L[k])&&day===today&&(v.day||L[k].start.slice(0,10))===day&&(!ONLY.has(SP)||L[k].sport===SP)&&!(grades||{})[k]&&Date.parse(L[k].start)>NOW&&asOf(L[k])&&NOW-asOf(L[k])<12*36e5).sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0,5);
  if(ONLY.has(SP)&&!top.length){el.hidden=true;el.innerHTML="";return}el.hidden=false;
  const hitT=new Set(mlbHits.map(h=>h.t.split(": ").pop()));
  let h=`<a href="https://betlab.sportslabshq.com/sharp.html" style="display:flex;justify-content:space-between;align-items:center;gap:10px;text-decoration:none;background:#53e3a614;border:1px solid #53e3a655;border-radius:12px;padding:10px 12px;margin-bottom:12px"><span><b style="color:#e6ebf5">💎 Sharp Picks</b><br><small style="color:#8b97b0">Our highest-conviction plays</small></span><span style="font-weight:800">Open →</span></a><h2>🎯 Sports Labs Recommended</h2><div class="sub">Our top picks, locked in before the game at a real market price. Updated ${stats&&!isNaN(Date.parse(stats.updated))?new Date(stats.updated).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET":""}</div>`;
  h+=`<h3>Today's top picks</h3><div class="grid">`;
  const tm=x=>!x||isNaN(Date.parse(x))?"":new Date(x).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  h+=top.length?top.map(([k,v])=>{const x=L[k],g=(grades||{})[k],won=(g&&g.result==="win")||[...hitT].some(n=>x.title.startsWith(n)),our=v.p_cal||x.p_model,ln=x.ref&&x.ref.line!=null?(x.market.includes("HR")?"Yes (1+ HR)":"Over "+x.ref.line):"";
    return `<div class="c${won?" win":""}"><b>${e(x.title)}</b><small>${e(x.market)}${ln?" · line "+e(ln):""} · <b style="display:inline">${am(x.price_dec)}</b> at ${e((x.price_src||"book").replace(/\s*\(.*\)/,""))}</small><div style="display:flex;gap:10px;margin:6px 0;flex-wrap:wrap"><span><small>Book (no-vig)</small><br><b style="display:inline">${pc(x.implied)}</b></span><span><small>Ours</small><br><b style="display:inline">${pc(our)}</b></span><span><small>Edge</small><br><b style="display:inline;color:#53e3a6">${((our-x.implied)*100>0?"+":"")+((our-x.implied)*100).toFixed(1)} pts</b></span></div><small>Starts ${tm(x.start)} ET · price as of ${tm(new Date(asOf(x)).toISOString())} ET</small>${NOW-asOf(x)>3*36e5?' <span class="slh-tag" style="background:#f5b94222;color:#f5b942">stale price</span>':""}</div>`}).join(""):`<div class="c"><small>No open picks right now. New picks post before each game starts.</small></div>`;
  h+=`</div>`;
  const hits=mlbHits.slice(0,4).concat((cCH||[]).filter(c=>(c.start||"")>=YD).slice(0,2).map(c=>({t:c.title,s:c.result_line,d:"",lab:c.label+" (not in official record)"})));
  if(ONLY.has(SP)){el.innerHTML=h;return}
  h+=`${hits.length?`<h3>✅ Yesterday's hits</h3>`:""}<div class="grid">`+hits.map(x=>`<div class="c win"><b>${e(x.t)}</b><small>${e(x.s)}</small><br><small>${e(x.lab)}${x.d?" · "+e(x.d):""}</small></div>`).join("")+`</div>`;
  const o=stats&&stats.official;if(o&&o.n)h+=`<h3>📈 Official record</h3><div class="grid"><div class="c"><span class="big">${o.wins}-${o.losses}</span><b>Official Recommended record</b><small>${o.n} graded</small></div></div>`;   // only present when public_flags.show_overall_record is on
  const SPS=new Set(top.map(([k])=>L[k].sport).concat(hits.length&&mlbHits.length?["mlb"]:[]));const srcs=[...SPS].map(s=>"official box scores");
  h+=`<div class="sub" style="margin-top:10px">${srcs.length?"Results from "+[...new Set(srcs)].join(" and ")+". ":""} Not betting advice. 21+. Problem? 1-800-GAMBLER.</div>`;
  el.innerHTML=h;
}
function boot(){document.querySelectorAll("[data-slhero]:not(.slh)").forEach(el=>{el.className="slh";if(window.__blSport)el.dataset.sport=window.__blSport;el.innerHTML='<span class="sub">Loading top picks…</span>';render(el).catch(()=>el.innerHTML='<span class="sub">Top picks unavailable right now.</span>')})}
window.SLHero=boot;window.SLHeroSport=sp=>{window.__blSport=sp;document.querySelectorAll("[data-slhero].slh").forEach(el=>{if(el.dataset.sport===sp)return;el.dataset.sport=sp;render(el).catch(()=>{})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
