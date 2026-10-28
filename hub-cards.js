/* Injects rich NBA Hub and CBB Hub interactive preview cards into Bet Lab's main NBA and CBB Dashboard views (#dash).
   Provides direct access to:
   - NBA: Today's Slate & Blowout Risk, 30-Team Positional DvP, Spot vs. Fake-Out Classifier, Correlated SGPs
   - CBB: Calculated Upset Radar, Rolling 10-Game Season Segments (G1-10 -> G21-30), Prop Hurdles & Freshmen vs. Upperclassmen
*/
(function(){"use strict";
if(window.__hubCards)return;window.__hubCards=1;
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const am=a=>a==null?"—":(a>0?"+"+a:""+a);
const S=v=>v==null?"—":(v>0?"+"+v.toFixed(1):v.toFixed(1));
let NBH=null,CBH=null,NBH_L=0,CBH_L=0;

function loadNbh(){
  if(NBH||NBH_L)return;NBH_L=1;
  fetch("data/nba_hub.json?v="+Math.floor(Date.now()/18e4)).then(r=>r.ok?r.json():null).then(d=>{NBH=d;mount()}).catch(()=>{});
}
function loadCbh(){
  if(CBH||CBH_L)return;CBH_L=1;
  fetch("data/cbb_hub.json?v="+Math.floor(Date.now()/18e4)).then(r=>r.ok?r.json():null).then(d=>{CBH=d;mount()}).catch(()=>{});
}

function nbaWidgetHtml(d){
  const spots=(d.props||[]).filter(p=>p.spot_cls==="spot").slice(0,4);
  const fakes=(d.props||[]).filter(p=>p.spot_cls==="fakeout").slice(0,3);
  const sgps=(d.sgp_cards||[]).slice(0,2);
  return `<div class="card" id="bl-nba-hub-card" style="grid-column:1/-1;border-color:#2a5a48;background:linear-gradient(135deg,rgba(16,44,36,.55),var(--panel,#121826) 75%)">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px">
      <div>
        <h3 style="margin:0">🏀 NBA Hub Command Center · Spot vs. Fake-Out Classifier, 30-Team DvP &amp; Correlated SGPs</h3>
        <div class="sub" style="margin-top:2px">Live slate pace &amp; blowout meters, Starting 5 rotations, empirical injury cascades, and 5-zone court shot defense</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <a href="./nba-hub.html" style="background:#53e3a6;color:#05180e;font-weight:800;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:12px">Open Full NBA Hub →</a>
        <a href="./nba-hub.html#dvp" style="background:#182135;border:1px solid #2b3b5c;color:#e6ebf5;font-weight:700;padding:6px 10px;border-radius:8px;text-decoration:none;font-size:12px">🛡️ 30-Team DvP &amp; Shot Zones</a>
        <a href="./nba-hub.html#rotations" style="background:#182135;border:1px solid #2b3b5c;color:#e6ebf5;font-weight:700;padding:6px 10px;border-radius:8px;text-decoration:none;font-size:12px">📋 Rotations &amp; Cascades</a>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px">
      <div style="background:rgba(15,23,42,.65);border:1px solid var(--line,#243049);border-radius:10px;padding:10px">
        <div style="font-size:11.5px;font-weight:800;color:#53e3a6;text-transform:uppercase;margin-bottom:6px">🎯 Top Confirmed Execution Spots (L10 ≥ 60% · Med ≥ Line)</div>
        ${spots.map(p=>`<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)">
          <span><b>${E(p.player)}</b> <span class="mut">(${E(p.team)} ${E(p.matchup)})</span></span>
          <span><b>o${p.line} ${E(p.mk_short)}</b> <span class="up">(Proj ${p.proj} · L10 ${p.l10_pct}%)</span></span>
        </div>`).join("")}
      </div>
      <div style="background:rgba(15,23,42,.65);border:1px solid var(--line,#243049);border-radius:10px;padding:10px">
        <div style="font-size:11.5px;font-weight:800;color:#ff5d6c;text-transform:uppercase;margin-bottom:6px">🚨 Flagged Fake-Out Traps (Mirage / Skew / Blowout Risk)</div>
        ${fakes.map(p=>`<div style="font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)">
          <div style="display:flex;justify-content:space-between"><b>${E(p.player)} (${E(p.team)}) o${p.line} ${E(p.mk_short)}</b><span class="dn">Pass / Caution</span></div>
          <div class="mut" style="font-size:11px">${E((p.fakeout_flags||[])[0]||"Role/skew warning")}</div>
        </div>`).join("")}
      </div>
      <div style="background:rgba(15,23,42,.65);border:1px solid var(--line,#243049);border-radius:10px;padding:10px">
        <div style="font-size:11.5px;font-weight:800;color:#3fa9ff;text-transform:uppercase;margin-bottom:6px">🔗 Correlation-Verified NBA SGP Stacks</div>
        ${sgps.map(s=>`<div style="font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)">
          <div style="display:flex;justify-content:space-between"><b>${E(s.matchup)} · ${E(s.corr_type)}</b><span class="up">Fair ${am(s.fair_odds)}</span></div>
          <div class="mut" style="font-size:11px">${s.legs.map(l=>`${E(l.player)} o${l.line} ${E(l.mk_short)} (${E(l.l10)})`).join(" + ")}</div>
        </div>`).join("")}
      </div>
    </div>
  </div>`;
}

function cbbWidgetHtml(d){
  const upsets=(d.upset_radar||[]).slice(0,3);
  const hurdles=(d.prop_hurdles||[]).slice(0,4);
  const segTeams=(d.teams||[]).filter(t=>t.ap&&t.ap<=10).slice(0,4);
  return `<div class="card" id="bl-cbb-hub-card" style="grid-column:1/-1;border-color:#2a4f86;background:linear-gradient(135deg,rgba(19,40,74,.55),var(--panel,#121826) 75%)">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px">
      <div>
        <h3 style="margin:0">🏀 CBB Hub Command Center · Upset Radar, 10-Game Rolling Segments &amp; Usage Hurdles</h3>
        <div class="sub" style="margin-top:2px">365 D-I teams · Segment 1 (G1–10) to Segment 3 (G21–30) trajectory · Top Freshmen vs. Returning Upperclassmen · ${E(d.ratings_credit||"Ratings: barttorvik.com")}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <a href="./cbb-hub.html" style="background:#53e3a6;color:#05180e;font-weight:800;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:12px">Open Full CBB Hub →</a>
        <a href="https://cbblab.sportslabshq.com/" target="_blank" rel="noopener" style="background:#182135;border:1px solid #2b3b5c;color:#e6ebf5;font-weight:700;padding:6px 10px;border-radius:8px;text-decoration:none;font-size:12px">🏟️ CBB Lab Site ↗</a>
        <a href="./cbb-hub.html#class" style="background:#182135;border:1px solid #2b3b5c;color:#e6ebf5;font-weight:700;padding:6px 10px;border-radius:8px;text-decoration:none;font-size:12px">🎓 Freshmen vs. Vets</a>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px">
      <div style="background:rgba(15,23,42,.65);border:1px solid var(--line,#243049);border-radius:10px;padding:10px">
        <div style="font-size:11.5px;font-weight:800;color:#ff5d6c;text-transform:uppercase;margin-bottom:6px">🚨 Calculated Upset Alert Bin (Top Spotlights)</div>
        ${upsets.map(u=>`<div style="font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)">
          <div style="display:flex;justify-content:space-between"><b>${u.dog_rk?"#"+u.dog_rk+" ":""}${E(u.dog)} (${E(u.sl_spread_dog)}) vs ${u.fav_rk?"#"+u.fav_rk+" ":""}${E(u.fav)}</b><span class="up">${Math.round(u.dog_win_prob*100)}% Win</span></div>
          <div class="mut" style="font-size:11px">${E((u.triggers||[])[0]||"")}</div>
        </div>`).join("")}
      </div>
      <div style="background:rgba(15,23,42,.65);border:1px solid var(--line,#243049);border-radius:10px;padding:10px">
        <div style="font-size:11.5px;font-weight:800;color:#53e3a6;text-transform:uppercase;margin-bottom:6px">🔥 High-Usage Prop Hurdles That Keep Rolling</div>
        ${hurdles.map(h=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)">
          <span><b>${E(h.n)}</b> <span class="mut">(${E(h.ab)} · ${E(h.yr_short)} · ${h.usg}% USG)</span></span>
          <span><b>${E(h.hurdle)}</b> <span class="up">(${Math.round(h.p_hit*100)}%)</span></span>
        </div>`).join("")}
      </div>
      <div style="background:rgba(15,23,42,.65);border:1px solid var(--line,#243049);border-radius:10px;padding:10px">
        <div style="font-size:11.5px;font-weight:800;color:#3fa9ff;text-transform:uppercase;margin-bottom:6px">📆 Rolling 10-Game Segments (G1–10 → G21–30)</div>
        ${segTeams.map(t=>{
          const sg=((t.exp_meta||{}).segments)||{};
          return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)">
            <span><b>#${t.ap} ${E(t.team)}</b> <span class="mut">(${E((t.exp_meta||{}).seg_profile||"")})</span></span>
            <span>${S((sg.g1_10||{}).em)} → <b class="up">${S((sg.g21_30||{}).em)}</b></span>
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>`;
}

function mount(){
  const dEl=document.getElementById("dash");
  if(!dEl||typeof sport==="undefined")return;
  if(sport==="nba"){
    if(!NBH){loadNbh();return}
    if(!document.getElementById("bl-nba-hub-card")){
      const hl=dEl.querySelector(".sl-hublink");
      if(hl)hl.insertAdjacentHTML("afterend",nbaWidgetHtml(NBH));
      else dEl.insertAdjacentHTML("afterbegin",nbaWidgetHtml(NBH));
    }
  }else if(sport==="ncaamb"){
    if(!CBH){loadCbh();return}
    if(!document.getElementById("bl-cbb-hub-card")){
      const hl=dEl.querySelector(".sl-hublink");
      if(hl)hl.insertAdjacentHTML("afterend",cbbWidgetHtml(CBH));
      else dEl.insertAdjacentHTML("afterbegin",cbbWidgetHtml(CBH));
    }
  }
}

function init(){
  const dEl=document.getElementById("dash");
  if(!dEl)return setTimeout(init,200);
  new MutationObserver(()=>mount()).observe(dEl,{childList:true});
  mount();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();
