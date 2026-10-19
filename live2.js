// Bet Lab live tracker for College Football + Soccer (same UX as the NFL tracker).
// Browser polls ESPN's free public scoreboard + match summaries (CORS open). No Odds API calls, nothing server-side.
(function(){
const PATH={nfl:"football/nfl",nhl:"hockey/nhl",mlb:"baseball/mlb",nba:"basketball/nba"},GEN=sp=>!!PATH[sp];
const SB={cfb:"https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300",soccer:lg=>`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg}/scoreboard`};
const SUM={cfb:id=>"https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event="+id,soccer:(lg,id)=>`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg}/summary?event=${id}`};
const SOC_KEY={goals:["totalGoals"],assists:["goalAssists"],shots:["totalShots"],sot:["shotsOnTarget"],fouls:["foulsCommitted"],saves:["saves"],cards:["yellowCards","redCards"]};
const S={};["nfl","cfb","nhl","mlb","nba","soccer"].forEach(k=>S[k]={games:[],box:{},ev:{},at:null,err:null,timer:null,picks:null});
const LAB={nfl:"NFL",cfb:"College football",nhl:"NHL",mlb:"MLB",nba:"NBA",soccer:"Soccer"};
const E=s=>String(s??"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
const P=x=>x==null?"—":Math.round(x*100)+"%";
const etT=d=>d.toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",second:"2-digit"})+" ET";
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"}),eday=t=>new Date(t).toLocaleDateString("en-CA",{timeZone:"America/New_York"});
async function jx(u){const r=await fetch(u+(u.includes("?")?"&":"?")+"_="+Math.floor(Date.now()/30000));if(!r.ok)throw new Error(r.status);return r.json()}
const taken=()=>{try{return JSON.parse(localStorage.getItem((window.LS||"bl_")+"taken")||"[]")}catch(e){return[]}};
function slipsFor(sp){try{return (typeof myBets=="function"?myBets():taken())}catch(e){return[]}}
// tracked picks = Bet Lab's own logged recommendations (data/edge_log.jsonl, the same log the public record grades)
async function loadPicks(sp){if(S[sp].picks)return S[sp].picks;let L=[];
 try{const t=await (await fetch("data/edge_log.jsonl?v="+Date.now())).text();const TI=await j("data/edge_tiers.json",{});
  for(const ln of t.split("\n")){if(!ln.trim())continue;let e;try{e=JSON.parse(ln)}catch(_){continue}
   if(e.sport!=sp||Math.abs(new Date(e.start)-Date.now())>20*36e5)continue;e.tier=(TI[e.id]||{}).tier||"research";L.push(e)}}catch(e){}
 if(sp=="soccer"){await ensure("soccer");const out=[];
  for(const e of L){const rec=(e.ref&&e.ref.rec)||"";const legs=rec.split("|").slice(2).join("|").split(",").map(x=>x.split("~"));
   const rows=legs.map(([aid,mk,ln])=>{const r=(DATA.soccer||[]).find(r=>r.aid==aid&&r.market==mk);return r?{r,aid,market:mk,line:+ln,stat:r.stat,player:r.player,game:r.game,lg:r.lg,team:r.team}:null});
   if(rows.every(Boolean)&&rows.length)out.push({...e,legs:rows})}L=out}
 else L=L.map(e=>({...e,legs:e.ref&&e.ref.aid?[{aid:e.ref.aid,stat:e.ref.stat,line:e.ref.line,player:e.ref.player,game:e.ref.game,market:e.market}]:[]}));
 try{if(window.TE&&TE.plays){if(GEN(sp)||sp=="soccer")await ensure(sp);const have=new Set(L.flatMap(e=>(e.legs||[]).map(l=>l.aid+"|"+l.market)));
  TE.plays.filter(p=>p.sport==sp&&p.aid&&p.market&&!have.has(p.aid+"|"+p.market)).forEach(p=>{const r=(DATA[sp]||[]).find(r=>r.aid==p.aid&&r.market==p.market);
   L.push({id:p.id,title:p.title,tier:p.official?"recommended":"edge",start:p.start,ref:{game:String(p.game)},legs:[{aid:p.aid,stat:r?r.stat:null,line:p.line,player:p.player,game:String(p.game),market:p.market}]})})}}catch(e){}
 return S[sp].picks=L}
const gameOf=e=>e.ref?.game||(e.legs&&e.legs[0]&&e.legs[0].game);
function parseEv(e,sp){const c=e.competitions[0],st=c.status;return{id:e.id,name:e.shortName,state:st.type.state,detail:st.type.shortDetail,period:st.period,clock:st.displayClock,start:e.date,lg:e._lg,
 teams:c.competitors.map(t=>({ab:t.team.abbreviation,id:t.team.id,name:t.team.displayName,score:+t.score||0,ha:t.homeAway,rank:t.curatedRank&&t.curatedRank.current<26?t.curatedRank.current:null})),sit:window.LiveEv?LiveEv.sbSit(c):null}}
function done(g,sp){if(g.state=="post")return 1;if(g.state!="in")return 0;
 if(sp=="nfl"||sp=="nhl"||sp=="nba"){const pl=sp=="nhl"?1200:sp=="nba"?720:900,np=sp=="nhl"?3:4,[m,s]=String(g.clock||"0:00").split(":").map(Number);return Math.min(1,((g.period-1)*pl+(pl-((m||0)*60+(s||0))))/(pl*np))}
 if(sp=="mlb")return Math.min(1,Math.max(0,((g.period||1)-1+(/Bot|Mid|End/.test(g.detail||"")?.5:0))/9));
 if(sp=="cfb"){const[m,s]=String(g.clock||"0:00").split(":").map(Number);return Math.min(1,((g.period-1)*900+(900-((m||0)*60+(s||0))))/3600)}
 const mm=String(g.clock||"").match(/(\d+)'(?:\+(\d+))?/);let m=mm?+mm[1]:0;if(/HT/.test(g.detail))m=45;return Math.min(1,m/90)}
const clk=(g,sp)=>sp=="mlb"?(g.detail||""):sp=="nhl"?(g.period>3?"OT ":"P"+g.period+" ")+g.clock:(sp=="cfb"||sp=="nfl"||sp=="nba")?(g.period>4?"OT ":"Q"+g.period+" ")+g.clock:(/HT/.test(g.detail)?"HT":g.clock);
function boxCfb(d){const m={};for(const t of d.boxscore?.players||[])for(const c of t.statistics||[])for(const a of c.athletes||[]){const o=m[a.athlete.id]||(m[a.athlete.id]={_n:a.athlete.displayName,_t:t.team.abbreviation});
  c.keys.forEach((k,i)=>{const v=a.stats[i];if(k.includes("/")){const[x,y]=k.split("/"),[p,q]=String(v).split("/");o[x]=+p;o[y]=+q}else if(!(k=="interceptions"&&c.name!="passing"))o[k]=+v||0})}return m}
function boxGen(d,sp){const m={};for(const t of d.boxscore?.players||[])for(const c of t.statistics||[])for(const a of c.athletes||[]){const o=m[a.athlete.id]||(m[a.athlete.id]={_n:a.athlete.displayName,_t:t.team.abbreviation});
  (c.keys||[]).forEach((k,i)=>{const v=(a.stats||[])[i];if(k.includes("-")&&sp!="mlb"){const[x,y]=k.split("-"),[p,q]=String(v).split("-");if(o[x]==null)o[x]=+p;if(o[y]==null)o[y]=+q}else if(o[k]==null)o[k]=+v||0})}
 if(sp=="nhl")for(const a in m)m[a].points=(m[a].goals||0)+(m[a].assists||0);return m}
function evGen(d){return (d.plays||d.scoringPlays||[]).filter(p=>p.scoringPlay).map(p=>({t:(p.period?.displayValue||("P"+(p.period?.number||"")))+" "+(p.clock?.displayValue||""),x:p.type?.text||"Score",txt:p.text||""}))}
function boxSoc(d){const m={};for(const t of d.rosters||[])for(const p of t.roster||[]){const o=m[p.athlete.id]={_n:p.athlete.displayName,_t:t.team?.abbreviation,_on:p.starter||p.subbedIn,_off:p.subbedOut};for(const s of p.stats||[])o[s.name]=+s.value||0}
 for(const a in m){const o=m[a];for(const k in SOC_KEY)o[k]=SOC_KEY[k].reduce((x,n)=>x+(o[n]||0),0)}return m}
function evSoc(d){return (d.keyEvents||[]).filter(k=>/Goal|Yellow|Red|Penalty/.test(k.type?.text||"")&&!/Delay/.test(k.type?.text||"")).map(k=>({t:k.clock?.displayValue||"",x:k.type.text,txt:(k.text||"").replace(/^Goal! [^.]*\.\s*/,"")}))}
function evCfb(d){return (d.scoringPlays||[]).map(p=>({t:(p.period?"Q"+p.period.number:"")+" "+(p.clock?.displayValue||""),x:p.type?.text||"Score",txt:p.text||""}))}
async function poll(sp){const L=S[sp];clearTimeout(L.timer);
 try{const picks=await loadPicks(sp),slips=slipsFor(sp).filter(b=>b.legs.some(l=>l.sport==sp));let ev=[];
  if(sp=="cfb"){const d=await jx(SB.cfb);ev=(d.events||[]).map(e=>parseEv(e,sp))}
  else if(GEN(sp)){const d=await jx(`https://site.api.espn.com/apis/site/v2/sports/${PATH[sp]}/scoreboard`);ev=(d.events||[]).map(e=>parseEv(e,sp))}
  else{await ensure("soccer");const lgs=new Set((DATA.soccer||[]).filter(r=>eday(r.time)==today()).map(r=>r.lg));picks.forEach(p=>p.legs.forEach(l=>lgs.add(l.lg)));
   slips.forEach(b=>b.legs.forEach(l=>{if(l.sport=="soccer"){const r=find("soccer",l.aid+"|"+l.market);if(r)lgs.add(r.lg)}}));
   const rs=await Promise.all([...lgs].map(lg=>jx(SB.soccer(lg)).then(d=>(d.events||[]).map(e=>(e._lg=lg,parseEv(e,sp)))).catch(()=>[])));ev=rs.flat()}
  // which games to open: CFB desk games / tracked picks / your slips (soccer: covered matches with picks, slips or props)
  const want=new Set(picks.map(gameOf));slips.forEach(b=>b.legs.forEach(l=>{if(l.sport==sp)want.add(String(l.game))}));
  if(sp=="cfb"&&typeof CFBD!="undefined"&&CFBD&&CFBD.games)CFBD.games.forEach(g=>want.add(g.id));
  if(sp=="soccer"||GEN(sp)){if(GEN(sp))await ensure(sp);(DATA[sp]||[]).forEach(r=>want.add(String(r.game)))}
  ev.forEach(g=>g.tracked=want.has(g.id));
  L.games=ev;const live=ev.filter(g=>g.tracked&&(g.state=="in"||(g.state=="post"&&Date.now()-new Date(g.start)<4*36e5))).slice(0,16);
  await Promise.all(live.map(async g=>{if(g.state=="post"&&L.box[g.id]&&L.box[g.id]._final)return;try{const d=await jx(sp=="cfb"?SUM.cfb(g.id):GEN(sp)?`https://site.api.espn.com/apis/site/v2/sports/${PATH[sp]}/summary?event=${g.id}`:SUM.soccer(g.lg,g.id));
   L.box[g.id]=sp=="cfb"?boxCfb(d):GEN(sp)?boxGen(d,sp):boxSoc(d);L.ev[g.id]=sp=="cfb"?evCfb(d):GEN(sp)?evGen(d):evSoc(d);if(window.LiveEv)LiveEv.ingest(sp+"|"+g.id,sp,d);if(g.state=="post")L.box[g.id]._final=1}catch(e){}}));
  L.err=null;L.at=new Date();L.timer=setTimeout(()=>poll(sp),ev.some(g=>g.tracked&&g.state=="in")?60000:10*60000);
 }catch(e){L.err=String(e.message||e);L.timer=setTimeout(()=>poll(sp),120000)}
 if(view=="live"&&sport==sp)draw(sp);window.liveBadge&&liveBadge()}
const val=(st,stat)=>!st?0:(stat||[]).reduce((a,k)=>a+(k[0]=="-"?-1:1)*(st[k.replace(/^-/,"")]||0),0);
function chance(sp,leg,cur,g){const isTD=leg.line==null,target=isTD?1:Math.floor(leg.line)+1,need=target-cur;if(need<=0)return 1;const fr=done(g,sp),rem=Math.max(0,1-fr);if(g.state=="post"||rem<=0)return 0;
 const r=find(sp,leg.aid+"|"+leg.market);const vs=(r&&r.games||[]).slice(0,20).map(x=>x.v).filter(v=>v!=null);if(!vs.length)return null;const m=vs.reduce((a,b)=>a+b,0)/vs.length;
 return pois(m*rem,need)}
function legRow(sp,leg,g,tag){const st=(S[sp].box[g.id]||{})[leg.aid],cur=val(st,leg.stat),isTD=leg.line==null,hit=isTD?cur>=1:cur>leg.line,fr=done(g,sp);
 const off=sp=="soccer"&&st&&(st._off||!st._on),dead=!hit&&(g.state=="post"||(sp=="soccer"&&st&&st._off)),ch=hit?1:off?0:chance(sp,leg,cur,g),pace=fr>.08&&!isTD&&cur>0?cur/fr:null,tgt=isTD?"1+ TD":(sp=="soccer"&&leg.line==.5?leg.market:"over "+leg.line);
 const pct=Math.min(100,Math.round(100*cur/Math.max(.5,isTD?1:leg.line+.5))),onf=sp=="soccer"&&st&&st._off?' <span class="mut">(subbed off)</span>':sp=="soccer"&&st&&!st._on?' <span class="mut">(bench)</span>':"";
 return `<div class="lp"><div><span class="pl">${E(leg.player)}</span>${tag||""}<br><span class="mut">${E(leg.market)} ${isTD?"":leg.line}</span>${hit?'<span class="st hit">✓ HIT</span>':dead?'<span class="st dead">MISSED</span>':""}${onf}</div>
 <div><b>${st?cur:0}</b> <span class="mut">now · ${E(clk(g,sp))}</span><div class="pb"><i class="${hit?"ok":dead?"dead":""}" style="width:${pct}%"></i></div></div>
 <div>${ch!=null?`<b>${P(ch)}</b> <span class="mut">live chance to reach ${E(tgt)}</span>`:`<span class="mut">target ${E(tgt)}</span>`}${pace!=null&&!hit?`<br><span class="mut">On pace for ${pace.toFixed(sp=="soccer"?1:0)} (straight-line, ${Math.round((1-fr)*100)}% of game left)</span>`:""}${ch!=null&&!hit&&!off?`<br><span class="mut">Model: his per-game average (last ≤20) scaled to time left, Poisson. Estimate, not odds.</span>`:""}</div></div>`}
function teamPick(sp,e,g){const side=e.ref?.side,t=g.teams.find(x=>x.ha==side),o=g.teams.find(x=>x.ha!=side);if(!t)return"";const mg=t.score-o.score;
 const s=g.state=="post"?(mg>0?'<span class="st hit">✓ WON</span>':mg<0?'<span class="st dead">LOST</span>':'<span class="st dead">DRAW</span>'):mg>0?`<span class="st hit">LEADING +${mg}</span>`:mg<0?`<span class="st" style="background:var(--bad);color:#fff">TRAILING ${mg}</span>`:'<span class="st mo">TIED</span>';
 return `<div class="lp"><div><span class="pl">${E(e.title)}</span>${tierTag(e)}</div><div><b>${E(t.ab)} ${t.score} – ${o.score} ${E(o.ab)}</b> <span class="mut">${E(clk(g,sp))}</span></div><div>${s}</div></div>`}
const tierTag=e=>e.tier=="edge"?' <span class="pill" style="background:#53e3a622;color:#53e3a6">TODAY\'S EDGE</span>':e.tier=="recommended"?' <span class="pill y" title="Official pick on the public record">OFFICIAL</span>':' <span class="pill" title="Research pick (logged, not on the official record)">research</span>';
function slipsCard(sp){const T=slipsFor(sp).filter(b=>b.result!="win"&&b.result!="loss").filter(b=>b.legs.some(l=>l.sport==sp&&S[sp].games.some(g=>g.id==l.game&&g.state!="pre")));if(!T.length)return"";
 return `<div class="card" style="margin-bottom:12px;border-color:var(--acc2)"><h3>🧾 My open slips · live</h3><div class="sub">Legs from this sport update from live box scores. Live chance to cash = product of each leg's live estimate (hit legs count 100%). Estimate, not a cash-out price.</div>${T.map(b=>{let pc=1,known=true;
  const rows=b.legs.map(l=>{if(l.sport!=sp)return`<div class="lp"><div><b>${E(l.player)}</b> <span class="mut">${E(l.market)} o${E(l.line)} · ${E((l.sport||"").toUpperCase())} (see that sport's Live tab)</span></div></div>`;
   const g=S[sp].games.find(x=>x.id==l.game);if(!g||g.state=="pre"){known=false;return`<div class="lp"><div><b>${E(l.player)}</b> <span class="mut">${E(l.market)} o${E(l.line)} · not started</span></div></div>`}
   const st=(S[sp].box[g.id]||{})[l.aid],cur=val(st,l.stat),c=cur>l.line?1:(sp=="soccer"&&st&&(st._off||!st._on))?0:chance(sp,l,cur,g);if(c==null)known=false;else pc*=c;return legRow(sp,l,g)}).join("");
  return `<div class="bun"><b>${b.legs.length>1?b.legs.length+"-leg slip":"Single"}</b> <span class="mut">stake ${E(b.stake)} · live chance to cash <b style="color:var(--txt)">${known?P(pc):"—"}</b></span>${rows}</div>`}).join("")}</div>`}
function leaders(box,sp){const A=Object.entries(box).filter(([k])=>k[0]!="_").map(([id,o])=>({id,...o}));
 if(GEN(sp)&&sp!="nfl"){const top=(k,lab,n=3)=>{const r=A.filter(o=>o[k]>0).sort((a,b)=>b[k]-a[k]).slice(0,n);return r.length?`<span>${lab}: ${r.map(o=>`<b>${E(o._n)}</b> ${E(o._t)} ${o[k]}`).join(", ")}</span>`:""};
  const T=sp=="nhl"?[top("goals","Goals"),top("points","Points"),top("shotsTotal","Shots")]:sp=="mlb"?[top("homeRuns","HR"),top("hits","Hits"),top("RBIs","RBI")]:[top("points","Pts"),top("rebounds","Reb"),top("assists","Ast")];return T.filter(Boolean).join("<br>")}
 if(sp=="cfb"||sp=="nfl"){const top=(k,lab)=>{const r=A.filter(o=>o[k]>0).sort((a,b)=>b[k]-a[k]).slice(0,2);return r.length?`<span>${lab}: ${r.map(o=>`<b>${E(o._n)}</b> ${E(o._t)} ${o[k]}${k=="passingYards"&&o.passingTouchdowns?" · "+o.passingTouchdowns+" TD":""}`).join(", ")}</span>`:""};
  return [top("passingYards","Pass yds"),top("rushingYards","Rush yds"),top("receivingYards","Rec yds")].filter(Boolean).join("<br>")}
 const sc=A.filter(o=>o.goals>0).map(o=>`⚽ <b>${E(o._n)}</b> ${E(o._t)}${o.goals>1?" ×"+o.goals:""}`),sh=A.filter(o=>o.shots>0).sort((a,b)=>b.sot-a.sot||b.shots-a.shots).slice(0,4).map(o=>`<b>${E(o._n)}</b> ${o.shots} sh / ${o.sot} on tgt`);
 return [sc.length?sc.join(" · "):"",sh.length?"Shots: "+sh.join(" · "):""].filter(Boolean).join("<br>")}
function propsBlock(sp,g){let R=[];
 if(sp=="soccer"||GEN(sp))R=(DATA[sp]||[]).filter(r=>String(r.game)==g.id&&r.stat&&r.stat.length&&r.line!=null).map(r=>({aid:r.aid,stat:r.stat,line:r.line,player:r.player,market:r.market,team:r.team}));
 else if(typeof CFBD!="undefined"&&CFBD&&CFBD.games){const G=CFBD.games.find(x=>x.id==g.id);R=((G&&G.td)||[]).filter(r=>!r.unav).map(r=>({aid:r.aid,stat:["rushingTouchdowns","receivingTouchdowns"],line:null,player:r.player,market:"Anytime TD",team:r.team}))}
 if(!R.length||g.state!="in")return"";const box=S[sp].box[g.id]||{};
 const X=R.map(l=>{const st=box[l.aid];if(sp=="soccer"&&(!st||!st._on||st._off))return null;const cur=val(st,l.stat),hit=l.line==null?cur>=1:cur>l.line;return{l,cur,hit,c:hit?1:chance(sp,l,cur,g)}}).filter(Boolean)
  .filter(x=>!x.hit&&(x.cur>0||(x.c??0)>=.35)).sort((a,b)=>(b.c??0)-(a.c??0)).slice(0,8);
 if(!X.length)return"";
 return `<details style="margin-top:8px"><summary style="font-size:12px;font-weight:700">📊 Board props still live (${X.length}) ${sp=="soccer"?"· players on the pitch":sp=="cfb"?"· anytime TD":""}</summary>${X.map(x=>legRow(sp,x.l,g,' <span class="pos">'+E(x.l.team||"")+"</span>"+(typeof addBtn=="function"&&find(sp,x.l.aid+"|"+x.l.market)?addBtn(find(sp,x.l.aid+"|"+x.l.market)):""))).join("")}</details>`}
function draw(sp){const el=$("live"),L=S[sp];if(!el)return;const lab=LAB[sp]||sp;
 const live=L.games.filter(g=>g.tracked&&g.state=="in"),fin=L.games.filter(g=>g.tracked&&g.state=="post"&&L.box[g.id]),nxt=L.games.filter(g=>g.tracked&&g.state=="pre").sort((a,b)=>new Date(a.start)-new Date(b.start));
 const picks=L.picks||[];
 let h=`<div class="an" style="padding:0 20px 20px"><div class="kick">${lab} · Live tracker</div><h2>🔴 Live</h2><div class="sub mut" style="font-size:12px">Scores, clocks and your picks update about every minute while ${sp=="soccer"?"matches":"games"} are live. ${L.at?"Last update "+etT(L.at):""} ${L.err?`<b class="dn">Live data unreachable (${E(L.err)}); retrying in 2 min.</b>`:""}<br>
 Each game shows our picks (<span class="pill y">OFFICIAL</span> = on the public record) and any legs from your slips, with ✓ hit, ✗ missed or in progress. Live chance is an estimate, not odds.</div>`;
 h+=slipsCard(sp);
 const myLegs=g=>{const R=[];slipsFor(sp).filter(b=>b.result!="win"&&b.result!="loss"||g.state=="post").forEach(b=>(b.legs||[]).forEach(l=>{if(l.sport==sp&&String(l.game)==g.id)R.push(l)}));if(!R.length)return"";return `<div class="mut" style="font-size:12px;margin-top:8px;font-weight:700">🧾 Your slip legs</div>`+R.map(l=>legRow(sp,l,g)).join("")};
 const preCard=g=>{const ps=picks.filter(e=>gameOf(e)==g.id),ml=myLegs(g);if(!ps.length&&!ml)return"";return `<div class="lg">${window.LiveEv?LiveEv.head(sp,g,null):E(g.name+" · "+g.detail)}${ps.map(e=>e.legs&&e.legs.length?(e.legs.length>1?`<div class="mut" style="font-size:12px;margin-top:6px">🎯 ${E(e.title)}${tierTag(e)}</div>`:"")+e.legs.map(l=>`<div class="lp"><div><span class="pl">${E(l.player)}</span>${e.legs.length>1?"":tierTag(e)}<br><span class="mut">${E(l.market)} ${l.line??""}</span></div><div class="mut">Not started · ${E(g.detail)}</div></div>`).join(""):`<div class="lp"><div><span class="pl">${E(e.title)}</span>${tierTag(e)}</div><div class="mut">Not started · ${E(g.detail)}</div></div>`).join("")}${ml.replace(/<div class="lp">/g,'<div class="lp">')}</div>`};
 const card=g=>{const ps=picks.filter(e=>gameOf(e)==g.id),box=L.box[g.id]||{},evs=(L.ev[g.id]||[]).slice(-6).reverse();
  const tm=g.teams.slice().sort((a,b)=>a.ha=="away"?-1:1);
  const trk={ids:[],names:[]},addT=l=>{if(l&&l.aid){trk.ids.push(l.aid);trk.names.push(l.player)}};ps.forEach(e=>(e.legs||[]).forEach(addT));slipsFor(sp).forEach(b=>b.legs.forEach(l=>{if(l.sport==sp&&String(l.game)==g.id)addT(l)}));
  trk.wids=[];trk.wnames=[];const addW=l=>{if(l&&l.aid){trk.wids.push(l.aid);trk.wnames.push(l.player)}};
  if(sp=="soccer")(DATA.soccer||[]).filter(r=>r.game==g.id).forEach(addT);else if(typeof CFBD!="undefined"&&CFBD&&CFBD.games){const G=CFBD.games.find(x=>x.id==g.id);((G&&G.td)||[]).forEach(addW)}
  if(window.LiveEv&&LiveEv.cache[sp+"|"+g.id])return `<div class="lg">${LiveEv.head(sp,g,sp+"|"+g.id)}${sp=="soccer"?`<div class="mut" style="font-size:11px">${E((LEAGUES.find(l=>l[0]==g.lg)||[0,g.lg])[1])}</div>`:""}
  ${leaders(box,sp)?`<div style="font-size:12px;margin:6px 0">${leaders(box,sp)}</div>`:""}${LiveEv.panel(sp+"|"+g.id,trk)}
  ${ps.map(e=>e.legs&&e.legs.length?(e.legs.length>1?`<div class="mut" style="font-size:12px;margin-top:6px">🎯 ${E(e.title)}${tierTag(e)}</div>`:"")+e.legs.map(l=>legRow(sp,l,g,e.legs.length>1?"":tierTag(e))).join(""):teamPick(sp,e,g)).join("")||(myLegs(g)?"":'<div class="mut" style="font-size:12px">No picks on this game yet.</div>')}${myLegs(g)}${propsBlock(sp,g)}</div>`;
  return `<div class="lg"><div class="sc" style="flex-wrap:wrap">${tm.map(t=>`<span>${t.rank?'<span class="mut" style="font-size:12px">#'+t.rank+"</span> ":""}${E(t.ab)} ${t.score}</span>`).join('<span class="mut">–</span>')}<span class="clk">${g.state=="in"?"● "+E(clk(g,sp)):"FINAL"}</span>${sp=="soccer"?`<span class="mut" style="font-size:12px;font-weight:600">${E((LEAGUES.find(l=>l[0]==g.lg)||[0,g.lg])[1])}</span>`:""}</div>
  ${leaders(box,sp)?`<div style="font-size:12px;margin:6px 0">${leaders(box,sp)}</div>`:""}
  ${evs.length?`<details style="font-size:12px;margin:4px 0"><summary class="mut">${sp=="soccer"?"Goals & cards":"Scoring plays"} (${(L.ev[g.id]||[]).length})</summary>${evs.map(x=>`<div>${E(x.t)} · <b>${E(x.x)}</b> ${E(x.txt).slice(0,140)}</div>`).join("")}</details>`:""}
  ${ps.map(e=>e.legs&&e.legs.length?(e.legs.length>1?`<div class="mut" style="font-size:12px;margin-top:6px">🎯 ${E(e.title)}${tierTag(e)}</div>`:"")+e.legs.map(l=>legRow(sp,l,g,e.legs.length>1?"":tierTag(e))).join(""):teamPick(sp,e,g)).join("")||(myLegs(g)?"":'<div class="mut" style="font-size:12px">No picks on this game yet.</div>')}${myLegs(g)}${propsBlock(sp,g)}</div>`};
 if(!live.length)h+=`<div class="card empty">No ${sp=="soccer"?"matches":"games"} in progress right now.</div>`;
 h+=live.map(card).join("");
 const up=nxt.filter(g=>(Date.parse(g.start)-Date.now())<36*36e5).map(preCard).filter(Boolean);
 if(up.length)h+=`<div class="kick" style="margin:10px 0 6px">Up next · picks we're tracking</div>`+up.slice(0,12).join("");else if(!live.length&&nxt.length)h+=`<div class="mut" style="font-size:12px;margin:6px 0">Next: ${nxt.slice(0,5).map(g=>E(g.name+" · "+g.detail)).join(" · ")}</div>`;
 if(fin.length)h+=`<div class="kick" style="margin:10px 0 6px">Final today</div>`+fin.slice(0,12).map(card).join("");
 el.innerHTML=h+"</div>"}
window.LiveX={view(sp){const L=S[sp];if(!L.at&&!L.err){$("live").innerHTML=`<div class="card empty">Loading live games…</div>`;poll(sp)}else draw(sp)},sports:["nfl","cfb","nhl","mlb","nba","soccer"],count(sp){const L=S[sp];return L&&L.at?L.games.filter(g=>g.tracked&&g.state=="in").length:null},S};
})();
