/* Bet Lab player links: every player name on Bet Lab views opens the player profile (search.js) — deep link #player=<sport>:<id>.
   Adds Recent games, season averages and Bet Lab history (Highlighted plays) to the profile from existing public feeds only. */
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
var T=null;function schedule(){if(T)return;T=setTimeout(function(){T=null;mo.disconnect();try{scan(document.body)}catch(e){}mo.observe(document.body,{childList:true,subtree:true,characterData:true});prof()},150)}
var mo=new MutationObserver(schedule);
// ---------- open ----------
function open(key){var m=/^(\w+):(\d+)$/.exec(key||"");if(!m)return;
 if(onIndex&&window.SLSearch){load().then(function(){var x=IDX.find(function(q){return q.s==m[1]&&q.aid==m[2]});if(x)SLSearch.profile(x)})}
 else location.href="./index.html#player="+m[1]+":"+m[2]}
function hit(e){var el=e.target.closest&&e.target.closest(".plk[data-pl]");if(!el||el.closest("[inert],.sl-locked"))return;if(e.type=="keydown"&&e.key!="Enter"&&e.key!=" ")return;e.preventDefault();e.stopPropagation();open(el.getAttribute("data-pl"))}
document.addEventListener("click",hit,true);document.addEventListener("keydown",hit,true);
window.addEventListener("hashchange",function(){var m=/#player=(\w+:\d+)/.exec(location.hash);if(m&&onIndex){var c=(/#player=\w+:(\d+)/.exec(location.hash)||[])[1],cur=document.getElementById("slp-venue");if(!cur||PROF!=m[1])open(m[1])}});
// ---------- profile extras ----------
var PROF=null,CACHE={};
function once(u){return CACHE[u]||(CACHE[u]=J(u).catch(function(){delete CACHE[u];return null}))}
var COLS={nhl:[["goals","G"],["assists","A"],["points","PTS"],["shotsTotal","SOG"],["blockedShots","BLK"],["toi","TOI"]],nhlg:[["saves","SV"],["goalsAgainst","GA"],["toi","TOI"]],
 nba:[["points","PTS"],["totalRebounds","REB"],["assists","AST"],["threePointFieldGoalsMade-threePointFieldGoalsAttempted","3PM"],["minutes","MIN"]],
 soccer:[["goals","G"],["assists","A"],["shots","SH"],["sot","SOT"],["saves","SV"],["start","GS"]]};
var SZN={nhl:"2026-09-01",nba:"2026-10-01",soccer:"2026-07-01",nfl:"2026-09-01",cfb:"2026-08-15",mlb:"2026-03-01"};
function f1(v){return v==null||isNaN(v)?"—":(Math.round(v*10)/10).toString()}
function curX(){var m=/#player=(\w+):(\d+)/.exec(location.hash);if(!m||!IDX)return null;return IDX.find(function(q){return q.s==m[1]&&q.aid==m[2]})||null}
function logTable(sp,G,cols){var L=G.slice(0,10),sz=G.filter(function(g){return g.d>=SZN[sp]});
 var h='<div class="gl"><table><thead><tr><th>Date</th><th class="l">Opp</th>'+cols.map(function(c){return "<th>"+c[1]+"</th>"}).join("")+'</tr></thead><tbody>'+L.map(function(g){return '<tr><td>'+E(g.d.slice(5))+'</td><td class="l">'+E((g.at=="@"?"@ ":"vs ")+(g.o||""))+'</td>'+cols.map(function(c){var v=g.s?g.s[c[0]]:g[c[0]];return "<td>"+(v==null?"—":f1(+v))+"</td>"}).join("")+'</tr>'}).join("")+'</tbody>';
 if(sz.length)h+='<tbody><tr><td colspan=2 class="l"><b>Season avg</b> <span style="color:var(--mut,#8a94a7)">('+sz.length+' GP)</span></td>'+cols.map(function(c){var a=sz.map(function(g){return g.s?g.s[c[0]]:g[c[0]]}).filter(function(v){return v!=null&&!isNaN(+v)});return "<td><b>"+(a.length?f1(a.reduce(function(s,v){return s+ +v},0)/a.length):"—")+"</b></td>"}).join("")+'</tr></tbody>';
 return h+'</table></div>'+(sz.length?"":'<div style="font-size:12px;color:var(--mut,#8a94a7)">No games logged this season yet, so no season averages.</div>')}
function fromRows(x){var R=(typeof DATA!="undefined"&&DATA[x.s]||[]).filter(function(r){return String(r.aid)==String(x.aid)&&r.games&&r.games.length});if(!R.length)return null;
 var by={},cols=[];R.forEach(function(r){var lab=r.market.replace(/^Player /,"");if(cols.some(function(c){return c[1]==lab}))return;cols.push([lab,lab]);r.games.forEach(function(g){var k=g.e||g.d;var o=by[k]||(by[k]={d:g.d,o:g.o,at:g.at,s:{}});o.s[lab]=g.v})});
 return{G:Object.keys(by).map(function(k){return by[k]}).sort(function(a,b){return b.d.localeCompare(a.d)}),cols:cols.slice(0,6)}}
function history(x){var nn=N(x.name),out=[],seen={};function add(d,t,res){var k=d+"|"+N(t);if(seen[k])return;seen[k]=1;out.push({d:d,t:t,res:res})}
 return Promise.all([once("data/value_vault_record.json?v="+V),once("data/called_it.json?v="+V)]).then(function(a){var vv=a[0],ci=a[1];
  if(vv&&vv.graded)Object.keys(vv.graded).forEach(function(k){var g=vv.graded[k],t=k.split("|").slice(1).join("|");if(g.sport==x.s&&N(t).indexOf(nn+" ")==0)add(g.d,t.replace(/\s*\((NFL|NHL|NBA|MLB|CFB|Soccer)\)$/i,""),g.res)});
  if(ci&&ci.cards)ci.cards.forEach(function(c){if(c.kind!="player"||c.sport!=x.s||!c.official)return;if((c.id||"").split("|").indexOf(String(x.aid))>=0||N(c.title).indexOf(nn+" ")==0)add((c.start||c.logged_at||"").slice(0,10),c.title,c.result)});
  out.sort(function(a,b){return b.d.localeCompare(a.d)});return out})}
function nhlLab(x){if(x.s!="nhl")return Promise.resolve(null);return once("https://nhllab.sportslabshq.com/data/players.json").then(function(P){if(!P)return null;var n=N(x.name),c=P.filter(function(p){return N(p.name)==n});if(c.length>1)c=c.filter(function(p){return p.team==x.team});return c.length==1?c[0].id:null})}
function prof(){var dr=document.getElementById("drawer"),v=document.getElementById("slp-venue");if(!dr||!v||!dr.classList.contains("open"))return;var x=curX();if(!x)return;var key=x.s+":"+x.aid;if(dr.querySelector('#plx[data-k="'+key+'"]'))return;
 var old=document.getElementById("plx");if(old)old.remove();PROF=key;var box=document.createElement("div");box.id="plx";box.setAttribute("data-k",key);box.setAttribute("data-sl-public","");
 box.innerHTML='<h3>Recent games</h3><div id="plx-g" style="font-size:13px;color:var(--mut,#8a94a7)">Loading game log…</div><h3>Bet Lab history</h3><div id="plx-h" style="font-size:13px;color:var(--mut,#8a94a7)">Loading…</div><div id="plx-l"></div>';
 v.parentNode.insertBefore(box,v);
 var gp=(x.s=="nhl"||x.s=="nba"||x.s=="soccer")?once("data/logs_"+x.s+".json?v="+V).then(function(L){var G=L&&L[x.aid];if(G&&x.s=="nhl")G=G.filter(function(g){return !/^\d{4}01/.test(g.e||"")});if(!G||!G.length)return null;G=G.slice().sort(function(a,b){return b.d.localeCompare(a.d)});var c=COLS[x.s];if(x.s=="nhl"&&/^G/.test(x.pos||""))c=COLS.nhlg;return{G:G,cols:c}}):Promise.resolve(null);
 gp.then(function(r){if(PROF!=key)return;r=r||fromRows(x);var el=document.getElementById("plx-g");if(!el)return;if(!r||!r.G.length){el.textContent="Not enough data yet: no logged games for this player in our feeds.";return}
  el.style.color="";el.innerHTML=logTable(x.s,r.G,r.cols)+'<div style="font-size:11px;color:var(--mut,#8a94a7);margin-top:4px">Last '+Math.min(10,r.G.length)+' logged games'+(r.G.length<5?" (small sample)":"")+(x.s=="nhl"?", regular season and playoffs (preseason excluded)":"")+'. Hit rate on each prop is under its prop tab above.</div>'});
 history(x).then(function(H){if(PROF!=key)return;var el=document.getElementById("plx-h");if(!el)return;if(!H.length){el.textContent="No Highlighted plays logged for this player yet.";return}
  var w=H.filter(function(h){return h.res=="win"}).length,l=H.filter(function(h){return h.res=="loss"}).length;el.style.color="";
  el.innerHTML='<div style="margin-bottom:4px"><b>'+w+'-'+l+'</b> on graded Highlighted plays'+(H.length>w+l?" · "+(H.length-w-l)+" pending/void":"")+'</div>'+H.slice(0,10).map(function(h){return '<div style="display:flex;gap:8px;align-items:baseline;padding:6px 0;border-top:1px solid var(--line,#2a2f3a);font-size:13px"><span style="color:var(--mut,#8a94a7);flex:none">'+E(h.d.slice(5))+'</span><span style="flex:1;min-width:0">'+E(h.t)+'</span><span class="'+(h.res=="win"?"w":h.res=="loss"?"lo":"")+'" style="flex:none">'+E(h.res?h.res.toUpperCase():"Pending")+'</span></div>'}).join("")});
 nhlLab(x).then(function(id){if(PROF!=key||!id)return;var el=document.getElementById("plx-l");if(el)el.innerHTML='<div style="margin-top:10px;font-size:13px"><a href="https://nhllab.sportslabshq.com/#player/'+id+'" target="_blank" rel="noopener" style="color:var(--acc,#34d399)">Full NHL Lab profile →</a> <span style="color:var(--mut,#8a94a7)">(advanced stats, on-ice impact)</span></div>'})}
load();if(document.body)mo.observe(document.body,{childList:true,subtree:true,characterData:true});
})();
