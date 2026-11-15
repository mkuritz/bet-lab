/* NFL Hub: Live Game Analyzer (preview, uncalibrated).
   Quarter / halftime / final boards: in-game injuries, pace & game flow, live player props.
   Data: data/live/index.json + <gid>_<stage>.json. No live prices. Uncalibrated. */
(function(){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SN={q1:'End of 1st',h1:'Halftime',q3:'End of 3rd',final:'Final'};
const STAGE_ORDER=['q1','h1','q3','final'];
const FL={
  injury_out:['⚠️','Left mid-game'],
  role:['🔼','Role increase'],
  trending:['📈','Trending'],
  script:['🎬','Game script'],
  script_fade:['🧊','Script fade'],
  behind:['📉','Behind pace'],
  already_hit:['✅','Already in'],
  pace:['⚡','Fast pace']
};
const LEAN={over:'Over',under:'Under',hit:'Hit',even:'Even'};
let BASE='data/live/';
async function J(u){const r=await fetch(BASE+u+'?t='+Math.floor(Date.now()/20000));if(!r.ok)throw new Error(r.status);return r.json()}
const q=new URLSearchParams(location.search);if(q.get('lasrc'))BASE=q.get('lasrc').replace(/\/?$/,'/');

const CSS=`<style id="lacss">
.la-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.la-prev{background:#2a2205;border:1px solid #6b5512;color:#fbbf24;font-size:11px;font-weight:800;border-radius:99px;padding:3px 10px;letter-spacing:.04em}
.la-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin:10px 0 16px}
.la-g{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;text-align:left;color:inherit;width:100%;font:inherit}
.la-g:hover{border-color:var(--acc)}
.la-g.on{border-color:var(--acc);box-shadow:inset 3px 0 0 var(--acc)}
.la-g .h{display:flex;gap:8px;align-items:center;font-weight:800}
.la-g img{width:22px;height:22px}
.la-g .sc{margin-left:auto;font-size:16px;letter-spacing:.3px}
.la-g .m{font-size:12px;color:var(--mut);margin-top:4px}
.la-g .live{color:var(--bad);font-weight:800;font-size:11px}
.la-sec{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:0 0 8px}
.la-stage{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 12px}
.la-stage button{padding:6px 14px;border-radius:99px;background:var(--panel2);border:1px solid var(--line);color:var(--mut);font-weight:700;font-size:13px;cursor:pointer}
.la-stage button.on{background:var(--acc);color:#0b1220;border-color:var(--acc)}
.la-stage button.off{opacity:.4;pointer-events:none}
.la-score{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.la-score b{font-size:28px;letter-spacing:.5px}
.la-score .tm{font-weight:800;font-size:15px;display:flex;align-items:center;gap:6px}
.la-score img{width:28px;height:28px}
.la-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:14px;margin-bottom:14px}
.la-cols>.card{margin:0;min-width:0}
.la-stat{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;margin:8px 0}
.la-stat>div{background:#ffffff0d;border-radius:8px;padding:8px 10px}
.la-stat b{display:block;font-size:18px;line-height:1.1}
.la-stat span{font-size:11px;color:var(--mut)}
.la-ent{padding:10px 0;border-bottom:1px solid var(--line)}
.la-ent:last-child{border:0}
.la-ent .h{display:flex;gap:9px;align-items:center}
.la-ent img{width:36px;height:36px;border-radius:50%;background:var(--panel2);flex:0 0 auto}
.la-ent .n{font-weight:800}
.la-ent .rt{margin-left:auto;font-weight:900;font-size:16px;text-align:right;line-height:1.1}
.la-ent .rt small{display:block;font-size:10px;font-weight:600;color:var(--mut)}
.la-why{font-size:12px;color:var(--mut);margin-top:5px}
.la-pill{display:inline-flex;gap:4px;align-items:center;font-size:10.5px;font-weight:800;padding:1.5px 8px;border-radius:99px;border:1px solid var(--line);background:#16213a;color:#c7d7fe;margin:1px 2px 1px 0}
.la-pill.over,.la-pill.hit{background:#0c2b20;border-color:#1d6b4c;color:#6ee7b7}
.la-pill.under{background:#2d121e;border-color:#882642;color:#fda4af}
.la-inj{padding:8px 0;border-bottom:1px solid var(--line)}
.la-inj:last-child{border:0}
.la-inj .h{font-weight:800}
.la-ben{font-size:12px;color:var(--mut);margin:4px 0 0 0;padding:0 0 0 16px}
.la-back{background:none;border:0;color:var(--acc);font-weight:700;cursor:pointer;padding:0;margin:0 0 10px;font:inherit}
.la-meth li{margin:4px 0}.la-meth ul{padding-left:18px;margin:6px 0}
.la-group{font-size:12px;font-weight:800;color:var(--mut);margin:16px 0 6px;text-transform:uppercase;letter-spacing:.06em}
@media(max-width:600px){.la-score b{font-size:22px}.la-stat b{font-size:16px}}
</style>`;

function logo(t){return t&&t.logo?`<img alt="" src="${esc(t.logo)}">`:'';}
function head(r){return r&&r.headshot?`<img alt="" src="${esc(r.headshot)}">`:`<img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">`;}
function pills(flags){return (flags||[]).map(f=>{const x=FL[f];return x?`<span class="la-pill">${x[0]} ${esc(x[1])}</span>`:''}).join('');}
function leanPill(lean){if(!lean||!LEAN[lean])return '';return `<span class="la-pill ${esc(lean)}">${esc(LEAN[lean])}</span>`;}
function pct(v){return v==null?'–':(v*100).toFixed(v<0.1&&v>-0.1?1:0)+'%';}
function num(v,d=0){return v==null||v===''?'–':typeof v==='number'?v.toFixed(d).replace(/\.0$/,''):v;}
function when(iso){if(!iso)return '';try{const d=new Date(iso);return d.toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';}catch(e){return iso;}}

function sortG(idx){
  const rows=Object.values(idx.games||{});
  const rank=g=>{
    const st=g.state;
    if(st==='in'||(g.stages&&g.stages.q1&&st!=='post')){
      if(st==='in')return 0;
    }
    if(st==='in')return 0;
    if(g.pending&&st==='pre')return 1;
    if(g.stages&&Object.keys(g.stages).length&&st!=='post')return 0;
    if(st==='post'||g.ended)return 2;
    return 1;
  };
  rows.sort((a,b)=>{
    const ra=rank(a),rb=rank(b);
    if(ra!==rb)return ra-rb;
    return String(a.kickoff||a.date||'').localeCompare(String(b.kickoff||b.date||''))||String(a.gid).localeCompare(String(b.gid));
  });
  return rows;
}

function groupLabel(g, today){
  const d=g.date||'';
  if(d===today)return "Today's games";
  if(g.state==='in')return "Today's games";
  return d?`Replays · ${d}`:'Replays';
}

window.NFLLive=async function(el){
  if(!document.getElementById('lacss'))document.head.insertAdjacentHTML('beforeend',CSS);
  let IDX, cache={};
  const st={gid:new URLSearchParams(location.search).get('g')||null, stage:new URLSearchParams(location.search).get('stage')||null};
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});

  async function board(g, stage){
    const meta=(g.stages||{})[stage]; if(!meta)throw new Error('no stage');
    const k=meta.file;
    if(!cache[k])cache[k]=await J(k);
    return cache[k];
  }

  function gameCard(g){
    const live=g.state==='in';
    const pending=g.pending&&!g.stages;
    const sc=g.score||{};
    const stages=STAGE_ORDER.filter(s=>g.stages&&g.stages[s]).map(s=>SN[s]).join(' · ');
    const detail=live?(g.detail||'Live'):(pending?(g.detail||'Upcoming'):(g.ended||g.detail||'Final'));
    return `<button type="button" class="la-g${st.gid===g.gid?' on':''}" data-gid="${esc(g.gid)}">
      <div class="h"><span>${esc(g.away)}</span><span class="sc">${pending?'':`${sc.away??'–'}–${sc.home??'–'}`}</span><span>${esc(g.home)}</span></div>
      <div class="m">${live?'<span class="live">LIVE</span> · ':''}${esc(detail)}${stages?` · ${esc(stages)}`:''}${g.kickoff&&pending?' · '+esc(when(g.kickoff)):''}</div>
    </button>`;
  }

  function listHTML(games){
    let last='';
    const parts=[];
    for(const g of games){
      const lab=groupLabel(g,today);
      if(lab!==last){parts.push(`<div class="la-group">${esc(lab)}</div>`);last=lab;}
      parts.push(gameCard(g));
    }
    return `<div class="la-games">${parts.join('')}</div>`;
  }

  function paceHTML(D){
    const p=D.pace||{};
    const proe=p.pass_rate_over_expected;
    const proeLbl=proe==null?'–':(proe>=0?'+':'')+pct(proe);
    return `<div class="card">
      <div class="la-sec">Pace & game flow</div>
      <div class="la-stat">
        <div><b>${esc(num(p.sec_per_play,1))}</b><span>sec / play</span></div>
        <div><b>${esc(num(p.plays_per_min,1))}</b><span>plays / min</span></div>
        <div><b>${esc(p.pace||'–')}</b><span>vs 26 sec prior</span></div>
        <div><b>${esc(pct(p.pass_rate))}</b><span>pass rate</span></div>
        <div><b>${esc(proeLbl)}</b><span>pass rate vs expected</span></div>
        <div><b>${p.pregame_total!=null?esc(num(p.projected_total,0))+' / '+esc(num(p.pregame_total,1)):esc(num(p.projected_total,0))}</b><span>proj / pregame total</span></div>
      </div>
      <div class="la-why">${esc(p.total_why||'')}</div>
      <div class="la-why"><b>${esc(D.away)}</b> ${esc((p.away&&p.away.script)||'')} (${esc(num(p.away&&p.away.pass_rate!=null?p.away.pass_rate*100:null,0))}% pass).
      <b>${esc(D.home)}</b> ${esc((p.home&&p.home.script)||'')} (${esc(num(p.home&&p.home.pass_rate!=null?p.home.pass_rate*100:null,0))}% pass).</div>
    </div>`;
  }

  function injHTML(D){
    const inj=D.injuries||[];
    const shifts=D.shifts||[];
    const by=Object.fromEntries(shifts.map(s=>[s.injured&&s.injured.pid,s]));
    if(!inj.length)return `<div class="card"><div class="la-sec">In-game injuries</div><div class="mut sm">No mid-game injuries in the play-by-play for this snapshot.</div>${inactHTML(D)}</div>`;
    const rows=inj.map(i=>{
      const sh=by[i.pid]||{};
      const bens=(sh.beneficiaries||[]).map(b=>{
        const bit=b.entered?'entered the game':`usage after the injury: ${b.post&&b.post.plays||0} plays (was ${b.pre&&b.pre.plays||0})`;
        const extra=[];
        if(b.post&&b.post.pass_att)extra.push(`${b.post.pass_att} dropbacks`);
        if(b.post&&b.post.rush_att)extra.push(`${b.post.rush_att} carries`);
        if(b.post&&b.post.tgt)extra.push(`${b.post.tgt} targets`);
        return `<li><b>${esc(b.name)}</b> ${esc(bit)}${extra.length?` · ${esc(extra.join(', '))}`:''}</li>`;
      }).join('');
      return `<div class="la-inj">
        <div class="h">${esc(i.name)} <span class="mut sm">${esc(i.team)} ${esc(i.pos||'')}</span> ${`<span class="la-pill ${i.status==='out'||i.label&&i.label.indexOf('Ruled')===0?'under':''}">${esc(i.label||i.status)}</span>`}${i.body?`<span class="la-pill">${esc(i.body)}</span>`:''}${i.when?`<span class="mut sm">${esc(i.when)}</span>`:''}</div>
        ${bens?`<ul class="la-ben">${bens}</ul>`:(sh.note?`<div class="la-why">${esc(sh.note)}</div>`:'')}
      </div>`;
    }).join('');
    return `<div class="card"><div class="la-sec">In-game injuries & usage shift</div>${rows}${inactHTML(D)}</div>`;
  }

  function inactHTML(D){
    const a=D.inactives||[];
    if(!a.length)return '';
    const by={};
    a.forEach(x=>{(by[x.team]||(by[x.team]=[])).push(x);});
    const line=Object.keys(by).map(t=>`<b>${esc(t)}</b> ${by[t].map(x=>esc(x.name)+(x.pos?' ('+esc(x.pos)+')':'')).join(', ')}`).join(' · ');
    return `<div class="la-why" style="margin-top:10px"><b>Pregame inactives:</b> ${line}</div>`;
  }

  function boardHTML(D){
    const items=D.board||[];
    if(!items.length)return `<div class="card"><div class="la-sec">Player props that make sense</div><div class="mut sm">No standout live props at this snapshot (no injury, script, or trending hook against a pregame line).</div></div>`;
    const rows=items.map(r=>`<div class="la-ent">
      <div class="h">${head(r)}<div><div class="n">${esc(r.name)} <span class="mut sm">${esc(r.team)} ${esc(r.pos||'')}</span></div>
        <div>${leanPill(r.lean)}${pills(r.flags)}</div></div>
        <div class="rt">${esc(r.market)}${r.line!=null?`<small>${r.lean==='hit'?'':(r.lean==='under'?'u':r.lean==='over'?'o':'')} ${esc(num(r.line,1))}</small>`:`<small>no pregame line</small>`}</div>
      </div>
      <div class="la-stat" style="margin-top:6px">
        <div><b>${esc(num(r.so_far,1))}</b><span>so far</span></div>
        <div><b>${esc(num(r.live_proj,1))}</b><span>live proj (rest + so far)</span></div>
        <div><b>${r.book&&r.price!=null?esc(r.book)+' '+(r.price>0?'+':'')+esc(r.price):'–'}</b><span>pregame price</span></div>
      </div>
      <div class="la-why">${esc(r.why)}</div>
    </div>`).join('');
    return `<div class="card"><div class="la-sec">Player props that make sense <span class="mut sm">· pregame line is the baseline · no live prices</span></div>${rows}</div>`;
  }

  function usageHTML(D){
    const rows=(D.usage||[]).filter(r=>r.pass_att||r.rush_att||r.tgt||r.rec);
    if(!rows.length)return '';
    const body=rows.map(r=>`<tr>
      <td class="l">${esc(r.name)}</td><td>${esc(r.team)}</td><td>${esc(r.pos||'')}</td>
      <td>${r.pass_att?`${r.pass_cmp}/${r.pass_att}, ${r.pass_yds}y`:''}${r.pass_td?` ${r.pass_td} TD`:''}${r.int?` ${r.int} INT`:''}</td>
      <td>${r.rush_att?`${r.rush_att}–${r.rush_yds}`:''}${r.rush_td?` ${r.rush_td} TD`:''}</td>
      <td>${r.tgt?`${r.rec}/${r.tgt}, ${r.rec_yds}y`:''}${r.rec_td?` ${r.rec_td} TD`:''}</td>
    </tr>`).join('');
    return `<div class="card"><div class="la-sec">Usage so far this snapshot</div>
      <div class="wrap"><table><thead><tr><th>Player</th><th>Team</th><th>Pos</th><th>Passing</th><th>Rushing</th><th>Receiving (rec/tgt)</th></tr></thead><tbody>${body}</tbody></table></div>
      <div class="la-why">${esc((D.notes&&D.notes.snaps)||'')}</div>
    </div>`;
  }

  const METH=`<div class="card la-meth"><div class="la-sec">How this board is built</div>
    <ul>
      <li>Snapshots land at the end of the 1st quarter, at halftime, at the end of the 3rd, and at final.</li>
      <li>Pace is official offensive plays (rushes, pass attempts, sacks) over elapsed game clock. The 26 seconds-per-play baseline is a judgment prior.</li>
      <li>Pass rate over expected is a simple down / distance / score / time prior. Uncalibrated.</li>
      <li>Mid-game injuries come from the official play-by-play (“was injured during the play,” ruled out or questionable to return) plus the in-game injury report. Pregame inactives are listed separately.</li>
      <li>Usage is carries, targets, receptions and dropbacks from the play-by-play — official snap counts are not in this feed.</li>
      <li>Player-prop rows use a pregame line when one is on file (Book A / B / C). No live prices are used. Remaining projections are judgment priors.</li>
      <li>Every board is labeled uncalibrated. Compare any live number yourself.</li>
    </ul>
  </div>`;

  async function draw(){
    const games=sortG(IDX);
    const top=`<div class="la-top"><h2 style="margin:0">⏱️ Live Analyzer</h2><span class="la-prev">PREVIEW · UNCALIBRATED</span>
      <span class="mut sm">In-game injuries, pace & game flow, and the player props that make sense at each quarter break.</span></div>`;
    if(!st.gid){
      el.innerHTML=top+`<p class="mut sm">Today's games sit at the top. Last week's completed games are underneath as replays so you can step through end of 1st, halftime, end of 3rd, and final. This link is private and is not on the public NFL Hub.</p>`+listHTML(games)+METH;
      el.querySelectorAll('[data-gid]').forEach(b=>b.onclick=()=>{st.gid=b.dataset.gid;st.stage=null;draw();});
      return;
    }
    const G=IDX.games[st.gid]||games.find(x=>x.gid===st.gid);
    if(!G){st.gid=null;return draw();}
    const available=STAGE_ORDER.filter(s=>G.stages&&G.stages[s]);
    if(!st.stage||!available.includes(st.stage))st.stage=available[available.length-1]||null;
    if(!st.stage){
      el.innerHTML=top+`<button type="button" class="la-back" data-back>← All games</button>
        <div class="card"><div class="la-score">
          <div class="tm">${esc(G.away)}</div><b>${(G.score&&G.score.away)||0}</b>
          <span class="mut">${esc(G.detail||'Upcoming')}</span>
          <b>${(G.score&&G.score.home)||0}</b><div class="tm">${esc(G.home)}</div>
        </div><p class="mut">No quarter board yet. Boards appear when a quarter ends (and at final).</p></div>`+listHTML(games);
      el.querySelector('[data-back]').onclick=()=>{st.gid=null;draw();};
      el.querySelectorAll('[data-gid]').forEach(b=>b.onclick=()=>{st.gid=b.dataset.gid;st.stage=null;draw();});
      return;
    }
    let D;
    try{D=await board(G,st.stage);}catch(e){el.innerHTML=top+`<div class="card">Could not load this board.</div>`;return;}
    const pills=STAGE_ORDER.map(s=>`<button type="button" class="${s===st.stage?'on':(available.includes(s)?'':'off')}" data-stage="${s}">${SN[s]}</button>`).join('');
    const ta=D.teams&&D.teams.away||{}, th=D.teams&&D.teams.home||{};
    el.innerHTML=top+`<button type="button" class="la-back" data-back>← All games</button>
      <div class="card">
        <div class="la-score">
          <div class="tm">${logo(ta)} ${esc(D.away)}</div><b>${D.score.away}</b>
          <span class="mut sm">${esc(D.stage_label)} · ${esc(D.detail||'')}</span>
          <b>${D.score.home}</b><div class="tm">${logo(th)} ${esc(D.home)}</div>
        </div>
        <div class="la-stage">${pills}</div>
        <div class="mut sm">Built ${esc(when(D.built))} · ${D.play_count||0} plays in this snapshot${D.degraded?' · early / partial read':''}</div>
      </div>
      <div class="la-cols">${paceHTML(D)}${injHTML(D)}</div>
      ${boardHTML(D)}${usageHTML(D)}${METH}`;
    el.querySelector('[data-back]').onclick=()=>{st.gid=null;st.stage=null;draw();};
    el.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{st.stage=b.dataset.stage;draw();});
  }

  el.innerHTML='<div class="card mut">Loading Live Analyzer…</div>';
  try{IDX=await J('index.json')}catch(e){
    el.innerHTML=`<div class="la-top"><h2 style="margin:0">⏱️ Live Analyzer</h2><span class="la-prev">PREVIEW · UNCALIBRATED</span></div>
      <div class="card"><p>No boards yet. Boards appear at the end of the 1st and 3rd quarters, at halftime, and at final.</p></div>`;
    return;
  }
  await draw();
  const iv=setInterval(async()=>{
    if(!el.isConnected){clearInterval(iv);return;}
    if(document.hidden)return;
    try{
      const n=await J('index.json');
      if(n.updated&&n.updated!==IDX.updated){IDX=n;cache={};const y=scrollY;await draw();scrollTo(0,y);}
    }catch(e){}
  },60000);
};
})();
