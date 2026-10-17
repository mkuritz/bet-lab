// Bet Lab · Live slips: every taken slip + every Bet Lab recommended slip/SGP, all sports, one view.
// Browser-only: ESPN free public scoreboards + box scores (CORS open). No Odds API calls.
(function(){
const PATH={nfl:"football/nfl",cfb:"football/college-football",nhl:"hockey/nhl",mlb:"baseball/mlb",nba:"basketball/nba",soccer:"soccer/"};
const NAME={nfl:"NFL",cfb:"CFB",nhl:"NHL",mlb:"MLB",nba:"NBA",soccer:"Soccer"};
const SOC={goals:["totalGoals"],assists:["goalAssists"],shots:["totalShots"],sot:["shotsOnTarget"],fouls:["foulsCommitted"],saves:["saves"],cards:["yellowCards","redCards"]};
const E=s=>String(s??"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
const S={box:{},gm:{},at:null,timer:null,busy:false,filter:"all"};
const etT=d=>d.toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"})+" ET";
async function jx(u){const r=await fetch(u+(u.includes("?")?"&":"?")+"_="+Math.floor(Date.now()/30000));if(!r.ok)throw new Error(r.status);return r.json()}
const findRow=(sp,aid,mk)=>(window.DATA&&DATA[sp]||[]).find(r=>String(r.aid)==String(aid)&&r.market==mk);
function norm(sp,l){const r=l.aid?findRow(sp,l.aid,l.market):null;return{sport:sp,aid:String(l.aid||r?.aid||""),player:l.player||r?.player,market:l.market,line:l.line!=null?+l.line:(r?r.line:null),stat:l.stat||r?.stat,game:String(l.game||r?.game||""),lg:l.lg||r?.lg,time:r?.time}}
async function collect(){const out=[];
 // 1) your taken slips (saved on this device / account)
 let T=[];try{T=typeof myBets=="function"?myBets():[]}catch(e){}
 T.filter(b=>b.result!="win"&&b.result!="loss"&&b.result!="void").forEach((b,i)=>out.push({kind:"taken",title:(b.legs.length>1?b.legs.length+"-leg slip":"Single"),sub:`stake ${E(b.stake??"1u")}${b.odds?` · ${b.odds>0?"+":""}${E(b.odds)}`:""}`,legs:b.legs.map(l=>norm(l.sport||"nfl",l))}));
 // 2) Bet Lab recommended slips for today, every sport we cover
 for(const sp of ["nfl","cfb","nhl","mlb","nba","soccer"]){try{if(typeof ensure=="function")await ensure(sp);const d=(DATA[sp]||[]);if(!d.length||typeof buildRecs!="function")continue;
   const prev=sport,plg=typeof LG!="undefined"?LG:null;let recs=[];try{sport=sp;if(plg!==null)LG=null;recs=buildRecs(d)||[]}finally{sport=prev;if(plg!==null)LG=plg}
   const today=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
   recs.filter(b=>b.legs.some(r=>r.time&&new Date(r.time).toLocaleDateString("en-CA",{timeZone:"America/New_York"})==today)).slice(0,4).forEach(b=>out.push({kind:"rec",title:`${b.icon||""} ${E(b.head||b.theme)}`,sub:`${NAME[sp]} · ${E(b.theme)} · est. ${Math.round(b.p*100)}%`,legs:b.legs.map(r=>norm(sp,r))}))}catch(e){console.warn("recs",sp,e)}}
 // 3) soccer blowout SGP cards
 ((window.SGP||{}).cards||[]).filter(c=>!c.held).forEach(c=>out.push({kind:"rec",title:`⚽ Blowout SGP: ${E(c.club?.name||c.fav)}`,sub:`Soccer SGP · est. ${c.est!=null?Math.round(c.est*100)+"%":"—"}`,legs:c.legs.map(l=>norm("soccer",{...l,game:c.game,lg:c.lg}))}));
 // 4) Sports Labs logged parlays still pending (the public parlay record)
 ((window.PARL||{}).recent||[]).filter(p=>!p.result||p.result=="pending").forEach(p=>{const ks=String(p.id).split("|")[2]?.split(",")||[];
   out.push({kind:"rec",title:`📒 ${E(p.head||p.theme)}`,sub:`${NAME[p.sport]||p.sport} · logged parlay record`,legs:p.legs.map((l,i)=>{const[aid,mk,ln]=(ks[i]||"").split("~");return norm(p.sport,{...l,aid,market:mk||l.market,line:ln!=null?+ln:l.line})})})});
 return out}
function parseBox(sp,d){const m={};
 if(sp=="soccer"){for(const t of d.rosters||[])for(const p of t.roster||[]){const o=m[p.athlete.id]={_on:p.starter||p.subbedIn,_off:p.subbedOut};for(const s of p.stats||[])o[s.name]=+s.value||0}
  for(const a in m){const o=m[a];for(const k in SOC)o[k]=SOC[k].reduce((x,n)=>x+(o[n]||0),0)}return m}
 for(const t of d.boxscore?.players||[])for(const c of t.statistics||[])for(const a of c.athletes||[]){const o=m[a.athlete.id]||(m[a.athlete.id]={});
  (c.keys||[]).forEach((k,i)=>{const v=a.stats[i];if(k.includes("/")||(k.includes("-")&&String(v).includes("-"))){const sep=k.includes("/")?"/":"-";const[x,y]=k.split(sep),[p,q]=String(v).split(sep);if(o[x]==null)o[x]=+p||0;if(o[y]==null)o[y]=+q||0}
   else if(k=="interceptions"&&c.name&&c.name!="passing"){}else if(o[k]==null)o[k]=+v||0})}
 for(const a in m){const o=m[a];if(sp=="nhl"&&o.points==null&&(o.goals!=null||o.assists!=null))o.points=(o.goals||0)+(o.assists||0)}
 return m}
function frac(sp,g){if(g.state=="post")return 1;if(g.state!="in")return 0;const P=g.period||1,[mm,ss]=String(g.clock||"0:00").split(":").map(Number),left=(mm||0)*60+(ss||0);
 if(sp=="nfl"||sp=="cfb")return Math.min(1,((P-1)*900+900-left)/3600);if(sp=="nba")return Math.min(1,((P-1)*720+720-left)/2880);if(sp=="nhl")return Math.min(1,((P-1)*1200+1200-left)/3600);
 if(sp=="mlb")return Math.min(1,(P-.5)/9);const m=String(g.clock||g.detail||"").match(/(\d+)'/);return /HT/.test(g.detail)?.5:Math.min(1,(m?+m[1]:0)/90)}
const val=(st,stat)=>!st?0:(stat||[]).reduce((a,k)=>a+(k[0]=="-"?-1:1)*(st[k.replace(/^-/,"")]||0),0);
async function poll(){if(S.busy)return;S.busy=true;clearTimeout(S.timer);
 try{S.slips=await collect();const need={};S.slips.forEach(s=>s.legs.forEach(l=>{if(l.game&&l.sport)need[l.sport+"|"+l.game]=l}));
  await Promise.all(Object.entries(need).map(async([k,l])=>{const old=S.gm[k];if(old&&old.state=="post"&&S.box[k])return;const sp=l.sport;
   const path=sp=="soccer"?PATH.soccer+(l.lg||"eng.1"):PATH[sp];if(!path)return;
   try{const d=await jx(`https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${l.game}`);const c=d.header?.competitions?.[0],st=c?.status;
    S.gm[k]={state:st?.type?.state||"pre",detail:st?.type?.shortDetail||"",period:st?.period,clock:st?.displayClock,teams:(c?.competitors||[]).map(t=>({ab:t.team?.abbreviation,score:t.score,ha:t.homeAway})),start:c?.date};
    if(S.gm[k].state!="pre")S.box[k]=parseBox(sp,d)}catch(e){}}));
  S.at=new Date();S.err=null}catch(e){S.err=String(e.message||e)}
 S.busy=false;const live=Object.values(S.gm).some(g=>g.state=="in");S.timer=setTimeout(()=>{if(window.view=="lslips"||(typeof view!="undefined"&&view=="lslips"))poll()},live?30000:5*60000);draw()}
function legState(l){const k=l.sport+"|"+l.game,g=S.gm[k];if(!g)return{st:"pre",html:`<span class="mut">${l.game?"waiting for ESPN":"no game id"}</span>`};
 if(g.state=="pre")return{st:"pre",html:`<span class="mut">${E(g.detail||"not started")}</span>`};
 const box=S.box[k]||{},p=box[l.aid];if(!l.stat||!l.stat.length)return{st:g.state=="post"?"unk":"live",html:`<span class="mut">${E(g.detail)} · no free live stat for this market</span>`};
 const cur=val(p,l.stat),isTD=l.line==null,hit=isTD?cur>=1:cur>l.line,fr=frac(l.sport,g),offd=l.sport=="soccer"&&p&&p._off;
 if(hit)return{st:"hit",cur,html:`<b>${cur}</b> <span class="st hit">✓ HIT</span>`};
 if(g.state=="post"||offd)return{st:"miss",cur,html:`<b>${cur}</b> <span class="st dead">MISSED</span>${offd?' <span class="mut">(subbed off)</span>':""}`};
 const pace=fr>.08?cur/fr:null,tgt=isTD?1:l.line;
 return{st:"live",cur,html:`<b>${cur}</b> <span class="mut">${E(g.detail)}</span>${pace!=null?` · <span class="${pace>tgt?"up":"dn"}">pace ${pace.toFixed(l.sport=="soccer"||l.sport=="nhl"?1:0)}</span>`:""}`,pct:Math.min(100,Math.round(100*cur/Math.max(.5,tgt+.5)))}}
function slipHtml(s){const L=s.legs.map(l=>({l,x:legState(l)}));const n=L.length,h=L.filter(o=>o.x.st=="hit").length,m=L.filter(o=>o.x.st=="miss").length,lv=L.filter(o=>o.x.st=="live").length;
 const status=m?'<span class="st dead">LOST</span>':h==n?'<span class="st hit">✓ CASHED</span>':lv?`<span class="st mo">LIVE · ${h}/${n} hit</span>`:h?`<span class="st mo">${h}/${n} hit</span>`:'<span class="pill">Pending</span>';
 s._st=m?"lost":h==n?"won":lv||h?"live":"pre";
 return `<div class="bun lsb" style="padding:10px 0;border-top:1px solid var(--line,rgba(148,163,184,.2))"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><b>${s.title}</b><br><span class="mut" style="font-size:12px">${s.sub}</span></div><div>${status}</div></div>
 ${L.map(({l,x})=>`<div class="lp" style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:8px;padding:6px 0;font-size:13px"><div><span class="pl">${E(l.player)}</span> <span class="pill" style="font-size:10px">${NAME[l.sport]||E(l.sport)}</span><br><span class="mut">${E(l.market)}${l.line!=null&&!/Anytime/.test(l.market)?" o"+l.line:""}</span></div><div>${x.html}${x.pct!=null?`<div class="pb"><i style="width:${x.pct}%"></i></div>`:""}</div></div>`).join("")}</div>`}
function draw(){const el=document.getElementById("lslips");if(!el||el.hidden)return;if(!S.slips){el.innerHTML='<div class="card empty">Loading every slip and connecting to ESPN live box scores…</div>';return}
 const F=S.filter,ok=s=>F=="all"||(F=="live"?s._st=="live":F=="pre"?s._st=="pre":s._st=="won"||s._st=="lost");
 const tk=S.slips.filter(s=>s.kind=="taken"),rc=S.slips.filter(s=>s.kind=="rec");const th=tk.map(slipHtml),rh=rc.map(slipHtml);
 const tk2=tk.map((s,i)=>ok(s)?th[i]:"").join(""),rc2=rc.map((s,i)=>ok(s)?rh[i]:"").join("");
 el.innerHTML=`<div style="padding:0 20px 20px"><div class="kick">All sports · live slip feed</div><h2 style="margin:4px 0">🧾 Live slips</h2>
 <div class="mut" style="font-size:12px">Every slip you've taken plus today's Bet Lab recommended slips, soccer SGPs and logged parlays, across NFL, CFB, NHL, MLB, NBA and soccer. Leg stats come from ESPN's free box scores${S.at?` · updated ${etT(S.at)}`:""}; refreshes every 30s while games are live. Pace is straight-line, an estimate only.</div>
 <div class="chips" style="margin:10px 0">${[["all","All"],["live","Live"],["pre","Not started"],["done","Settled"]].map(([k,t])=>`<button data-lsf="${k}" class="${F==k?"on":""}">${t}</button>`).join("")}</div>
 <div class="card" data-sl-public style="margin-bottom:12px"><h3>My taken slips</h3>${tk2||`<div class="mut">${tk.length?"No taken slips in this filter.":"No open taken slips. Mark a slip as taken and it shows up here live."}</div>`}</div>
 <div class="card"><h3>Bet Lab recommended slips · today</h3>${rc2||'<div class="mut">No recommended slips in this filter.</div>'}<div class="mut" style="font-size:11px;margin-top:6px">Gaps: markets without a free box-score stat (pitcher strikeouts, outs, hits allowed, tackles) show the game status only. MLB doubles/triples aren't in ESPN's live box. Not betting advice.</div></div></div>`;
 el.querySelectorAll("[data-lsf]").forEach(b=>b.onclick=()=>{S.filter=b.dataset.lsf;draw()})}
window.LiveSlips={view(){draw();poll()},state:S};
})();
