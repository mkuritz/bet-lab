/* Player prop intel in the Bet Lab NFL player drawer. Data: data/prop_intel_nfl.json (built by props/tools/prop_intel.py). Keyed by ESPN athlete id (r.aid). */
(function(){let D=null;const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
fetch("data/prop_intel_nfl.json?v="+Math.floor(Date.now()/3e5)).then(r=>r.ok?r.json():null).then(j=>D=j).catch(()=>{});
const DIR={up:["▲ Up","up"],down:["▼ Down","tough"],uncertain:["◆ Uncertain","mut"]};
function gl(G){if(!G)return"";var f=function(n){return(n>0?"+":"")+(+n)},s=[];if(G.spread)s.push(G.spread.fav+" "+G.spread.line.map(f).join(" / "));if(G.total!=null)s.push("O/U "+G.total);(G.moves||[]).forEach(function(m){s.push(m.mkt=="total"?"Total "+m.from+" → "+m.to:"Spread "+m.from.fav+" "+f(m.from.line)+" → "+(m.to.fav!=m.from.fav?m.to.fav+" ":"")+f(m.to.line))});return s.join(" · ")}
function drawer(sp,r){if(sp!="nfl"||!D||!r)return"";const p=D.players[String(r.aid)];if(!p)return"";const d=DIR[p.dir]||DIR.uncertain;
 return `<h3 style="margin:18px 0 4px;font-size:14px">Prop impact <span class="tag ${d[1]}">${d[0]}</span>${p.unconfirmed?'<span class="tag y" style="background:#d2992222">Unconfirmed</span>':""}</h3>
 <div style="font-size:13px">${E(p.note)}</div>
 <div class="mut" style="font-size:12px;margin-top:4px">Markets: ${p.markets.map(m=>`<span class="tag mut" style="border:1px solid var(--line);margin:0 4px 0 0">${E(m)}</span>`).join("")}</div>
 <div class="mut" style="font-size:12px;margin-top:4px">Confidence: <b>${E(p.conf)}</b>${p.conf_note?" ("+E(p.conf_note)+")":""} · ${E(p.game)}</div>
 <div class="mut" style="font-size:11px;margin-top:2px">${E(p.src)} · ${E(p.time)} · ${E(D.week)}</div>${p.gk&&D.games&&D.games[p.gk]?`<div class="mut" style="font-size:12px;margin-top:4px">Game line: <b>${E(gl(D.games[p.gk]))}</b></div>`:""}`}
window.PI={drawer,has:a=>!!(D&&D.players[String(a)])};})();
