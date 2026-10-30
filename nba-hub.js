/* NBA Hub interactive engine:
   1. Today's NBA Slate, Win-Prob, Fair vs Book Lines, Pace/ITT, Rest/B2B & Blowout Risk Meter
   2. Spot vs. Fake-Out Prop Board (Confirmed Spots, Off-Market Snipes, Fake-Out Traps)
   3. Starting 5, Rotations, Minutes Projections & Active Injury Usage Cascades (With vs Without Teammate)
   4. 30-Team Positional DvP (PG, SG, SF, PF, C across Season / L10 / L5) & 5-Zone Court Shot-Zone Defense Matrix
   5. Hot Streaks, Volume-Due Positive Regression & Correlated Non-Cannibalizing SGP Builder
   6. Interactive Player Profile Modal (Game-log bar chart with Minutes Overlay, Avg/Median toggle, Shot Chart, With/Without Teammate splits & Similar Players vs Opponent)
*/
(function(){"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const am=p=>p==null?"—":(p>0?"+"+p:""+p);
const sg=v=>v==null?"—":(v>0?"+"+v.toFixed(1):v.toFixed(1));
const fmtET=t=>t?new Date(t).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET":"—";
const rkCol=r=>{
  // r: 1 = Softest (Most Allowed -> Green for Over target), 30 = Toughest (Red)
  const x=Math.max(0,Math.min(1,(r-1)/29));
  return `hsl(${Math.round(135-135*x)} 62% 24%)`;
};

let D=null,PLOGS=null,SHOTS_LG=null,SHOT_CACHE={};
let TAB="slate";
let F={
  q:"",team:"",game:"",mkt:"",spot:"all",
  dvpWin:"szn",dvpStat:"pts",dvpSort:"PG",dvpDir:1,
  rotTeam:"",
  strkSub:"hot",
  tmConf:"",tmSort:"net"
};

const MKT_STAT_MAP={
  "Points":g=>g.points||0,
  "Rebounds":g=>g.totalRebounds||0,
  "Assists":g=>g.assists||0,
  "3-Point Field Goals":g=>parseFloat(String(g["threePointFieldGoalsMade-threePointFieldGoalsAttempted"]||0).split("-")[0])||0,
  "Steals":g=>g.steals||0,
  "Blocks":g=>g.blocks||0,
  "Points, Rebounds, and Assists":g=>(g.points||0)+(g.totalRebounds||0)+(g.assists||0),
  "Points and Assists":g=>(g.points||0)+(g.assists||0),
  "Points and Rebounds":g=>(g.points||0)+(g.totalRebounds||0),
  "Assists and Rebounds":g=>(g.assists||0)+(g.totalRebounds||0)
};

function loadHub(){
  const v=Math.floor(Date.now()/18e4);
  return fetch("data/nba_hub.json?v="+v).then(r=>r.json()).then(d=>{D=d;return d});
}
function loadPlogs(){
  if(PLOGS)return Promise.resolve(PLOGS);
  return fetch("data/plogs_nba.json?v="+Math.floor(Date.now()/6e5)).then(r=>r.ok?r.json():{}).then(p=>{PLOGS=p||{};return PLOGS}).catch(()=>({}));
}
function loadPlayerShot(aid){
  if(SHOT_CACHE[aid])return Promise.resolve(SHOT_CACHE[aid]);
  return fetch("data/shots_nba/"+aid+".json?v="+Math.floor(Date.now()/6e5)).then(r=>r.ok?r.json():null).then(s=>{SHOT_CACHE[aid]=s;return s}).catch(()=>null);
}

function renderKPIs(){
  const el=document.getElementById("kpi-strip");
  if(!el||!D)return;
  const spots=(D.props||[]).filter(p=>p.spot_cls==="spot").length;
  const snipes=(D.props||[]).filter(p=>p.spot_cls==="snipe").length;
  const fakes=(D.props||[]).filter(p=>p.spot_cls==="fakeout").length;
  const b2bCnt=(D.slate||[]).reduce((s,g)=>s+(g.b2b_away?1:0)+(g.b2b_home?1:0),0);
  el.innerHTML=[
    ["🏀 Slate Games",(D.slate||[]).length,"Win-Prob, Pace & Blowout Risk"],
    ["🎯 Confirmed Spots",spots,"L10 ≥ 60% · Med ≥ Line · +2–8% Edge"],
    ["⚡ Off-Market Snipes",snipes,"Book A value vs projection"],
    ["🚨 Fake-Out Traps Flagged",fakes,"Mirage / Skew / DvP Shift warnings"],
    ["🔥 Hot Streaks & Volume-Due",(D.hot_streaks||[]).length+" / "+(D.volume_due||[]).length,"80%+ Hitters & Regression plays"],
    ["🔗 Correlated SGP Stacks",(D.sgp_cards||[]).length,"Zero Same-Stat Cannibalization"]
  ].map(x=>`<div class="kpi"><div class="l">${x[0]}</div><div class="v">${x[1]}</div><div class="s">${x[2]}</div></div>`).join("");
  const sub=document.getElementById("hub-sub");
  if(sub)sub.textContent=`Updated ${fmtET(D.updated)} · ${Object.keys(D.teams||{}).length} NBA Teams · ${(D.props||[]).length} Classified Props · 30-Team Positional DvP (Season / L10 / L5) & 5-Zone Court Shot Matrix`;
}

function renderSlate(){
  const G=D.slate||[];
  if(!G.length)return `<div class="card"><div class="mut">No upcoming NBA slate games in the current window.</div></div>`;
  return `<div class="ctl-bar">
    <span style="font-weight:800">🏀 Matchup Slate (${G.length} games)</span>
    <span class="mut" style="font-size:12px">Model Win Probability, Fair Spread/Total vs. Book A, Implied Team Totals (ITT), Rest/B2B &amp; Q4 Blowout Sit Risk</span>
  </div>
  <div class="grid">${G.map(g=>{
    const wA=Math.round(g.win_away*100),wH=100-wA;
    const spBook=g.book_spread==null?"—":(g.book_spread===0?"PK":g.book_spread<0?`${g.home} ${g.book_spread}`:`${g.away} -${g.book_spread}`);
    const spMod=g.model_spread===0?"PK":g.model_spread<0?`${g.home} ${g.model_spread}`:`${g.away} -${g.model_spread}`;
    const blCls=g.blowout_tier.includes("High")?"bad":g.blowout_tier.includes("Mod")?"warn":"ok";
    const rAw=g.b2b_away?`<span class="badge b2b">⚡ 0d B2B</span>`:(g.rest_away>=2?`<span class="badge ok">🛌 ${g.rest_away}d Rest</span>`:`<span class="badge">1d Rest</span>`);
    const rHm=g.b2b_home?`<span class="badge b2b">⚡ 0d B2B</span>`:(g.rest_home>=2?`<span class="badge ok">🛌 ${g.rest_home}d Rest</span>`:`<span class="badge">1d Rest</span>`);
    const gProps=(D.props||[]).filter(p=>p.game===g.id&&p.spot_cls!=="fakeout").slice(0,3);
    return `<div class="gm-card">
      <div class="gm-top">
        <span>${fmtET(g.time)}</span>
        <span class="badge ${blCls}" title="Estimated Q4 starter bench risk from spread">Blowout Risk: ${E(g.blowout_tier)} (${g.blowout_pct}%)</span>
      </div>
      <div class="gm-tm">
        <div class="lhs"><img src="${E(g.away_logo)}" alt=""><span>${E(g.away_name)}</span> <span class="mut" style="font-size:12px;font-weight:600">(${E(g.away_rec)})</span> ${rAw}</div>
        <div><b style="font-size:15px">${wA}%</b> <span class="mut" style="font-size:11.5px">Fair ${am(g.fair_mla)} · Book A ${am(g.mla)}</span></div>
      </div>
      <div class="gm-tm">
        <div class="lhs"><img src="${E(g.home_logo)}" alt=""><span>${E(g.home_name)}</span> <span class="mut" style="font-size:12px;font-weight:600">(${E(g.home_rec)})</span> ${rHm}</div>
        <div><b style="font-size:15px">${wH}%</b> <span class="mut" style="font-size:11.5px">Fair ${am(g.fair_mlh)} · Book A ${am(g.mlh)}</span></div>
      </div>
      <div class="gm-bar" title="Win Probability: ${g.away} ${wA}% vs ${g.home} ${wH}%"><i class="a" style="width:${wA}%"></i><i class="h" style="width:${wH}%"></i></div>
      <div class="gm-cells">
        <div><div class="l">Book / SL Spread</div><div class="v">${E(spBook)} <span class="mut">/</span> ${E(spMod)}</div></div>
        <div><div class="l">Book / SL Total</div><div class="v">${g.book_total??"—"} <span class="mut">/</span> ${g.model_total}</div></div>
        <div><div class="l">Implied Totals</div><div class="v">${E(g.away)} ${g.itt_away} · ${E(g.home)} ${g.itt_home}</div></div>
        <div><div class="l">Proj Pace</div><div class="v">${g.proj_pace} <span class="mut" style="font-size:10px">poss</span></div></div>
      </div>
      ${(g.mismatches||[]).length?`<div style="display:flex;flex-wrap:wrap;gap:4px">${g.mismatches.map(m=>`<span class="badge ${m.kind==='soft'?'spot':'snipe'}" style="font-size:10px">${E(m.txt)}</span>`).join("")}</div>`:""}
      ${g.game_script?`<div style="background:rgba(11,15,23,.72);border:1px solid rgba(83,227,166,.28);border-radius:9px;padding:8px 10px;font-size:11.5px;display:flex;flex-direction:column;gap:3px">
        <div style="font-weight:800;color:#53e3a6;font-size:11px;text-transform:uppercase;letter-spacing:.04em">📋 The Game Script · We Deliver The Script</div>
        <div class="mut" style="font-size:11px">${E(g.game_script.pace_tempo||"")}</div>
        ${(g.game_script.flow||[]).map(f=>`<div style="padding-top:2px;border-top:1px dashed rgba(255,255,255,.07)"><b>${E(f.phase)}:</b> ${E(f.text)}</div>`).join("")}
        <div style="padding-top:3px;border-top:1px solid rgba(255,255,255,.08);color:#53e3a6"><b>🎯 Script Verdict:</b> ${E(g.game_script.verdict||"")}</div>
      </div>`:""}
      ${gProps.length?`<div style="border-top:1px solid var(--line);padding-top:6px;font-size:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span class="mut" style="font-size:10.5px;font-weight:800;text-transform:uppercase">🎯 Top Verified Spots in Game</span><a href="#" data-jump-game="${E(g.id)}" style="font-size:11px;font-weight:700">All Game Props →</a></div>
        ${gProps.map(p=>`<div style="display:flex;justify-content:space-between;padding:2px 0">
          <span><a class="plink" data-player-aid="${E(p.aid)}" data-player-mkt="${E(p.market)}">${E(p.player)}</a> <span class="mut">(${E(p.team)} · ${p.min_l5||p.min_proj||"—"}m)</span></span>
          <span><b>Over ${p.line} ${E(p.mk_short)}</b> <span class="up">(Proj ${p.proj} · L10 ${p.l10_pct}%)</span></span>
        </div>`).join("")}
      </div>`:""}
    </div>`;
  }).join("")}</div>`;
}

function renderProps(){
  const P=D.props||[];
  const teams=[...new Set(P.map(x=>x.team))].sort();
  const mkts=[...new Set(P.map(x=>x.market))].sort();
  const games=D.slate||[];
  const q=F.q.toLowerCase().trim();
  const R=P.filter(p=>{
    if(F.spot==="spot"&&p.spot_cls!=="spot")return false;
    if(F.spot==="snipe"&&p.spot_cls!=="snipe")return false;
    if(F.spot==="verified"&&(p.spot_cls!=="spot"&&p.spot_cls!=="snipe"))return false;
    if(F.spot==="fakeout"&&p.spot_cls!=="fakeout")return false;
    if(F.team&&p.team!==F.team&&p.opp!==F.team)return false;
    if(F.game&&p.game!==F.game)return false;
    if(F.mkt&&p.market!==F.mkt)return false;
    if(q&&!(p.player+" "+p.team+" "+p.opp+" "+p.market).toLowerCase().includes(q))return false;
    return true;
  });

  return `<div class="ctl-bar">
    <input type="search" id="f-q" placeholder="Search player, team or prop…" value="${E(F.q)}">
    <select id="f-game"><option value="">All Slate Games</option>${games.map(g=>`<option value="${E(g.id)}" ${F.game===g.id?"selected":""}>${E(g.away)} @ ${E(g.home)}</option>`).join("")}</select>
    <select id="f-team"><option value="">All Teams</option>${teams.map(t=>`<option value="${E(t)}" ${F.team===t?"selected":""}>${E(t)}</option>`).join("")}</select>
    <select id="f-mkt"><option value="">All Markets</option>${mkts.map(m=>`<option value="${E(m)}" ${F.mkt===m?"selected":""}>${E(m)}</option>`).join("")}</select>
    <div class="pills">
      ${[["all","All Props ("+P.length+")"],["verified","🎯 Verified Spots & Snipes"],["spot","🎯 Confirmed Spots Only"],["snipe","⚡ Off-Market Snipes"],["fakeout","🚨 Fake-Out Traps"]].map(x=>`<button type="button" data-spot="${x[0]}" class="${F.spot===x[0]?"on":""}">${x[1]}</button>`).join("")}
    </div>
  </div>
  <div class="card" style="padding:0">
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th class="l-al">Player &amp; Matchup</th>
            <th class="l-al">Market</th>
            <th>Line</th>
            <th>Proj / Med</th>
            <th>L10 Hit%</th>
            <th>L5 Hit%</th>
            <th>MIN (L5 vs Szn)</th>
            <th>Opp DvP (Szn/L5)</th>
            <th>Book A Price</th>
            <th>Conviction</th>
            <th class="l-al">Spot vs. Fake-Out Diagnosis</th>
          </tr>
        </thead>
        <tbody>
          ${R.slice(0,180).map(p=>{
            const why=(p.spot_cls==="fakeout"?p.fakeout_flags:p.reasons)||[];
            const dMin=p.min_delta>0?`+${p.min_delta}`:p.min_delta;
            return `<tr>
              <td class="l-al"><a class="plink" data-player-aid="${E(p.aid)}" data-player-mkt="${E(p.market)}">${E(p.player)}</a> <span class="mut">${E(p.pos_slot)} · ${E(p.team)} ${E(p.matchup)}</span></td>
              <td class="l-al"><b>${E(p.mk_short)}</b></td>
              <td><b>${p.line}</b></td>
              <td><b class="${p.proj>p.line?'up':''}">${p.proj}</b> <span class="mut">/ ${p.median}</span></td>
              <td><b class="${p.l10_pct>=60?'up':p.l10_pct<=40?'dn':''}">${p.l10_pct}%</b> <span class="mut">(${p.l10_h}/${p.l10_n})</span></td>
              <td><b>${p.l5_pct}%</b> <span class="mut">(${p.l5_h}/${p.l5_n})</span></td>
              <td><b>${p.min_l5||"—"}m</b> <span class="${p.min_delta>=1.5?'up':p.min_delta<=-2?'dn':'mut'}">(${dMin}m)</span></td>
              <td><span class="rk-box" style="background:${rkCol(p.dvp_szn)}">#${p.dvp_szn}</span> <span class="mut">/ #${p.dvp_l5}</span></td>
              <td><b>${am(p.ov_odds)}</b> <span class="mut">${E(p.book)}</span></td>
              <td><b>${p.conviction}/100</b></td>
              <td class="l-al"><span class="badge ${p.spot_cls}">${E(p.spot_tag)}</span> <span class="mut" style="font-size:11.5px">${E((p.execution_thesis&&p.execution_thesis.why_edge)?(p.execution_thesis.why_edge+" · "+p.execution_thesis.catalyst):(why.join(" · ")||"Standard projection"))}</span></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderRotations(){
  const U=D.units||[];
  const CAS=D.cascade||[];
  const EMP=D.emp_cascades||{};
  const teams=U.map(u=>u.team).sort();
  const fltU=F.rotTeam?U.filter(u=>u.team===F.rotTeam):U;

  return `<div class="ctl-bar">
    <span style="font-weight:800">📋 Starting 5, Second Unit Rotations &amp; Active Injury Usage Cascades</span>
    <select id="f-rot-tm"><option value="">All 30 NBA Teams</option>${teams.map(t=>`<option value="${E(t)}" ${F.rotTeam===t?"selected":""}>${E(t)}</option>`).join("")}</select>
  </div>
  <div class="card">
    <h3>🩹 Active Injury Usage Cascade Board (Empirical With vs. Without Teammate Deltas)</h3>
    <div class="mut" style="font-size:12px;margin-bottom:10px">When a starter or high-usage rotation player is ruled Out, here is who absorbs the minutes and usage—backed by actual shared box-score splits.</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">
      ${CAS.filter(c=>!F.rotTeam||c.team===F.rotTeam).slice(0,18).map(c=>{
        const empList=[];
        (c.out||[]).forEach(outNm=>{
          const k=c.team+"|"+outNm;
          if(EMP[k])empList.push(...EMP[k]);
        });
        return `<div class="gm-card" style="background:var(--panel2)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b style="font-size:15px">${E(c.team)} Injury Cascade</b>
            <span class="badge bad">Out: ${E((c.out||[]).join(", "))}</span>
          </div>
          ${(c.gets||[]).slice(0,4).map(o=>`<div style="font-size:12.5px;display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:5px">
            <span><b>${E(o.player)}</b> <span class="mut">(${E(o.pos)})</span></span>
            <span>${o.base.min}→<b class="up">${o.est.min}m</b> · ${o.base.pts}→<b class="up">${o.est.pts} PTS</b> · ${o.base.reb} REB · ${o.base.ast} AST</span>
          </div>`).join("")}
          ${empList.length?`<div style="margin-top:4px;padding-top:5px;border-top:1px dashed var(--line);font-size:11.5px">
            <div class="mut" style="font-weight:800;font-size:10px;text-transform:uppercase;margin-bottom:3px">📊 Empirical Box-Score Splits Without Starter</div>
            ${empList.slice(0,3).map(e=>`<div style="display:flex;justify-content:space-between">
              <span><a class="plink" data-player-aid="${E(e.aid)}" data-player-mkt="${E(e.market)}">${E(e.player)}</a> (${E(e.market)})</span>
              <span class="up"><b>${e.wo_avg} w/o</b> vs ${e.w_avg} w/ (${e.delta>=0?"+":""}${e.delta}) · Hits ${e.wo_hit} (${e.wo_pct}%)</span>
            </div>`).join("")}
          </div>`:""}
        </div>`;
      }).join("")}
    </div>
  </div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(370px,1fr))">
    ${fltU.map(u=>{
      const tr=D.teams[u.team]||{};
      const st5=(u.first&&u.first.players)||[];
      const bn5=(u.second&&u.second.players)||[];
      return `<div class="card" style="margin:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
            ${tr.logo?`<img src="${E(tr.logo)}" width="24" height="24" alt="">`:""}
            <div><b>${E(u.name||u.team)}</b> <div class="mut" style="font-size:11px">Proj ${E(tr.proj_wl||"—")} · Pace ${tr.pace||"—"} · Bench Share ${u.bench_share||0}%</div></div>
          </div>
          ${(u.out||[]).length?`<span class="badge bad">${u.out.length} Out</span>`:`<span class="badge ok">Full Strength</span>`}
        </div>
        <div style="font-size:10.5px;font-weight:800;color:var(--acc);text-transform:uppercase;margin:4px 0">★ Projected Starting 5 (${u.first.total.pts} PTS / ${u.first.total.reb} REB / ${u.first.total.ast} AST)</div>
        <table>
          <thead><tr><th class="l-al">Slot</th><th class="l-al">Player</th><th>Proj MIN</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead>
          <tbody>
            ${st5.map(p=>`<tr>
              <td class="l-al"><span class="badge spot">${E(p.slot||p.pos)}</span></td>
              <td class="l-al"><a class="plink" data-player-aid="${E(p.id)}" data-player-mkt="Points">${E(p.name)}</a>${p.status?` <span class="dn" style="font-size:10.5px">(${E(p.status)})</span>`:""}</td>
              <td><b>${p.proj?p.proj.min:"—"}</b></td>
              <td><b>${p.proj?p.proj.pts:"—"}</b></td>
              <td>${p.proj?p.proj.reb:"—"}</td>
              <td>${p.proj?p.proj.ast:"—"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        <div style="font-size:10.5px;font-weight:800;color:var(--acc2);text-transform:uppercase;margin:10px 0 4px">Second Unit Rotation (${u.second.total.pts} PTS / ${u.second.total.reb} REB / ${u.second.total.ast} AST)</div>
        <table>
          <tbody>
            ${bn5.map(p=>`<tr>
              <td class="l-al"><span class="badge">${E(p.pos)}</span></td>
              <td class="l-al"><a class="plink" data-player-aid="${E(p.id)}" data-player-mkt="Points">${E(p.name)}</a>${p.status?` <span class="dn" style="font-size:10.5px">(${E(p.status)})</span>`:""}</td>
              <td>${p.proj?p.proj.min:"—"}</td>
              <td><b>${p.proj?p.proj.pts:"—"}</b></td>
              <td>${p.proj?p.proj.reb:"—"}</td>
              <td>${p.proj?p.proj.ast:"—"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        ${(u.out||[]).length?`<div class="dn" style="font-size:11.5px;margin-top:8px"><b>Inactive / Out:</b> ${u.out.map(x=>E(x.name)+" ("+E(x.status)+")").join(", ")}</div>`:""}
      </div>`;
    }).join("")}
  </div>`;
}

function renderDvP(){
  const W=D.dvp.windows[F.dvpWin]||D.dvp.windows.szn;
  const st=F.dvpStat;
  const POS=["PG","SG","SF","PF","C"];
  const ks=Object.keys(W).sort((a,b)=>{
    if(F.dvpSort==="team")return a.localeCompare(b)*F.dvpDir;
    const ra=W[a][F.dvpSort][st].r,rb=W[b][F.dvpSort][st].r;
    return (ra-rb)*F.dvpDir;
  });

  const SZ=(D.shot_zones&&D.shot_zones.teams)||{};
  const szKeys=Object.keys(SZ).sort((a,b)=>{
    const ra=((SZ[a].active||{}).rim||{}).r||15;
    const rb=((SZ[b].active||{}).rim||{}).r||15;
    return ra-rb;
  });

  return `<div class="ctl-bar">
    <span style="font-weight:800">🛡️ 30-Team Defense vs. Position (DvP) Matrix</span>
    <div class="pills">
      ${[["szn","Full Season Prior+Current"],["l10","Last 10 Games (L10)"],["l5","Last 5 Games (L5)"]].map(x=>`<button type="button" data-dvp-win="${x[0]}" class="${F.dvpWin===x[0]?"on":""}">${x[1]}</button>`).join("")}
    </div>
    <div class="pills" style="margin-left:auto">
      ${[["pts","Points (PTS)"],["reb","Rebounds (REB)"],["ast","Assists (AST)"],["3pm","3-Pointers (3PM)"],["pra","Pts+Reb+Ast (PRA)"],["fd","Fantasy Pts"]].map(x=>`<button type="button" data-dvp-st="${x[0]}" class="${F.dvpStat===x[0]?"on":""}">${x[1]}</button>`).join("")}
    </div>
  </div>
  <div class="card">
    <div class="mut" style="font-size:12px;margin-bottom:8px">Rank <b class="up">#1 = Softest Defense (Allows Most ${E(st.toUpperCase())} — Prime Over Target)</b> to <b class="dn">#30 = Toughest Defense (Stingiest)</b>. Click any column header to sort.</div>
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th class="l-al" data-dvp-sort="team">Team Defense</th>
            ${POS.map(p=>`<th data-dvp-sort="${p}">vs ${p} ${F.dvpSort===p?(F.dvpDir>0?"▲":"▼"):""}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${ks.map(t=>{
            const tr=D.teams[t]||{};
            const row=W[t];
            return `<tr>
              <td class="l-al"><img src="${E(tr.logo||'')}" width="18" height="18" style="vertical-align:middle;margin-right:6px" alt=""><b>${E(t)}</b> <span class="mut">${E(tr.name||"")} · DRtg #${tr.drtg_rk||"—"}</span></td>
              ${POS.map(p=>{
                const cell=row[p][st];
                return `<td><span class="rk-box" style="background:${rkCol(cell.r)}">#${cell.r}</span> <span class="mut" style="font-size:11.5px">${cell.v}</span></td>`;
              }).join("")}
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <h3>🎯 30-Team Court Shot-Zone Defense Matrix (Play-by-Play Locations)</h3>
    <div class="mut" style="font-size:12px;margin-bottom:8px">Opponent FG% and Attempts Allowed per game across all 5 court zones (<b class="up">#1 = Highest FG% Allowed / Softest</b> to <b class="dn">#30 = Best Zone Suppression</b>).</div>
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th class="l-al">Defense</th>
            <th>Rim (&lt;4 ft)</th>
            <th>Paint (Non-RA)</th>
            <th>Mid-Range</th>
            <th>Corner 3</th>
            <th>Above-the-Break 3</th>
            <th>All 3PT Allowed</th>
          </tr>
        </thead>
        <tbody>
          ${szKeys.map(t=>{
            const tr=D.teams[t]||{};
            const s=(SZ[t]&&SZ[t].active)||{};
            const zc=z=>{
              const o=s[z];
              if(!o)return `<td class="mut">—</td>`;
              return `<td><span class="rk-box" style="background:${rkCol(o.r)}">#${o.r}</span> <b>${(o.fg*100).toFixed(1)}%</b> <span class="mut" style="font-size:11px">(${o.fga_g}/g)</span></td>`;
            };
            return `<tr>
              <td class="l-al"><img src="${E(tr.logo||'')}" width="18" height="18" style="vertical-align:middle;margin-right:6px" alt=""><b>${E(t)}</b></td>
              ${zc("rim")}${zc("paint")}${zc("mid")}${zc("c3")}${zc("ab3")}${zc("three")}
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderStreaks(){
  const H=D.hot_streaks||[];
  const V=D.volume_due||[];
  const SGP=D.sgp_cards||[];
  return `<div class="ctl-bar">
    <div class="pills">
      ${[["hot","🔥 Hot Finishers & L10 Hit Streaks ("+H.length+")"],["vol","📈 Volume-Due Positive Regression ("+V.length+")"],["sgp","🔗 Correlated Non-Cannibalizing SGP Builder ("+SGP.length+")"]].map(x=>`<button type="button" data-strk-sub="${x[0]}" class="${F.strkSub===x[0]?"on":""}">${x[1]}</button>`).join("")}
    </div>
  </div>
  ${F.strkSub==="hot"?`<div class="card">
    <h3>🔥 NBA Hot Streaks &amp; High-Floor Hitters (70%+ L10 with Stable/Expanding Minutes)</h3>
    <div class="grid">
      ${H.map(p=>`<div class="gm-card" style="background:var(--panel2)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><a class="plink" style="font-size:15px" data-player-aid="${E(p.aid)}" data-player-mkt="${E(p.market)}">${E(p.player)}</a> <span class="mut">(${E(p.team)} ${E(p.matchup)})</span></div>
          <span class="badge spot">🔥 ${p.streak?p.streak+" Straight · ":""}L10 ${p.l10_h}/${p.l10_n} (${p.l10_pct}%)</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span><b>Over ${p.line} ${E(p.market)}</b> (${am(p.ov_odds)} ${E(p.book)})</span>
          <span>Proj <b class="up">${p.proj}</b> · Med <b>${p.median}</b></span>
        </div>
        <div class="mut" style="font-size:11.5px">L10 Avg: <b>${p.l10_avg}</b> · L5 Avg: <b>${p.l5_avg}</b> · Minutes: <b>${p.min_l5||p.min_proj}m</b> · Opp DvP: <b>#${p.dvp_szn}</b></div>
      </div>`).join("")}
    </div>
  </div>`:""}
  ${F.strkSub==="vol"?`<div class="card">
    <h3>📈 Volume-Due Positive Regression Targets (High Minutes/Role + Projection Above Line After Cold L5)</h3>
    <div class="grid">
      ${V.map(p=>`<div class="gm-card" style="background:var(--panel2)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><a class="plink" style="font-size:15px" data-player-aid="${E(p.aid)}" data-player-mkt="${E(p.market)}">${E(p.player)}</a> <span class="mut">(${E(p.team)} ${E(p.matchup)})</span></div>
          <span class="badge snipe">📈 Volume Due (+${(p.proj-p.line).toFixed(1)} vs Line)</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span><b>Over ${p.line} ${E(p.market)}</b> (${am(p.ov_odds)} ${E(p.book)})</span>
          <span>Our Proj <b class="up">${p.proj}</b> (L10 Avg ${p.l10_avg} vs L5 ${p.l5_avg})</span>
        </div>
        <div class="mut" style="font-size:11.5px">Workload: <b>${p.min_l5||p.min_proj}m L5</b> (${p.min_delta>=0?"+":""}${p.min_delta}m vs Szn) · Opp DvP: <b>#${p.dvp_szn}</b></div>
      </div>`).join("")}
    </div>
  </div>`:""}
  ${F.strkSub==="sgp"?`<div class="card">
    <h3>🔗 Correlation-Verified NBA SGP Stacks (Hit-First Mode HP · Zero Same-Stat Cannibalization)</h3>
    <div class="mut" style="font-size:12px;margin-bottom:10px">Built with our upgraded NBA SGP rules: every leg requires ≥60% L10 empirical hit rate, Median ≥ Line, stable/expanding minutes, and strictly positive pairwise correlation (never stacking two Rebound overs or two Assist overs on the same team).</div>
    <div class="grid">
      ${SGP.map(s=>`<div class="gm-card" style="background:var(--panel2);border-color:#2c5282">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><b>${E(s.matchup)}</b> · <span style="color:var(--acc)">${E(s.corr_type)}</span></div>
          <span class="badge spot">ρ ${E(s.corr_r)} · Fair ${am(s.fair_odds)} (${s.combined_prob}%)</span>
        </div>
        <div class="mut" style="font-size:11px;color:#86efac">✓ ${E(s.cannibalization_check)}</div>
        ${s.script_thesis?`<div style="background:rgba(11,15,23,.65);border:1px solid rgba(63,169,255,.3);border-radius:7px;padding:6px 8px;font-size:11.5px;color:#cbd5e1"><b>📋 Game Script Alignment:</b> ${E(s.script_thesis)}</div>`:""}
        ${s.legs.map((l,i)=>`<div style="border-top:1px solid var(--line);padding-top:6px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px">
          <div><b>Leg ${i+1}: <a class="plink" data-player-aid="${E(l.aid)}" data-player-mkt="${E(l.market)}">${E(l.player)}</a></b> (${E(l.team)})<br><span class="mut" style="font-size:11px">L10: ${E(l.l10)} · ${l.min_l5||"—"} MIN ·Proj ${l.proj} (Med ${l.median})</span></div>
          <div style="text-align:right"><b>Over ${l.line} ${E(l.mk_short)}</b><br><span class="up" style="font-size:11.5px">${am(l.odds)} (${E(l.book)})</span></div>
        </div>`).join("")}
      </div>`).join("")}
    </div>
  </div>`:""}`;
}

function renderTeams(){
  const T=Object.values(D.teams||{});
  const flt=T.filter(t=>!F.tmConf||t.conf===F.tmConf).sort((a,b)=>{
    const k=F.tmSort;
    if(k==="drtg")return a.drtg-b.drtg;
    return (b[k]||0)-(a[k]||0);
  });
  return `<div class="ctl-bar">
    <span style="font-weight:800">📊 30-Team Efficiency, Four-Factors, Pace &amp; Rest Splits</span>
    <div class="pills">
      ${[["","All 30 Teams"],["East","Eastern Conference"],["West","Western Conference"]].map(x=>`<button type="button" data-tm-conf="${x[0]}" class="${F.tmConf===x[0]?"on":""}">${x[1]}</button>`).join("")}
    </div>
    <select id="f-tm-sort" style="margin-left:auto">
      <option value="net" ${F.tmSort==="net"?"selected":""}>Sort: Net Rating</option>
      <option value="ortg" ${F.tmSort==="ortg"?"selected":""}>Sort: Offensive Rating (OffRtg)</option>
      <option value="drtg" ${F.tmSort==="drtg"?"selected":""}>Sort: Defensive Rating (DefRtg)</option>
      <option value="pace" ${F.tmSort==="pace"?"selected":""}>Sort: Tempo / Pace</option>
      <option value="bpi" ${F.tmSort==="bpi"?"selected":""}>Sort: Power Index</option>
    </select>
  </div>
  <div class="card" style="padding:0">
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th class="l-al">#</th>
            <th class="l-al">Team</th>
            <th>26-27 / Proj W-L</th>
            <th>Net Rtg</th>
            <th>OffRtg</th>
            <th>DefRtg</th>
            <th>Pace</th>
            <th>PPG / Opp PPG</th>
            <th>3PM/g</th>
            <th>TOV%</th>
            <th>FTR</th>
            <th>Home / Away Net</th>
            <th>0d B2B / 2+d Rest Net</th>
            <th>Playoffs / Title</th>
          </tr>
        </thead>
        <tbody>
          ${flt.map((t,i)=>`<tr>
            <td class="l-al">${i+1}</td>
            <td class="l-al"><img src="${E(t.logo)}" width="20" height="20" style="vertical-align:middle;margin-right:6px" alt=""><b>${E(t.team)}</b> <span class="mut">${E(t.name)}</span></td>
            <td><b>${E(t.record_26)}</b> <span class="mut">(${E(t.proj_wl)})</span></td>
            <td class="${t.net>=0?'up':'dn'}"><b>${sg(t.net)}</b> <span class="mut">#${t.net_rk}</span></td>
            <td><b>${t.ortg}</b> <span class="mut">#${t.ortg_rk}</span></td>
            <td><b>${t.drtg}</b> <span class="mut">#${t.drtg_rk}</span></td>
            <td><b>${t.pace}</b> <span class="mut">#${t.pace_rk}</span></td>
            <td>${t.ppg} / ${t.oppg}</td>
            <td>${t.tpm_g}</td>
            <td>${t.tov_pct}%</td>
            <td>${t.ftr}%</td>
            <td><span class="${t.home_net>=0?'up':'dn'}">${sg(t.home_net)}</span> / <span class="${t.away_net>=0?'up':'dn'}">${sg(t.away_net)}</span></td>
            <td><span class="${t.b2b_net>=0?'up':'dn'}">${sg(t.b2b_net)}</span> / <span class="${t.rest_net>=0?'up':'dn'}">${sg(t.rest_net)}</span></td>
            <td><b>${E(t.playoffs)}</b> · <span class="mut">${E(t.title)}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openPlayerModal(aid,mkt){
  const ov=document.getElementById("nba-modal-ov");
  const md=document.getElementById("nba-modal");
  if(!ov||!md||!D)return;
  const pProps=(D.props||[]).filter(x=>String(x.aid)===String(aid));
  const curProp=pProps.find(x=>x.market===mkt)||pProps[0]||{aid:aid,player:"Player #"+aid,market:mkt||"Points",line:15.5,team:"",opp:""};
  let splitMode="all",refMode="avg",activeMkt=curProp.market||"Points";

  ov.classList.add("open");
  md.innerHTML=`<div class="mut">Loading game logs &amp; shot profile for ${E(curProp.player)}…</div>`;

  Promise.all([loadPlogs(),loadPlayerShot(aid)]).then(([plogs,shotData])=>{
    const logs=(plogs[String(aid)]||[]).slice();
    function drawModal(){
      const pr=(pProps.find(x=>x.market===activeMkt))||curProp;
      const fn=MKT_STAT_MAP[activeMkt]||MKT_STAT_MAP["Points"];
      const line=pr.line||15.5;
      const avgMin=logs.length?logs.reduce((s,g)=>s+((g.s&&g.s.minutes)||0),0)/logs.length:28;

      const filteredLogs=logs.filter(g=>{
        const m=(g.s&&g.s.minutes)||0;
        if(splitMode==="home")return g.at==="vs";
        if(splitMode==="away")return g.at==="@";
        if(splitMode==="highmin")return m>=avgMin;
        if(splitMode==="h2h")return g.o===pr.opp;
        if(splitMode==="2026")return (g.d||"").startsWith("2026-10");
        return true;
      }).slice(0,15).reverse();

      const vals=filteredLogs.map(g=>fn(g.s||{}));
      const hits=vals.filter(v=>v>line).length;
      const meanVal=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):0;
      const sortedVals=vals.slice().sort((a,b)=>a-b);
      const medVal=sortedVals.length?(sortedVals.length%2?sortedVals[(sortedVals.length-1)/2]:0.5*(sortedVals[sortedVals.length/2-1]+sortedVals[sortedVals.length/2])):0;
      const refVal=refMode==="med"?medVal:meanVal;
      const maxBar=Math.max(line*1.3, ...vals, 10);
      const linePct=Math.min(92,Math.max(8,Math.round(line/maxBar*100)));

      // Positional comps vs opponent
      const comps=(D.props||[]).filter(x=>x.opp===pr.opp&&x.market===activeMkt&&x.aid!==pr.aid).slice(0,5);

      // Shot zones summary
      const s25=shotData&&shotData.seasons&&(shotData.seasons["2025-26"]||shotData.seasons["2026-27"]);
      const zHtml=s25&&s25.zones?`<div style="margin-top:12px">
        <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:var(--mut);margin-bottom:6px">🏀 Player Court Shot-Zone Breakdown (${s25.fga} FGA)</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
          ${s25.zones.map(z=>{
            const pct=z.fga?Math.round(z.fgm/z.fga*100):0;
            const share=s25.fga?Math.round(z.fga/s25.fga*100):0;
            return `<div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px;text-align:center">
              <div class="mut" style="font-size:10px;text-transform:uppercase">${E(z.k)}</div>
              <div style="font-weight:900;font-size:14px">${pct}%</div>
              <div class="mut" style="font-size:10px">${z.fgm}/${z.fga} (${share}% vol)</div>
            </div>`;
          }).join("")}
        </div>
      </div>`:"";

      md.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div style="display:flex;gap:12px;align-items:center">
            <img src="https://a.espncdn.com/i/headshots/nba/players/full/${E(aid)}.png" width="58" height="58" style="border-radius:50%;background:var(--panel2);object-fit:cover" onerror="this.style.display='none'" alt="">
            <div>
              <div style="font-size:20px;font-weight:900">${E(pr.player)} <span class="badge ${pr.spot_cls||'spot'}">${E(pr.spot_tag||'Active')}</span></div>
              <div class="mut" style="font-size:12.5px">${E(pr.team)} ${E(pr.matchup||"")} · Pos: ${E(pr.pos_slot||pr.pos)} · Opp DvP: <b>#${pr.dvp_szn||15} Szn / #${pr.dvp_l5||15} L5</b></div>
            </div>
          </div>
          <button type="button" id="nba-modal-close" style="background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:18px">✕</button>
        </div>

        ${pProps.length>1?`<div class="ctl-bar" style="margin-top:12px;padding:8px">
          <span class="mut" style="font-size:11.5px;font-weight:800">Market:</span>
          <div class="pills">${pProps.map(x=>`<button type="button" data-md-mkt="${E(x.market)}" class="${x.market===activeMkt?"on":""}">${E(x.mk_short)} (${x.line})</button>`).join("")}</div>
        </div>`:""}

        ${pr.execution_thesis?`<div style="margin-top:10px;padding:10px 12px;background:rgba(11,15,23,.78);border:1px solid rgba(83,227,166,.35);border-radius:10px;font-size:12px;line-height:1.45;display:flex;flex-direction:column;gap:4px">
          <div style="font-weight:800;color:#53e3a6;text-transform:uppercase;font-size:11px;letter-spacing:.04em">🎯 5-Pillar Execution Thesis &amp; Game Script Fit</div>
          <div><b style="color:#53e3a6">Why The Edge Exists:</b> ${E(pr.execution_thesis.why_edge||"")}</div>
          <div><b style="color:#38bdf8">Key Catalyst:</b> ${E(pr.execution_thesis.catalyst||"")}</div>
          <div><b style="color:#a78bfa">Game Script Fit:</b> ${E(pr.execution_thesis.script_alignment||"")}</div>
          <div><b style="color:#f5c451">Risk &amp; Trap Audit:</b> ${E(pr.execution_thesis.trap_audit||"")}</div>
          <div><b style="color:#53e3a6">Target Execution:</b> ${E(pr.execution_thesis.target_execution||"")}</div>
        </div>`:""}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px">
          <div class="kpi"><div class="l">Line / Book A</div><div class="v">${line} <span style="font-size:13px;color:var(--acc)">${am(pr.ov_odds)}</span></div><div class="s">${E(activeMkt)}</div></div>
          <div class="kpi"><div class="l">Our Proj / Med</div><div class="v">${pr.proj||meanVal.toFixed(1)} <span style="font-size:13px;color:var(--mut)">/ ${pr.median||medVal.toFixed(1)}</span></div><div class="s">Conviction ${pr.conviction||70}/100</div></div>
          <div class="kpi"><div class="l">Split Hit Rate</div><div class="v ${hits/Math.max(1,vals.length)>=0.6?'up':''}">${vals.length?Math.round(hits/vals.length*100):0}%</div><div class="s">${hits}/${vals.length} games over ${line}</div></div>
          <div class="kpi"><div class="l">Split Mean / Med</div><div class="v">${meanVal.toFixed(1)} <span style="font-size:13px;color:var(--mut)">/ ${medVal.toFixed(1)}</span></div><div class="s">Δ ${(meanVal-line>=0?"+":"")+(meanVal-line).toFixed(1)} vs Line</div></div>
        </div>

        <div class="ctl-bar" style="margin-top:10px;padding:8px;justify-content:space-between">
          <div class="pills">
            ${[["all","All Logs"],["home","🏠 Home"],["away","✈️ Away"],["highmin","🔥 High MIN (≥Avg)"],["h2h","🆚 vs "+E(pr.opp)],["2026","📅 2026-27 Only"]].map(x=>`<button type="button" data-md-split="${x[0]}" class="${splitMode===x[0]?"on":""}">${x[1]}</button>`).join("")}
          </div>
          <div class="pills">
            <button type="button" data-md-ref="${refMode==='avg'?'med':'avg'}" class="on">Ref: ${refMode==='avg'?'Mean ('+meanVal.toFixed(1)+')':'Median ('+medVal.toFixed(1)+')'} ⇄</button>
          </div>
        </div>

        <div class="bar-chart">
          <div class="ref-line" style="bottom:${linePct}%"><span>Line ${line}</span></div>
          ${filteredLogs.length?filteredLogs.map(g=>{
            const v=fn(g.s||{});
            const m=(g.s&&g.s.minutes)||0;
            const hPct=Math.min(95,Math.max(6,Math.round(v/maxBar*100)));
            const hit=v>line;
            return `<div class="bar-col" title="${g.d}: ${v} ${activeMkt} (${m} MIN) ${g.at} ${g.o}">
              <div class="bar-val ${hit?'up':'dn'}">${v}</div>
              <div class="bar-min">${m}m</div>
              <div class="bar-fill" style="height:${hPct}%;background:${hit?'#53e3a6':'#ff5d6c'}"></div>
              <div class="bar-lbl">${E(g.o)}</div>
            </div>`;
          }).join(""):`<div class="mut" style="margin:auto">No games match this situational filter.</div>`}
        </div>

        ${pr.wo?`<div class="card" style="margin-top:12px;background:var(--panel2)">
          <div style="font-size:12px;font-weight:800;color:var(--acc)">🩹 Empirical Teammate On/Off Split: Without ${E(pr.wo.tm_out)}</div>
          <div style="font-size:13px;margin-top:4px">Averages <b>${pr.wo.avg}</b> without ${E(pr.wo.tm_out)} (${pr.wo.n} games) vs. <b>${pr.wo.w_avg}</b> with him (<b class="up">${pr.wo.delta>=0?"+":""}${pr.wo.delta} boost</b>).</div>
        </div>`:""}

        ${zHtml}

        ${comps.length?`<div style="margin-top:14px">
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:var(--mut);margin-bottom:6px">👥 Other Matchup Props vs. ${E(pr.opp)} (${E(activeMkt)})</div>
          <table>
            <thead><tr><th class="l-al">Player</th><th>Line</th><th>Proj</th><th>L10 Hit%</th><th>Spot Tag</th></tr></thead>
            <tbody>
              ${comps.map(c=>`<tr>
                <td class="l-al"><a class="plink" data-player-aid="${E(c.aid)}" data-player-mkt="${E(c.market)}">${E(c.player)}</a> (${E(c.team)})</td>
                <td>${c.line}</td>
                <td><b>${c.proj}</b></td>
                <td>${c.l10_pct}% (${c.l10_h}/${c.l10_n})</td>
                <td><span class="badge ${c.spot_cls}">${E(c.spot_tag)}</span></td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>`:""}
      `;

      const cl=md.querySelector("#nba-modal-close");
      if(cl)cl.onclick=()=>ov.classList.remove("open");
      md.querySelectorAll("[data-md-mkt]").forEach(b=>b.onclick=()=>{activeMkt=b.dataset.mdMkt;drawModal()});
      md.querySelectorAll("[data-md-split]").forEach(b=>b.onclick=()=>{splitMode=b.dataset.mdSplit;drawModal()});
      md.querySelectorAll("[data-md-ref]").forEach(b=>b.onclick=()=>{refMode=b.dataset.mdRef;drawModal()});
    }
    drawModal();
  });
}

function render(){
  if(!D)return;
  document.querySelectorAll("#hub-tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===TAB));
  const out=document.getElementById("hub-out");
  if(!out)return;
  if(TAB==="slate")out.innerHTML=renderSlate();
  else if(TAB==="props")out.innerHTML=renderProps();
  else if(TAB==="rotations")out.innerHTML=renderRotations();
  else if(TAB==="dvp")out.innerHTML=renderDvP();
  else if(TAB==="streaks")out.innerHTML=renderStreaks();
  else if(TAB==="teams")out.innerHTML=renderTeams();

  const fq=document.getElementById("f-q");
  if(fq)fq.oninput=e=>{F.q=e.target.value;render()};
  const fg=document.getElementById("f-game");
  if(fg)fg.onchange=e=>{F.game=e.target.value;render()};
  const ft=document.getElementById("f-team");
  if(ft)ft.onchange=e=>{F.team=e.target.value;render()};
  const fm=document.getElementById("f-mkt");
  if(fm)fm.onchange=e=>{F.mkt=e.target.value;render()};
  const fr=document.getElementById("f-rot-tm");
  if(fr)fr.onchange=e=>{F.rotTeam=e.target.value;render()};
  const fts=document.getElementById("f-tm-sort");
  if(fts)fts.onchange=e=>{F.tmSort=e.target.value;render()};
}

document.addEventListener("click",e=>{
  const tb=e.target.closest("#hub-tabs button[data-tab]");
  if(tb){TAB=tb.dataset.tab;render();return}
  const sp=e.target.closest("[data-spot]");
  if(sp){F.spot=sp.dataset.spot;render();return}
  const dw=e.target.closest("[data-dvp-win]");
  if(dw){F.dvpWin=dw.dataset.dvpWin;render();return}
  const ds=e.target.closest("[data-dvp-st]");
  if(ds){F.dvpStat=ds.dataset.dvpSt;render();return}
  const dso=e.target.closest("[data-dvp-sort]");
  if(dso){
    const k=dso.dataset.dvpSort;
    if(F.dvpSort===k)F.dvpDir*=-1;
    else{F.dvpSort=k;F.dvpDir=1}
    render();return;
  }
  const ss=e.target.closest("[data-strk-sub]");
  if(ss){F.strkSub=ss.dataset.strkSub;render();return}
  const tc=e.target.closest("[data-tm-conf]");
  if(tc){F.tmConf=tc.dataset.tmConf;render();return}
  const jg=e.target.closest("[data-jump-game]");
  if(jg){e.preventDefault();F.game=jg.dataset.jumpGame;TAB="props";render();return}
  const pl=e.target.closest("[data-player-aid]");
  if(pl){e.preventDefault();location.href="index.html#player=nba:"+encodeURIComponent(pl.dataset.playerAid)+(pl.dataset.playerMkt?"&ctx="+encodeURIComponent(pl.dataset.playerMkt):"");return}
  const ov=document.getElementById("nba-modal-ov");
  if(e.target===ov)ov.classList.remove("open");
});

document.addEventListener("pointerover",e=>{const pl=e.target.closest&&e.target.closest("[data-player-aid]");if(pl&&!window.__pf){window.__pf=1;const l=document.createElement("link");l.rel="prefetch";l.href="index.html";document.head.appendChild(l)}});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    const ov=document.getElementById("nba-modal-ov");
    if(ov)ov.classList.remove("open");
  }
});

loadHub().then(()=>{
  if(location.hash==="#dvp")TAB="dvp";
  else if(location.hash==="#rotations")TAB="rotations";
  else if(location.hash==="#props")TAB="props";
  else if(location.hash==="#streaks")TAB="streaks";
  else if(location.hash==="#teams")TAB="teams";
  renderKPIs();
  render();
});
})();
