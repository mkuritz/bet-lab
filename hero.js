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
  CACHE=CACHE||Promise.all([j(BL+"edge_tiers.json"),j(BL+"edge_log.jsonl"),j(BL+"edge_grades.json"),j(BL+"edge_stats.json"),j(BL+"called_it.json"),j(ML+"called_it_mlb.json"),j(BL+"chat_calls.json"),j(ML+"slate.json"),j(ML+"hr_scores.json"),j(ML+"k_projections.json")]);const [tiers,log,grades,stats,cBL,cML,cCH,mSl,mHR,mK]=await CACHE;if((el.dataset.sport||"")!==SP)return;
  const L={};(log||[]).forEach(x=>L[x.id]=x);
  const YD=new Date(Date.now()-864e5).toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  const mlbHits=(cML||[]).filter(c=>(c.date||"")>=YD).map(c=>({t:c.title,s:c.stat,p:c.pick,d:c.date,lab:"Official · posted pre-game"}));
  const inScope=x=>!ONLY.has(SP)||x.sport===SP;
  const rec=Object.entries(tiers||{}).filter(([k,v])=>v.tier==="recommended"&&L[k]&&inScope(L[k]));
  const dayOf=([k,v])=>v.day||L[k].start.slice(0,10);
  // Slate = today's picks if any, else the most recent slate (results stay up until the next slate takes over).
  const days=[...new Set(rec.map(dayOf))].sort();const day=days.includes(today)?today:(days.filter(d=>d<today).pop()||days[0]);
  const NOW=Date.now(),asOf=x=>{const m=/as of ([0-9T:+\-Z]+)/.exec(x.price_src||"");const t=Date.parse(m?m[1]:x.logged_at||"");return isNaN(t)?null:t};
  // Picks never vanish before or during their game: pending -> LIVE -> Hit/Miss/Void, kept until the next slate.
  // Guard: an ungraded MLB pick whose game is not on MLB Lab's phase-filtered slate for that day is not shown.
  const MPK=mSl&&Array.isArray(mSl.games)?new Set(mSl.games.map(g=>String(g.pk))):null;
  const mlbOk=(k,x)=>{if(!x.id.startsWith("mlb|")||!MPK||(grades||{})[k])return true;const p=x.id.split("|");return (mSl.date||"")>p[2]||MPK.has(p[3])};
  const top=rec.filter(r=>dayOf(r)===day&&mlbOk(r[0],L[r[0]])).sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0,5);
  if(ONLY.has(SP)&&!top.length){el.hidden=true;el.innerHTML="";return}el.hidden=false;
  const hitT=new Set(mlbHits.map(h=>h.t.split(": ").pop()));
  let h=`<a href="https://betlab.sportslabshq.com/sharp.html" style="display:flex;justify-content:space-between;align-items:center;gap:10px;text-decoration:none;background:#53e3a614;border:1px solid #53e3a655;border-radius:12px;padding:10px 12px;margin-bottom:12px"><span><b style="color:#e6ebf5">💎 Highlighted</b><br><small style="color:#8b97b0">Our highest-conviction plays</small></span><span style="font-weight:800">Open →</span></a><h2>🎯 Highlighted</h2><div class="sub">Our top picks, locked in before the game at a real market price. Updated ${stats&&!isNaN(Date.parse(stats.updated))?new Date(stats.updated).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET":""}</div>`;
  h+=`<h3>${day===today?"Today's top picks":"Latest picks · "+e(new Date(day+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}))}</h3><div class="grid">`;
  const tm=x=>!x||isNaN(Date.parse(x))?"":new Date(x).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  const tmS=x=>new Date(x).toLocaleString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
  const book=src=>{src=src||"book";const m=/^Odds API \(([^,)]+)/.exec(src);return m?m[1]:src.replace(/\s*\(.*\)/,"").replace(/\s+via\s.*$/,"")};
  // Latest market snapshot (display only; the logged price never changes). MLB: MLB Lab's latest board.
  const HRM={},KM={};((mHR&&mHR.players)||[]).forEach(p=>{if(p.market)HRM[p.pk+"|"+p.id]=p.market});((mK&&mK.pitchers)||[]).forEach(p=>{if(p.market)KM[p.pk+"|"+p.id]=p.market});
  const snap=x=>{const p=x.id.split("|");if(p[0]!=="mlb")return null;
    if(p[1]==="hr"){const m=HRM[p[3]+"|"+p[4]],a=m&&(m.ask||m.implied);if(!a||!mHR||(mHR.date||"")!==p[2]||(x.ref&&x.ref.ticker&&m.ticker&&m.ticker!==x.ref.ticker))return null;return {d:1/a,b:m.src||"Kalshi",t:Date.parse(mHR.generated),nv:!m.ask}}
    if(p[1]==="k"){const m=KM[p[3]+"|"+p[4]];if(!m||m.implied_over==null||!mK||(mK.date||"")!==p[2]||(x.ref&&m.line!=null&&+m.line!==+x.ref.line))return null;const i=p[5]==="u"?1-m.implied_over:m.implied_over;return i>0?{d:1/i,b:m.src||"book",t:Date.parse(mK.generated),nv:p[5]==="u"}:null}
    return null};
  const TAG=(c,bg,t)=>` <span class="slh-tag" style="background:${bg};color:${c}">${t}</span>`;
  h+=top.length?top.map(([k,v])=>{const x=L[k],g=(grades||{})[k],res=g&&g.result,started=Date.parse(x.start)<=NOW,won=res==="win"||(!res&&[...hitT].some(n=>x.title.startsWith(n))),our=v.p_cal||x.p_model,ln=x.ref&&x.ref.line!=null?(x.market.includes("HR")?"Yes (1+ HR)":"Over "+x.ref.line):"";
    const lt=asOf(x),sn=!started&&!res?snap(x):null,fresh=sn&&!isNaN(sn.t)&&(!lt||sn.t>lt)?sn:null;
    const st=res==="win"?TAG("#53e3a6","#53e3a622","✓ Hit"):res==="loss"?TAG("#ff6b6b","#ff6b6b22","✗ Miss"):res==="void"||res==="push"?TAG("#8b97b0","#8b97b022",res==="void"?"Void":"Push"):started?TAG("#fff","#e5484d","LIVE"):"";
    const when=started?`Started ${tm(x.start)} ET`:`Starts ${tm(x.start)} ET`;
    const lock=lt?`locked ${tm(new Date(lt).toISOString())} ET`:"locked pre-game";
    const old=!started&&!res&&!fresh&&lt&&NOW-lt>3*36e5;
    return `<div class="c${won?" win":""}"><b>${e(x.title)}</b>${st}<small>${e(x.market)}${ln?" · line "+e(ln):""} · Locked <b style="display:inline">${am(x.price_dec)}</b> at ${e(book(x.price_src))}${fresh?` · now <b style="display:inline">${am(fresh.d)}</b> at ${e(book(fresh.b))}${fresh.nv?" (est.)":""} <span style="opacity:.8">(${tmS(fresh.t)} ET)</span>`:""}</small><div style="display:flex;gap:10px;margin:6px 0;flex-wrap:wrap"><span><small>Book (no-vig)</small><br><b style="display:inline">${pc(x.implied)}</b></span><span><small>Ours</small><br><b style="display:inline">${pc(our)}</b></span><span><small>Edge</small><br><b style="display:inline;color:#53e3a6">${((our-x.implied)*100>0?"+":"")+((our-x.implied)*100).toFixed(1)} pts</b></span></div><small>${when} · ${lock}</small>${old?TAG("#f5b942","#f5b94222","no newer price yet"):""}</div>`}).join(""):`<div class="c"><small>No open highlights right now. New highlights post before each game starts.</small></div>`;
  h+=`</div>`;
  const hits=mlbHits.slice(0,4).concat((cCH||[]).filter(c=>(c.start||"")>=YD).slice(0,2).map(c=>({t:c.title,s:c.result_line,d:"",lab:c.label+" (not in official record)"})));
  if(ONLY.has(SP)){el.innerHTML=h;return}
  h+=`${hits.length?`<h3>✅ Yesterday's hits</h3>`:""}<div class="grid">`+hits.map(x=>`<div class="c win"><b>${e(x.t)}</b><small>${e(x.s)}</small><br><small>${e(x.lab)}${x.d?" · "+e(x.d):""}</small></div>`).join("")+`</div>`;
  const o=stats&&stats.official;if(o&&o.n)h+=`<h3>📈 Official record</h3><div class="grid"><div class="c"><span class="big">${o.wins}-${o.losses}</span><b>Official Highlighted record</b><small>${o.n} graded</small></div></div>`;   // only present when public_flags.show_overall_record is on
  const SPS=new Set(top.map(([k])=>L[k].sport).concat(hits.length&&mlbHits.length?["mlb"]:[]));const srcs=[...SPS].map(s=>"official box scores");
  h+=`<div class="sub" style="margin-top:10px">${srcs.length?"Results from "+[...new Set(srcs)].join(" and ")+". ":""} Not betting advice. 21+. Problem? 1-800-GAMBLER.</div>`;
  el.innerHTML=h;
}
function boot(){document.querySelectorAll("[data-slhero]:not(.slh)").forEach(el=>{el.className="slh";if(window.__blSport)el.dataset.sport=window.__blSport;el.innerHTML='<span class="sub">Loading top highlights…</span>';render(el).catch(()=>el.innerHTML='<span class="sub">Top highlights unavailable right now.</span>')})}
window.SLHero=boot;window.SLHeroSport=sp=>{window.__blSport=sp;document.querySelectorAll("[data-slhero].slh").forEach(el=>{if(el.dataset.sport===sp)return;el.dataset.sport=sp;render(el).catch(()=>{})})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
