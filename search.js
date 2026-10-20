/* Bet Lab player search: cross-sport typeahead + player profile (props, injury, next game, live box score).
   Index: data/player_index.json (engine publish step, public fields only). Live data: public feeds */
(function(){
"use strict";
var SPN={nfl:"NFL",cfb:"CFB",nba:"NBA",nhl:"NHL",mlb:"MLB",soccer:"Soccer"};
var PATH={nfl:"football/nfl",cfb:"football/college-football",nba:"basketball/nba",nhl:"hockey/nhl",mlb:"baseball/mlb",soccer:"soccer"};
var HEAD={nfl:"nfl",cfb:"college-football",nba:"nba",nhl:"nhl",mlb:"mlb",soccer:"soccer"};
var IDX=null,IDXP=null,onIndex=!!document.getElementById("tabs")&&!!document.getElementById("drawer");
function EJ(u){var alt=u.replace("//site.api.espn.com/","//site.web.api.espn.com/");return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return fetch(alt).then(function(r){if(!r.ok)throw 0;return r.json()})})}
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function N(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ø/g,"o").replace(/ß/g,"ss").replace(/ł/g,"l").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim()}
function head(sp,aid){return "https://a.espncdn.com/combiner/i?img=/i/headshots/"+HEAD[sp]+"/players/full/"+aid+".png&w=96&h=70&cb=1"}
function load(){if(IDXP)return IDXP;IDXP=fetch("data/player_index.json?v="+Math.floor(Date.now()/6e5)).then(function(r){return r.json()}).then(function(d){
  IDX=d.p.map(function(r){var n=N(r[2]);return{s:r[0],aid:r[1],name:r[2],team:r[3],pos:r[4],head:r[5],inj:r[6],lg:r[7],props:r[8],n:n,w:n.split(" "),t:N(r[3])}});return IDX}).catch(function(){IDXP=null;return[]});return IDXP}
// edit distance with early exit (typo tolerance)
function lev(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;var p=[],i,j;for(j=0;j<=b.length;j++)p[j]=j;for(i=1;i<=a.length;i++){var c=[i],mn=i;for(j=1;j<=b.length;j++){c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]==b[j-1]?0:1));if(c[j]<mn)mn=c[j]}if(mn>max)return max+1;p=c}return p[b.length]}
function score(x,q,qw){var s=0;if(x.n==q)s=120;else if(x.n.indexOf(q)==0)s=100;else{
  var all=qw.every(function(t){return x.w.some(function(w){return w.indexOf(t)==0})});if(all)s=85;else if(x.n.indexOf(q)>=0)s=60;else{
   var tot=0;for(var k=0;k<qw.length;k++){var t=qw[k],best=9;for(var m=0;m<x.w.length;m++){var w=x.w[m].slice(0,Math.max(t.length,x.w[m].length>t.length+1?t.length+1:x.w[m].length));var d=lev(t,w,2);if(d<best)best=d}if(best>(t.length<4?0:t.length<7?1:2))return 0;tot+=best}s=50-tot*8}}
  if(qw.length==1&&x.t==q)s=Math.max(s,70);
  return s+(x.props?20:0)+(onIndex&&typeof sport!="undefined"&&sport==x.s?4:0)+(x.s=="nfl"||x.s=="nba"?2:0)}
var ALIAS={wemby:"victor wembanyama",sga:"shai gilgeous alexander",ovi:"alex ovechkin",cmc:"christian mccaffrey",ajb:"a j brown",kd:"kevin durant",lebron:"lebron james",ohtani:"shohei ohtani",judge:"aaron judge"};
function search(q){q=N(q);q=ALIAS[q.replace(/ /g,"")]||q;if(q.length<2||!IDX)return[];var qw=q.split(" "),out=[];for(var i=0;i<IDX.length;i++){var sc=score(IDX[i],q,qw);if(sc>0)out.push([sc,IDX[i]])}
  out.sort(function(a,b){return b[0]-a[0]||a[1].name.localeCompare(b[1].name)});return out.slice(0,10).map(function(x){return x[1]})}
// ---------- UI ----------
var css=document.createElement("style");css.textContent=
 ".sls{position:relative;flex:1 1 220px;min-width:180px;max-width:420px}.sls input{width:100%;font-size:16px;box-sizing:border-box}"+
 ".sls-dd{position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--panel,#121826);border:1px solid var(--line,#2a2f3a);border-radius:12px;z-index:60;max-height:min(70vh,520px);overflow:auto;box-shadow:0 12px 32px #0009;padding:4px;margin:0;list-style:none}"+
 ".sls-dd li{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:9px;cursor:pointer;min-height:44px}.sls-dd li.on,.sls-dd li:hover{background:var(--panel2,#182033)}"+
 ".sls-dd img,.sls-ph{width:40px;height:30px;object-fit:cover;border-radius:6px;background:var(--panel2,#182033);flex:none}.sls-dd .nm{font-weight:700}.sls-dd .mt{font-size:12px;color:var(--mut,#8a94a7)}"+
 ".sls-tag{font-size:10px;font-weight:800;padding:1px 6px;border-radius:99px;margin-left:4px;vertical-align:middle}.sls-tag.p{background:rgba(52,211,153,.15);color:var(--acc,#34d399)}.sls-tag.i{background:rgba(255,93,108,.15);color:var(--bad,#ff5d6c)}"+
 ".sls-empty{padding:12px;color:var(--mut,#8a94a7);font-size:13px}"+
 ".slp-h{display:flex;gap:12px;align-items:center}.slp-h img{width:84px;height:62px;object-fit:cover;border-radius:10px;background:var(--panel2,#182033)}"+
 ".slp-g{background:var(--panel2,#182033);border-radius:12px;padding:10px 12px;margin:12px 0}.slp-sc{display:flex;justify-content:space-between;font-weight:800;font-size:18px;margin:4px 0}"+
 ".slp-bx{display:grid;grid-template-columns:repeat(auto-fit,minmax(74px,1fr));gap:6px;margin-top:8px}.slp-bx div{background:var(--panel,#121826);border-radius:8px;padding:6px 8px;font-size:11px;color:var(--mut,#8a94a7)}.slp-bx b{display:block;font-size:16px;color:var(--txt,#e6e9ef)}"+
 ".slp-t{width:100%;border-collapse:collapse;font-size:13px;min-width:0}.slp-t td,.slp-t th{padding:7px 6px;border-top:1px solid var(--line,#2a2f3a);text-align:left}.slp-t tr[data-m]{cursor:pointer}.slp-t th{font-size:11px;color:var(--mut,#8a94a7);font-weight:600}"+
 ".slp-live{display:inline-block;background:var(--bad,#ff5d6c);color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:5px;margin-right:6px;animation:slpb 1.6s infinite}@keyframes slpb{50%{opacity:.55}}"+
 "@media(max-width:600px){.sls{max-width:none;flex-basis:100%}}";
document.head.appendChild(css);
function attach(inp,onSelect){var wrap=document.createElement("div");wrap.className="sls";inp.parentNode.insertBefore(wrap,inp);wrap.appendChild(inp);
 inp.setAttribute("autocomplete","off");inp.setAttribute("autocapitalize","off");inp.setAttribute("spellcheck","false");inp.setAttribute("enterkeyhint","search");
 inp.setAttribute("role","combobox");inp.setAttribute("aria-autocomplete","list");inp.setAttribute("aria-expanded","false");inp.setAttribute("aria-controls","sls-dd");
 inp.placeholder="Search any player · NFL, CFB, NBA, NHL, MLB, soccer";
 var dd=document.createElement("ul");dd.className="sls-dd";dd.id="sls-dd";dd.setAttribute("role","listbox");dd.hidden=true;wrap.appendChild(dd);
 var res=[],sel=-1,tmr;
 function show(){var q=inp.value;if(N(q).length<2){dd.hidden=true;inp.setAttribute("aria-expanded","false");return}
  load().then(function(){res=search(q);sel=res.length?0:-1;
   dd.innerHTML=res.length?res.map(function(x,i){return '<li role="option" id="sls-o'+i+'" data-i="'+i+'" class="'+(i==sel?"on":"")+'" aria-selected="'+(i==sel)+'">'+(x.head?'<img loading="lazy" alt="" src="'+head(x.s,x.aid)+'" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'sls-ph\'}))">':'<span class="sls-ph"></span>')+
     '<div><div class="nm">'+E(x.name)+(x.props?'<span class="sls-tag p">PROPS</span>':"")+(x.inj?'<span class="sls-tag i">'+E(x.inj)+'</span>':"")+'</div><div class="mt">'+E(SPN[x.s])+(x.team?" · "+E(x.team):"")+(x.pos?" · "+E(x.pos):"")+'</div></div></li>'}).join(""):'<li class="sls-empty" role="option" aria-disabled="true">No players match "'+E(q)+'"</li>';
   dd.hidden=false;inp.setAttribute("aria-expanded","true");mark()})}
 function mark(){[].forEach.call(dd.children,function(li,i){li.classList.toggle("on",i==sel);li.setAttribute("aria-selected",i==sel)});if(sel>=0){inp.setAttribute("aria-activedescendant","sls-o"+sel);var li=dd.children[sel];li&&li.scrollIntoView&&li.scrollIntoView({block:"nearest"})}}
 function pick(i){var x=res[i];if(!x)return;dd.hidden=true;inp.setAttribute("aria-expanded","false");inp.value="";inp.dispatchEvent(new Event("input",{bubbles:true}));inp.blur();onSelect(x)}
 inp.addEventListener("input",function(){clearTimeout(tmr);tmr=setTimeout(show,90)});
 inp.addEventListener("focus",function(){load();if(inp.value)show()});
 inp.addEventListener("keydown",function(e){if(dd.hidden&&e.key!="Enter")return;
  if(e.key=="ArrowDown"){e.preventDefault();sel=Math.min(res.length-1,sel+1);mark()}else if(e.key=="ArrowUp"){e.preventDefault();sel=Math.max(0,sel-1);mark()}
  else if(e.key=="Enter"){if(!dd.hidden&&sel>=0){e.preventDefault();pick(sel)}}else if(e.key=="Escape"){dd.hidden=true;inp.setAttribute("aria-expanded","false")}});
 dd.addEventListener("mousedown",function(e){e.preventDefault()});
 dd.addEventListener("click",function(e){var li=e.target.closest("li[data-i]");if(li)pick(+li.dataset.i)});
 document.addEventListener("click",function(e){if(!wrap.contains(e.target)){dd.hidden=true;inp.setAttribute("aria-expanded","false")}});}
// ---------- profile (index page) ----------
var LIVE_D=null,TAB="ov";
function av(a){return a.length?a.reduce(function(s,g){return s+g.v},0)/a.length:null}
function f1(v){return v==null?"—":(Math.round(v*10)/10).toString()}
function ovr(a,line){return a.length?a.filter(function(g){return g.v>line}).length:0}
var PER={nfl:[4,15],cfb:[4,15],nba:[4,12],nhl:[3,20],soccer:[2,45]};
var LMAP={receivingYards:["receiving","YDS"],receptions:["receiving","REC"],receivingTargets:["receiving","TGTS"],rushingYards:["rushing","YDS"],rushingAttempts:["rushing","CAR"],passingYards:["passing","YDS"],passingTouchdowns:["passing","TD"],interceptions:["passing","INT"],rushingTouchdowns:["rushing","TD"],receivingTouchdowns:["receiving","TD"],
 goals:["","G"],assists:["","A"],shotsTotal:["","S"],shots:["","S"],points:["","PTS"],rebounds:["","REB"],threePointFieldGoalsMade:["","3PT"],hits:["batting","H"],homeRuns:["batting","HR"],RBIs:["batting","RBI"],runs:["batting","R"],strikeouts:["pitching","K"]};
function liveVal(r,box){if(!box||!r.stat)return null;var tot=0,any=false;for(var i=0;i<r.stat.length;i++){var k=r.stat[i].replace(/^-/,""),m=LMAP[k];if(!m)return null;
  var hit=box.find(function(b){return(!m[0]||b.g==m[0])&&b.l==m[1]});if(!hit)continue;var v=parseFloat(String(hit.v).split("/")[0].split("-")[0]);if(isNaN(v))continue;any=true;tot+=r.stat[i][0]=="-"?-v:v}return any?tot:null}
function qbMap(sp){var M={};if(sp!="nfl"&&sp!="cfb")return M;(DATA[sp]||[]).forEach(function(p){if(p.pos!="QB")return;(p.games||[]).forEach(function(g){var a=g.s&&g.s.passingAttempts;if(a>=10){var k=g.e+"|"+g.t;if(!M[k]||M[k].a<a)M[k]={n:p.player,a:a}}})});return M}
function bars(G,line){var mx=Math.max(line*1.4,1,Math.max.apply(null,G.map(function(g){return g.v})));return '<div class="chart">'+G.map(function(g){return '<div class="b" style="height:'+(g.v/mx*100)+'%;background:'+(g.v>line?"var(--acc)":"var(--bad)")+'" title="'+E(g.d+" "+g.at+g.o+": "+g.v)+'"><span>'+g.v+'</span></div>'}).join("")+'<div class="ln" style="bottom:'+(line/mx*100)+'%"><i>'+line+'</i></div></div><div class="xl">'+G.map(function(g){return '<div>'+(g.at=="@"?"@":"")+E(g.o)+'<br>'+E(g.d.slice(5))+'</div>'}).join("")+'</div>'}
function panel(x,r,props,g){var el=document.getElementById("slp-panel");if(!el||!r)return;var G=r.games||[],L5=G.slice(0,5),L10=G.slice(0,10),yr=G.length?G[0].d.slice(0,4):"",SZ=G.filter(function(q){return q.d.slice(0,4)==yr}),o=ourChance(r),yes=/Anytime/.test(r.market);
 var strip='<div class="slp-bx" style="grid-template-columns:repeat(auto-fit,minmax(68px,1fr))">'+
  '<div>Line<b>'+(yes?"Yes":"o"+E(r.line))+'</b></div>'+
  '<div>Our chance<b>'+(o?Math.round(o.p*100)+"%":"—")+'</b></div>'+
  '<div>Edge<b style="color:'+(o?(o.edge>0?"var(--acc)":"var(--bad)"):"inherit")+'">'+(o?(o.edge>0?"+":"")+(o.edge*100).toFixed(1):"—")+'</b></div>'+
  '<div style="outline:1px solid var(--acc)">L5 avg<b>'+f1(av(L5))+'</b></div><div>L10 avg<b>'+f1(av(L10))+'</b></div><div>Season<b>'+f1(r.avg)+'</b></div></div>'+
  '<div class="mut" style="font-size:11px;margin-top:4px">'+(o?"Our chance = L10 hit rate blended with the no-vig market; edge vs best book price, in points.":"No book price in our feed for this prop, so no edge. ")+' L5 is the main average (short season); L10/season shown for context. '+addBtn(Object.assign({},r,{_s:x.s}))+' add to slip</div>';
 var T=[["ov","Overview"],["mu","Matchup"],["hr","Hit Rate"],["h2h","Head-to-Head"],["od","Odds"]];if(x.s=="nfl")T.push(["ic","Injury Cascade"]);T.push(["lv","Live"]);if(!T.some(function(t){return t[0]==TAB}))TAB="ov";
 var body="";
 if(TAB=="ov"){var ins=[];var h5=ovr(L5,r.line),h10=ovr(L10,r.line);
  if(L5.length)ins.push("Over "+r.line+" in "+h5+" of last "+L5.length+" (L5 avg "+f1(av(L5))+(r.line?", "+(av(L5)>=r.line?"+":"")+f1(av(L5)-r.line)+" vs line":"")+").");
  if(L10.length>5)ins.push("L10: "+h10+"/"+L10.length+" over, avg "+f1(av(L10))+".");
  if(r.os)ins.push("🔥 Active "+r.os+"-game over streak.");else if(r.us>=2)ins.push(r.us+"-game under streak.");
  if(r.ven)ins.push((r.home?"Home":"Away")+" (tonight's venue): "+r.ven.h+"/"+r.ven.n+" over, avg "+r.ven.avg+".");
  if(r.dvp)ins.push(E(r.oa)+" ranks "+r.dvp.r+" of "+r.dvp.of+" vs "+E(r.pos)+(r.dvp.what?" ("+E(r.dvp.v)+" "+E(r.dvp.what)+")":"")+" (1 = softest)"+(r.dvp.tag?" · "+E(r.dvp.tag):"")+".");
  if(r.u){var U=Object.keys(r.u).filter(function(k){return r.u[k]&&r.u[k].tr});U.forEach(function(k){var u=r.u[k];ins.push(E(u.label||({sn:"Snap %",tg:"Targets",ca:"Carries",min:"Minutes",toi:"TOI",pa:"Plate appearances",st:"Start %"})[k]||k)+" trending "+(u.tr>0?"up":"down")+": recent "+E(u.l3!=null?u.l3:u.l5)+" vs season "+E(u.szn)+".")})}
  if(r.open!=null&&r.open!=r.line)ins.push("Line moved "+r.open+" → "+r.line+".");
  if(r.h2h)ins.push("Vs "+E(r.oa)+": "+r.h2h.h+"/"+r.h2h.n+" over"+(r.h2h.n<2?" (only "+r.h2h.n+" game)":"")+".");
  if(o&&o.edge>0)ins.push("Our chance "+Math.round(o.p*100)+"% vs book "+Math.round(o.ip*100)+"% at "+(o.best>0?"+":"")+o.best+" ("+E(o.book)+").");
  body='<ul style="margin:6px 0;padding-left:18px;font-size:13px;line-height:1.5">'+(ins.length?ins.map(function(t){return "<li>"+t+"</li>"}).join(""):"<li class=mut>Not enough logged games for insights yet.</li>")+'</ul><div class="mut" style="font-size:11px">Every insight is computed from logged box scores and posted lines. No scouting claims.</div>'}
 else if(TAB=="mu"){body=r.dvp?'<div style="font-size:13px">'+E(r.oa)+' allows <b>'+E(r.dvp.v)+'</b> '+E(r.dvp.what||r.market.toLowerCase()+" per game to "+r.pos+"s")+' · rank <b>'+r.dvp.r+' of '+r.dvp.of+'</b> (1 = softest) over '+r.dvp.g+' games this season.</div>':'<div class="mut" style="font-size:13px">No defense-vs-position number for this market yet.</div>';
  if(r.gs)body+='<div class="mut" style="font-size:13px;margin-top:8px">Game script: total '+(r.gs.tot??"—")+(r.gs.sp!=null?" · spread "+(r.gs.sp>0?"+":"")+r.gs.sp:"")+(r.gs.itt!=null?" · team implied "+r.gs.itt:"")+'</div>';
  body+='<div class="mut" style="font-size:11px;margin-top:8px">Coverage-scheme data (zone/man rates) isn\'t available from a free source, so it\'s omitted rather than guessed.</div>'}
 else if(TAB=="hr"){var rows=[["L5",L5],["L10",L10],["L20",G.slice(0,20)],["Season",SZ],["All logged",G]];
  body='<table class="slp-t"><thead><tr><th>Span</th><th>Over '+E(r.line)+'</th><th>Hit %</th><th>Avg</th></tr></thead><tbody>'+rows.map(function(q){var n=q[1].length,h=ovr(q[1],r.line);return '<tr><td>'+q[0]+'</td><td>'+h+"/"+n+'</td><td>'+(n?Math.round(h/n*100)+"%":"—")+'</td><td>'+f1(av(q[1]))+'</td></tr>'}).join("")+'</tbody></table>'+(G.length?bars(G.slice(0,20).reverse(),r.line):"")}
 else if(TAB=="h2h"){var H2=G.filter(function(q){return q.o==r.oa}),QM=qbMap(x.s),curQ=null;
  if(QM&&G.length&&x.pos!="QB"){var lq=G.map(function(q){return QM[q.e+"|"+q.t]}).find(Boolean);curQ=lq&&lq.n}
  var grp=function(lab,A){var n=A.length,h=ovr(A,r.line);return '<tr><td>'+lab+'</td><td>'+n+'</td><td>'+f1(av(A))+'</td><td>'+(n?h+"/"+n+" ("+Math.round(h/n*100)+"%)":"—")+'</td></tr>'};
  body='<div style="font-size:13px">'+H2.length+' logged game'+(H2.length==1?"":"s")+' vs '+E(r.oa)+(H2.length?" · last meeting "+E(H2[0].d)+" ("+H2[0].v+" vs today's line "+r.line+")":"")+'</div>'+(H2.length<2?'<div class="warn">'+(H2.length?"Only 1 game":"No games")+' vs '+E(r.oa)+' in our logs (last 2 seasons). Too small to lean on.</div>':"");
  if(H2.length){body+='<table class="slp-t"><thead><tr><th>Split</th><th>G</th><th>Avg</th><th>Over '+E(r.line)+'</th></tr></thead><tbody>'+grp("All vs "+E(r.oa),H2);
   if(curQ){var same=H2.filter(function(q){var m=QM[q.e+"|"+q.t];return m&&m.n==curQ}),oth=H2.filter(function(q){var m=QM[q.e+"|"+q.t];return m&&m.n!=curQ}),unk=H2.length-same.length-oth.length;body+=grp("With "+E(curQ)+" at QB",same)+grp("Different QB",oth)+(unk?'<tr><td colspan=4 class="mut">'+unk+' game(s): team QB not in our logs</td></tr>':"")}
   body+='</tbody></table><table class="slp-t" style="margin-top:6px"><thead><tr><th>Date</th><th>Game</th><th>Result</th>'+(curQ?"<th>Team QB</th>":"")+'</tr></thead><tbody>'+H2.map(function(q){var m=QM[q.e+"|"+q.t];return '<tr><td>'+E(q.d)+'</td><td>'+E(q.at+" "+q.o)+'</td><td><b style="color:'+(q.v>r.line?"var(--acc)":"var(--bad)")+'">'+q.v+'</b></td>'+(curQ?'<td>'+E(m?m.n:"?")+'</td>':"")+'</tr>'}).join("")+'</tbody></table>'}
  body+='<div class="mut" style="font-size:11px;margin-top:6px">From game logs (last 2 seasons'+(x.s=="nfl"?"; QB per game from the team's logged passer":"")+'). Career logs before that aren\'t in our data.'+(x.pos=="QB"?" Opposing-QB split isn't relevant here.":"")+'</div>'}
 else if(TAB=="od"){var q=(function(){try{return ppLeg(r)}catch(e){return null}})();
  body='<table class="slp-t"><tbody>'+(q?'<tr><td>Best price</td><td><b>'+(q.best>0?"+":"")+q.best+'</b> '+E(q.book||"")+'</td></tr>'+(q.dk!=null?'<tr><td>Book A</td><td>'+(q.dk>0?"+":"")+q.dk+'</td></tr>':"")+'<tr><td>No-vig fair</td><td>'+(q.nv!=null?Math.round(q.nv*100)+"%":"—")+' ('+(q.nv_books||q.books||0)+' books)</td></tr><tr><td>As of</td><td>'+E(etT(q.t))+(q.snap?" · "+E(q.snap):"")+'</td></tr>':'<tr><td colspan=2 class="mut">No multi-book price for this prop in our feed.</td></tr>')+
   (r.ov!=null?'<tr><td>Book A over</td><td>'+(r.ov>0?"+":"")+r.ov+'</td></tr>':"")+(r.open!=null?'<tr><td>Opening line</td><td>'+r.open+'</td></tr>':"")+'</tbody></table>'+
   (r.ladder?'<div class="tl" style="margin-top:6px">'+r.ladder.map(function(t){return '<span>'+t[0]+'+ <b>'+(t[1]==null?"—":(t[1]>0?"+":"")+t[1])+'</b></span>'}).join("")+'</div>':"")+
   (r.lh&&r.lh.length>1?'<div class="tl" style="margin-top:6px">'+r.lh.map(function(h){return '<span>'+E(etT(h[0]))+': <b>'+h[1]+'</b></span>'}).join("")+'</div>':"")+'<div class="mut" style="font-size:11px;margin-top:6px">Prices we already collect on our normal refresh. Nothing extra is fetched for this page.</div>'}
 else if(TAB=="ic"){var F=((window.IMP&&IMP.flags)||[]).filter(function(f){return f.team==r.team&&f.kind!="SELF"});
  body=F.length?F.map(function(f){var hit=f.aff&&(f.aff.pos||[]).indexOf(r.pos)>=0&&(f.aff.markets||[]).indexOf(r.market)>=0;return '<div class="corr" style="margin:6px 0">'+(hit?"⚡ ":"")+E(f.text)+' <span class="mut">· '+E(f.dir)+(hit?" · affects this prop":"")+'</span></div>'}).join(""):'<div class="mut" style="font-size:13px">No teammates flagged out or limited for '+E(r.team)+' this week.</div>';
  if(r.u){var u=r.u;body+='<div class="mut" style="font-size:12px;margin-top:6px">Usage: '+["sn","tg","ca"].filter(function(k){return u[k]&&u[k].szn>0}).map(function(k){return ({sn:"snap %",tg:"targets",ca:"carries"})[k]+" L3 "+u[k].l3+" vs season "+u[k].szn}).join(" · ")+'</div>'}
  body+='<div class="mut" style="font-size:11px;margin-top:6px">From the injury report and snap/usage data.</div>'}
 else if(TAB=="lv"){var d=LIVE_D&&LIVE_D.id==r.game?LIVE_D:null;
  if(!d||d.state=="pre")body='<div class="mut" style="font-size:13px">Game hasn\'t started. Starts '+E(etT(r.time))+'. This tab tracks his stats vs the line once it\'s live.</div>';
  else{var cur=liveVal(r,d.box),P=PER[x.s],frac=null;if(P&&d.period){var cl=String(d.clock||"0:00").split(":"),mins=(+cl[0]||0)+(+cl[1]||0)/60;frac=x.s=="soccer"?Math.min(1,(parseFloat(d.clock)||0)/90):Math.min(1,((d.period-1)*P[1]+(P[1]-mins))/(P[0]*P[1]))}
   var pace=cur!=null&&frac>0.05?cur/frac:null;
   body='<div class="slp-bx"><div>Now<b>'+(cur==null?"—":cur)+'</b></div><div>Line<b>'+r.line+'</b></div><div>Pace<b>'+(d.state=="post"?"Final":pace==null?"—":f1(pace))+'</b></div><div>Status<b style="font-size:12px">'+E(d.detail)+'</b></div></div>'+(cur!=null&&cur>r.line?'<div class="corr">✅ Already over '+r.line+'.</div>':"")+
   '<div class="mut" style="font-size:11px;margin-top:6px">Live box score. Pace = current stat ÷ share of game played (straight-line, not a model). Live player prop lines aren\'t in our feed.</div>'}}
 el.innerHTML=strip+'<div class="views" style="margin:10px 0 6px;display:flex;gap:4px;overflow-x:auto">'+T.map(function(t){return '<button data-tab="'+t[0]+'" class="'+(t[0]==TAB?"on":"")+'" style="white-space:nowrap">'+t[1]+'</button>'}).join("")+'</div><div class="card" '+(TAB=="ov"||TAB=="lv"?"data-sl-public":"data-sl-teaser")+' style="padding:10px 12px">'+body+'</div>'+
  '<button class="morebtn" id="slp-full" style="margin-top:8px">Full prop view (splits, ladder, line movement) →</button>';
 el.querySelectorAll("[data-tab]").forEach(function(b){b.onclick=function(){TAB=b.dataset.tab;panel(x,r,props,g)}});
 document.getElementById("slp-full").onclick=function(){drawer(r);var dr=document.getElementById("drawer"),b=document.createElement("button");b.className="morebtn";b.style.margin="0 0 8px";b.textContent="← "+x.name+" profile";b.onclick=function(){profile(x)};dr.insertBefore(b,dr.firstChild.nextSibling)}}
var WDIR=["N","NE","E","SE","S","SW","W","NW"];
function venue(x,g){if(["nfl","cfb","mlb"].indexOf(x.s)<0||!g)return;var el=document.getElementById("slp-venue");
 EJ("https://site.api.espn.com/apis/site/v2/sports/"+PATH[x.s]+"/summary?event="+g.id).then(function(d){if(CUR!==x.aid)return;var v=(d.gameInfo||{}).venue;if(!v)return;
  var ad=v.address||{},roof=v.indoor?"Indoor / dome (or roof closed)":"Outdoor",surf=v.grass===true?"Grass":v.grass===false?"Turf":"—";
  var G=((window.GAMES&&GAMES[x.s])||[]).find(function(q){return q.id==g.id})||{};
  var h='<div class="mut" style="font-size:12px">Stadium</div><div style="font-weight:700">'+E(v.fullName)+'</div><div class="mut" style="font-size:12px">'+E([ad.city,ad.state].filter(Boolean).join(", "))+" · "+roof+" · "+surf+'</div><div id="slp-wx" style="font-size:13px;margin-top:6px"></div>';
  var p=CUR_PROPS&&CUR_PROPS[0];if(p&&(p.hm||p.aw))h+='<div class="mut" style="font-size:12px;margin-top:6px">'+E(p.market)+' over '+p.line+': home '+(p.hm?p.hm.h+"/"+p.hm.n:"—")+' · away '+(p.aw?p.aw.h+"/"+p.aw.n:"—")+' (tonight: '+(p.home?"home":"away")+')</div>';
  el.innerHTML=h;el.hidden=false;var wx=document.getElementById("slp-wx");
  if(v.indoor){wx.innerHTML="🏟️ Indoors: weather n/a";return}
  if(!ad.city){wx.textContent="";return}
  fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&country=US&name="+encodeURIComponent(ad.city)).then(function(r){return r.json()}).then(function(gc){var c=gc.results&&gc.results[0];if(!c)throw 0;
   return fetch("https://api.open-meteo.com/v1/forecast?latitude="+c.latitude+"&longitude="+c.longitude+"&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC&forecast_days=10")}).then(function(r){return r.json()}).then(function(f){
   var t=new Date(g.time).toISOString().slice(0,13),i=f.hourly.time.findIndex(function(z){return z.slice(0,13)==t});if(i<0){wx.innerHTML='<span class="mut">Forecast not out yet for kickoff.</span>';return}var H=f.hourly;
   wx.innerHTML="🌤️ "+Math.round(H.temperature_2m[i])+"°F · wind "+Math.round(H.wind_speed_10m[i])+" mph "+WDIR[Math.round(H.wind_direction_10m[i]/45)%8]+" (gusts "+Math.round(H.wind_gusts_10m[i])+") · precip "+E(H.precipitation_probability[i])+'% <span class="mut">(forecast, game hour)</span>'}).catch(function(){wx.innerHTML=G.wx?'🌤️ '+Math.round(G.wx.temp)+"°F · wind "+Math.round(G.wx.wind)+" mph · rain "+E(G.wx.pop||0)+'% <span class="mut">(forecast)</span>':""})}).catch(function(){})}
var CUR_PROPS=null;

var LIVE_T=null,CUR=null;
function etT(t){return new Date(t).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET"}
function slug(sp,lg){return sp=="soccer"?"soccer/"+(lg||"all"):PATH[sp]}
function nextGame(x,props){var G=(window.GAMES&&GAMES[x.s])||[],now=Date.now(),dur=({nfl:3.6,cfb:3.8,nba:2.6,nhl:2.8,mlb:3.4,soccer:2.1}[x.s]||3)*36e5;
 if(props.length){var p=props.slice().sort(function(a,b){return new Date(a.time)-new Date(b.time)}).find(function(p){return +new Date(p.time)+dur>now})||props[0];
  var g=G.find(function(g){return g.id==p.game})||{};return Promise.resolve({id:p.game,time:p.time,opp:p.opp,lg:p.lg||g.lg||x.lg,home:g.home,away:g.away})}
 var g=G.filter(function(g){return(g.home==x.team||g.away==x.team)&&+new Date(g.time)+dur>now}).sort(function(a,b){return new Date(a.time)-new Date(b.time)})[0];
 if(g)return Promise.resolve({id:g.id,time:g.time,opp:g.home==x.team?"vs "+g.away:"@ "+g.home,lg:g.lg||x.lg,home:g.home,away:g.away});
 if(x.s=="soccer"||!x.team)return Promise.resolve(null);
 return EJ("https://site.api.espn.com/apis/site/v2/sports/"+PATH[x.s]+"/teams/"+encodeURIComponent(x.team.toLowerCase())+"/schedule").then(function(d){
  var e=(d.events||[]).filter(function(e){var st=e.competitions[0].status.type.state;return st!="post"}).sort(function(a,b){return new Date(a.date)-new Date(b.date)})[0];if(!e)return null;
  var c=e.competitions[0].competitors,me=c.find(function(t){return t.team.abbreviation==x.team}),op=c.find(function(t){return t!==me})||{team:{}};
  return{id:e.id,time:e.date,opp:(me&&me.homeAway=="home"?"vs ":"@ ")+op.team.abbreviation,src:"espn"}}).catch(function(){return null})}
function boxFor(d,aid){var out=null,bp=(d.boxscore&&d.boxscore.players)||[];
 bp.forEach(function(t){(t.statistics||[]).forEach(function(g){(g.athletes||[]).forEach(function(a){if(String(a.athlete&&a.athlete.id)==String(aid)){out=out||[];var L=g.labels||g.names||[];
   L.forEach(function(l,i){if(a.stats&&a.stats[i]!=null&&a.stats[i]!=="")out.push({g:g.name||"",gt:g.text||"",l:l,v:a.stats[i]})})}})})});
 (d.rosters||[]).forEach(function(t){(t.roster||[]).forEach(function(a){if(String(a.athlete&&a.athlete.id)==String(aid)&&a.stats){out=out||[];a.stats.forEach(function(s){if(s.displayValue!=null)out.push({g:"",gt:"",l:s.abbreviation||s.shortDisplayName||s.name,v:s.displayValue})})}})});
 return out}
function liveBlock(x,g,el){var u="https://site.api.espn.com/apis/site/v2/sports/"+slug(x.s,g.lg)+"/summary?event="+g.id;
 return EJ(u).then(function(d){if(CUR!==x.aid)return;var c=d.header&&d.header.competitions&&d.header.competitions[0];if(!c)return;var st=c.status.type,state=st.state;
  var T=c.competitors.slice().sort(function(a){return a.homeAway=="away"?-1:1});
  var LK="pf|"+x.s+"|"+g.id;if(window.LiveEv&&state!="pre")LiveEv.ingest(LK,x.s,d);
  if(window.LiveEv&&state!="pre"){var gg={state:state,detail:st.shortDetail||st.detail,period:c.status.period,clock:c.status.displayClock,teams:c.competitors.map(function(t){return{ab:t.team.abbreviation,score:t.score,ha:t.homeAway}})};
   var h=LiveEv.head(x.s,gg,LK)+LiveEv.panel(LK,{ids:[x.aid],names:[x.name]});}else{
  var h='<div class="mut" style="font-size:12px">'+(state=="in"?'<span class="slp-live">LIVE</span>'+E(st.shortDetail||st.detail):state=="post"?"FINAL":"Next game")+" · "+etT(c.date)+'</div>';
  h+='<div class="slp-sc">'+T.map(function(t){return '<span>'+E(t.team.abbreviation)+(state!="pre"?" "+E(t.score==null?"":t.score):"")+'</span>'}).join('<span class="mut" style="font-weight:400">'+(state=="pre"?"vs":"–")+'</span>')+'</div>';}
  var b=state!="pre"?boxFor(d,x.aid):null;LIVE_D={id:g.id,state:state,box:b,period:c.status.period,clock:c.status.displayClock,detail:st.shortDetail||st.detail};
  if(state!="pre"){h+=b&&b.length?'<div class="mut" style="font-size:12px;margin-top:6px">'+E(x.name)+' '+(state=="in"?"so far":"final line")+' (box score)</div><div class="slp-bx">'+b.slice(0,18).map(function(s){return '<div>'+E((s.g?s.g.charAt(0).toUpperCase()+s.g.slice(1)+" ":"")+s.l)+'<b>'+E(s.v)+'</b></div>'}).join("")+'</div>':'<div class="mut" style="font-size:12px;margin-top:6px">No box-score line for '+E(x.name)+' yet (hasn\'t recorded a stat, or it hasn\'t posted yet).</div>'}
  var pc=(d.pickcenter||[])[0];if(pc&&(pc.details||pc.overUnder!=null))h+='<div class="mut" style="font-size:12px;margin-top:8px">Game line'+(state=="in"?" (as last posted; may not be live)":"")+': '+E(pc.details||"")+(pc.overUnder!=null?" · O/U "+E(pc.overUnder):"")+' · '+E((pc.provider&&pc.provider.name)||"sportsbook")+'</div>';
  if(state=="in")h+='<div class="mut" style="font-size:11px;margin-top:4px">Live player prop lines aren\'t in our data feed, so the prop lines below are the latest pregame lines. Refreshes every 30s.</div>';
  el.innerHTML=h;if(TAB=="lv"&&CUR_PROPS&&CUR_PROPS.length){var on=document.querySelector("#slp-mk button.on");panel(x,CUR_PROPS[on?+on.dataset.pi:0],CUR_PROPS,g)}clearTimeout(LIVE_T);if(state=="in")LIVE_T=setTimeout(function(){if(document.getElementById("drawer").classList.contains("open")&&CUR===x.aid)liveBlock(x,g,el)},30000)}).catch(function(){})}
function ourChance(r){try{var q=ppLeg(r);if(!q||q.nv==null)return null;var sh=30,h=r.l10?r.l10.h:0,n=r.l10?r.l10.n:0,p=Math.min((h+sh*q.nv)/(n+sh),.97),ip=1/toDec(q.best);return{p:p,ip:ip,edge:p-ip,best:q.best,book:q.book}}catch(e){return null}}
async function profile(x){if(window.PLOPEN)return PLOPEN(x.s+":"+x.aid);CUR=x.aid;clearTimeout(LIVE_T);
 if(sport!==x.s){sport=x.s;try{page=1;save()}catch(e){}await ensure(x.s);try{fillFilters();render()}catch(e){}}else await ensure(x.s);
 var props=(DATA[x.s]||[]).filter(function(r){return String(r.aid)==String(x.aid)});
 CUR_PROPS=props;LIVE_D=null;var unav=props.map(function(r){return r.unav}).filter(Boolean)[0],inj=x.inj||(unav&&(unav.st||unav.status||unav))||"";
 var head0=x.head?'<img alt="" src="'+head(x.s,x.aid).replace("w=96&h=70","w=192&h=140")+'" onerror="this.remove()">':"";
 var H='<button class="x" id="cls" aria-label="Close">×</button><div class="slp-h">'+head0+'<div><h2 style="margin:0">'+E(x.name)+'</h2><div class="mut">'+E(SPN[x.s])+(x.team?" · "+E(x.team):"")+(x.pos?" · "+E(x.pos):"")+'</div>'+
  (inj?'<div style="margin-top:4px"><span class="sls-tag i" style="margin:0;font-size:11px">'+E(typeof inj=="string"?inj:"Injury")+'</span></div>':'<div class="mut" style="font-size:12px;margin-top:4px">No injury designation listed</div>')+'</div></div>'+
  '<div class="slp-g" data-sl-public id="slp-game"><span class="mut">Finding next game…</span></div>';
 if(props.length){props.sort(function(a,b){return(a.grp||"").localeCompare(b.grp||"")||a.market.localeCompare(b.market)});
  H+='<h3 style="margin:14px 0 4px;font-size:15px">Props ('+props.length+')</h3><div class="mk" id="slp-mk" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">'+props.map(function(r,i){return '<button class="morebtn" data-pi="'+i+'" style="margin:0;white-space:nowrap">'+E(r.market)+" "+(/Anytime/.test(r.market)?"":E(r.line))+'</button>'}).join("")+'</div><div id="slp-panel"></div>'}
 else H+='<div class="card" data-sl-public style="margin-top:12px"><b>No props posted for '+E(x.name)+' right now.</b><div class="mut" style="font-size:13px;margin-top:4px">'+(x.s=="cfb"?"College props are limited to the CFB desk's anytime TD board. Check the CFB tab.":x.s=="nba"?"NBA props post once the regular season starts.":"Props show here as soon as books post them for the next game.")+'</div></div>';
 H+='<div class="slp-g" data-sl-public id="slp-venue" hidden></div>';
 var dr=document.getElementById("drawer");dr.innerHTML=H;dr.classList.add("open");document.getElementById("shade").classList.add("open");dr.scrollTop=0;
 document.getElementById("cls").onclick=function(){CUR=null;clearTimeout(LIVE_T);close()};
 var sel=0;function selM(i){sel=i;dr.querySelectorAll("#slp-mk button").forEach(function(b){b.classList.toggle("on",+b.dataset.pi==i);b.style.borderColor=+b.dataset.pi==i?"var(--acc)":""});panel(x,props[i],props,g0)}
 var g0=null;dr.querySelectorAll("#slp-mk button").forEach(function(b){b.onclick=function(){selM(+b.dataset.pi)}});if(props.length){var bi=0,bs=-1;props.forEach(function(r,i){var o=ourChance(r),sc=(o?100+o.edge*100:0)+(/Yards|Points|Shots|Receptions|Hits|Strikeouts/.test(r.market)?20:0)+(r.games&&r.games.length?5:0);if(sc>bs){bs=sc;bi=i}});selM(bi)}
 try{history.replaceState(null,"","#player="+x.s+":"+x.aid)}catch(e){}
 var gel=document.getElementById("slp-game"),g=await nextGame(x,props);if(CUR!==x.aid)return;
 if(!g){gel.innerHTML='<span class="mut">No upcoming game on the schedule.</span>';return}
 gel.innerHTML='<div class="mut" style="font-size:12px">Next game</div><div style="font-weight:700;margin-top:2px">'+E(x.team)+" "+E(g.opp||"")+'</div><div class="mut" style="font-size:12px">'+etT(g.time)+'</div>';
 g0=g;if(props.length)panel(x,props[sel],props,g);venue(x,g);
 if(+new Date(g.time)-Date.now()<36e5*36)liveBlock(x,g,gel)}
function byKey(s,aid){return load().then(function(L){return L.find(function(x){return x.s==s&&x.aid==aid})})}
function fromHash(){if(window.PLOPEN)return;var m=/#player=(\w+):(\d+)/.exec(location.hash);if(!m)return;var t=0,iv=setInterval(function(){if((window.GAMES&&typeof ensure=="function"&&typeof RAW!="undefined"&&Object.keys(RAW).length)||++t>60){clearInterval(iv);byKey(m[1],m[2]).then(function(x){if(x)profile(x)})}},250)}
function init(){if(onIndex){var q=document.getElementById("q");if(q){attach(q,profile);var tmr;window.SLSearch={profile:profile,search:function(s){return load().then(function(){return search(s)})}};fromHash()}}
 else{var hd=document.querySelector("header");if(!hd)return;var i=document.createElement("input");i.type="search";i.className="sls-hdr";hd.appendChild(i);i.style.cssText="background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:8px;padding:8px 10px";attach(i,function(x){location.href="./index.html#player="+x.s+":"+x.aid})}}
document.readyState=="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();
