/* LiveEv: compact live game header + "What's happening" dropdown filtered to tracked props. Free ESPN summary feeds only (no odds credits). */
(function(){
const E=s=>String(s??"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
const C={},OPEN=new Set(),MORE={},LAST={};
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const ids=p=>(p.participants||[]).map(x=>String(x.athlete?.id||"")).filter(Boolean);
const nms=p=>(p.participants||[]).map(x=>x.athlete?.displayName||x.athlete?.fullName||"").filter(Boolean);
// kinds: always = shown regardless of tracking (scores, red cards, pitching changes); else only when a tracked player is involved
function build(sp,d){const out=[],FB=sp=="nfl"||sp=="cfb";
 if(FB){const D=d.drives||{},all=[...(D.previous||[]),...(D.current?[D.current]:[])];
  all.forEach(dr=>(dr.plays||[]).forEach(p=>{const t=p.type?.text||"",tx=p.text||"";if(/Timeout|End Period|End of|Kickoff$/.test(t)&&!p.scoringPlay)return;
   out.push({k:p.id,t:(p.period?.number>4?"OT":"Q"+(p.period?.number||""))+" "+(p.clock?.displayValue||""),x:p.scoringPlay?(t||"Score"):t,txt:tx.replace(/^\(\d+:\d+\)\s*/,"").replace(/^(No Huddle-)?(Shotgun|No Huddle)\s*/,"").replace(/#\d+\s*/g,"").replace(/,? clock \d+:\d+/,""),ids:ids(p),nm:nms(p),always:!!p.scoringPlay||/injur/i.test(tx)&&false,sc:!!p.scoringPlay,inj:/injur/i.test(tx)})}));
  if(!out.length)(d.scoringPlays||[]).forEach(p=>out.push({k:p.id,t:"Q"+(p.period?.number||"")+" "+(p.clock?.displayValue||""),x:p.type?.text||"Score",txt:p.text||"",ids:[],nm:[],always:true,sc:true}));
  const cur=D.current,lp=cur&&(cur.plays||[]).slice(-1)[0];C[sp+"sit"]=null;
  return{ev:out,sit:lp&&lp.end&&lp.end.shortDownDistanceText?{poss:cur.team?.abbreviation||"",dd:lp.end.shortDownDistanceText+(lp.end.possessionText?" at "+lp.end.possessionText:""),rz:(lp.end.yardsToEndzone??99)<=20}:null}}
 if(sp=="soccer"){const seen=new Set();
  (d.keyEvents||[]).forEach(k=>{const t=k.type?.text||"";if(/Kickoff|Delay|Halftime|End|Start/.test(t)&&!/Goal/.test(t))return;seen.add(k.id);
   out.push({k:k.id,t:k.clock?.displayValue||"",x:t,txt:(k.text||"").replace(/^Goal! [^.]*\.\s*/,""),ids:ids(k),nm:nms(k),always:/Goal|Red|Penalty/.test(t)&&!/Missed/.test(t)||/Own Goal/.test(t),sc:/Goal/.test(t)})});
  (d.commentary||[]).forEach(c=>{const p=c.play||{},t=p.type?.text||"";if(!p.id||seen.has(p.id))return;if(!/Attempt|Shot|Saved|Post|Substitution|Retired|Injur|Penalty|Offside|Hand ball/i.test(t+" "+(c.text||"")))return;
   seen.add(p.id);out.push({k:p.id,t:c.time?.displayValue||"",x:/Substitution/.test(t)?"Sub":/Retired|Injur/i.test(t)?"Injury":/Attempt|Shot|Saved|Post/i.test(t)?"Shot":t,txt:c.text||"",ids:ids(p),nm:nms(p).concat([c.text||""]),always:false})});
  out.sort((a,b)=>(parseInt(a.t)||0)-(parseInt(b.t)||0));return{ev:out,sit:null}}
 const P=d.plays||[];
 if(sp=="nhl"){P.forEach(p=>{const t=p.type?.text||"";if(/Face Off|Stoppage|Period|Giveaway|Takeaway/.test(t))return;const g=t=="Goal"||p.scoringPlay,pen=!/Shot|Blocked|Hit|Missed|Goal/.test(t);
   out.push({k:p.id,t:(p.period?.displayValue||"")+" "+(p.clock?.displayValue||""),x:g?"Goal":pen?"Penalty":t,txt:p.text||"",ids:ids(p),nm:[],always:g,sc:g})});return{ev:out,sit:null}}
 if(sp=="mlb"){let last=null;P.forEach(p=>{if(p.type?.text!="Play Result")return;last=p;const alt=p.alternativeType?.text||"",pc=/relieved|Pitching Change/i.test(p.text||"")||/Lineup Change/.test(alt)&&/relieved/.test(p.text||"");
   const sub=/Lineup Change|Defensive/.test(alt)&&!pc;out.push({k:p.id,t:(p.period?.type=="Top"?"▲":"▼")+(p.period?.number||""),x:pc?"Pitching change":p.scoringPlay?"Run scores":alt||"Play",txt:p.text||"",ids:ids(p),nm:[],always:!!p.scoringPlay||pc,sc:!!p.scoringPlay,sub})});
  return{ev:out.filter(e=>!e.sub||e.ids.length),sit:last&&last.outs!=null?{dd:last.outs+" out"}:null}}
 P.forEach(p=>{const t=p.type?.text||"";if(/Timeout|End|Jumpball|Period/.test(t))return;out.push({k:p.id,t:"Q"+(p.period?.number||"")+" "+(p.clock?.displayValue||""),x:t,txt:p.text||"",ids:ids(p),nm:[],always:false,sc:!!p.scoringPlay})});
 return{ev:out,sit:null}}
function ingest(key,sp,d){try{C[key]=Object.assign({sp},build(sp,d))}catch(e){console.warn("LiveEv",e)}}
function mt(e,ids,names){if(e.ids.some(i=>ids.has(i)))return true;const blob=norm(e.nm.join(" ")+" "+e.txt);
 return names.some(n=>{const z=norm(n).split(" ").filter(Boolean);if(!z.length)return false;const last=z[z.length-1];if(last.length<4)return blob.includes(norm(n));return blob.includes(norm(n))||blob.includes(z[0][0]+"."+last)||blob.includes(z[0][0]+". "+last)||(e.nm.length>0&&blob.includes(last))})}
const big=e=>{const m=String(e.txt).match(/for (\d+) y(?:ar)?ds/);return e.sc||e.inj||/Interception|Fumble|Touchdown/i.test(e.x)||(m&&+m[1]>=15)};
// T.ids/names = core (picks, slips): every play they're in. T.wids/wnames = watch list (prop board): only scores, big plays, turnovers, injuries.
function rel(e,T){if(mt(e,T.ids,T.names))return 2;if((T.wids.size||T.wnames.length)&&big(e)&&mt(e,T.wids,T.wnames))return 2;return e.always?1:0}
function list(key,T){const c=C[String(key).split("#")[0]];if(!c)return[];T=T||{};const S=a=>new Set([...(a||[])].map(String));
 T={ids:S(T.ids),names:[...(T.names||[])].filter(Boolean),wids:S(T.wids),wnames:[...(T.wnames||[])].filter(Boolean)};
 return c.ev.map(e=>({e,r:rel(e,T)})).filter(o=>o.r).reverse()}
function row(o){const e=o.e,ic=e.sc?"🟢":/Red/.test(e.x)?"🟥":/Yellow/.test(e.x)?"🟨":/Injur/i.test(e.x)||e.inj?"🩹":/Sub/.test(e.x)?"🔁":/Pitching/.test(e.x)?"⚾":/Penalty/.test(e.x)?"⛔":"•";
 return `<div class="lev-r${o.r==2?" lev-t":""}"><span class="lev-c">${E(e.t)}</span><span>${ic} <b>${E(e.x)}</b> ${E(e.txt.length>120?e.txt.slice(0,118)+"…":e.txt)}</span></div>`}
function inner(key){const L=LAST[key]||[],n=MORE[key]||8;return L.slice(0,n).map(row).join("")+(L.length>n?`<button class="lev-more" data-levm="${E(key)}">Show more (${L.length-n})</button>`:"")||'<div class="mut" style="padding:4px 0">Nothing involving tracked players yet. Goals, scoring plays and red cards show here as they happen.</div>'}
function panel(key,T){if(!C[String(key).split("#")[0]])return"";const L=list(key,T);LAST[key]=L;const tn=L.filter(o=>o.r==2).length;
 return `<details class="lev" data-lev="${E(key)}"${OPEN.has(key)?" open":""}><summary>What's happening <span class="mut">· ${L.length?L.length+" event"+(L.length>1?"s":"")+(tn?` · ${tn} on tracked players`:""):"quiet so far"}</span>${L[0]?`<span class="lev-last">${E(L[0].e.t)} ${E(L[0].e.x)}</span>`:""}</summary><div class="lev-b">${inner(key)}</div></details>`}
// g: {state,detail,period,clock,teams:[{ab,score,ha,id}],sit?}
function head(sp,g,key){const tm=(g.teams||[]).slice().sort((a,b)=>a.ha=="away"?-1:1),pre=g.state=="pre";
 const clk=g.state=="post"?"FINAL":pre?(g.detail||""):sp=="soccer"?(/HT/.test(g.detail||"")?"HT":(g.clock||g.detail||"")):sp=="mlb"?(g.detail||""):(g.detail||((g.period?"P"+g.period:"")+" "+(g.clock||"")));
 let sit=g.sit||(key&&C[key]&&C[key].sit)||null;if(g.state!="in")sit=null;
 const sitH=sit?` <span class="lev-sit">${sit.poss?"🏈 "+E(sit.poss)+" ":""}${E(sit.dd||"")}${sit.rz?' <b class="dn">RZ</b>':""}</span>`:"";
 return `<div class="lev-h">${g.state=="in"?'<span class="lev-live">●</span>':""}<b>${tm.map(t=>E(t.ab)+(pre?"":" "+E(t.score??""))).join(pre?" vs ":" – ")}</b> <span class="mut">${E(clk)}</span>${sitH}</div>`}
// scoreboard situation → {poss,dd,rz}
function sbSit(c){const s=c&&c.situation;if(!s||!s.shortDownDistanceText&&s.outs==null)return null;if(s.outs!=null&&!s.shortDownDistanceText)return{dd:(s.balls!=null?s.balls+"-"+s.strikes+", ":"")+s.outs+" out"};
 const pt=(c.competitors||[]).find(t=>String(t.team?.id||t.id)==String(s.possession));return{poss:pt?pt.team.abbreviation:"",dd:s.shortDownDistanceText+(s.possessionText?" at "+s.possessionText:""),rz:!!s.isRedZone}}
document.addEventListener("toggle",ev=>{const d=ev.target;if(d&&d.dataset&&d.dataset.lev){d.open?OPEN.add(d.dataset.lev):OPEN.delete(d.dataset.lev)}},true);
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-levm]");if(!b)return;ev.preventDefault();const k=b.dataset.levm;MORE[k]=(MORE[k]||8)+8;const box=b.closest(".lev-b");if(box)box.innerHTML=inner(k)});
const css=document.createElement("style");css.textContent=`.lev-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;font-size:14px;line-height:1.3}.lev-live{color:#ef4444;font-size:11px}.lev-sit{font-size:12px;padding:1px 6px;border-radius:6px;background:rgba(148,163,184,.15);white-space:nowrap}
.lev{margin:6px 0;font-size:12px;border:1px solid rgba(148,163,184,.2);border-radius:8px}.lev summary{cursor:pointer;padding:7px 9px;list-style:none;display:flex;flex-wrap:wrap;gap:4px 6px;align-items:baseline;min-height:20px}.lev summary::-webkit-details-marker{display:none}.lev summary:before{content:"▸";margin-right:2px}.lev[open] summary:before{content:"▾"}
.lev-last{flex-basis:100%;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.lev[open] .lev-last{display:none}.lev-b{padding:0 9px 8px}.lev-r{display:grid;grid-template-columns:52px 1fr;gap:6px;padding:4px 0;border-top:1px solid rgba(148,163,184,.12)}.lev-t{background:rgba(250,204,21,.07)}.lev-c{opacity:.7;font-variant-numeric:tabular-nums}
.lev-more{margin-top:6px;width:100%;padding:8px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:transparent;color:inherit;font-size:12px;cursor:pointer}`;document.head.appendChild(css);
window.LiveEv={ingest,panel,head,sbSit,list,cache:C};
})();
