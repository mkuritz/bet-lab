/* Sports Labs Ask mode for the shared search bar (extends search.js; a plain player/team name behaves exactly as before).
   Parse + fetch run in the sportslabs-ask Worker (api.sportslabshq.com/ask). Every number shown comes from published Bet Lab data. */
(function(){
"use strict";if(window.SLAsk)return;
var API="https://api.sportslabshq.com/ask/",C=function(){return window.SLAskCore},LSK="sl-ask:",BL=/betlab\./.test(location.hostname)?"./":"https://betlab.sportslabshq.com/";
var TEST=(/[?&#]asktest=(mnf-1019)/.exec(location.search+location.hash)||[])[1]||null;
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function J(k,d){try{var v=JSON.parse(localStorage.getItem(LSK+k));return v==null?d:v}catch(e){return d}}
function S(k,v){try{localStorage.setItem(LSK+k,JSON.stringify(v))}catch(e){}}
function N(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim()}
function pc(p){return Math.round(p*100)+"%"}
function ev(x){return(x>0?"+":"")+(x*100).toFixed(1)+"%"}
function am(o){o=+o;return(o>0?"+":"")+o}
function toDec(a){a=+a;return a>0?1+a/100:1+100/-a}
function decAm(d){return d>=2?"+"+Math.round((d-1)*100):"-"+Math.round(100/(d-1))}
function surface(){return location.hostname.split(".")[0]||"site"}
function pageSport(){try{return typeof sport!="undefined"?sport:null}catch(e){return null}}
async function tok(){try{if(window.SL&&SL.client){var s=(await SL.client.auth.getSession()).data.session;return s?s.access_token:null}}catch(e){}return null}
// ---------- logging (question, spec, result count, clicks; user id only, added server-side from the session) ----------
var LQ=[],LT=null,QID=null;
function log(ev,o){LQ.push(Object.assign({event:ev,qid:QID,surface:surface(),test:!!TEST},o||{}));clearTimeout(LT);LT=setTimeout(flush,800)}
async function flush(){if(!LQ.length)return;var b=LQ.splice(0,20),t=await tok();try{fetch(API+"log",{method:"POST",keepalive:true,headers:Object.assign({"Content-Type":"application/json"},t?{Authorization:"Bearer "+t}:{}),body:JSON.stringify(b)})}catch(e){}}
addEventListener("pagehide",flush);
// ---------- css ----------
var css=document.createElement("style");css.textContent=
".ask-tg{display:inline-flex;border:1px solid var(--line,#2a2f3a);border-radius:9px;overflow:hidden;margin-right:6px;flex:none;height:36px;align-self:center}.ask-tg button{background:transparent;color:var(--mut,#8a94a7);border:0;padding:0 9px;font-size:12px;font-weight:700;cursor:pointer;min-width:44px}.ask-tg button.on{background:var(--panel2,#182033);color:var(--acc,#34d399)}"+
".sls.ask-w{display:flex;align-items:center;max-width:520px}.sls.ask-w>input{flex:1}"+
".sls-dd li.ask-row{border-bottom:1px solid var(--line,#2a2f3a);border-radius:9px 9px 0 0}.ask-row .ic{width:40px;height:30px;border-radius:6px;background:rgba(52,211,153,.15);color:var(--acc,#34d399);display:flex;align-items:center;justify-content:center;font-weight:900;flex:none}"+
"#ask-panel{margin:8px 12px 14px;background:var(--panel,#121826);border:1px solid var(--line,#2a2f3a);border-radius:14px;padding:12px 14px;position:relative;color:var(--txt,#e6e9ef)}#ask-panel.full{position:fixed;inset:0;margin:0;border-radius:0;z-index:70;overflow:auto;padding:16px max(16px,calc(50% - 560px))}"+
"#ask-panel h3{margin:0 0 2px;font-size:16px}.ask-src{font-size:11px;color:var(--mut,#8a94a7)}.ask-x{position:absolute;right:10px;top:8px;background:none;border:0;color:var(--mut,#8a94a7);font-size:22px;cursor:pointer;min-width:44px;min-height:44px}"+
".ask-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.ask-chip{display:inline-flex;align-items:center;gap:4px;background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);border-radius:99px;padding:3px 4px 3px 10px;font-size:12px}.ask-chip select,.ask-chip input{background:transparent;color:inherit;border:0;font:inherit;font-weight:700;max-width:130px}.ask-chip input{width:52px}.ask-chip b{font-weight:700}.ask-chip button{background:none;border:0;color:var(--mut,#8a94a7);cursor:pointer;font-size:15px;min-width:28px;min-height:28px}"+
".ask-c{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-top:8px;background:none;border:0;padding:0}.ask-sgp{background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);border-radius:12px;padding:10px 12px}"+
".ask-sgp .hd{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--mut,#8a94a7)}.ask-leg{padding:7px 0;border-top:1px solid var(--line,#2a2f3a);font-size:13px}.ask-leg:first-of-type{border-top:0}.ask-leg .pl{font-weight:700;cursor:pointer}.ask-why{display:inline-block;font-size:11px;background:rgba(96,165,250,.13);color:#93c5fd;border-radius:6px;padding:1px 6px;margin:3px 4px 0 0}.ask-why.db{background:rgba(52,211,153,.14);color:var(--acc,#34d399)}"+
".ask-px{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.ask-px div{background:var(--panel,#121826);border-radius:8px;padding:6px 8px;font-size:11px;color:var(--mut,#8a94a7)}.ask-px b{display:block;font-size:15px;color:var(--txt,#e6e9ef)}"+
".ask-btns{display:flex;gap:6px;flex-wrap:wrap}.ask-btns button,.ask-b{background:var(--panel,#121826);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer;min-height:36px;text-decoration:none;display:inline-flex;align-items:center}.ask-btns button.pri{background:var(--acc,#34d399);color:#06120c;border-color:transparent}"+
".ask-bdg{font-size:10px;font-weight:800;border-radius:99px;padding:1px 7px;margin-left:4px;white-space:nowrap}.ask-bdg.pend{background:#facc15;color:#1a1400}.ask-bdg.exp{background:rgba(167,139,250,.18);color:#c4b5fd}.ask-bdg.test{background:#f97316;color:#1a0a00}"+
".ask-t{width:100%;border-collapse:collapse;font-size:13px}.ask-t th,.ask-t td{padding:7px 6px;border-top:1px solid var(--line,#2a2f3a);text-align:left}.ask-t th{font-size:11px;color:var(--mut,#8a94a7);font-weight:600}.ask-t tr[data-aid]{cursor:pointer}.ask-t button{background:none;border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:6px;min-width:32px;min-height:32px;cursor:pointer}"+
".ask-try{display:flex;flex-direction:column;gap:6px;margin-top:8px}.ask-try button{text-align:left;background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:9px;padding:9px 11px;cursor:pointer;font-size:13px}"+
".ask-sk{height:150px;border-radius:12px;background:linear-gradient(90deg,var(--panel2,#182033),#202a40,var(--panel2,#182033));background-size:200% 100%;animation:asksk 1.1s infinite}@keyframes asksk{to{background-position:-200% 0}}"+
".ask-swap{margin-top:6px;background:var(--panel,#121826);border-radius:8px;padding:6px 8px;font-size:12px}.ask-swap div{display:flex;justify-content:space-between;gap:6px;padding:4px 0;border-top:1px solid var(--line,#2a2f3a);cursor:pointer}.ask-swap div.no{opacity:.5;cursor:not-allowed}"+
"#ask-slip{position:fixed;right:0;top:0;bottom:0;width:min(360px,100vw);background:var(--panel,#121826);border-left:1px solid var(--line,#2a2f3a);z-index:80;transform:translateX(100%);transition:transform .2s;padding:14px;overflow:auto;color:var(--txt,#e6e9ef)}#ask-slip.open{transform:none}#ask-slipbtn{position:fixed;right:14px;bottom:84px;z-index:75;background:var(--acc,#34d399);color:#06120c;border:0;border-radius:99px;padding:10px 14px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px #0008}"+
".ask-side{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ask-side h4{margin:12px 0 6px;font-size:13px;color:var(--mut,#8a94a7)}@media(max-width:700px){.ask-side{grid-template-columns:1fr}.ask-c{grid-template-columns:1fr}.ask-px b{font-size:14px}}"+
".ask-gc{background:var(--panel2,#182033);border-radius:10px;padding:8px 10px;font-size:13px}.ask-note{font-size:12px;color:var(--mut,#8a94a7);margin-top:8px}"+
".ask-sum{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 2px;font-size:13px;font-weight:600}.ask-sum span{flex:1;min-width:0}.ask-adj{background:none;border:1px solid var(--line,#2a2f3a);color:var(--mut,#8a94a7);border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;min-height:28px}"+
".ask-roll{font-size:12px;color:#fcd34d;margin:4px 0 0}.ask-tag{display:inline-block;font-size:10px;font-weight:800;border-radius:6px;padding:2px 7px;background:rgba(148,163,184,.16);color:var(--mut,#a3acbd);margin:2px 0 6px}"+
".ask-ref{display:flex;gap:6px;margin:12px 0 6px}.ask-ref input{flex:1;min-width:0;font-size:16px;background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:9px;padding:9px 10px}.ask-fu{display:flex;gap:6px;flex-wrap:wrap}.ask-fu button{background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:99px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;min-height:34px}"+
".ask-trail{font-size:11px;color:var(--mut,#8a94a7);margin-top:2px}.ask-disc{font-size:11px;color:var(--mut,#8a94a7);margin-top:10px}.ask-disc a{color:inherit}";
document.head.appendChild(css);
// ---------- search bar hook ----------
function mode(inp){return inp.dataset.askMode||"auto"}
function want(inp,q,res){var m=mode(inp);if(m=="search")return false;if(m=="ask")return N(q).length>=3?"only":false;if(!C())return false;
 var exact=res&&res.some(function(x){return x.n==N(q)||N(x.team)==N(q)});return C().isQuestion(q,exact)}
function rowHtml(q){return '<li role="option" id="sls-ask" data-ask="1" class="ask-row"><span class="ic">?</span><div><div class="nm">Ask SportsLabs: '+E(q)+'</div><div class="mt">Answer from Bet Lab data · Enter to open</div></div></li>'}
function init(inp,wrap){if(inp.dataset.askOn)return;inp.dataset.askOn=1;wrap.classList.add("ask-w");
 var tg=document.createElement("div");tg.className="ask-tg";tg.setAttribute("role","group");tg.setAttribute("aria-label","Search mode");tg.innerHTML='<button type="button" data-m="search">Search</button><button type="button" data-m="ask">Ask</button>';
 wrap.insertBefore(tg,inp);function paint(){var m=mode(inp);tg.querySelectorAll("button").forEach(function(b){var on=b.dataset.m==m;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});inp.placeholder=m=="ask"?"Ask: e.g. best anytime TD props tonight":inp.dataset.ph0}
 inp.dataset.ph0=inp.placeholder;
 tg.onclick=function(e){var b=e.target.closest("button");if(!b)return;inp.dataset.askMode=mode(inp)==b.dataset.m?"auto":b.dataset.m;paint();inp.focus();inp.dispatchEvent(new Event("input",{bubbles:true}))};paint()}
// ---------- panel ----------
var P=null,CUR=null,RCACHE={},T0=0;
function anchor(inp){var b=inp&&(inp.closest(".bar")||inp.closest("header"));return b||document.querySelector("header")||document.body.firstElementChild}
function panel(full,inp){if(!P){P=document.createElement("section");P.id="ask-panel";P.setAttribute("aria-live","polite")}
 P.classList.toggle("full",!!full);var a=anchor(inp);if(full)document.body.appendChild(P);else if(a&&a.parentNode)a.parentNode.insertBefore(P,a.nextSibling);P.hidden=false;return P}
function close(){if(P){P.hidden=true;P.classList.remove("full")}if(/#ask/.test(location.hash))try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}
function head(){return '<button class="ask-x" aria-label="Close" data-a="close">×</button>'}
function recent(q){var r=J("recent",[]);r=[q].concat(r.filter(function(x){return x!=q})).slice(0,10);S("recent",r)}
async function post(path,body){var t=await tok();var r=await fetch(API+path,{method:"POST",headers:Object.assign({"Content-Type":"application/json"},t?{Authorization:"Bearer "+t}:{}),body:JSON.stringify(body)});return r.json()}
async function open(q,o){o=o||{};q=String(q||"").trim();if(q.length<3)return;QID=Math.random().toString(36).slice(2,10);T0=performance.now();recent(q);
 var el=panel(o.full,o.inp);el.innerHTML=head()+'<h3>Ask SportsLabs: '+E(q)+'</h3><div class="ask-src">Reading Bet Lab data…</div><div class="ask-c"><div class="ask-sk"></div><div class="ask-sk"></div><div class="ask-sk"></div></div>';wire(el);
 var d;try{d=await post("ask",{q:q,sport:pageSport(),test:TEST})}catch(e){d={error:"net"}}
 log("ask",{question:q,spec:d.spec||null,spec_hash:d.hash||null,parser:d.parser||null,result_count:d.result?d.result.count:0,ms:Math.round(performance.now()-T0)});
 if(!d.valid){return tryBox(el,q,d.suggestions||(C()?C().suggestions(pageSport()):[]),d.msg)}
 if(d.error){return tryBox(el,q,[],d.msg||"Couldn't load data right now.")}
 CUR={q:q,spec:d.spec,parser:d.parser,res:d.result};RCACHE[d.result.hash+(TEST||"")]=d.result;render(el)}
function tryBox(el,q,sg,msg){el.innerHTML=head()+'<h3>Ask SportsLabs</h3><div class="ask-note">'+E(msg||"That question is outside what Bet Lab data can answer, or it was missing a sport or market.")+'</div><div style="margin-top:8px;font-weight:700;font-size:13px">Try:</div><div class="ask-try">'+sg.map(function(s){return '<button data-q="'+E(s)+'">'+E(s)+'</button>'}).join("")+'</div>';wire(el)}
async function rerun(){var el=P,t=performance.now(),k=C().hash(CUR.spec)+(TEST||""),r=RCACHE[k];
 if(!r){var d;try{d=await post("run",{spec:CUR.spec,test:TEST})}catch(e){d={}}if(!d.result){el.querySelector(".ask-body").innerHTML='<div class="ask-note">'+E(d.msg||"Couldn't re-run that. Try again.")+'</div>';return}r=d.result;RCACHE[k]=r}
 CUR.res=r;render(el);log("run",{spec:CUR.spec,spec_hash:r.hash,result_count:r.count,ms:Math.round(performance.now()-t)})}
// ---------- chips ----------
var MT_ALL=["parlay","SGP","props","anytime TD","anytime goal","edges","injury","games","totals","goalie","shots","arb"],POS=["DB","FRONT","WR","RB","TE","QB","OL"],POSN={DB:"Defensive backs",FRONT:"Front seven",WR:"WR",RB:"RB",TE:"TE",QB:"QB",OL:"O-line",any:"Any position"};
function opt(a,v,lab){return a.map(function(x){return '<option value="'+E(x)+'"'+(String(x)==String(v)?" selected":"")+'>'+E(lab?lab(x):x)+'</option>'}).join("")}
function chips(s){var f=s.filters||{},h=[];if(f.market)h.push('<span class="ask-chip">Prop <b>'+E(f.market)+'</b><button data-rm="market" aria-label="Remove">×</button></span>');if(f.league)h.push('<span class="ask-chip">League <b>'+E((C().LGN||{})[f.league]||f.league)+'</b><button data-rm="league" aria-label="Remove">×</button></span>');
 h.push('<span class="ask-chip">Sport <select data-c="sport">'+opt(["nfl","cfb","nba","nhl","mlb","soccer"],s.sport,function(x){return x.toUpperCase()})+'</select></span>');
 (s.games||[]).forEach(function(g,i){h.push('<span class="ask-chip">Games <b>'+E(g.slot||g.team||(CUR&&CUR.res&&CUR.res.slate&&g.when?CUR.res.slate:g.when))+'</b><button data-rm="games" data-i="'+i+'" aria-label="Remove">×</button></span>')});
 (s.market_types||[]).forEach(function(m,i){h.push('<span class="ask-chip">Market <b>'+E(m)+'</b>'+(s.market_types.length>1?'<button data-rm="market_types" data-i="'+i+'" aria-label="Remove">×</button>':"")+'</span>')});
 if(s.legs!=null)h.push('<span class="ask-chip">Legs <select data-c="legs" aria-label="Legs">'+opt([2,3,4,5,6],s.legs,function(x){return x+" legs"})+'</select></span>');
 if(f.injury)h.push('<span class="ask-chip">Injury <select data-c="inj_pos">'+opt(POS.concat(["any"]),f.injury.position,function(x){return POSN[x]})+'</select><select data-c="inj_st">'+opt(["Out","Questionable","Doubtful","any"],f.injury.status)+'</select><button data-rm="injury" aria-label="Remove">×</button></span>');
 h.push('<span class="ask-chip">Min edge <input data-c="min_edge" inputmode="decimal" placeholder="EV bar" value="'+(f.min_edge!=null?+(f.min_edge*100).toFixed(1):"")+'">%'+(f.min_edge!=null?'<button data-rm="min_edge" aria-label="Remove">×</button>':"")+'</span>');
 if(f.odds)h.push('<span class="ask-chip">Odds <b>'+(f.odds.min!=null?am(f.odds.min):"any")+' to '+(f.odds.max!=null?am(f.odds.max):"any")+'</b><button data-rm="odds" aria-label="Remove">×</button></span>');
 if(f.team)h.push('<span class="ask-chip">Team <b>'+E(f.team)+'</b><button data-rm="team" aria-label="Remove">×</button></span>');
 if(f.player)h.push('<span class="ask-chip">Player <b>'+E(f.player)+'</b><button data-rm="player" aria-label="Remove">×</button></span>');
 h.push('<span class="ask-chip">Sort <select data-c="sort">'+opt(["edge","upside","hit_rate","CLV"],s.sort,function(x){return{edge:"Edge",upside:"Upside",hit_rate:"Chance",CLV:"CLV"}[x]})+'</select></span>');
 h.push('<span class="ask-chip">Show <select data-c="limit">'+opt([3,5,10,15,25],s.limit)+'</select></span>');
 h.push('<span class="ask-chip">Type <select data-c="add_mt"><option value="">Change</option>'+opt(MT_ALL.filter(function(m){return s.market_types.indexOf(m)<0}),"")+'</select></span>');
 return '<div class="ask-chips" role="group" aria-label="Filters">'+h.join("")+'</div>'}
function chipEdit(t){var s=JSON.parse(JSON.stringify(CUR.spec)),f=s.filters,c=t.dataset.c,v=t.value;
 if(c=="sport")s.sport=v;else if(c=="legs")s.legs=+v;else if(c=="sort")s.sort=v;else if(c=="limit")s.limit=+v;
 else if(c=="inj_pos")f.injury.position=v;else if(c=="inj_st")f.injury.status=v;
 else if(c=="min_edge"){var x=parseFloat(v);f.min_edge=isNaN(x)?null:Math.max(0,Math.min(50,x))/100}
 else if(c=="add_mt"&&v){s.market_types=[v];s.parlay=v=="parlay";if((v=="SGP"||v=="parlay")&&s.legs==null)s.legs=3;if(v!="SGP"&&v!="parlay")s.legs=null}
 s=C().canon(s);log("chip",{spec:s,detail:{chip:c,value:v}});CUR.spec=s;rerun()}
function chipRm(t){var s=JSON.parse(JSON.stringify(CUR.spec)),k=t.dataset.rm;if(k=="games"||k=="market_types"){s[k].splice(+t.dataset.i,1);if(k=="market_types"&&s.market_types.indexOf("SGP")<0&&s.market_types.indexOf("parlay")<0)s.legs=null;if(k=="market_types"&&!s.market_types.length)s.market_types=["props"]}else s.filters[k]=null;
 s=C().canon(s);log("chip",{spec:s,detail:{chip:k,removed:1}});CUR.spec=s;rerun()}
// ---------- components ----------
function badges(x){return(x.exp?'<span class="ask-bdg exp" title="Market not yet validated out of sample; needs a 4% EV edge">Experimental</span>':"")+((x.pending||[]).length?'<span class="ask-bdg pend" title="'+E(x.pending.join(", "))+'">Pending: '+E(x.pending.join(", "))+'</span>':"")}
function legTxt(l){return l.market+(l.yes?"":" o"+l.line)}
function legHtml(l,ci,li){return '<div class="ask-leg"><span class="pl" data-prof="'+E(sp()+":"+l.aid)+'">'+E(l.player)+'</span> <span class="ask-src">'+E(l.team)+' '+E(l.pos||"")+'</span> · '+E(legTxt(l))+'<div class="ask-src">Our chance '+pc(l.p)+' · book '+am(l.book_odds)+' · L10 '+(l.l10?l.l10[0]+"/"+l.l10[1]:"—")+'</div>'+(l.why||[]).map(function(w){return '<span class="ask-why'+(/ DB out/.test(w)?" db":"")+'">'+E(w)+'</span>'}).join("")+(ci!=null?' <button class="ask-b" style="min-height:28px;padding:2px 8px;margin-top:4px" data-swap="'+ci+':'+li+'">Swap leg</button><div class="ask-swapbox" id="ask-sw-'+ci+'-'+li+'"></div>':"")+'</div>'}
function sp(){return CUR&&CUR.spec?CUR.spec.sport:"nfl"}
function sgpCard(c,ci){return '<div class="ask-sgp" data-ci="'+ci+'"><div class="hd"><span>'+E(c.game.away+" @ "+c.game.home)+(c.game.slot?" · "+c.game.slot:"")+' · '+E(C().fmtET(c.game.time))+'</span><span>'+c.legs.length+'-leg SGP'+badges(c)+'</span></div>'+
 c.legs.map(function(l,li){return legHtml(l,ci,li)}).join("")+
 '<div class="ask-px"><div>Book odds<b>'+E(c.book_odds)+'</b></div><div>Model fair<b>'+E(c.fair_odds)+'</b></div><div>Edge (EV)<b style="color:var(--acc,#34d399)">'+ev(c.ev)+'</b></div></div>'+
 '<div class="ask-src" style="margin-bottom:6px">Our chance '+(c.p*100).toFixed(1)+'% (independent '+(c.p_ind*100).toFixed(1)+'%, same-team correlation applied). Book odds = each leg\'s best price multiplied; the book\'s own SGP price will differ.</div>'+
 '<div class="ask-btns"><button class="pri" data-addc="'+ci+'">Add to slip</button><a class="ask-b" href="'+BL+'index.html#slip='+encodeURIComponent(c.legs.map(function(l){return sp()+"~"+l.aid+"|"+l.market}).join(","))+'&add=1" data-open="'+ci+'">Open in Bet Lab</a></div></div>'}
function propTable(items,title){if(!items.length)return '<div class="ask-note">No '+E(title.toLowerCase())+' pass Bet Lab\'s EV bar for these filters.</div>';
 return '<div class="card" style="background:none;border:0;padding:0"><h4 style="margin:10px 0 4px">'+E(title)+'</h4><div style="overflow-x:auto"><table class="ask-t"><thead><tr><th></th><th>Player</th><th>Prop</th><th>Our chance</th><th>Book</th><th>Fair</th><th>Edge</th><th></th></tr></thead><tbody>'+
 items.map(function(l,i){return '<tr data-aid="'+E(l.aid)+'" data-ri="'+i+'"><td><span data-sl-watch="'+E(sp()+"|"+l.aid+"|"+l.player+"|"+l.team)+'"></span></td><td><b>'+E(l.player)+'</b><div class="ask-src">'+E(l.team+" "+(l.opp||""))+'</div>'+(l.why||[]).map(function(w){return '<span class="ask-why'+(/ DB out/.test(w)?" db":"")+'">'+E(w)+'</span>'}).join("")+'</td><td>'+E(legTxt(l))+badges(l)+'</td><td>'+pc(l.p)+'</td><td>'+am(l.book_odds)+'</td><td>'+E(l.fair_odds)+'</td><td style="color:var(--acc,#34d399)">'+ev(l.ev)+'</td><td><button data-addr="'+i+'" aria-label="Add to slip">+</button></td></tr>'}).join("")+'</tbody></table></div></div>'}
function injCard(items){if(!items.length)return"";return '<div class="ask-gc" style="margin-top:10px"><b>Injury tracker</b>'+items.map(function(x){return '<div style="padding:5px 0;border-top:1px solid var(--line,#2a2f3a);margin-top:5px"><b>'+E(x.text)+'</b><div class="ask-src">'+E(x.dir||"")+'</div></div>'}).join("")+'</div>'}
function gameCards(items){if(!items.length)return '<div class="ask-note">No upcoming games match.</div>';return '<div class="ask-c">'+items.map(function(g){return '<div class="ask-gc"><b>'+E(g.away+" @ "+g.home)+'</b>'+(g.slot?' <span class="ask-bdg exp">'+E(g.slot)+'</span>':"")+'<div class="ask-src">'+E(C().fmtET(g.time))+(g.spread?" · "+E(g.spread):"")+(g.total?" · O/U "+E(g.total):"")+'</div></div>'}).join("")+'</div>'}
function goalieCards(items){if(!items.length)return '<div class="ask-note">No goalie data for tonight\'s slate.</div>';return '<div class="ask-c">'+items.map(function(g){return '<div class="ask-gc"><b>'+E(g.name)+'</b> <span class="ask-src">'+E(g.team)+' vs '+E(g.opp)+'</span><div class="ask-px"><div>Save %<b>'+(g.sv!=null?g.sv.toFixed(3).replace(/^0/,""):"—")+'</b></div><div>Starts<b>'+E(g.starts)+'</b></div><div>Shots faced<b>'+E(g.shots)+'</b></div></div><div class="ask-src">Projected starter (NHL Lab depth order)'+(g.backup?" · backup "+E(g.backup):"")+' · last start '+E(g.last||"—")+'</div></div>'}).join("")+'</div>'}
function arbRows(items){if(!items.length)return '<div class="ask-note">No fresh arbitrage rows in Arb Lab right now.</div>';return items.map(function(a){return '<div class="ask-gc" style="margin-top:6px"><b>'+E(a.game)+'</b> · '+E(a.market)+' · <span style="color:var(--acc)">'+(a.profit_pct*100).toFixed(2)+'%</span><div class="ask-src">'+a.legs.map(function(l){return E(l.venue+" "+(l.team||l.side)+" "+l.dec)}).join(" · ")+'</div></div>'}).join("")}
function chanceTxt(l){return l.basis=="chance"&&l.p!=null?'Our chance '+pc(l.p):l.hrn?'Hit '+l.hrn[0]+'/'+l.hrn[1]+' recent games':'—'}
function pLeg(l,ci,li){return '<div class="ask-leg" style="overflow:hidden">'+(ci!=null?'<button class="ask-b" style="float:right;min-height:30px;padding:2px 9px;margin:0 0 0 6px;font-size:11px" data-pswap="'+ci+':'+li+'" aria-label="Swap this leg">Swap</button>':'')+'<span class="pl" data-prof="'+E(sp()+":"+l.aid)+'">'+E(l.player)+'</span> <span class="ask-src">'+E(l.team)+' '+E(l.opp||"")+'</span> · '+E(legTxt(l))+'<div class="ask-src">'+chanceTxt(l)+(l.book_odds!=null?' · book '+am(l.book_odds):'')+(l.lgn?' · '+E(l.lgn):'')+' · '+E(C().fmtET(l.time))+'</div>'+(l.why||[]).map(function(w){return '<span class="ask-why'+(/ DB out/.test(w)?" db":"")+'">'+E(w)+'</span>'}).join("")+'</div>'}
function parlayCard(c,ci){var hd=c.sgp&&c.game?E(c.game.away+" @ "+c.game.home)+' · ':'';
 return '<div class="ask-sgp" data-ci="'+ci+'"><div class="hd"><span>'+hd+E(c.label)+'</span><span>'+(c.p!=null?'Combined chance '+pc(c.p):'')+'</span></div>'+(c.tag?'<span class="ask-tag">'+E(c.tag)+'</span>':'<span class="ask-tag" style="color:var(--acc,#34d399)">Highlighted · clears our EV bar</span>')+
 c.legs.map(function(l,li){return pLeg(l,ci,li)}).join("")+
 (c.book_odds?'<div class="ask-px"'+(c.pass?'':' style="grid-template-columns:1fr 1fr"')+'><div>Book odds<b>'+E(c.book_odds)+'</b></div>'+(c.p!=null?'<div>Chance<b>'+pc(c.p)+'</b></div>':'')+(c.pass?'<div>Edge (EV)<b style="color:var(--acc,#34d399)">'+ev(c.ev)+'</b></div>':'')+'</div>':'<div class="ask-src" style="margin:6px 0">Book prices aren\'t posted for every leg yet.</div>')+
 '<div class="ask-btns">'+(c.book_dec?'<button class="pri" data-addp="'+ci+'">Add to slip</button>':'')+'</div></div>'}
function propTable2(c){var items=c.items;if(!items.length)return "";var showEdge=items.some(function(l){return l.pass});var anyP=items.some(function(l){return l.p!=null});
 return (c.tag?'<span class="ask-tag">'+E(c.tag)+'</span>':'')+'<div style="overflow-x:auto"><table class="ask-t"><thead><tr><th></th><th>Player</th><th>Prop</th><th>'+(anyP?'Our chance':'Hit rate')+'</th><th>Book</th>'+(showEdge?'<th>Edge</th>':'')+'<th></th></tr></thead><tbody>'+
 items.map(function(l,i){return '<tr data-aid="'+E(l.aid)+'" data-ri="'+i+'"><td><span data-sl-watch="'+E(sp()+"|"+l.aid+"|"+l.player+"|"+l.team)+'"></span></td><td><b>'+E(l.player)+'</b><div class="ask-src">'+E(l.team+" "+(l.opp||""))+'</div></td><td>'+E(legTxt(l))+badges(l)+'</td><td>'+(l.p!=null?pc(l.p):l.hrn?l.hrn[0]+'/'+l.hrn[1]:'—')+'</td><td>'+(l.book_odds!=null?am(l.book_odds):'—')+'</td>'+(showEdge?'<td style="color:var(--acc,#34d399)">'+(l.pass?ev(l.ev):'')+'</td>':'')+'<td>'+(l.book_odds!=null?'<button data-addr="'+i+'" aria-label="Add to slip">+</button>':'')+'</td></tr>'}).join("")+'</tbody></table></div>'}
function gameCards2(items){if(!items.length)return "";return '<div class="ask-c">'+items.map(function(g){return '<div class="ask-gc"><b>'+E(g.away+" @ "+g.home)+'</b>'+(g.slot?' <span class="ask-bdg exp">'+E(g.slot)+'</span>':"")+'<div class="ask-src">'+E(g.time?C().fmtET(g.time):(g.time_et||""))+(g.spread?" · "+E(g.spread):"")+(g.total?" · O/U "+E(g.total):"")+'</div>'+(g.model?'<div class="ask-src">Our model: '+E(g.home)+' '+(g.model.home_line>0?"+":"")+E(g.model.home_line)+' · total '+E((+g.model.total).toFixed(1))+' · '+E(g.home)+' win '+pc(g.model.home_win)+'</div>':'')+'</div>'}).join("")+'</div>'}
var ADJ=false;
function render(el){var r=CUR.res,s=CUR.spec,h=head();
 h+='<h3>'+E(CUR.q)+(r.test?' <span class="ask-bdg test">TEST MODE</span>':"")+'</h3>'+(CUR.trail&&CUR.trail.length?'<div class="ask-trail">Refined: '+CUR.trail.map(E).join(" → ")+'</div>':'')+'<div class="ask-src">as of '+E(r.as_of_et||"—")+'</div>';
 if(r.test)h+='<div class="ask-note" style="color:#fdba74">'+E(r.test.label)+'</div>';
 if(r.roll)h+='<div class="ask-roll">'+E(r.roll)+'</div>';
 h+='<div class="ask-sum"><span>'+E(r.summary||"")+'</span><button class="ask-adj" data-adj="1" aria-expanded="'+ADJ+'">'+(ADJ?"Hide":"Adjust")+'</button></div>'+((r.assumed||[]).length?'<div class="ask-src">'+E(r.assumed.join(" · "))+'</div>':'');
 h+=(ADJ?chips(s):'')+'<div class="ask-body">';
 r.components.forEach(function(c){
  if(c.type=="SGPCard")h+=c.items.length?'<div class="card ask-c">'+c.items.map(sgpCard).join("")+'</div>':"";
  else if(c.type=="PropTable"&&r.kind)h+=propTable2(c);
  else if(c.type=="PropTable"||c.type=="EdgeList")h+=propTable(c.items,c.type=="EdgeList"?"Edge list":"Prop edges");
  else if(c.type=="InjuryCascadeCard")h+=injCard(c.items);
  else if(c.type=="GameCard")h+=r.kind?gameCards2(c.items):gameCards(c.items);
  else if(c.type=="GoalieCard")h+=goalieCards(c.items);
  else if(c.type=="ArbRow")h+=arbRows(c.items);
  else if(c.type=="ParlayCard")h+=c.items.length?'<div class="ask-c">'+c.items.map(parlayCard).join("")+'</div>':"";
 });
 (r.notes||[]).filter(function(n){return n!==r.roll}).forEach(function(n){h+='<div class="ask-note">'+E(n)+'</div>'});
 h+='</div><form class="ask-ref" data-ref="1"><input name="r" placeholder="Refine: e.g. make it 4 legs, only Premier League, swap the second leg, safer" aria-label="Refine this answer" autocomplete="off"><button class="ask-b" style="background:var(--acc,#34d399);color:#06120c">Go</button></form>'+
 ((r.followups||[]).length?'<div class="ask-fu">'+r.followups.map(function(q){return '<button data-q2="'+E(q)+'">'+E(q)+'</button>'}).join("")+'</div>':'')+
 '<div class="ask-disc">Highlighted by our model; estimates only, not betting advice. 21+ · <a href="tel:18004262537">1-800-GAMBLER</a></div>';
 el.innerHTML=h;wire(el);padB(el);
 if(T0&&el.querySelector(".ask-sgp,.ask-t tr[data-aid],.ask-gc")){window.__askFirstCard=Math.round(performance.now()-T0);T0=0}
 if(!r.test&&CUR.res.count&&window.SL&&SL.lockNow)try{SL.lockNow()}catch(e){}}
function findCard(ci){var c=CUR.res.components.find(function(x){return x.type=="SGPCard"});return c&&c.items[ci]}
function findRow(i){var c=CUR.res.components.find(function(x){return x.type=="PropTable"||x.type=="EdgeList"});return c&&c.items[i]}
function padB(el){var h=0;if(!el.classList.contains("full")||innerWidth<=700){document.querySelectorAll("body > *, body > * > *").forEach(function(x){if(x===el||el.contains(x)||x.hidden)return;var cs=getComputedStyle(x);if(cs.position!="fixed"&&cs.position!="sticky")return;var r=x.getBoundingClientRect();if(r.height>0&&r.height<innerHeight*.6&&r.bottom>=innerHeight-4&&r.top>innerHeight*.4&&cs.display!="none"&&cs.visibility!="hidden")h=Math.max(h,innerHeight-r.top)})}el.style.paddingBottom=h?(h+16)+"px":"";el.style.scrollPaddingBottom=h?(h+16)+"px":""}
addEventListener("resize",function(){if(P&&!P.hidden)padB(P)});
function findPar(ci){var c=CUR.res.components.find(function(x){return x.type=="ParlayCard"});return c&&c.items[ci]}
async function refineQ(q,ci){q=String(q||"").trim();if(q.length<2||!CUR)return;var el=P,t=performance.now(),pc0=findPar(ci||0),last={legs:pc0?pc0.legs.map(function(l){return l.id}):[]};
 var bd=el.querySelector(".ask-body");if(bd)bd.innerHTML='<div class="ask-c"><div class="ask-sk"></div><div class="ask-sk"></div></div>';
 var d;try{d=await post("refine",{q:q,base:CUR.spec,last:last,sport:pageSport(),test:TEST})}catch(e){d={}}
 log("ask",{question:q,spec:d.spec||null,spec_hash:d.hash||null,parser:"refine",result_count:d.result?d.result.count:0,ms:Math.round(performance.now()-t),detail:{refine:1,changes:d.changes||null}});
 if(!d.result){if(bd)bd.innerHTML='<div class="ask-note">'+E(d.msg||"Couldn't apply that. Try rephrasing, e.g. \"make it 4 legs\".")+'</div>';return}
 if(d.fresh){CUR={q:q,spec:d.spec,parser:"rules",res:d.result,trail:[]}}else{CUR.spec=d.spec;CUR.res=d.result;CUR.trail=(CUR.trail||[]).concat([q])}
 RCACHE[d.result.hash+(TEST||"")]=d.result;render(el)}
function wire(el){
 el.onclick=function(e){var t=e.target,b;
  if(t.closest('[data-a="close"]'))return close();
  if((b=t.closest("[data-q]")))return open(b.dataset.q,{full:P.classList.contains("full")});
  if((b=t.closest("[data-rm]")))return chipRm(b);
  if(t.closest("[data-adj]")){ADJ=!ADJ;render(el);log("click",{detail:{kind:"adjust",open:ADJ}});return}
  if((b=t.closest("[data-q2]")))return refineQ(b.dataset.q2);
  if((b=t.closest("[data-pswap]"))){var pp=b.dataset.pswap.split(":").map(Number);return refineQ("Swap the "+["1st","2nd","3rd","4th","5th","6th"][pp[1]]+" leg",pp[0])}
  if((b=t.closest("[data-addp]"))){var pc0=findPar(+b.dataset.addp);addSlip({k:pc0.k,legs:pc0.legs,label:pc0.label+" parlay",dec:pc0.book_dec});log("add",{spec_hash:CUR.res.hash,detail:{kind:"parlay",key:pc0.k}});return}
  if((b=t.closest("[data-addc]"))){var c=findCard(+b.dataset.addc);addSlip({k:c.key,legs:c.legs,label:c.legs.length+"-leg SGP · "+c.game.away+" @ "+c.game.home,dec:c.book_dec});log("add",{spec_hash:CUR.res.hash,detail:{kind:"sgp",key:c.key}});return}
  if((b=t.closest("[data-open]"))){log("click",{spec_hash:CUR.res.hash,detail:{kind:"open_betlab",ci:+b.dataset.open}});return}
  if((b=t.closest("[data-swap]"))){var p=b.dataset.swap.split(":"),cc=findCard(+p[0]),bx=document.getElementById("ask-sw-"+p[0]+"-"+p[1]);if(bx.innerHTML){bx.innerHTML="";return}
   var A=cc.swaps[+p[1]]||[];bx.innerHTML='<div class="ask-swap"><b>Alternatives for '+E(cc.legs[+p[1]].player)+'</b> <span class="ask-src">(re-priced with the correlation model)</span>'+(A.length?A.map(function(a,ai){return '<div class="'+(a.pass?"":"no")+'" data-alt="'+p[0]+':'+p[1]+':'+ai+'"><span>'+E(a.leg.player+" "+legTxt(a.leg))+'</span><span>'+E(a.book_odds)+' · fair '+E(a.fair_odds)+' · '+ev(a.ev)+(a.pass?"":" · below EV bar")+'</span></div>'}).join(""):'<div class="no">No other priced legs in this game.</div>')+'</div>';log("swap",{spec_hash:CUR.res.hash,detail:{ci:+p[0],li:+p[1]}});return}
  if((b=t.closest("[data-alt]"))&&!b.classList.contains("no")){var q=b.dataset.alt.split(":").map(Number),c2=findCard(q[0]),a=c2.swaps[q[1]][q[2]];swapLeg(c2,q[1],a);render(el);return}
  if((b=t.closest("[data-addr]"))){e.stopPropagation();var l=findRow(+b.dataset.addr);addSlip({k:l.id,legs:[l],label:l.player+" "+legTxt(l),dec:toDec(l.book_odds)});log("add",{spec_hash:CUR.res.hash,detail:{kind:"prop",id:l.id}});return}
  if(t.closest(".sl-star")){log("star",{detail:{aid:(t.closest("tr")||{}).dataset&&t.closest("tr").dataset.aid}});return}
  if((b=t.closest("[data-prof]"))){prof(b.dataset.prof);return}
  if((b=t.closest("tr[data-aid]"))){prof(sp()+":"+b.dataset.aid);return}
 };
 el.onchange=function(e){var t=e.target;if(t.dataset.c)chipEdit(t)};
 el.onsubmit=function(e){var f=e.target.closest("[data-ref]");if(!f)return;e.preventDefault();var v=f.querySelector("input").value;refineQ(v)};
 el.onkeydown=function(e){if(e.key=="Enter"&&e.target.dataset.c=="min_edge"){e.preventDefault();chipEdit(e.target)}if(e.key=="Escape"&&P.classList.contains("full"))close()}}
function swapLeg(c,li,a){var legs=c.legs.slice();legs[li]=a.leg;var old=c.legs[li];c.swaps[li]=c.swaps[li].filter(function(z){return z!==a});
 // re-price the swapped card with the same correlation model as the Worker (shared core)
 var L=legs.map(function(l){return{p:l.p,dec:toDec(l.book_odds),team:l.team}}),px=C().sgpPrice(L);c.legs=legs;c.p=px.p;c.p_ind=px.p_ind;c.book_dec=px.dec;c.book_odds=decAm(px.dec);c.fair_odds=C().pAm(px.p);c.ev=px.ev;c.key=legs.map(function(l){return l.id}).join("+");
 c.exp=legs.some(function(l){return l.exp});log("swap",{spec_hash:CUR.res.hash,detail:{from:old.id,to:a.leg.id}})}
function prof(k){var p=k.split(":");log("profile",{detail:{sport:p[0],aid:p[1]}});if(window.PLOPEN){if(P.classList.contains("full"))P.classList.remove("full");return PLOPEN(k)}location.href=BL+"index.html#player="+k}
// ---------- slip drawer ----------
var SL0=J("slip",[]);
function addSlip(it){if(!SL0.some(function(x){return x.k==it.k}))SL0.push({k:it.k,label:it.label,dec:it.dec,legs:it.legs.map(function(l){return{aid:l.aid,player:l.player,market:l.market,line:l.line,yes:l.yes,stat:l.stat,game:l.game,time:l.time,team:l.team,opp:l.opp,book_odds:l.book_odds}})});S("slip",SL0);slip(true)}
function slip(openIt){var d=document.getElementById("ask-slip"),bt=document.getElementById("ask-slipbtn");
 if(!d){d=document.createElement("aside");d.id="ask-slip";d.setAttribute("aria-label","Ask slip");document.body.appendChild(d);bt=document.createElement("button");bt.id="ask-slipbtn";bt.type="button";document.body.appendChild(bt);bt.onclick=function(){d.classList.toggle("open")}}
 bt.textContent="Ask slip ("+SL0.length+")";bt.hidden=!SL0.length;if(openIt)d.classList.add("open");
 var dec=SL0.reduce(function(a,x){return a*x.dec},1),st=J("stake",10);
 d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b>Ask slip</b><button class="ask-b" data-sx="close" aria-label="Close slip">×</button></div>'+
  (SL0.length?SL0.map(function(x,i){return '<div class="ask-gc" style="margin-top:8px"><div style="display:flex;justify-content:space-between;gap:6px"><b>'+E(x.label)+'</b><button class="ask-b" style="min-height:28px" data-sx="rm" data-i="'+i+'" aria-label="Remove">×</button></div>'+x.legs.map(function(l){return '<div class="ask-src">'+E(l.player+" "+legTxt(l))+' · '+am(l.book_odds)+'</div>'}).join("")+'<div class="ask-src">Price '+decAm(x.dec)+'</div></div>'}).join("")+
  '<div class="ask-px" style="grid-template-columns:1fr 1fr"><div>Combined price<b>'+decAm(dec)+'</b></div><div>To win<b>$'+(st*(dec-1)).toFixed(2)+'</b></div></div><label class="ask-src">Stake $ <input id="ask-stake" inputmode="decimal" value="'+st+'" style="width:90px;background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:6px;padding:6px"></label>'+
  '<div class="ask-btns" style="margin-top:10px"><button data-sx="copy">Copy slip</button><button class="pri" data-sx="track">Track</button><button data-sx="clear">Clear</button></div><div class="ask-src" id="ask-smsg" style="margin-top:6px">Combined price multiplies each item\'s book odds. Track saves it to My bets; it is graded automatically after the games. Only track bets you actually placed.</div>':'<div class="ask-note">Add an SGP or a prop from an Ask answer.</div>');
 d.onclick=function(e){var b=e.target.closest("[data-sx]");if(!b)return;var a=b.dataset.sx;
  if(a=="close")d.classList.remove("open");
  else if(a=="rm"){SL0.splice(+b.dataset.i,1);S("slip",SL0);slip()}
  else if(a=="clear"){SL0=[];S("slip",SL0);slip()}
  else if(a=="copy"){var txt=SL0.map(function(x){return x.legs.map(function(l){return l.player+" "+legTxt(l)+" ("+am(l.book_odds)+")"}).join("\n")}).join("\n")+"\nCombined "+decAm(dec)+" · stake $"+J("stake",10);try{navigator.clipboard.writeText(txt)}catch(_){}document.getElementById("ask-smsg").textContent="Copied.";log("click",{detail:{kind:"copy_slip",n:SL0.length}})}
  else if(a=="track"){var legs=[];SL0.forEach(function(x){x.legs.forEach(function(l){legs.push({sport:sp(),aid:l.aid,player:l.player,market:l.market,line:l.line,stat:l.stat,game:l.game,time:l.time,team:l.team,opp:l.opp,ov:null,odds:+l.book_odds})})});
   var od=decAm(dec),bet={id:Date.now().toString(36),at:new Date().toISOString(),odds:+od,boost:null,stake:+J("stake",10),book:"",src:"ask",legs:legs};
   if(TEST){document.getElementById("ask-smsg").textContent="Test mode: not tracked (these games are already final).";return}
   var T=[];try{T=JSON.parse(localStorage.getItem("betlab:v1:taken")||"[]")}catch(_){}T.push(bet);localStorage.setItem("betlab:v1:taken",JSON.stringify(T));
   document.getElementById("ask-smsg").textContent=(window.SLBets&&SLBets.ready()?"Tracked in My bets (synced to your account).":"Tracked in My bets on this device. Sign in to sync it to your account.")+" It will be graded automatically after the games.";log("track",{detail:{n:legs.length,odds:+od}})}};
 var si=d.querySelector("#ask-stake");if(si)si.onchange=function(){var v=parseFloat(si.value);S("stake",isNaN(v)?10:Math.max(0,Math.min(1e5,v)));slip()}}
// ---------- full page (sidebar "Ask") ----------
function full(){QID=null;var el=panel(true);var R=J("recent",[]),SV=J("saved",[]),EX=C()?C().EXAMPLES:{};
 el.innerHTML=head()+'<h3>Ask SportsLabs</h3><div class="ask-src">Questions are answered from Bet Lab props, prices and the injury tracker. No live web lookups.'+(TEST?' <span class="ask-bdg test">TEST MODE</span>':"")+'</div>'+
 '<form id="ask-f" style="display:flex;gap:6px;margin:12px 0"><input id="ask-fi" style="flex:1;font-size:16px;background:var(--panel2,#182033);border:1px solid var(--line,#2a2f3a);color:inherit;border-radius:9px;padding:10px" placeholder="Ask about props, SGPs, injuries…" aria-label="Ask a question"><button class="ask-b" style="background:var(--acc,#34d399);color:#06120c">Ask</button></form>'+
 '<div class="ask-side"><div><h4>Recent questions</h4><div class="ask-try">'+(R.length?R.map(function(q){return '<button data-q="'+E(q)+'">'+E(q)+'</button>'}).join(""):'<span class="ask-src">None yet.</span>')+'</div><h4>Saved questions</h4><div class="ask-try">'+(SV.length?SV.map(function(q){return '<button data-q="'+E(q)+'">★ '+E(q)+'</button>'}).join(""):'<span class="ask-src">Tap ☆ Save on an answer to keep a question here.</span>')+'</div></div><div>'+
 Object.keys(EX).map(function(s){return '<h4>'+s.toUpperCase()+' examples</h4><div class="ask-try">'+EX[s].map(function(q){return '<button data-q="'+E(q)+'">'+E(q)+'</button>'}).join("")+'</div>'}).join("")+'</div></div>';
 wire(el);el.querySelector("#ask-f").onsubmit=function(e){e.preventDefault();open(el.querySelector("#ask-fi").value,{full:true})};log("open",{detail:{kind:"full"}})}
// save button injected into answers
document.addEventListener("click",function(e){var b=e.target.closest("[data-save]");if(!b||!CUR)return;var SV=J("saved",[]);if(SV.indexOf(CUR.q)<0)SV.unshift(CUR.q);S("saved",SV.slice(0,20));b.textContent="★ Saved"});
var _r=render;render=function(el){_r(el);var h=el.querySelector("h3");if(h&&!CUR.res.test)h.insertAdjacentHTML("beforeend",' <button class="ask-b" data-save="1" style="min-height:28px;padding:2px 8px;font-size:11px">'+(J("saved",[]).indexOf(CUR.q)>=0?"★ Saved":"☆ Save")+'</button>')};
function fromHash(){if(/#ask\b/.test(location.hash)){var m=/[#&]q=([^&]+)/.exec(location.hash);if(m)open(decodeURIComponent(m[1]),{full:true});else full()}}
addEventListener("hashchange",fromHash);
window.SLAsk={init:init,want:want,row:rowHtml,open:open,full:full,mode:mode};
function boot(){slip();fromHash()}
document.readyState=="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
