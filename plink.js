/* Bet Lab player links: every player name on Bet Lab views opens the player profile (search.js) — deep link #player=<sport>:<id>.
   Opens the All-props player popup (index drawer) for the player's sport; players without props today get standard props built from plogs_<sport>.json. */
(function(){
"use strict";if(window.__plink)return;window.__plink=1;
var V=Math.floor(Date.now()/6e5),IDX=null,BYN=null,IP=null,onIndex=!!document.getElementById("drawer")&&!!document.getElementById("views");
var SPL={NFL:"nfl",CFB:"cfb",NBA:"nba",NHL:"nhl",MLB:"mlb",SOCCER:"soccer",SOC:"soccer"};
function N(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ø/g,"o").replace(/ß/g,"ss").replace(/ł/g,"l").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim()}
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function J(u){return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json()})}
function load(){if(IP)return IP;IP=J("data/player_index.json?v="+V).then(function(d){IDX=[];BYN={};d.p.forEach(function(r){var x={s:r[0],aid:r[1],name:r[2],team:r[3],pos:r[4],head:r[5],inj:r[6],lg:r[7],props:r[8]},n=N(r[2]);IDX.push(x);(BYN[n]=BYN[n]||[]).push(x)});schedule()}).catch(function(){IP=null});return IP}
var css=document.createElement("style");css.textContent=".plk{cursor:pointer;text-decoration:underline dotted;text-decoration-thickness:1px;text-underline-offset:3px;border-radius:3px}.plk:hover{color:var(--acc,#34d399)}.plk:focus-visible{outline:2px solid var(--acc,#34d399);outline-offset:2px}"+
 "#plx h3{margin:14px 0 4px;font-size:15px}#plx .gl{overflow-x:auto}#plx table{width:100%;border-collapse:collapse;font-size:12.5px}#plx td,#plx th{padding:6px 5px;border-top:1px solid var(--line,#2a2f3a);text-align:right;white-space:nowrap}#plx td:first-child,#plx th:first-child,#plx td.l,#plx th.l{text-align:left}#plx th{font-size:11px;color:var(--mut,#8a94a7);font-weight:600}#plx .w{color:var(--acc,#34d399);font-weight:700}#plx .lo{color:var(--bad,#ff5d6c);font-weight:700}";
document.head.appendChild(css);
// ---------- sport context ----------
function ctxSport(el){for(var i=0,e=el;e&&i<8;i++,e=e.parentElement){if(e.dataset&&e.dataset.sport)return e.dataset.sport.toLowerCase();var k=e.querySelector&&e.querySelector(":scope > .k, :scope > .r1 > .k, :scope > .sp");if(k){var t=SPL[k.textContent.trim().toUpperCase()];if(t)return t}}
 var m=/\((NFL|NHL|NBA|MLB|CFB|Soccer)\)/i.exec((el.parentElement||el).textContent||"");if(m)return SPL[m[1].toUpperCase()];
 if(onIndex&&typeof sport!="undefined")return sport;var h=/[?&#](?:s|sport|tab)=(\w+)/.exec(location.search+location.hash);return h?h[1].toLowerCase():null}
function pick(c,el){if(!c)return null;var s=ctxSport(el);if(s){var f=c.filter(function(x){return x.s==s});if(f.length)c=f;else if(onIndex)return null}
 if(c.length==1)return c[0];var p=c.filter(function(x){return x.props});return p.length==1?p[0]:null}
// ---------- linker ----------
var SKIP="a,button,input,select,option,textarea,script,style,.plk,[inert],.sl-locked,nav,header,footer,thead,th,.slp-h,.sls,.sls-dd,#plx,[data-plk-no],.sl-cta,.sl-bar,#tabs,#views,.views,.tabs,.chips,label,summary>.mut";
var WRD=/^[\s#\d.]*?((?:[A-Za-zÀ-ÿĀ-žŁłØøß][\wÀ-ÿĀ-žŁłØøß.'’\-]*\.?)(?:\s+(?:[A-Za-zÀ-ÿĀ-žŁłØøß][\wÀ-ÿĀ-žŁłØøß.'’\-]*\.?)){0,4})/;
function linkText(tn){var t=tn.nodeValue;if(!t||t.length<4)return;var m=WRD.exec(t);if(!m)return;var start=m.index+m[0].length-m[1].length,words=m[1].split(/\s+/);
 for(var k=Math.min(words.length,5);k>=1;k--){var raw=words.slice(0,k).join(" "),cands=BYN[N(raw)];if(!cands)continue;if(k==1&&(N(raw).length<5||cands[0].name.indexOf(" ")>=0))continue;
  var pi=t.indexOf(raw,start);if(pi<0)continue;var after=t.charAt(pi+raw.length);if(after&&/[A-Za-zÀ-ÿ]/.test(after))continue;
  var x=pick(cands,tn.parentElement);if(!x)return;var sp=document.createElement("span");sp.className="plk";sp.setAttribute("data-pl",x.s+":"+x.aid);sp.tabIndex=0;sp.setAttribute("role","link");sp.title="Open "+x.name+" profile";sp.textContent=t.substr(pi,raw.length);
  var rest=tn.splitText(pi);rest.nodeValue=rest.nodeValue.slice(raw.length);rest.parentNode.insertBefore(sp,rest);return}}
var ESP={"nfl":"nfl","college-football":"cfb","nba":"nba","nhl":"nhl","mlb":"mlb","soccer":"soccer"};
function anchors(root){root.querySelectorAll('a[href*="espn.com/"][href*="/player/"]:not(.plk)').forEach(function(a){if(a.closest("[inert],.sl-locked,nav,header,footer"))return;var m=/espn\.com\/([a-z-]+)\/player\/(?:_\/)?id\/(\d+)/.exec(a.href);if(!m||!ESP[m[1]])return;var s=ESP[m[1]],x=IDX.find(function(q){return q.s==s&&q.aid==m[2]});if(!x)return;a.classList.add("plk");a.setAttribute("data-pl",s+":"+m[2]);a.removeAttribute("target");a.title="Open "+x.name+" profile"})}
function scan(root){if(!BYN||!root)return;anchors(root);var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;if(!p||!/\S/.test(n.nodeValue))return 2;if(p.closest(SKIP))return 2;if(p.closest("#drawer")&&!p.closest("#drawer .slp-g, #drawer table, #drawer .card, #drawer .imp, #drawer li")&&document.getElementById("slp-venue"))return 2;return 1}}),L=[],n;while(n=w.nextNode())L.push(n);L.forEach(linkText)}
var T=null;function schedule(){if(T)return;T=setTimeout(function(){T=null;mo.disconnect();try{scan(document.body)}catch(e){}mo.observe(document.body,{childList:true,subtree:true,characterData:true})},150)}
var mo=new MutationObserver(schedule);
// ---------- open: the All-props player popup (index.html drawer(r)), for the player's own sport ----------
var EMBED=/[?&]plembed=1/.test(location.search),CACHE={};
function once(u){return CACHE[u]||(CACHE[u]=J(u).catch(function(){delete CACHE[u];return null}))}
var DEF={DE:1,DT:1,NT:1,DL:1,LB:1,ILB:1,OLB:1,MLB:1,CB:1,S:1,FS:1,SS:1,DB:1,EDGE:1};
// standard props per sport/position: [market, stat keys, fixed line or null = reference line from his L10 median]
function STD(s,pos){pos=(pos||"").toUpperCase();
 if(s=="nhl")return pos=="G"?[["Saves",["saves"],null]]:[["Points",["points"],0.5],["Anytime Goal",["goals"],0.5],["Shots on Goal",["shotsTotal"],null],["Assists",["assists"],0.5],["Blocked Shots",["blockedShots"],null],["Powerplay Points",["powerPlayPoints"],0.5]];
 if(s=="nba")return[["Points",["points"],null],["Rebounds",["totalRebounds"],null],["Assists",["assists"],null],["3-Point Field Goals",["threePointFieldGoalsMade-threePointFieldGoalsAttempted"],null],["Points + Assists + Rebounds",["points","assists","totalRebounds"],null],["Points + Assists",["points","assists"],null],["Points + Rebounds",["points","totalRebounds"],null],["Rebounds + Assists",["totalRebounds","assists"],null],["Steals + Blocks",["steals","blocks"],null]];
 if(s=="soccer")return pos=="G"||pos=="GK"?[["Saves",["saves"],null]]:[["Anytime Goal",["goals"],0.5],["Shots",["shots"],null],["Shots on Target",["sot"],0.5],["Assists",["assists"],0.5]];
 if(s=="mlb")return/^(P|SP|RP)$/.test(pos)?[["Pitcher Strikeouts",["strikeouts"],null],["Earned Runs Allowed",["earnedRuns"],null]]:[["Hits",["hits"],0.5],["Bases",["hits","doubles","doubles","triples","triples","triples","homeRuns","homeRuns","homeRuns","homeRuns"],1.5],["Home Runs",["homeRuns"],0.5],["RBIs",["RBIs"],0.5],["Runs Scored",["runs"],0.5],["Hits + Runs + RBIs",["hits","runs","RBIs"],null]];
 if(s=="nfl"||s=="cfb"){if(pos=="QB")return[["Passing Yards",["passingYards"],null],["Passing Touchdowns",["passingTouchdowns"],1.5],["Rushing Yards",["rushingYards"],null],["Passing Plus Rushing Yards",["passingYards","rushingYards"],null],["Pass Completions",["completions"],null]];
  if(pos=="RB"||pos=="FB")return[["Rushing Yards",["rushingYards"],null],["Rushing Plus Receiving Yards",["rushingYards","receivingYards"],null],["Carries",["rushingAttempts"],null],["Receptions",["receptions"],null],["Anytime TD",["rushingTouchdowns","receivingTouchdowns"],0.5]];
  if(pos=="WR"||pos=="TE")return[["Receiving Yards",["receivingYards"],null],["Rushing Plus Receiving Yards",["rushingYards","receivingYards"],null],["Receptions",["receptions"],null],["Anytime TD",["rushingTouchdowns","receivingTouchdowns"],0.5]];
  if(pos=="K"||pos=="PK")return[["Kicking Points",["totalKickingPoints"],null],["Field Goals Made",["fieldGoalsMade-fieldGoalAttempts"],null]];
  return[["Tackles Plus Assists",["totalTackles"],null],["Tackles",["soloTackles"],null],["Sacks",["sacks"],0.5],["Interceptions",["interceptions"],0.5]]}
 return[]}
function vOf(g,st){var t=0,any=false;st.forEach(function(k){var kk=k.replace(/^-/,"");if(g.s&&kk in g.s){any=true;t+=k[0]=="-"?-g.s[kk]:g.s[kk]}});return any?t:null}
function nextG(s,team){team=({UTAH:"UTA"})[team]||team;var now=Date.now()-4*36e5;return((window.GAMES||{})[s]||[]).filter(function(g){return(g.home==team||g.away==team)&&+new Date(g.time)>now}).sort(function(a,b){return a.time<b.time?-1:1})[0]||null}
function synth(s,x,logs){var G=(logs&&logs[x.aid])||[];if(!G.length)return[];var ng=nextG(s,x.team),home=ng?ng.home==(({UTAH:"UTA"})[x.team]||x.team):false,oa=ng?(home?ng.away:ng.home):"";
 var base={aid:x.aid,player:x.name,pos:x.pos||"",team:x.team||"",oa:oa,home:home,opp:ng?(home?"vs ":"@")+oa:"",time:ng?ng.time:null,game:ng?ng.id:null,_syn:1};
 return STD(s,x.pos).map(function(m){var vs=G.map(function(g){return vOf(g,m[1])}).filter(function(v){return v!=null});if(!vs.length)return null;var line=m[2];
   if(line==null){var a=vs.slice(0,10).slice().sort(function(p,q){return p-q}),md=a[Math.floor((a.length-1)/2)];line=Math.max(0.5,Math.round(md)-0.5)}
   return splits(enrich(Object.assign({},base,{market:m[0],stat:m[1],line:line,_ref:m[2]==null}),logs,s))}).filter(Boolean)}
function splits(r){var G=r.games||[],ag=function(a){return a.length?{h:a.filter(function(x){return x.v>r.line}).length,n:a.length,avg:Math.round(a.reduce(function(t,x){return t+x.v},0)/a.length*100)/100}:null};r.h2h=r.oa?ag(G.filter(function(x){return x.o==r.oa})):null;r.hm=ag(G.filter(function(x){return x.at!="@"}));r.aw=ag(G.filter(function(x){return x.at=="@"}));r.ven=r.home?r.hm:r.aw;var os=0;for(var i=0;i<G.length&&G[i].v>r.line;i++)os++;r.os=os;return r}
var ORD=/Points$|^Points|Passing Yards|Rushing Yards|Receiving Yards|Shots on Goal|Hits|Anytime|Tackles Plus|Saves|Strikeouts/;
function show(s,rows,r){var prev=sport,keep=DATA[s],lg=LG;sport=s;LG="";DATA[s]=rows;
 try{drawer(r)}finally{sport=prev;DATA[s]=keep;LG=lg}
 var dr=document.getElementById("drawer");dr.setAttribute("data-pl-open",s+":"+r.aid);
 dr.querySelectorAll(".mk [data-m]").forEach(function(b){b.onclick=function(){show(s,rows,rows.find(function(q){return q.market==b.dataset.m}))}});
 if(!dr.querySelector(".mk [data-m]")){var mk=dr.querySelector(".mk");if(mk)mk.innerHTML=rows.map(function(q){return '<button data-m="'+E(q.market)+'" class="'+(q.market==r.market?"on":"")+'">'+E(q.market)+" "+q.line+'</button>'}).join("");mk&&mk.querySelectorAll("[data-m]").forEach(function(b){b.onclick=function(){show(s,rows,rows.find(function(q){return q.market==b.dataset.m}))}})}
 var sub=dr.querySelector("h2 + .mut");if(sub&&!r.time)sub.textContent=(r.team?r.team+" · ":"")+"No game on the schedule";
 if(r._syn){dr.querySelectorAll("h2 .add").forEach(function(b){b.remove()});var h3=dr.querySelector("h3");if(h3){var n=document.createElement("div");n.className="mut";n.style.cssText="font-size:12px;margin-top:2px";n.textContent=r._ref?"No book line posted today. Reference line = his last-10 median, rounded to the half, so hit rates show his recent form.":"No book line posted today. Standard line shown.";h3.after(n)}}
 if(EMBED){var c=document.getElementById("cls");if(c)c.onclick=function(){parent.postMessage({plclose:1},"*")}}
 try{history.replaceState(null,"",location.pathname+location.search+"#player="+s+":"+r.aid)}catch(e){}}
function empty(x){var dr=document.getElementById("drawer");dr.innerHTML='<button class="x" id="cls">×</button><h2 style="margin:0">'+E(x.name)+' <span class="pos">'+E((x.pos||"")+" · "+(x.team||""))+'</span></h2><p class="mut" style="margin-top:14px">Not enough data yet: no games logged for '+E(x.name)+' this season or last.</p>';
 dr.classList.add("open");document.getElementById("shade").classList.add("open");document.getElementById("cls").onclick=EMBED?function(){parent.postMessage({plclose:1},"*")}:close}
async function openIdx(s,aid,ctx){await load();var x=IDX.find(function(q){return q.s==s&&q.aid==aid});if(!x)return;
 for(var i=0;i<80&&!(typeof ensure=="function"&&window.GAMES&&typeof RAW!="undefined"&&RAW[s]);i++)await new Promise(function(r){setTimeout(r,150)});
 await ensure(s);var rows=(DATA[s]||[]).filter(function(r){return String(r.aid)==String(aid)}),own=rows.filter(function(r){return r.games&&r.games.length});
 if(!own.length){var pl=await once("data/plogs_"+s+".json?v="+V),lg=pl&&pl[aid]?pl:await once("data/logs_"+s+".json?v="+V);rows=rows.map(function(r){var k=r.stat||(typeof mkStat=="function"?mkStat(s,r.market,r.pos):null);return k&&lg&&lg[aid]?splits(enrich(Object.assign({},r,{x:null,stat:k}),lg,s)):r});var sy=synth(s,x,lg);rows=rows.concat(sy.filter(function(q){return!rows.some(function(r){return r.market==q.market})}))}
 
 if(!rows.length||!rows.some(function(r){return r.games&&r.games.length})){if(rows.length){show(s,rows,rows[0]);return}return empty(x)}
 var CT=N(ctx||""),hitM=null;if(CT)rows.forEach(function(r){var mm=N(r.market),al=mm.replace(/s$/,"");if((CT.indexOf(mm)>=0||CT.indexOf(al)>=0||(/anytime/.test(mm)&&/anytime|goal|td/.test(CT)&&/anytime/.test(CT)))&&(!hitM||mm.length>N(hitM.market).length))hitM=r});if(hitM){show(s,rows,hitM);return}
 var PRI=["Passing Yards","Rushing Yards","Receiving Yards","Points","Shots on Goal","Hits","Tackles Plus Assists","Saves","Pitcher Strikeouts","Shots","Anytime Goal","Anytime TD"],gm=rows.filter(function(r){return r.games.length}),best=null;PRI.some(function(m){best=gm.find(function(r){return r.market==m});return best});best=best||gm[0]||rows[0];show(s,rows,best)}
var OV=null;function overlay(key,ctx){if(!OV){OV=document.createElement("div");OV.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#0008;display:flex;justify-content:flex-end";
  OV.innerHTML='<iframe title="Player profile" style="border:0;width:min(560px,100%);height:100%;background:#0d1320"></iframe>';OV.onclick=function(e){if(e.target==OV)closeOv()};document.body.appendChild(OV)}
 OV.hidden=false;OV.style.display="flex";OV.firstChild.src="./index.html?plembed=1#plopen="+key+(ctx?"&ctx="+encodeURIComponent(ctx.slice(0,120)):"");OV.firstChild.focus()}
function closeOv(){if(OV){OV.style.display="none";OV.firstChild.src="about:blank"}}
window.addEventListener("message",function(e){if(e.data&&e.data.plclose)closeOv()});
document.addEventListener("keydown",function(e){if(e.key=="Escape"&&OV&&OV.style.display!="none")closeOv()});
function open(key,ctx){var m=/^(\w+):(\d+)$/.exec(key||"");if(!m)return;if(onIndex)openIdx(m[1],m[2],ctx);else overlay(key,ctx)}
window.PLOPEN=open;
function hit(e){var el=e.target.closest&&e.target.closest(".plk[data-pl]");if(!el||el.closest("[inert],.sl-locked"))return;if(e.type=="keydown"&&e.key!="Enter"&&e.key!=" ")return;e.preventDefault();e.stopPropagation();var row=el.closest("tr,li,.r,.imp,.it,.card,div");open(el.getAttribute("data-pl"),row?row.textContent:"")}
document.addEventListener("click",hit,true);document.addEventListener("keydown",hit,true);
if(onIndex){var hm=/#(?:plopen|player)=(\w+:\d+)/.exec(location.hash),hc=/[#&]ctx=([^&]*)/.exec(location.hash);if(hm)setTimeout(function(){open(hm[1],hc?decodeURIComponent(hc[1]):"")},50);
 window.addEventListener("hashchange",function(){var m=/#(?:plopen|player)=(\w+:\d+)/.exec(location.hash);var dr=document.getElementById("drawer");if(m&&dr.getAttribute("data-pl-open")!=m[1])open(m[1])})}
if(EMBED){var es=document.createElement("style");es.textContent="body>*:not(#drawer):not(#shade){display:none!important}#shade{display:none!important}#drawer{width:100%!important;border-left:0!important}";document.head.appendChild(es)}
load();if(document.body)mo.observe(document.body,{childList:true,subtree:true,characterData:true});
})();
