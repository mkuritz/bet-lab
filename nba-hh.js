/* NBA Hub · High Hurdles + Stars shot zones (PREVIEW). Display only: never feeds Highlighted plays.
   Data: data/nba_high_hurdles_page.json (built by the engine from already-published prices, logs and shot locations). */
(function(){"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pc=x=>x==null?"–":Math.round(x*100)+"%",od=a=>a==null?"–":(a>0?"+"+a:""+a);
const et=t=>t?new Date(t).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit"})+" ET":"–";
const ZN={rim:"Rim",paint:"Paint (non-RA)",mid:"Mid-range",c3:"Corner 3",ab3:"Above break 3"},ZK=["rim","paint","mid","c3","ab3"];
const TIERS=["Short plus","Plus money","Longshot","Deep longshot"];
let H=null,ST={view:location.hash==="#stars"?"stars":"hh",tier:"all",mkt:"",color:"his",open:{}};
const css=document.createElement("style");css.textContent=`
.hh-row{background:var(--panel);border:1px solid var(--line);border-radius:12px;margin-bottom:8px;overflow:hidden}
.hh-hd{display:grid;grid-template-columns:34px minmax(0,1.7fr) minmax(0,1.1fr) 78px 92px 92px 18px;gap:10px;align-items:center;padding:10px 12px;cursor:pointer}
.hh-hd:hover{background:var(--panel2)}.hh-gr{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-weight:900}
.hh-gA{background:rgba(83,227,166,.18);color:var(--acc)}.hh-gB{background:rgba(63,169,255,.16);color:var(--acc2)}
.hh-lab{font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;font-weight:800}.hh-big{font-size:16px;font-weight:900}
.hh-bd{display:none;border-top:1px solid var(--line);padding:12px;background:#0e1420}.hh-row.open .hh-bd{display:block}
.hh-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.hh-pan{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px;min-width:0}
.hh-pan h4{margin:0 0 6px;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.hh-kv{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:3px 0;border-bottom:1px dashed var(--line)}.hh-kv span{color:var(--mut)}
.hh-tier{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;border:1px solid var(--line);white-space:nowrap}
.hh-t0{color:#86efac}.hh-t1{color:var(--acc2)}.hh-t2{color:var(--warn)}.hh-t3{color:#f0abfc}
.sz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.sz-card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.sz-card svg{width:100%;height:auto;display:block;border-radius:10px}.sz-z{font-size:12px;display:grid;grid-template-columns:1fr auto auto;gap:6px 10px;align-items:center}
.sz-bar{height:6px;border-radius:3px;background:var(--line);overflow:hidden}.sz-bar i{display:block;height:100%}
.sz-lgd{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mut)}.sz-lgd i{flex:1;height:7px;border-radius:4px;background:linear-gradient(90deg,#2c7bff,#22d3ee,#facc15,#ff3b3b)}
.hh-mob{display:none}.hh-note{font-size:11.5px;color:var(--mut);margin-top:10px}
@media(max-width:760px){.hh-mob{display:inline}.hh-hd{grid-template-columns:30px minmax(0,1fr) auto 14px;row-gap:4px}.hh-hd .hm{display:none}.hh-grid{grid-template-columns:1fr}}`;
document.head.appendChild(css);
function load(){if(H)return Promise.resolve(H);return fetch("data/nba_high_hurdles_page.json?v="+Math.floor(Date.now()/18e4)).then(r=>r.ok?r.json():null).catch(()=>null).then(j=>H=j)}
/* NHL Lab shot-map palette: cold blue -> cyan -> yellow -> hot red. t in -1..1 */
function heat(t){t=Math.max(-1,Math.min(1,t));const S=[[44,123,255],[34,211,238],[250,204,21],[255,59,59]],x=(t+1)/2*3,i=Math.min(2,Math.floor(x)),f=x-i;return"rgb("+S[i].map((v,k)=>Math.round(v+(S[i+1][k]-v)*f)).join(",")+")"}
function zoneMap(s,mode){const Y=y=>y+5.25,a=Math.sqrt(23.75*23.75-22*22),Z={};(s.shots.zones||[]).forEach(z=>Z[z.k]=z);
 const fill=k=>{const z=Z[k]||{};if(mode==="opp"){if(!z.opp_r||!z.opp_of)return["#3a4660",.35];return[heat((z.opp_of+1-2*z.opp_r)/(z.opp_of-1)),.82]}
  if(!z.fga)return["#3a4660",.35];return[heat((z.d||0)/0.08),.35+.6*Math.min(1,z.share/0.4)]};
 const sh=(k,el)=>{const[c,o]=fill(k);return el.replace("/>",' fill="'+c+'" fill-opacity="'+o.toFixed(2)+'"><title>'+E(tipTxt(k,Z[k],mode))+'</title></'+el.match(/^<(\w+)/)[1]+'>')};
 const L='stroke="#f4ead9" stroke-width=".25" fill="none" opacity=".85"';
 let w='<rect x="0" y="0" width="50" height="40" fill="#1b2335"/>';
 w+=sh("ab3",'<rect x="0" y="0" width="50" height="40"/>');
 w+=sh("c3",'<rect x="0" y="0" width="3" height="'+Y(9)+'"/>')+sh("c3",'<rect x="47" y="0" width="3" height="'+Y(9)+'"/>');
 w+='<path d="M3 0 L3 '+Y(a)+' A23.75 23.75 0 0 0 47 '+Y(a)+' L47 0 Z" fill="#1b2335"/>'+sh("mid",'<path d="M3 0 L3 '+Y(a)+' A23.75 23.75 0 0 0 47 '+Y(a)+' L47 0 Z"/>');
 w+='<rect x="17" y="0" width="16" height="'+Y(14)+'" fill="#1b2335"/>'+sh("paint",'<rect x="17" y="0" width="16" height="'+Y(14)+'"/>');
 w+='<circle cx="25" cy="'+Y(0)+'" r="4" fill="#1b2335"/>'+sh("rim",'<circle cx="25" cy="'+Y(0)+'" r="4"/>');
 w+='<rect x="0" y="0" width="50" height="40" '+L+'/><rect x="17" y="0" width="16" height="19" '+L+'/><path d="M19 19 A6 6 0 0 0 31 19" '+L+'/>';
 w+='<path d="M3 0 L3 '+Y(a)+' A23.75 23.75 0 0 0 47 '+Y(a)+' L47 0" '+L+'/><line x1="22" y1="'+Y(-1.25)+'" x2="28" y2="'+Y(-1.25)+'" '+L+'/><circle cx="25" cy="'+Y(0)+'" r=".75" '+L+'/>';
 const P={rim:[25,Y(1.2)],paint:[25,Y(11)],mid:[25,Y(19.5)],c3:[1.5,Y(3)],ab3:[25,Y(29.5)]};
 ZK.forEach(k=>{const z=Z[k]||{},p=P[k],t=mode==="opp"?(z.opp_r?"#"+z.opp_r:"–"):(z.fga?Math.round(z.share*100)+"%":"–"),b=mode==="opp"?(z.opp_fg!=null?pc(z.opp_fg):""):(z.fg!=null?pc(z.fg):"");
  const txt=(x,y)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="'+(k==="c3"?1.9:2.6)+'" font-weight="800" fill="#fff" stroke="#0b0f17" stroke-width=".45" paint-order="stroke">'+t+'</text><text x="'+x+'" y="'+(y+2.4)+'" text-anchor="middle" font-size="'+(k==="c3"?1.5:1.9)+'" fill="#e6ebf5" stroke="#0b0f17" stroke-width=".35" paint-order="stroke">'+b+'</text>';
  w+=txt(p[0],p[1]);if(k==="c3")w+=txt(48.5,p[1])});
 return'<svg viewBox="0 0 50 40" role="img" aria-label="'+E(s.player)+' shot zones">'+w+'</svg>'}
function tipTxt(k,z,mode){z=z||{};return mode==="opp"?ZN[k]+": opponent allows "+pc(z.opp_fg)+" (#"+(z.opp_r||"–")+" of "+(z.opp_of||30)+", 1 = softest)":ZN[k]+": "+z.fgm+"/"+z.fga+" ("+pc(z.fg)+") · league "+pc(z.lg)+" · "+pc(z.share)+" of his shots"}
function zoneRows(s){return'<div class="sz-z">'+(s.shots.zones||[]).map(z=>{const d=z.d==null?null:Math.round(z.d*100);
 return'<div>'+ZN[z.k]+' <span class="mut" style="font-size:11px">'+pc(z.share)+' of FGA</span><div class="sz-bar"><i style="width:'+Math.min(100,z.share*250)+'%;background:'+heat((z.d||0)/0.08)+'"></i></div></div><div><b>'+pc(z.fg)+'</b>'+(d==null?"":' <span class="'+(d>=0?"up":"dn")+'">'+(d>0?"+":d==0?"±":"")+d+'</span>')+'</div><div class="mut" style="font-size:11px;text-align:right">opp #'+(z.opp_r||"–")+'</div>'}).join("")+'</div>'}
function star(s){const ez=s.edge_zone,hh=(s.hh||[]).map(x=>'<span class="badge '+(x.grade==="A"?"spot":"snipe")+'">'+E(x.hurdle+"+ "+x.mk)+" "+od(x.book)+'</span>').join(" ");
 return'<div class="sz-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div style="min-width:0"><a class="plink" data-player-aid="'+E(s.aid)+'">'+E(s.player)+'</a> <span class="mut">'+E(s.pos||"")+'</span><div class="mut" style="font-size:12px">'+E(s.team)+" "+(s.home?"vs":"@")+" "+E(s.opp)+" · "+et(s.start)+'</div></div><div style="text-align:right"><div class="hh-big">'+s.shots.fga_g+'</div><div class="hh-lab">FGA / game</div></div></div>'+
 zoneMap(s,ST.color)+(ez?'<div style="font-size:12.5px">🎯 <b>Matchup zone:</b> '+ZN[ez]+' ('+pc((s.shots.zones.find(z=>z.k===ez)||{}).share)+' of his shots), '+E(s.opp)+' ranks #'+(s.shots.zones.find(z=>z.k===ez)||{}).opp_r+' softest there.</div>':'<div class="mut" style="font-size:12px">No soft spot: '+E(s.opp)+' is not top 10 softest in any zone he uses for 15%+ of his shots.</div>')+
 zoneRows(s)+(hh?'<div style="display:flex;gap:6px;flex-wrap:wrap">'+hh+'</div>':"")+'<div class="mut" style="font-size:11px">'+s.shots.fgm+"/"+s.shots.fga+" FG in "+s.shots.games+" games · "+(s.shots.season==="2026-27"?"this season":"last season (small sample this season)")+'</div></div>'}
function spark(r){const L=(r.last10||[]).slice().reverse(),mx=Math.max(r.hurdle+1,...L.map(g=>g.v||0)),w=280,h=70,bw=w/Math.max(1,L.length),y=v=>h-4-(v/mx)*(h-14);
 return'<svg viewBox="0 0 '+w+' '+(h+14)+'" width="100%" role="img" aria-label="Last 10 games">'+L.map((g,i)=>'<rect x="'+(i*bw+3)+'" y="'+y(g.v||0)+'" width="'+(bw-6)+'" height="'+(h-4-y(g.v||0))+'" rx="3" fill="'+((g.v||0)>=r.hurdle?"#53e3a6":"#3a4b70")+'"><title>'+E(g.d+" "+g.at+" "+g.o+": "+g.v)+'</title></rect><text x="'+(i*bw+bw/2)+'" y="'+(h+10)+'" fill="#8b97b0" font-size="9" text-anchor="middle">'+E(g.o)+'</text><text x="'+(i*bw+bw/2)+'" y="'+(y(g.v||0)-2)+'" fill="#e6ebf5" font-size="9" text-anchor="middle">'+(g.v==null?"":g.v)+'</text>').join("")+'<line x1="0" x2="'+w+'" y1="'+y(r.hurdle)+'" y2="'+y(r.hurdle)+'" stroke="#ffb020" stroke-dasharray="4 3"/><text x="'+(w-2)+'" y="'+(y(r.hurdle)-3)+'" fill="#ffb020" font-size="9" text-anchor="end">'+r.hurdle+'+</text></svg>'}
const kv=(k,v)=>v==null||v===""?"":'<div class="hh-kv"><span>'+k+'</span><b>'+v+'</b></div>';
function row(r){const R=r.rates,ti=TIERS.indexOf(r.tier),S=r.shots?{player:r.player,shots:r.shots}:(H.stars||[]).find(s=>s.aid===r.aid),open=ST.open[r.id];
 return'<div class="hh-row'+(open?" open":"")+'"><div class="hh-hd" data-hh-open="'+E(r.id)+'"><div class="hh-gr hh-g'+r.grade+'">'+r.grade+'</div>'+
 '<div style="min-width:0"><a class="plink" data-player-aid="'+E(r.aid)+'" data-player-mkt="'+E(r.market)+'">'+E(r.player)+'</a> <span class="mut" style="font-size:12px">'+E(r.pos||"")+'</span><div class="mut" style="font-size:12px">'+E(r.team)+" "+(r.home?"vs":"@")+" "+E(r.opp)+" · "+et(r.start)+'</div></div>'+
 '<div><div class="hh-big">'+r.hurdle+'+ '+E(r.mk)+' <span class="hh-mob up" style="font-size:13px">'+od(r.book)+'</span></div><div class="mut" style="font-size:11.5px">line '+r.line+' · <span class="hh-tier hh-t'+ti+'">'+E(r.tier)+'</span></div></div>'+
 '<div class="hm"><div class="hh-lab">Our chance</div><div class="hh-big">'+pc(r.p)+'</div></div>'+
 '<div class="hm"><div class="hh-lab">Book</div><b>'+od(r.book)+'</b> <span class="mut" style="font-size:11px">'+E(r.book_letter)+'</span><div class="up" style="font-size:11.5px">+'+(r.edge*100).toFixed(1)+' pts</div></div>'+
 '<div class="hm"><div class="hh-lab">Fair</div><b>'+od(r.fair)+'</b><div class="mut" style="font-size:11px">book implies '+pc(r.implied)+'</div></div><div class="mut">▾</div></div>'+
 '<div class="hh-bd"><div class="hh-grid"><div class="hh-pan"><h4>Last 10 vs the hurdle</h4>'+spark(r)+'</div>'+
 '<div class="hh-pan"><h4>Hurdle history</h4>'+kv("Cleared "+r.hurdle+"+, last "+R.l30_n,R.l30_hits+"/"+R.l30_n+" ("+pc(R.l30_hits/R.l30_n)+")")+kv("Cleared this season",R.this_hits+"/"+R.this_n)+kv("Best, last 30",R.best)+kv("L10 average",R.l10_avg)+kv("Minutes L5 / season",(r.usage.min_l5||"–")+" / "+(r.usage.min_szn||"–"))+(r.dvp&&r.dvp.r?kv("Opp DvP ("+E(r.dvp.what||"")+")","#"+r.dvp.r+" of "+r.dvp.of+" (1 = softest)"):"")+'</div>'+
 '<div class="hh-pan"><h4>Our chance, built from</h4>'+kv("Pricing model at "+r.hurdle+"+",pc(r.parts.model))+kv("His hit rate (shrunk)",pc(r.parts.history))+kv("Opponent factor","×"+r.parts.opp_factor)+kv("Our chance",pc(r.p))+kv(E(r.book_letter)+" price",od(r.book)+" ("+pc(r.implied)+")")+
 (r.alts&&r.alts.length?kv("Other A/B rungs",r.alts.map(a=>a.hurdle+"+ "+od(a.book)+" ("+a.grade+")").join(", ")):"")+'</div>'+
 (r.shot_mk&&S?'<div class="hh-pan" style="grid-column:1/-1"><h4>Where he shoots vs '+E(r.opp)+'</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px"><div>'+zoneMap(S,"his")+'<div class="mut" style="font-size:11px;margin-top:4px">His FG% vs league · labels = share of his shots</div></div><div>'+zoneMap(S,"opp")+'<div class="mut" style="font-size:11px;margin-top:4px">What '+E(r.opp)+' allows · labels = rank (1 = softest)</div></div></div></div>':"")+
 '</div></div></div>'}
function body(){if(!H)return'<div class="card mut">High Hurdles is not available yet.</div>';
 const P=H.players||[],mk=[...new Set(P.map(r=>r.market))].sort();
 const head='<div class="card" style="margin-bottom:12px"><h2 style="margin:0 0 4px">High Hurdles <span class="badge warn">Preview · not live</span></h2><div class="mut" style="font-size:12.5px">Overs at least ~20% above tonight’s posted line, at plus money only, where the player has a real history of clearing that number and our chance beats the price. Grade A = our chance beats the book by 4+ points, B = by 1+ point. Every A and B row is listed. Questionable, Probable, Doubtful, Out and any player on Hold are never featured. Tap a row for the breakdown, tap a name for his profile.</div>'+
 '<div class="pills" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+[["hh","High Hurdles ("+P.length+")"],["stars","⭐ Stars · shot zones ("+(H.stars||[]).length+")"]].map(x=>'<button type="button" class="'+(ST.view===x[0]?"on":"")+'" data-hh-view="'+x[0]+'" style="background:'+(ST.view===x[0]?"var(--acc)":"var(--panel2)")+';color:'+(ST.view===x[0]?"#05180e":"var(--mut)")+';border:1px solid var(--line);border-radius:999px;padding:6px 12px;font:800 12px system-ui;cursor:pointer">'+x[1]+'</button>').join("")+'</div></div>';
 if(ST.view==="stars"){const S=H.stars||[];
  return head+'<div class="ctl-bar"><span class="mut" style="font-size:12px;font-weight:700">Color zones by</span><div class="pills">'+[["his","His FG% vs league"],["opp","What tonight’s opponent allows"]].map(x=>'<button type="button" data-hh-color="'+x[0]+'" class="'+(ST.color===x[0]?"on":"")+'">'+x[1]+'</button>').join("")+'</div><div class="sz-lgd" style="min-width:220px;flex:1"><span>'+(ST.color==="opp"?"Tough":"Cold")+'</span><i></i><span>'+(ST.color==="opp"?"Soft":"Hot")+'</span></div></div>'+
  (S.length?'<div class="sz-grid">'+S.map(star).join("")+'</div>':'<div class="card mut">No stars with enough shots on tonight’s slate.</div>')+
  '<div class="hh-note">Tonight’s stars (players on Hold excluded), most shots per game first. Five zones from every regular-season field-goal attempt’s court location: Rim = within 4 ft, Paint (non-RA) = rest of the lane, Mid-range, Corner 3 and Above-the-break 3. Shading = his FG% vs the league average in that zone, stronger shading = more of his shots; “opp #” = how soft tonight’s opponent is in that zone this season (1 = most allowed). Shot data through '+et(H.shots_updated)+' ('+(H.shots_games||0)+' games).</div>'}
 const L=P.filter(r=>(ST.tier==="all"||r.tier===ST.tier)&&(!ST.mkt||r.market===ST.mkt));
 return head+'<div class="ctl-bar"><div class="pills">'+[["all","All ("+P.length+")"]].concat(TIERS.map(t=>[t,t+" ("+P.filter(r=>r.tier===t).length+")"])).map(x=>'<button type="button" data-hh-tier="'+E(x[0])+'" class="'+(ST.tier===x[0]?"on":"")+'">'+E(x[1])+'</button>').join("")+'</div>'+
  '<select id="hh-mkt"><option value="">All markets</option>'+mk.map(m=>'<option '+(ST.mkt===m?"selected":"")+'>'+E(m)+'</option>').join("")+'</select><span class="mut" style="font-size:11.5px;margin-left:auto">Updated '+et(H.updated)+'</span></div>'+
  (L.length?L.map(row).join(""):'<div class="card mut">No player clears the capability check at plus money for this filter tonight.</div>')+
  '<h3 style="margin:18px 0 8px">Graded record</h3>'+(Object.keys(H.record||{}).length?'<div class="card">'+Object.entries(H.record).map(([t,g])=>Object.entries(g).map(([k,[h,n]])=>kv(E(t)+" · "+k,h+"-"+(n-h)+" ("+pc(h/n)+")")).join("")).join("")+'</div>':'<div class="card mut">No graded results yet. The record starts with the first graded slate.</div>')+
  (H.excluded&&H.excluded.length?'<div class="hh-note">Not featured tonight (Hold / injury): '+H.excluded.map(x=>E(x.player)+" ("+E(x.why)+")").join(", ")+'.</div>':"")+
  '<div class="hh-note">Prices are the ones already on the Bet Lab board (Book A–W). Our chance = our pricing model at that number blended with his own hit rate, nudged for the opponent. Display only. A big line misses more often than it hits, even at A. 21+ only.</div>'}
window.NBAHH={render(el){el.innerHTML='<div class="card mut">Loading High Hurdles…</div>';load().then(()=>{if(el.isConnected)el.innerHTML=body()})}};
document.addEventListener("click",e=>{const el=document.getElementById("nba-hh");if(!el)return;
 if(e.target.closest("[data-player-aid]"))return;
 const v=e.target.closest("[data-hh-view]");if(v){ST.view=v.dataset.hhView;el.innerHTML=body();return}
 const t=e.target.closest("[data-hh-tier]");if(t){ST.tier=t.dataset.hhTier;el.innerHTML=body();return}
 const c=e.target.closest("[data-hh-color]");if(c){ST.color=c.dataset.hhColor;el.innerHTML=body();return}
 const o=e.target.closest("[data-hh-open]");if(o){const id=o.dataset.hhOpen;ST.open[id]=!ST.open[id];o.parentNode.classList.toggle("open");}});
document.addEventListener("change",e=>{if(e.target&&e.target.id==="hh-mkt"){ST.mkt=e.target.value;const el=document.getElementById("nba-hh");if(el)el.innerHTML=body()}});
})();
