/* Player prop intel in the Bet Lab NFL player drawer. Data: data/prop_intel_nfl.json (built by props/tools/prop_intel.py). Keyed by ESPN athlete id (r.aid). */
(function(){let D=null;const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// Display-only fail-closed gate: current official Hub season/week and a recent dated import.
var CTX=null;
function intelTime(raw){
 if(typeof raw!=="string")return NaN;
 if(/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(raw))return Date.parse(raw);
 var m=/^(?:([A-Z][a-z]{2}) (\d{1,2}), (\d{4})|(\d{4})-(\d\d)-(\d\d)) (\d{1,2}):(\d\d) (AM|PM) ET$/.exec(raw);
 if(!m)return NaN;
 var y=+(m[3]||m[4]),mo=m[1]?"JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[1])/3:+m[5]-1,day=+(m[2]||m[6]);
 var wall=Date.UTC(y,mo,day,+m[7]%12+(m[9]==="PM"?12:0),+m[8]),t=wall;
 for(var i=0;i<3;i++){var a=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(t)).map(function(p){return[p.type,p.value]}));t+=wall-Date.UTC(+a.year,+a.month-1,+a.day,+a.hour,+a.minute);}
 return t;
}
function intelAvailable(p,now){
 now=now||Date.now();
 var m=/^(\d{4}) Week (\d{1,2})$/.exec(D&&D.week||""),at=intelTime(D&&(D.updated_at||D.updated_et)),ct=Date.parse(CTX&&CTX.updated);
 if(!p||!m||!CTX||+m[1]!==+CTX.season||+m[2]!==+CTX.week||!isFinite(at)||at>now||now-at>72*36e5||!isFinite(ct)||ct>now||now-ct>48*36e5)return false;
 return (CTX.games||[]).some(function(g){var kick=Date.parse(g.date);return g&&g.away&&g.home&&p.gk===g.away.abbr+"@"+g.home.abbr&&isFinite(kick)&&kick>=now-6*36e5&&kick<=now+7*864e5;});
}
var UNAVAILABLE="<div class='mut pi-unavailable' role='status'>Prop impact unavailable: current-week, fresh verified context is not available.</div>";
fetch("https://nfllab.sportslabshq.com/data/nfl.json?v="+Math.floor(Date.now()/3e5)).then(function(r){return r.ok?r.json():null}).then(function(j){CTX=j;}).catch(function(){});
fetch("data/prop_intel_nfl.json?v="+Math.floor(Date.now()/3e5)).then(r=>r.ok?r.json():null).then(j=>D=j).catch(()=>{});
const DIR={up:["▲ Up","up"],down:["▼ Down","tough"],uncertain:["◆ Uncertain","mut"]};
function drawer(sp,r){if(sp!="nfl"||!r)return"";const p=D&&D.players&&D.players[String(r.aid)];if(!intelAvailable(p))return UNAVAILABLE;const d=DIR[p.dir]||DIR.uncertain;
 return `<h3 style="margin:18px 0 4px;font-size:14px">Prop impact <span class="tag ${d[1]}">${d[0]}</span>${p.unconfirmed?'<span class="tag y" style="background:#d2992222">Unconfirmed</span>':""}</h3>
 <div style="font-size:13px">${E(p.note)}</div>
 <div class="mut" style="font-size:12px;margin-top:4px">Markets: ${p.markets.map(m=>`<span class="tag mut" style="border:1px solid var(--line);margin:0 4px 0 0">${E(m)}</span>`).join("")}</div>
 <div class="mut" style="font-size:12px;margin-top:4px">Confidence: <b>${E(p.conf)}</b>${p.conf_note?" ("+E(p.conf_note)+")":""} · ${E(p.game)}</div>
 <div class="mut" style="font-size:11px;margin-top:2px">${E(p.src)} · ${E(p.time)} · ${E(D.week)}</div>`}
window.PI={drawer,has:a=>intelAvailable(D&&D.players&&D.players[String(a)])};})();
