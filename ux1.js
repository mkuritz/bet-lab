/* Sports Labs UX v1: methodology-first player drawer, stacked combo bars, line stepper, mobile tabs. Real data only. */
(function(){"use strict";if(window.__ux1)return;window.__ux1=1;
var E=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var css=document.createElement("style");css.textContent=
"#drawer .ux-meth{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:12px 0 6px}"+
"#drawer .ux-meth>div{background:rgba(83,227,166,.06);border:1px solid rgba(83,227,166,.22);border-radius:12px;padding:8px 10px;min-height:52px}"+
"#drawer .ux-meth small{display:block;font-size:10.5px;color:var(--mut,#8a94a7);text-transform:uppercase;letter-spacing:.04em}"+
"#drawer .ux-meth b{font-size:17px;font-weight:800}#drawer .ux-pos{color:#53e3a6}#drawer .ux-neg{color:var(--bad,#ff5d6c)}"+
"#drawer .ux-take{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;background:transparent!important;border-style:dashed!important;min-height:0!important}"+
"#drawer .ux-chip{border:1px solid var(--line,#2a2f3a);border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:700}#drawer .ux-chip.best{border-color:#53e3a6;color:#53e3a6;box-shadow:0 0 0 1px #53e3a6 inset}"+
"#drawer .ux-tag{border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;margin-left:4px}.ux-lock{background:rgba(83,227,166,.15);color:#53e3a6}.ux-scr{background:rgba(255,93,108,.15);color:#ff5d6c}"+
"#drawer .ux-ins{margin:6px 0 4px;font-size:13px;line-height:1.4;padding:8px 10px;border-left:3px solid #53e3a6;background:rgba(255,255,255,.03);border-radius:0 12px 12px 0}"+
".ux-i{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;border:1px solid var(--mut,#8a94a7);font-size:11px;cursor:pointer;margin-left:4px;color:var(--mut,#8a94a7);background:none;padding:0;vertical-align:middle}"+
".ux-pop{position:fixed;z-index:200;max-width:320px;background:#121826;border:1px solid #2a3344;border-radius:12px;padding:10px 12px;font-size:12.5px;line-height:1.45;box-shadow:0 10px 30px rgba(0,0,0,.5)}.ux-pop li{margin:3px 0}"+
"#drawer .chart .b{transform-origin:bottom;animation:uxg .3s ease-out;transition:height .3s ease,background .3s;display:flex;flex-direction:column-reverse;cursor:pointer}"+
"@keyframes uxg{from{transform:scaleY(0)}to{transform:scaleY(1)}}"+
"#drawer .chart .b .sg{width:100%;flex:none;transition:height .3s}#drawer .chart .b.ux-st{background:transparent!important}"+
"#drawer .chart .b.ux-st.h .sg{opacity:1}#drawer .chart .b.ux-st.m .sg{opacity:.45}#drawer .chart .b.ux-st.h{outline:2px solid #53e3a6;outline-offset:-1px}#drawer .chart .b.ux-st.m{outline:2px solid var(--bad,#ff5d6c);outline-offset:-1px}"+
"#drawer .chart .b{position:relative}#drawer .chart .b>span{position:absolute;left:0;right:0;bottom:2px;z-index:1;text-align:center}#drawer .chart .ln{border-top-style:dashed;transition:bottom .3s}"+
".ux-leg{display:flex;gap:10px;font-size:11.5px;margin:4px 0}.ux-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}"+
".ux-step{display:inline-flex;align-items:center;gap:6px;margin:6px 0;font-size:13px}.ux-step button{width:30px;height:30px;border-radius:999px;border:1px solid var(--line,#2a2f3a);background:#151c2a;color:inherit;font-size:16px;cursor:pointer}.ux-step b{min-width:46px;text-align:center}"+
".ux-tip{position:fixed;z-index:210;background:#0b0f17;border:1px solid #53e3a6;border-radius:10px;padding:6px 9px;font-size:12px;pointer-events:none}"+
"#drawer h2{position:sticky;top:0;z-index:5;background:inherit}"+
"body:has(#drawer.open) .sl-bar{left:auto!important;right:10px!important;bottom:10px!important;width:auto!important;max-width:220px;padding:6px 10px!important;border-radius:999px!important}"+
"body:has(#drawer.open) .sl-bar small,body:has(#drawer.open) .sl-bar>div:first-child{display:none!important}"+
"@media(max-width:640px){#drawer .ux-meth{grid-template-columns:repeat(3,1fr);gap:5px;margin:8px 0 4px}#drawer .ux-meth>div{padding:5px 7px;min-height:0;border-radius:10px}#drawer .ux-meth small{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#drawer .ux-meth b{font-size:14px}#drawer .ux-take{font-size:11.5px;padding:4px 7px!important}#drawer .ux-ins{font-size:12px;padding:5px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#drawer .chart{height:170px}#drawer .gspan-bar{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none}#drawer .gspan-bar>*{flex:none}#drawer h3{margin-top:8px!important;font-size:15px}#drawer .ux-i{width:15px;height:15px;font-size:10px}#drawer .mk{display:flex;flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;gap:6px;scrollbar-width:none}#drawer .mk::-webkit-scrollbar{display:none}#drawer .mk button{flex:none;scroll-snap-align:start;white-space:nowrap}#drawer .chart-wrap{min-height:200px}}";
document.head.appendChild(css);
var SHORT={"Points, Rebounds, and Assists":"PRA","Points and Rebounds":"PR","Points and Assists":"PA","Assists and Rebounds":"RA","Rebounds and Assists":"RA","Points":"PTS","Rebounds":"REB","Assists":"AST","3-Point Field Goals":"3PM","Blocks":"BLK","Steals":"STL","Steals and Blocks":"S+B","Turnovers":"TO"};
var COMBO={"Points, Rebounds, and Assists":["points","totalRebounds","assists"],"Points and Rebounds":["points","totalRebounds"],"Points and Assists":["points","assists"],"Assists and Rebounds":["totalRebounds","assists"],"Rebounds and Assists":["totalRebounds","assists"]};
var SC={points:"#53e3a6",totalRebounds:"#38bdf8",assists:"#f5c451"},SL={points:"PTS",totalRebounds:"REB",assists:"AST"};
function am(o){return o==null?null:(o>0?"+"+o:String(o))}
function be(o){return o==null?null:(o<0?-o/(-o+100):100/(o+100))}
function pop(btn,html){var o=document.querySelector(".ux-pop");if(o){o.remove();if(o._b===btn)return}var p=document.createElement("div");p.className="ux-pop";p.innerHTML=html;p._b=btn;document.body.appendChild(p);var r=btn.getBoundingClientRect();p.style.top=Math.min(innerHeight-p.offsetHeight-8,r.bottom+6)+"px";p.style.left=Math.max(8,Math.min(innerWidth-p.offsetWidth-8,r.left-140))+"px"}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".ux-i");if(b){e.preventDefault();e.stopPropagation();pop(b,b._html||"");return}if(!e.target.closest||!e.target.closest(".ux-pop")){var o=document.querySelector(".ux-pop");if(o)o.remove()}},true);
function iBtn(html){return '<button type="button" class="ux-i" aria-label="Details" data-uxi="'+E(html)+'">ⓘ</button>'}
function hydrate(root){root.querySelectorAll("[data-uxi]").forEach(function(b){b._html=b.getAttribute("data-uxi");b.removeAttribute("data-uxi")})}
/* ---------- methodology strip (from existing fields only) ---------- */
function bkL(b){return /^Book [A-Z]$/.test(b||"")?b:"Best Book"}
function methHtml(r){
 var q=null;try{q=typeof ppLeg==="function"?ppLeg(r,r._s||(typeof sport!=="undefined"?sport:"nba")):null}catch(e){}
 var nv=q&&q.nv!=null?q.nv:null,off=q&&q.best!=null?q.best:(r.ov!=null?+r.ov:null),bk=q?bkL(q.book):(r.ov!=null?"Book A":null),est=false;
 if(nv==null&&r.ov!=null){var o=+r.ov;nv=Math.min(.95,(o>0?100/(o+100):-o/(-o+100))/1.045);est=true}
 if(nv==null&&off==null)return "";
 var h=r.l10&&r.l10.n?r.l10.h:0,n=r.l10&&r.l10.n?r.l10.n:0,K=typeof SHK!=="undefined"?SHK:30;
 var p=nv!=null?Math.min((h+K*nv)/(n+K),.97):null,fp=p!=null&&typeof fair==="function"?fair(p):null,bev=be(off),edge=p!=null&&bev!=null?Math.round((p-bev)*1000)/10:null,out=[];
 out.push('<div><small>Our prob.'+iBtn("Sports Labs chance of the over "+E(r.line)+": recent hit rate blended with the no-vig market price"+(est?" (estimated from the posted price)":"")+".")+'</small><b>'+(p!=null?(p*100).toFixed(1)+"%":"—")+'</b></div>');
 out.push('<div><small>Fair price</small><b>'+(fp?E(fp):"—")+'</b></div>');
 out.push('<div><small>Offered'+(bk?" · "+E(bk):"")+'</small><b>'+(off!=null?E(am(off)):"—")+'</b></div>');
 out.push('<div><small>Break-even'+iBtn("The win rate the offered price needs to break even.")+'</small><b>'+(bev!=null?(bev*100).toFixed(1)+"%":"—")+'</b></div>');
 out.push('<div><small>Edge'+iBtn("Our probability minus the break-even rate, in percentage points.")+'</small><b class="'+(edge>0?"ux-pos":"ux-neg")+'">'+(edge!=null?(edge>0?"+":"")+edge+" pts":"—")+'</b></div>');
 var s=r.spot||{};if(s.score!=null)out.push('<div><small>Validation'+iBtn('<ul>'+(s.checks||[]).map(function(c){return "<li>"+(c.st==="pass"?"✅":c.st==="warn"?"⚠️":"❌")+" <b>"+E(c.k)+"</b>: "+E(c.v)+"</li>"}).join("")+"</ul>")+'</small><b>'+E(s.score)+'</b><span class="mut" style="font-size:11px">/100</span></div>');
 var books=[];(r.ladder||[]).forEach(function(x){if(x[2]&&books.indexOf(bkL(x[2]))<0)books.push(bkL(x[2]))});if(bk&&books.indexOf(bk)<0)books.unshift(bk);
 var take=fp&&/^[+-]\d+$/.test(fp)?'<div class="ux-take"><b>Take it at '+E(fp)+' or better</b>'+iBtn("At or above our fair price the play has positive expected value. Compare every Book and take the best number. Boosted prices raise the payout, so a boost can turn a small edge into a bigger one.")+(books.length?' · '+books.map(function(b){return '<span class="ux-chip'+(b===bk?' best':'')+'">'+E(b)+(b===bk&&off!=null?" "+E(am(off)):"")+'</span>'}).join(" "):"")+'</div>':"";
 return '<div class="ux-meth">'+out.join("")+take+'</div>';
}
function insHtml(r){var s=r.spot||{},rs=(s.reasons||[]).slice(),w=r.wo;var det=[];
 rs.forEach(function(x){det.push(E(x))});
 if(w&&w.tm_out&&w.n)det.push(E("Without "+w.tm_out+" ("+w.status+"): "+w.h+"/"+w.n+" over, avg "+w.avg+(w.delta!=null?" ("+(w.delta>0?"+":"")+w.delta+")":"")));
 if(r.dvp&&r.dvp.what&&r.dvp.r)det.push(E("Matchup: "+r.oa+" ranks #"+r.dvp.r+" of "+r.dvp.of+" in "+r.dvp.what+" ("+r.dvp.v+")"));
 if(!det.length)return "";
 return '<div class="ux-ins">'+iBtn("<ul>"+det.map(function(x){return "<li>"+x+"</li>"}).join("")+"</ul>")+' 💡 '+det[0]+'</div>';}
function tagHtml(r){var l=r.ttl&&r.ttl.lbl;if(!l)return "";return '<span class="ux-tag '+(/scratch/i.test(l)?"ux-scr":"ux-lock")+'">'+E(l)+'</span>'}
/* ---------- chart: stacked combos + stepper + tap ---------- */
function enhanceChart(box,r){if(!box||!r)return;var ch=box.querySelector(".chart");if(!ch||ch.__ux)return;ch.__ux=1;
 var comp=COMBO[r.market],G=r.games||[],byD={};G.forEach(function(g){byD[g.d+(g.o||"")]=g});
 var bars=[].slice.call(ch.querySelectorAll(".b")),lnEl=ch.querySelector(".ln");if(!bars.length)return;
 var mx=0;bars.forEach(function(b){var v=+b.getAttribute("data-barv")||+(b.querySelector("span")||{}).textContent||0,h=parseFloat(b.style.height)||0;if(h>0&&v>0)mx=Math.max(mx,v*100/h);var t=b.getAttribute("title")||"",m=/^(\d{4}-\d\d-\d\d) (?:vs|@)?(\w+)/.exec(t);b._g=m?byD[m[1]+m[2]]:null;b._v=v});
 if(!mx)mx=Math.max.apply(null,bars.map(function(b){return b._v}))||1;
 if(comp){bars.forEach(function(b){var s=b._g&&b._g.s;if(!s)return;b.classList.add("ux-st");var tot=0;comp.forEach(function(k){tot+=+s[k]||0});if(!tot)return;comp.forEach(function(k){var d=document.createElement("div");d.className="sg";d.style.height=((+s[k]||0)/tot*100)+"%";d.style.background=SC[k];b.appendChild(d)})});
  var lg=document.createElement("div");lg.className="ux-leg";lg.innerHTML=comp.map(function(k){return '<span><i style="background:'+SC[k]+'"></i>'+SL[k]+'</span>'}).join("")+'<span class="mut">Outline: green = hit, red = miss</span>';ch.parentNode.parentNode.insertAdjacentElement("afterend",lg)}
 var line=+r.line,base=line,sum=box.querySelector(".gspan-sum b");
 var st=document.createElement("div");st.className="ux-step";st.innerHTML='<span class="mut">Line</span><button type="button" data-d="-1" aria-label="Lower line">−</button><b>'+line+'</b><button type="button" data-d="1" aria-label="Raise line">+</button><span class="mut ux-hr"></span>';
 box.querySelector(".chart-wrap").insertAdjacentElement("beforebegin",st);
 function apply(){var h=0;bars.forEach(function(b){var hit=b._v>line;if(hit)h++;b.classList.toggle("h",hit);b.classList.toggle("m",!hit);if(!b.classList.contains("ux-st"))b.style.background=hit?"var(--acc)":"var(--bad)"});
  if(lnEl){lnEl.style.bottom=Math.min(95,Math.max(3,line/mx*100))+"%";var i=lnEl.querySelector("i");if(i)i.textContent="Line "+line}
  st.querySelector("b").textContent=line;var t=h+"/"+bars.length+" ("+Math.round(h/bars.length*100)+"%)";if(sum)sum.textContent=t;st.querySelector(".ux-hr").textContent=line!==base?"hit rate at "+line+": "+t:"";
  try{var u=new URL(location.href);if(line!==base)u.searchParams.set("line",line);else u.searchParams.delete("line");history.replaceState(history.state,"",u)}catch(e){}}
 var rng=document.getElementById("dl-rng");if(rng){st.style.display="none";if(!rng.__ux){rng.__ux=1;rng.addEventListener("input",function(){var c=document.querySelector("#dr-chart-box .chart");if(c&&c.__set)c.__set(+rng.value)})}}
 ch.__set=function(v){line=v;apply()};
 st.addEventListener("click",function(e){var b=e.target.closest("button[data-d]");if(!b)return;e.stopPropagation();line=Math.max(0.5,+(line+(+b.dataset.d)).toFixed(1));apply()});
 var tip=null;function hideTip(){if(tip){tip.remove();tip=null}}
 bars.forEach(function(b){b.addEventListener("click",function(e){e.stopPropagation();line=Math.max(0.5,b._v-0.5);var rg=document.getElementById("dl-rng");if(rg){rg.value=line;rg.dispatchEvent(new Event("input",{bubbles:true}))}apply();hideTip();tip=document.createElement("div");tip.className="ux-tip";var g=b._g,s=g&&g.s;tip.innerHTML=(g?E(g.d)+" "+E(g.at||"")+E(g.o||"")+"<br>":"")+"<b>"+b._v+"</b>"+(comp&&s?" = "+comp.map(function(k){return SL[k]+" "+(+s[k]||0)}).join(" + "):"")+(s&&s.minutes!=null?"<br>"+s.minutes+" MIN":"");document.body.appendChild(tip);var rc=b.getBoundingClientRect();tip.style.left=Math.max(6,Math.min(innerWidth-tip.offsetWidth-6,rc.left))+"px";tip.style.top=Math.max(6,rc.top-tip.offsetHeight-6)+"px";setTimeout(hideTip,2500)})});
 try{var q=+new URL(location.href).searchParams.get("line");if(q>0)line=q}catch(e){}
 apply();}
/* ---------- drawer pass ---------- */
function curR(){try{return window._uxR||null}catch(e){return null}}
function pass(){var d=document.getElementById("drawer");if(!d||!d.classList.contains("open"))return;var r=curR();
 d.querySelectorAll(".mk button").forEach(function(b){if(b.__ux)return;b.__ux=1;var t=b.textContent.trim(),m=/^(.*)\s([\d.]+)$/.exec(t);if(m&&SHORT[m[1]]){if(matchMedia("(max-width:640px)").matches)b.textContent=SHORT[m[1]]+" "+m[2];b.title=t}});
 if(!r)return;var hh=d.querySelector("h2");if(hh&&r.player&&hh.textContent.indexOf(r.player)<0)return;
 var mk=d.querySelector(".mk");if(mk&&!d.querySelector(".ux-wrap")){var w=document.createElement("div");w.className="ux-wrap";w.innerHTML=methHtml(r)+insHtml(r);hydrate(w);mk.insertAdjacentElement("afterend",w)}
 var h2=d.querySelector("h2");if(h2&&!h2.querySelector(".ux-tag")&&r.ttl&&r.ttl.lbl)h2.insertAdjacentHTML("beforeend",tagHtml(r));
 enhanceChart(d.querySelector("#dr-chart-box"),r);}
/* capture current row by wrapping renderSpanChart */
function wrap(){var f=window.renderSpanChart;if(typeof f!=="function"||f.__ux)return;var g=function(r,sp,c){window._uxR=r;queueMicrotask(function(){try{pass()}catch(e){}});return f.apply(this,arguments)};g.__ux=1;window.renderSpanChart=g}
var T=null;new MutationObserver(function(){wrap();if(T)return;T=setTimeout(function(){T=null;try{pass()}catch(e){}},40)}).observe(document.documentElement,{childList:true,subtree:true});
wrap();
})();
