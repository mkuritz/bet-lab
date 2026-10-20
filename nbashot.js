/* NBA Shot chart in the player popup (index drawer): hex bins sized by frequency, colored by FG% vs league average,
   zone table, season toggle, side cards from numbers Bet Lab already publishes. Real shots only (data/shots_nba/<aid>.json). */
(function(){"use strict";if(window.__nbashot)return;window.__nbashot=1;
var LG=null,CACHE={},SEL={},V=Math.floor(Date.now()/6e5);
var THIS="2026-27",LAST="2025-26",MIN=50,ZN={rim:"Rim",paint:"Paint (non-RA)",mid:"Mid-range",c3:"Corner 3",ab3:"Above break 3"};
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function J(u){return fetch(u).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
function lg(){return LG||(LG=J("data/shots_nba/league.json?v="+V))}
function pl(a){return CACHE[a]||(CACHE[a]=J("data/shots_nba/"+a+".json?v="+V))}
var css=document.createElement("style");css.textContent=
"#nbs{margin-top:18px}#nbs h3{margin:0 0 6px;font-size:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}#nbs .sg{margin-left:auto;display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}"+
"#nbs .sg button{background:none;border:0;color:var(--mut);font:600 11.5px system-ui;padding:4px 10px;cursor:pointer}#nbs .sg button.on{background:var(--acc2);color:#04121f}"+
"#nbs .wrap{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px}#nbs svg{width:100%;height:auto;display:block;border-radius:8px}"+
"#nbs .hx{stroke:#0b0f17;stroke-width:.12;cursor:pointer}#nbs .hx:hover,#nbs .hx.on{stroke:#fff;stroke-width:.3}"+
"#nbs .lgd{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mut);margin-top:6px}#nbs .lgd{flex-wrap:wrap}#nbs .lgd i{flex:1;min-width:90px;height:7px;border-radius:4px;background:linear-gradient(90deg,#2f6fd6,#e9eef7,#e5383b)}"+
"#nbs .tip{min-height:18px;font-size:12px;color:var(--txt);margin-top:4px}#nbs .zt{margin-top:8px;font-size:13px}#nbs .zr{display:grid;grid-template-columns:1fr auto 64px;gap:8px;align-items:center;padding:6px 2px;border-top:1px solid var(--line)}#nbs .zr>:nth-child(n+2){text-align:right;white-space:nowrap}"+
"#nbs .up{color:var(--acc)}#nbs .dn{color:var(--bad)}#nbs .cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}"+
"#nbs .cd{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px}#nbs .cd small{display:block;color:var(--mut);font-size:11.5px}#nbs .cd b{display:block;font-size:22px;margin:2px 0}#nbs .cd span{font-size:11px;color:var(--mut)}"+
"#nbs .note{font-size:11.5px;color:var(--mut);margin-top:6px}";
document.head.appendChild(css);
function col(d){var t=Math.max(-1,Math.min(1,d/0.10)),a=[233,238,247],b=t<0?[47,111,214]:[229,56,59],k=Math.abs(t);return"rgb("+a.map(function(v,i){return Math.round(v+(b[i]-v)*k)}).join(",")+")"}
function hexPts(cx,cy,r){var p=[];for(var i=0;i<6;i++){var an=Math.PI/180*(60*i-30);p.push((cx+r*Math.cos(an)).toFixed(2)+","+(cy+r*Math.sin(an)).toFixed(2))}return p.join(" ")}
// court in feet: x 0..50, y = feet from the rim (rim at y=0, baseline y=-5.25); drawn basket-at-top
function court(){var Y=function(y){return y+5.25},L='stroke="#f4ead9" stroke-width=".22" fill="none" opacity=".9"',w="";
 w+='<defs><linearGradient id="nbsw" x1="0" x2="1"><stop offset="0" stop-color="#b9824b"/><stop offset=".5" stop-color="#c8925a"/><stop offset="1" stop-color="#b47c45"/></linearGradient>'+
  '<pattern id="nbsp" width="3" height="47" patternUnits="userSpaceOnUse"><rect width="3" height="47" fill="url(#nbsw)"/><line x1="3" y1="0" x2="3" y2="47" stroke="#8f5f33" stroke-width=".06" opacity=".6"/><line x1="0" y1="13" x2="3" y2="13" stroke="#8f5f33" stroke-width=".05" opacity=".5"/><line x1="0" y1="31" x2="3" y2="31" stroke="#8f5f33" stroke-width=".05" opacity=".5"/></pattern></defs>';
 w+='<rect x="0" y="0" width="50" height="42" fill="url(#nbsp)"/><rect x="0" y="0" width="50" height="42" fill="#000" opacity=".12"/>';
 w+='<rect x="0" y="0" width="50" height="47" '+L+'/>';
 w+='<rect x="17" y="0" width="16" height="19" fill="#9a6235" opacity=".35"/><rect x="17" y="0" width="16" height="19" '+L+'/><rect x="19" y="0" width="12" height="19" '+L+'/>';
 w+='<path d="M19 19 A6 6 0 0 0 31 19" '+L+'/><path d="M19 19 A6 6 0 0 1 31 19" '+L+' stroke-dasharray=".8 .6"/>';
 w+='<line x1="22" y1="'+Y(-1.25)+'" x2="28" y2="'+Y(-1.25)+'" '+L+'/><circle cx="25" cy="'+Y(0)+'" r=".75" '+L+'/><path d="M21 '+Y(0)+' A4 4 0 0 0 29 '+Y(0)+'" '+L+'/>';
 var a=Math.sqrt(23.75*23.75-22*22);w+='<path d="M3 0 L3 '+Y(a)+' A23.75 23.75 0 0 0 47 '+Y(a)+' L47 0" '+L+'/>';
 w+='<path d="M19 47 A6 6 0 0 1 31 47" '+L+'/>';return w}
function zrow(z,p,lgz){var f=p.fga?p.fgm/p.fga:null,d=f!=null&&lgz!=null?(f-lgz)*100:null;
 return'<div class="zr"><div>'+ZN[z]+' <span class="mut" style="font-size:11px">'+p.fgm+'/'+p.fga+'</span></div><div>'+(f==null?'<span class="mut">no shots</span>':Math.round(f*100)+'%')+(d==null?"":' · <span class="'+(d>=0?"up":"dn")+'">'+(d>=0?"+":"")+d.toFixed(0)+'</span>')+'</div><div class="mut" style="font-size:11px">league '+(lgz==null?"—":Math.round(lgz*100)+"%")+'</div></div>'}
function nm(t){return({UTA:"UTAH",GSW:"GS",NOP:"NO",SAS:"SA",NYK:"NY",WAS:"WSH"})[t]||t}
function cards(r,P,L,s){var h="";
 // 1) selected market: L10 average vs line (published hit-rate data)
 if(r&&r.l10&&r.l10.avg!=null)h+='<div class="cd"><small>'+E(r.market)+' · L10 avg</small><b>'+(+r.l10.avg).toFixed(1)+'</b><span>Line '+E(r.line)+' · over in '+r.l10.h+'/'+r.l10.n+'</span></div>';
 // 2) opponent rim defense rank from real shots allowed
 if(r&&r.oa){var tS=(L.seasons[THIS]||{}).teams||{},tL=(L.seasons[LAST]||{}).teams||{},k=nm(r.oa),t=tS[k]&&tS[k].g>=10?[tS[k],"this season"]:tL[k]?[tL[k],LAST+" season"]:null;
  if(t&&t[0].rim)h+='<div class="cd"><small>'+E(r.oa)+' rim D rank</small><b class="'+(t[0].rim.r<=10?"up":t[0].rim.r>=21?"dn":"")+'">'+t[0].rim.r+'<span style="font-size:13px"> of '+t[0].of+'</span></b><span>Allows '+Math.round(t[0].rim.fg*100)+'% at the rim, '+t[0].rim.fga_g+' att/g · '+t[1]+' · 1 = softest</span></div>'}
 // 3) usage: minutes trend + shot volume
 var m=r&&r.u&&r.u.min;if(m)h+='<div class="cd"><small>Minutes, last 5</small><b>'+m.l5+'</b><span>vs '+(r.szN===0?"last season":"season")+' '+m.szn+(P.games?' · '+(P.fga/P.games).toFixed(1)+' FGA/g ('+s+')':"")+'</span></div>';
 else if(P.games)h+='<div class="cd"><small>Shot volume</small><b>'+(P.fga/P.games).toFixed(1)+'</b><span>FGA per game, '+s+'</span></div>';
 // 4) price edge only with a same-day price
 try{var R=typeof dlRow=="function"&&r?dlRow("nba",r):null,td=new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
  if(R&&R.best!=null&&R.fair!=null&&R.start&&new Date(R.start).toLocaleDateString("en-CA",{timeZone:"America/New_York"})==td){var b=R.best,imp=b>0?100/(b+100):-b/(-b+100),e=(R.fair-imp)*100;
   h+='<div class="cd"><small>'+E(r.market)+' over · price edge</small><b class="'+(e>=0?"up":"dn")+'">'+(e>=0?"+":"")+e.toFixed(1)+'%</b><span>Market fair '+Math.round(R.fair*100)+'% vs best price '+(b>0?"+":"")+b+' ('+Math.round(imp*100)+'%) · '+E(R.book||"")+'</span></div>'}}catch(_){}
 return h?'<div class="cards">'+h+'</div>':""}
function paint(box,aid,r){Promise.all([lg(),pl(aid)]).then(function(x){var L=x[0],D=x[1];if(!box.isConnected)return;
 if(!L||!D||!D.seasons){box.innerHTML='<h3>🏀 Shot chart</h3><div class="wrap"><p class="mut" style="margin:4px 0">Not enough data yet: no field-goal attempts on file for this player this season or last.</p></div>';return}
 var S=D.seasons,cur=S[THIS]||{fga:0},s=SEL[aid]||(cur.fga>=200?THIS:LAST);if(!S[s]&&S[THIS])s=THIS;SEL[aid]=s;var P=S[s]||{fga:0,fgm:0,games:0,zones:[],hex:[]},LZ={};((L.seasons[s]||{}).zones||[]).forEach(function(z){LZ[z.k]=z.fg});
 var lab=s==THIS?"This season ("+THIS+")":"Last season ("+LAST+")",tog='<span class="sg"><button data-s="'+THIS+'" class="'+(s==THIS?"on":"")+'">This season</button><button data-s="'+LAST+'" class="'+(s==LAST?"on":"")+'">Last season</button></span>';
 var h='<h3>🏀 Shot chart <span class="mut" style="font-weight:400;font-size:12px">'+lab+'</span>'+tog+'</h3>';
 if(P.fga<MIN){h+='<div class="wrap"><p class="mut" style="margin:4px 0">Not enough data yet: '+P.fga+' field-goal attempt'+(P.fga==1?"":"s")+' '+(s==THIS?"so far this season":"last season")+' (we show the chart from '+MIN+'). '+(s==THIS&&S[LAST]&&S[LAST].fga>=MIN?"Switch to Last season for his full chart.":"")+'</p></div>'}
 else{var mx=P.hex.reduce(function(a,q){return Math.max(a,q[2])},1),hx=P.hex.filter(function(q){return q[1]<=36.5&&(P.fga<200||q[2]>=2)}).slice().reverse().map(function(q,i){var rr=(L.hex_ft||2)*(0.3+0.68*Math.sqrt(q[2]/mx)),f=q[3]/q[2],d=f-q[4];
   return'<polygon class="hx" data-t="'+E(ZN[q[5]]+": "+q[3]+"/"+q[2]+" ("+Math.round(f*100)+"%) · league here "+Math.round(q[4]*100)+"% · "+(d>=0?"+":"")+Math.round(d*100))+'" points="'+hexPts(q[0],q[1]+5.25,rr)+'" fill="'+col(d)+'"/>'}).join("");
  h+='<div class="wrap"><svg viewBox="0 0 50 42" role="img" aria-label="Shot chart, '+E(lab)+'">'+court()+hx+'</svg><div class="tip" aria-live="polite"><span class="mut">Tap or hover a hex for makes, attempts and FG% vs league.</span></div>'+
   '<div class="lgd"><span>−10%</span><i></i><span>+10%</span><span style="margin-left:8px">FG% vs league avg · bigger hex = more shots</span></div>'+
   '<div class="zt">'+P.zones.map(function(z){return zrow(z.k,z,LZ[z.k])}).join("")+'<div class="zr"><div><b>All field goals</b> <span class="mut" style="font-size:11px">'+P.fgm+'/'+P.fga+'</span></div><div><b>'+Math.round(P.fgm/P.fga*100)+'%</b></div><div class="mut" style="font-size:11px">'+P.games+' games</div></div></div></div>'}
 h+=cards(r,P,L,s==THIS?"this season":"last season");
 h+='<div class="note">Every regular-season field-goal attempt from play-by-play shot locations ('+(L.seasons[s]?L.seasons[s].games:0)+' games league-wide). Rim = within 4 ft; Paint (non-RA) = rest of the lane; league average = all players in the same zone or spot that season. Free throws not included.</div>';
 box.innerHTML=h;
 box.querySelectorAll(".sg [data-s]").forEach(function(b){b.onclick=function(){SEL[aid]=b.dataset.s;paint(box,aid,r)}});
 var tip=box.querySelector(".tip");box.querySelectorAll(".hx").forEach(function(p){var f=function(){box.querySelectorAll(".hx.on").forEach(function(o){o.classList.remove("on")});p.classList.add("on");tip.textContent=p.getAttribute("data-t")};p.addEventListener("mouseenter",f);p.addEventListener("click",f)})})}
function inject(r){if(typeof sport=="undefined"||sport!="nba"||!r||!r.aid)return;var dr=document.getElementById("drawer");if(!dr)return;
 var old=dr.querySelector("#nbs");if(old)old.remove();var box=document.createElement("div");box.id="nbs";box.setAttribute("data-sl-public","");box.setAttribute("data-plk-no","");box.innerHTML='<h3>🏀 Shot chart</h3><div class="wrap mut">Loading shot chart…</div>';
 var anchor=dr.querySelector(".split");anchor=anchor&&anchor.nextSibling?anchor:null;if(anchor)anchor.after(box);else dr.appendChild(box);paint(box,String(r.aid),r)}
function hook(){if(typeof window.drawer!="function")return setTimeout(hook,100);if(window.drawer.__nbs)return;var o=window.drawer,w=function(r){var x=o.apply(this,arguments);try{inject(r)}catch(e){console.warn("shot chart",e)}return x};w.__nbs=1;window.drawer=w}
hook();})();
