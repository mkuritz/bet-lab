/* Soccer SGPs & Blowouts — collapsed History of settled cards.
   Renders data/soccer_sgp_history.json. Does not grade, predict, or refresh. */
(function(root){
 var esc=function(s){return String(s==null?"":s).replace(/[<>&"]/g,function(c){return{"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]})};
 var P=function(x){return typeof x=="number"&&isFinite(x)?Math.round(x*100)+"%":"—"};
 var A=function(o){return typeof o=="number"&&isFinite(o)?(o>0?"+":"")+o:""};
 var ICON={win:["✓","Hit","sh-w"],loss:["✗","Missed","sh-l"],push:["–","Push","sh-n"],void:["–","Void","sh-n"],pending:["…","Pending","sh-n"],unknown:["?","Not verifiable from stored finals","sh-n"]};
 function mark(r){var m=ICON[r]||ICON.unknown;return '<span class="sh-m '+m[2]+'" role="img" aria-label="'+m[1]+'" title="'+m[1]+'">'+m[0]+'</span>'}
 function dayKey(t){var d=new Date(t);if(isNaN(d))return"";var k=d.toLocaleDateString("en-CA",{timeZone:"America/New_York"});return /^\d{4}-\d{2}-\d{2}$/.test(k)?k:""}
 function dayLabel(k){var p=String(k).split("-");if(p.length!=3)return k;return new Date(Date.UTC(+p[0],+p[1]-1,+p[2],12)).toLocaleDateString("en-US",{timeZone:"UTC",weekday:"long",month:"short",day:"numeric"})}
 function num(x){return typeof x=="number"&&isFinite(x)}
 function settled(H,exclude){var ex=exclude||{},seen={};return ((H&&H.games)||[]).filter(function(g){
   if(!g||g.status!=="final"||!g.final||!num(g.final.fav_score)||!num(g.final.dog_score)||!dayKey(g.time)||ex[g.game]||seen[g.game])return false;
   seen[g.game]=1;return true}).sort(function(a,b){return a.time<b.time?1:a.time>b.time?-1:0})}
 function group(G){var out=[],idx={};G.forEach(function(g){var k=dayKey(g.time);if(!k)return;if(!(k in idx)){idx[k]=out.length;out.push({day:k,games:[]})}out[idx[k]].games.push(g)});return out}
 function legRow(label,l,right){return '<div class="sh-leg">'+mark(l&&l.res)+'<span class="sh-lt">'+label+'</span><span class="mut">'+right+'</span></div>'}
 function scoreLine(g){var f=g.final,fav=f.fav_name||f.fav,dog=f.dog_name||f.dog;
  var line='Final: '+esc(fav)+' '+esc(f.fav_score)+' – '+esc(f.dog_score)+' '+esc(dog);
  if(f.orientation==="verified"&&f.home_name)line+=' <span class="mut">· home '+esc(f.home_name)+'</span>';
  return line}
 function marketLabel(l){var m=esc(l.market);if(l.market==="Anytime Goal")return m;if(num(l.line))return m+" "+(l.line+0.5)+"+";return m}
 function card(g){var f=g.final,b=g.blowout,s=g.sgp,fav=(b&&b.fav_name)||(s&&s.fav_name)||f.fav_name||g.fav,dog=(b&&b.dog_name)||(s&&s.dog_name)||f.dog_name||g.dog;
  var tier=(b&&b.tier)||(s&&s.tier);
  var h='<div class="sh-card" id="sgph-'+esc(g.game)+'"><div class="sh-top"><b>'+esc(fav)+' <span class="mut">vs</span> '+esc(dog)+'</b>'+(tier==="main"||tier==="watch"?'<span class="lt '+(tier=="main"?"lm":"lw")+'">'+(tier=="main"?"MAIN":"WATCH")+'</span>':"")+'</div>';
  h+='<div class="mut">'+esc(new Date(g.time).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"}))+' ET · '+esc(g.lg)+' · <span class="st dead">FINAL</span></div>';
  h+='<div class="sh-score">'+scoreLine(g)+'</div>';
  if(b){h+='<div class="kick">Blowout call · '+esc(g.fav||f.fav)+' win '+P(b.pf)+(num(b.margin)?' · actual margin '+(b.margin>0?"+":"")+b.margin:"")+'</div>';
   h+=(b.legs||[]).map(function(l){return legRow(esc(l.leg),l,'ours '+P(l.p)+(l.actual!=null?' · '+esc(l.actual):""))}).join("")}
  if(s){h+='<div class="kick">SGP '+mark(s.res)+' <span class="mut">'+esc(s.res=="win"?"cashed":s.res=="loss"?"missed":s.res=="push"?"push":s.res=="void"?"void":s.res=="pending"?"pending":"not fully verifiable")+'</span></div>';
   h+=(s.legs||[]).map(function(l){return legRow('<b>'+esc(l.player)+'</b> '+marketLabel(l),l,(l.price!=null&&l.price!==""?'DK '+esc(A(l.price)):"")+(l.actual!=null?' · actual '+esc(l.actual):""))}).join("")}
  return h+'</div>'}
 function tally(G){var w=0,l=0,n=0;G.forEach(function(g){[(g.blowout||{}).legs||[],(g.sgp||{}).legs||[]].forEach(function(L){L.forEach(function(x){if(x.res=="win")w++;else if(x.res=="loss")l++;else n++})})});return{w:w,l:l,n:n}}
 function when(H){var u=H&&H.updated;if(!u)return"";var d=new Date(u);return isNaN(d)?esc(u):esc(d.toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}))+" ET"}
 function html(H,exclude){var G=settled(H,exclude);
  var css='<style>.sh-wrap{grid-column:1/-1}.sh-wrap>summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:44px}.sh-wrap>summary::-webkit-details-marker{display:none}.sh-wrap>summary:focus-visible{outline:2px solid var(--acc,#3b82f6);outline-offset:2px;border-radius:8px}.sh-wrap>summary h3{margin:0}.sh-chev{transition:transform .15s}.sh-wrap[open] .sh-chev{transform:rotate(90deg)}.sh-day{margin-top:10px}.sh-day>summary{cursor:pointer;font-weight:800;min-height:44px;display:flex;align-items:center;gap:6px}.sh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:10px;margin-top:6px}.sh-card{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--panel2);font-size:12px}.sh-top{display:flex;justify-content:space-between;gap:6px;font-size:14px}.sh-score{margin:5px 0;font-size:13px}.sh-leg{display:flex;gap:6px;align-items:flex-start;padding:2px 0}.sh-lt{flex:1}.sh-m{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;font-weight:900;font-size:11px;flex:none}.sh-w{background:#16a34a;color:#fff}.sh-l{background:#dc2626;color:#fff}.sh-n{background:#64748b;color:#fff}.lt{font-size:10px;font-weight:800;padding:1px 6px;border-radius:6px;vertical-align:middle}.lm{background:#16a34a;color:#fff}.lw{background:#ca8a04;color:#fff}</style>';
  var head='<summary aria-label="History of settled Soccer SGPs and Blowouts, collapsed"><span><h3 style="display:inline">🗂️ History</h3> <span class="mut sm">'+(G.length?G.length+' finished match'+(G.length>1?"es":""):"none yet")+'</span></span><span class="sh-chev" aria-hidden="true">›</span></summary>';
  var refresh=(H&&H.auto_refresh===true)?'':' This archive does not refresh on its own.';
  if(!G.length)return css+'<details class="card sh-wrap" id="sgp-history">'+head+'<div class="mut" style="margin-top:6px">No settled matches with a verified final score in the archive yet.'+(when(H)?' Archive built '+when(H)+'.':'')+refresh+'</div></details>';
  var t=tally(G),days=group(G);
  var body='<div class="sub">Cards as last published before kickoff, graded from stored final scores. ✓ hit · ✗ missed · – push or void · ? not verifiable from stored finals. Legs: '+t.w+' hit / '+t.l+' missed'+(t.n?' · '+t.n+' not a hit or a miss':'')+'.'+(when(H)?' Archive built '+when(H)+'.':'')+refresh+'</div>'+
   days.map(function(d){return '<details class="sh-day" data-day="'+d.day+'"><summary>'+esc(dayLabel(d.day))+' <span class="mut sm">'+d.games.length+' match'+(d.games.length>1?"es":"")+'</span></summary><div class="sh-grid">'+d.games.map(card).join("")+'</div></details>'}).join("");
  return css+'<details class="card sh-wrap" id="sgp-history">'+head+body+'</details>'}
 var api={html:html,settled:settled,group:group,dayKey:dayKey};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.SoccerHist=api;
})(typeof window!=="undefined"?window:this);
