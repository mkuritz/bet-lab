/* NBA stat Projections (data/nba_proj.json): a "<MKT> proj" card in the NBA player popup for the selected market,
   and a Proj column next to Line in the NBA props table. Estimates only; open to everyone like profiles. */
(function(){"use strict";if(window.__nbaproj)return;window.__nbaproj=1;
var DOC=null,V=Math.floor(Date.now()/3e5);
var MK={"Points":"pts","Rebounds":"reb","Assists":"ast","3-Point Field Goals":"3pm","Steals":"stl","Blocks":"blk","Turnovers":"to","Points, Rebounds, and Assists":"pra","Points and Assists":"pa","Points and Rebounds":"pr","Assists and Rebounds":"ar","Steals and Blocks":"sb"};
var AB={pts:"PTS",reb:"REB",ast:"AST","3pm":"3PM",stl:"STL",blk:"BLK",to:"TO",pra:"PRA",pa:"P+A",pr:"P+R",ar:"A+R",sb:"S+B"};
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function load(){return DOC||(DOC=fetch("data/nba_proj.json?v="+V).then(function(r){return r.ok?r.json():null}).then(function(d){window.__NBPJ=d;try{if(d&&typeof sport!="undefined"&&sport=="nba"&&typeof view!="undefined"&&view=="dash"&&typeof dash=="function")dash()}catch(e){}return d}).catch(function(){return null}))}
load();
function find(d,r){if(!d||!d.games||!r)return null;var g=d.games[String(r.game)];if(g&&g.players&&g.players[String(r.aid)])return{g:g,p:g.players[String(r.aid)]};
 for(var k in d.games){var q=d.games[k].players||{};if(q[String(r.aid)])return{g:d.games[k],p:q[String(r.aid)]}}return null}
var css=document.createElement("style");css.textContent=
"#nbp{margin-top:14px}#nbp .cd,.nbp-cd{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px}#nbp .cd small,.nbp-cd small{display:flex;justify-content:space-between;gap:6px;color:var(--mut);font-size:11.5px}"+
".nbp-cd b{display:block;font-size:26px;margin:2px 0}.nbp-cd span{font-size:11px;color:var(--mut);display:block}.nbp-cd .est{font-size:10px;border:1px solid var(--line);border-radius:999px;padding:0 6px}"+
".nbp-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}.nbp-g div{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:5px 6px;text-align:center}.nbp-g i{display:block;font-style:normal;font-size:10.5px;color:var(--mut)}.nbp-g b{font-size:14px;margin:0}"+
"td.nbp-td{white-space:nowrap}td.nbp-td small{color:var(--mut);display:block;font-size:10.5px}@media(max-width:560px){.nbp-g{grid-template-columns:repeat(3,minmax(0,1fr))}}";
document.head.appendChild(css);
function card(x,r){var k=MK[r.market]||"pts",p=x.p,v=p.proj[k],L=p.lines&&p.lines[k],med=p.med&&p.med[k];
 var h='<div class="nbp-cd" data-sl-public=""><small><span>'+AB[k]+' proj</span><span class="est" title="'+E(DOCN||"")+'">estimate</span></small><b>'+v.toFixed(1)+'</b>'+
  '<span>Projection · median '+med+(L?' · '+Math.round(L.p_over*100)+'% over '+E(L.line):'')+' · '+p.proj.min.toFixed(0)+' min'+(p.status?' · listed '+E(p.status):'')+'</span>'+
  '<div class="nbp-g">'+["pts","reb","ast","3pm","stl","blk","to","pra"].map(function(s){return'<div><i>'+AB[s]+'</i><b>'+p.proj[s].toFixed(1)+'</b></div>'}).join("")+'</div>'+
  (p.opp_role?'<span style="margin-top:6px"><b>Role:</b> '+p.proj.min.toFixed(0)+' min proj'+(p.opp_role.min_last!=null?' vs '+p.opp_role.min_last.toFixed(0)+' last season':'')+(p.opp_role.min_pre!=null?' · '+p.opp_role.min_pre.toFixed(0)+' in preseason':'')+(p.opp_role.why||[]).filter(function(w){return w.indexOf("preseason")<0}).map(function(w){return' · '+E(w.replace(/^out: /,"teammates out: "))}).join("")+'</span>':'')+
  '<span style="margin-top:6px">Estimate from projected minutes (preseason role, this season, last season, teammates out), per-minute production, opponent and pace. '+(x.g.frozen?'Locked at tip.':'Updated '+new Date(x.g.as_of.replace("Z",":00Z")).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})+'.')+'</span></div>';
 return h}
var DOCN="";
function inject(r){if(typeof sport=="undefined"||sport!="nba"||!r||!r.aid)return;var dr=document.getElementById("drawer");if(!dr)return;
 load().then(function(d){if(!d)return;DOCN=d.note||"";var x=find(d,r);var old=dr.querySelector("#nbp");if(old)old.remove();if(!x)return;
  var box=document.createElement("div");box.id="nbp";box.setAttribute("data-sl-public","");box.setAttribute("data-plk-no","");box.innerHTML=card(x,r);
  var nbs=dr.querySelector("#nbs"),sp=dr.querySelector(".split");if(nbs)nbs.before(box);else if(sp&&sp.nextSibling)sp.after(box);else dr.appendChild(box)})}
function hook(){if(typeof window.drawer!="function")return setTimeout(hook,100);if(window.drawer.__nbp)return;var o=window.drawer,w=function(r){var y=o.apply(this,arguments);try{inject(r)}catch(e){console.warn("proj",e)}return y};w.__nbp=1;for(var k in o)w[k]=o[k];window.drawer=w}
hook();
// ---- props table: Proj column after Line ----
var busy=0;
function table(){if(busy)return;if(typeof sport=="undefined"||sport!="nba")return;var th=document.getElementById("th"),tb=document.getElementById("tb");if(!th||!tb)return;
 var R;try{R=rows}catch(_){return}
 load().then(function(d){if(!d||sport!="nba")return;busy=1;try{
  var lc=th.querySelector('th[data-k="line"]');if(lc&&!th.querySelector("th.nbp-th")){var t=document.createElement("th");t.className="nbp-th";t.textContent="Proj";t.title="Projection (estimate) for this market";lc.after(t)}
  var ix=lc?Array.prototype.indexOf.call(th.children,lc):3;
  tb.querySelectorAll("tr[data-i]").forEach(function(tr){if(tr.querySelector("td.nbp-td"))return;var r=R[+tr.getAttribute("data-i")],x=r&&find(d,r),k=r&&MK[r.market],td=document.createElement("td");td.className="nbp-td";
   if(x&&k&&x.p.proj[k]!=null){var v=x.p.proj[k],L=x.p.lines&&x.p.lines[k];td.innerHTML='<b>'+v.toFixed(1)+'</b>'+(L&&L.line==r.line?'<small>'+Math.round(L.p_over*100)+'% over</small>':"")}
   else{td.innerHTML='<span class="mut">—</span>';td.title="Projections post on game day"}var c=tr.children[ix];if(c)c.after(td)})}finally{busy=0}})}
function watch(){var tb=document.getElementById("tb"),th=document.getElementById("th");if(!tb||!th)return setTimeout(watch,200);
 new MutationObserver(function(){if(!busy)table()}).observe(tb,{childList:true});new MutationObserver(function(){if(!busy)table()}).observe(th,{childList:true});table()}
watch();})();
