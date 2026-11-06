/* NBA Hub profiles. Only existing hub, player-log and shot feeds; no app routing. */
(function () {
  "use strict";
  const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num = v => v != null && Number.isFinite(Number(v));
  const val = v => num(v) ? Number(v).toFixed(1) : "—";
  const publicNote = note => String(note || "")
    .replace(/,\s*[^,.]*(?:\s+of\s+[^,]+)?\s+reports?\.?$/i, ".")
    .replace(/,\s*Anthony Slater and Shams Charania reported[^.]*\.?$/i, ".")
    .replace(/,\s*NBA (?:reporter|writer)\.?$/i, ".");
  const dateET = t => t ? new Date(t).toLocaleString("en-US", {timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) + " ET" : "";
  const stats = [["MIN","minutes"],["PTS","points"],["REB","totalRebounds"],["AST","assists"],["STL","steals"],["BLK","blocks"]];
  let D, ov, md, people = new Map(), byName = new Map(), matcher, targets, logsPromise;
  let request = 0, stack = [], lastFocus, bodyOverflow, inertState = [];
  const shots = new Map();
  const playerLink = p => `<button type="button" class="profile-link" data-player-aid="${E(p.id)}">${E(p.name)}</button>`;
  const teamLink = (t, label) => D.teams[t] ? `<button type="button" class="profile-link" data-team="${E(t)}">${E(label || t)}</button>` : E(label || t);
  const section = (id, title, html) => html ? `<section class="profile-section" id="profile-${id}"><h3>${E(title)}</h3>${html}</section>` : "";
  const table = (head, rows) => rows.length ? `<div class="tw"><table><thead><tr>${head.map(h=>`<th>${E(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>` : "";
  const cell = s => `<td>${s}</td>`;
  const kpis = entries => `<div class="profile-kpis">${entries.filter(x=>x[1]!=null && x[1]!=="").map(x=>`<div class="kpi"><div class="l">${E(x[0])}</div><div class="v">${E(x[1])}</div></div>`).join("")}</div>`;
  const seasonStart = () => `${String(D.season || "").slice(0,4)}-10-01`;
  function seasonLogs(logs, team) {
    return logs.filter(g => g.d >= seasonStart() && (!team || g.t === team));
  }
  function average(logs, key) {
    const values = logs.map(g=>g.s && g.s[key]).filter(num).map(Number);
    return values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
  }
  function add(p) {
    if (!p.name) return;
    const existing = byName.get(p.name);
    const id = String(p.id || (existing && existing.id) || "name:" + p.name);
    const item = Object.assign({}, people.get(id), p, {id});
    people.set(id, item); byName.set(item.name, item);
  }
  async function init(data) {
    D=data; ov=document.getElementById("nba-modal-ov"); md=document.getElementById("nba-modal");
    people=new Map(); byName=new Map();
    // The existing public identity feed fills out the roster beyond tonight's
    // ten-player rotations and gives inactive / off-board names stable IDs.
    try {
      const response=await fetch("data/player_index.json?v="+Math.floor(Date.now()/6e5));
      if(response.ok){
        const index=await response.json();
        (index.p||[]).filter(p=>p[0]==="nba"&&D.teams[p[3]]).forEach(p=>add({id:p[1],name:p[2],team:p[3],pos:p[4],...(p[6]?{status:p[6]}:{})}));
      }
    } catch (_) { /* The hub's own identities remain usable offline. */ }
    (D.units||[]).forEach(u=>[...(u.first?.players||[]),...(u.second?.players||[])].forEach(p=>add({...p, role:(u.first?.players||[]).includes(p)?"Projected starter":"Second unit"})));
    (D.props||[]).forEach(p=>add({id:p.aid,name:p.player,team:p.team,pos:p.pos_slot||p.pos}));
    (D.injuries||[]).forEach(add);
    (D.units||[]).forEach(u=>(u.out||[]).forEach(p=>add({...p,team:u.team})));
    (D.cascade||[]).forEach(c=>{
      (c.gets||[]).forEach(p=>add({name:p.player,team:c.team,pos:p.pos,cascade:p}));
      (c.out||[]).forEach(name=>{if(!byName.has(name))add({name,team:c.team,status:"Out"});});
    });
    Object.values(D.emp_cascades||{}).flat().forEach(p=>{if(!byName.has(p.player))add({id:p.aid,name:p.player});});
    targets=new Map();
    byName.forEach(p=>targets.set(p.name,{player:p.id}));
    Object.entries(D.teams||{}).forEach(([t,p])=>{targets.set(t,{team:t}); if(p.name){
      targets.set(p.name,{team:t});
      const nickname=p.name.replace(/^(?:Atlanta|Boston|Brooklyn|Charlotte|Chicago|Cleveland|Dallas|Denver|Detroit|Golden State|Houston|Indiana|Los Angeles|LA|Memphis|Miami|Milwaukee|Minnesota|New Orleans|New York|Oklahoma City|Orlando|Philadelphia|Phoenix|Portland|Sacramento|San Antonio|Toronto|Utah|Washington) /, "");
      if(nickname!==p.name)targets.set(nickname,{team:t});
    }});
    const escapeRE = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    matcher = new RegExp("(?<![\\w])("+[...targets.keys()].sort((a,b)=>b.length-a.length).map(escapeRE).join("|")+")(?![\\w])","g");
    ov.addEventListener("click",e=>{if(e.target===ov)close();});
    document.addEventListener("keydown",e=>{
      if(!ov.classList.contains("open"))return;
      if(e.key==="Escape"){e.preventDefault();close();}
      if(e.key==="Tab"){
        const items=[...md.querySelectorAll('button:not([disabled]),a[href],select,input,[tabindex="0"]')];
        const first=items[0],last=items[items.length-1];
        if(!first){e.preventDefault();md.focus();}
        else if(e.shiftKey&&(document.activeElement===first||document.activeElement===md)){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    // Native keyboard activation for legacy player anchors without hrefs.
    document.addEventListener("keydown",e=>{
      if((e.key==="Enter"||e.key===" ")&&e.target.matches("a[data-player-aid]:not([href])")){e.preventDefault();e.target.click();}
    });
  }
  // Also link identities embedded in game scripts, injury notes, matchup chips,
  // bar labels and other prose, rather than leaving a second set of dead names.
  function wire(root) {
    if(!root || !matcher)return;
    root.querySelectorAll("[data-player-aid]").forEach(a=>{if(a.tagName==="A"&&!a.hasAttribute("href")){a.tabIndex=0;a.setAttribute("role","button");}});
    root.querySelectorAll("img").forEach(img=>{
      if(img.closest("button,a,[data-team]"))return;
      const found=Object.entries(D.teams||{}).find(([,t])=>t.logo && img.getAttribute("src")===t.logo);
      if(found){const b=document.createElement("button");b.type="button";b.className="team-link";b.dataset.team=found[0];b.setAttribute("aria-label","Open "+found[1].name+" profile");img.replaceWith(b);b.append(img);}
    });
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode:n=>n.parentElement.closest("button,a,select,option,script,style,textarea,th,.kpi .l,[data-player-aid],[data-team],h2")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT
    });
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      matcher.lastIndex=0; const text=n.textContent; let match, pos=0; const frag=document.createDocumentFragment();
      while((match=matcher.exec(text))){
        frag.append(document.createTextNode(text.slice(pos,match.index)));
        const target=targets.get(match[0]),b=document.createElement("button");b.type="button";b.className="profile-link";b.textContent=match[0];
        if(target.player)b.dataset.playerAid=target.player;else b.dataset.team=target.team;
        frag.append(b);pos=matcher.lastIndex;
      }
      if(pos){frag.append(document.createTextNode(text.slice(pos)));n.replaceWith(frag);}
    });
  }
  function loadLogs() {
    if(!logsPromise){
      const read=path=>{
        if(!["data/logs_nba.json","data/plogs_nba.json"].includes(path))throw Error("Unexpected stats path");
        return fetch(path+"?v="+Math.floor(Date.now()/6e5)).then(r=>{if(!r.ok)throw Error("logs");return r.json();});
      };
      // Full logs retain the latest games and complete current-season sample;
      // the shorter prop-log feed remains a real-data fallback, never a seed.
      logsPromise=read("data/logs_nba.json").catch(()=>read("data/plogs_nba.json")).catch(()=>{logsPromise=null;return null;});
    }
    return logsPromise;
  }
  function loadShots(id) {
    if(!/^\d+$/.test(id))return Promise.resolve(null);
    if(!shots.has(id))shots.set(id,fetch("data/shots_nba/"+encodeURIComponent(id)+".json?v="+Math.floor(Date.now()/6e5)).then(r=>r.ok?r.json():null).catch(()=>null));
    return shots.get(id);
  }
  function shell(title, content) {
    md.innerHTML=`<div class="profile-actions"><button type="button" data-profile-back ${stack.length>1?"":"hidden"}>← Back</button><button type="button" data-profile-close aria-label="Close profile">✕ Close</button></div>${content}`;
    ov.setAttribute("aria-label",title);ov.removeAttribute("aria-labelledby");
    md.querySelector("[data-profile-close]").onclick=close;
    md.querySelector("[data-profile-back]").onclick=()=>{stack.pop();show(stack[stack.length-1]);};
    wire(md);
  }
  function open(item) {
    if(!ov.classList.contains("open")){
      lastFocus=document.activeElement;bodyOverflow=document.body.style.overflow;
      document.body.style.overflow="hidden";
      inertState=[...document.body.children].filter(el=>el!==ov).map(el=>[el,el.inert]);inertState.forEach(([el])=>el.inert=true);
      stack=[];ov.classList.add("open");
    }
    stack.push(item);show(item);
  }
  function close() {
    request++;ov.classList.remove("open");document.body.style.overflow=bodyOverflow;
    inertState.forEach(([el,state])=>el.inert=state);stack=[];
    if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
  }
  async function show(item) {
    const renderVersion=++request;
    shell("NBA profile",'<h2 id="nba-profile-title">Loading profile…</h2><p class="mut" role="status">Loading available stats…</p>');
    md.scrollTop=0;md.querySelector("[data-profile-close]").focus({preventScroll:true});
    const [logs,shot]=await Promise.all([loadLogs(),item.type==="player"?loadShots(item.id):Promise.resolve(null)]);
    if(renderVersion!==request)return;
    if(item.type==="team")renderTeam(item.id,logs);else renderPlayer(item.id,item.market,logs,shot);
    md.querySelector("[data-profile-close]").focus({preventScroll:true});
  }
  function matchup(team) {
    const g=(D.slate||[]).find(g=>g.home===team||g.away===team);
    if(!g)return "";
    const home=g.home===team,opp=home?g.away:g.home;
    return section("matchup","Upcoming matchup",`<div class="profile-note">${teamLink(team)} ${home?"vs":"@"} ${teamLink(opp,D.teams[opp]?.name||opp)} · ${E(dateET(g.time))}${num(g.proj_pace)?`<br>Projected pace: ${E(g.proj_pace)}`:""}${num(home?g.itt_home:g.itt_away)?` · Implied team total: ${E(home?g.itt_home:g.itt_away)}`:""}</div>`);
  }
  function injuryCards(list) {
    return list.map(p=>`<div class="profile-note">${byName.has(p.name)?playerLink(byName.get(p.name)):E(p.name)} · <b>${E(p.status)}</b>${p.note?`<br>${E(publicNote(p.note))}`:""}${p.date?`<div class="mut">Updated ${E(dateET(p.date))}</div>`:""}</div>`).join("");
  }
  function propRows(props) {
    return table(["Market","Line","Projection","Median","L10","Price"],props.map(p=>`<tr>${cell(E(p.market))}${cell(E(p.line))}${cell(val(p.proj))}${cell(val(p.median))}${cell(num(p.l10_pct)?E(p.l10_pct)+"%":"—")}${cell(p.ov_odds!=null?E((p.ov_odds>0?"+":"")+p.ov_odds)+" · "+E(/^Book [A-Z]$/.test(p.book)?p.book:""):"—")}</tr>`));
  }
  function renderPlayer(id,market,allLogs,shot) {
    const p=people.get(String(id));
    if(!p){shell("Player unavailable",'<h2 id="nba-profile-title">Profile unavailable</h2><p class="mut">This player is not in the current hub feed.</p>');return;}
    const logs=(allLogs?.[id]||[]).slice().sort((a,b)=>b.d.localeCompare(a.d));
    const season=seasonLogs(logs,p.team),recent=logs.slice(0,15);
    const injuries=(D.injuries||[]).filter(x=>String(x.id)===id||x.name===p.name);
    const props=(D.props||[]).filter(x=>String(x.aid)===id);
    const g=(D.slate||[]).find(g=>g.home===p.team||g.away===p.team);
    const opp=g?(g.home===p.team?g.away:g.home):null;
    const h2h=opp?logs.filter(g=>g.o===opp):[];
    const statSummary=rows=>kpis([["Games",rows.length],...stats.map(([label,key])=>[label,val(average(rows,key))])]);
    const logTable=table(["Date","Matchup",...stats.map(x=>x[0])],recent.map(g=>`<tr>${cell(E(g.d))}${cell(E(g.at)+" "+teamLink(g.o))}${stats.map(([,key])=>cell(num(g.s?.[key])?E(g.s[key]):"—")).join("")}</tr>`));
    const chartProp=props.find(x=>x.market===market)||props.find(x=>x.market==="Points");
    const chartKey={Points:"points",Rebounds:"totalRebounds",Assists:"assists",Steals:"steals",Blocks:"blocks"}[chartProp?.market];
    const chartLogs=season.slice(0,10).filter(g=>num(g.s?.[chartKey]));
    let chart="";
    if(chartKey&&chartLogs.length>=2&&num(chartProp.line)){
      const max=Math.max(...chartLogs.map(g=>Number(g.s[chartKey])),Number(chartProp.line),1);
      chart=section("trend","Recent "+chartProp.market+" · line "+chartProp.line,`<div class="bar-chart">${chartLogs.slice().reverse().map(g=>`<div class="bar-col" title="${E(g.d)}: ${E(g.s[chartKey])}"><div class="bar-val">${E(g.s[chartKey])}</div><div class="bar-fill" style="height:${Math.max(2,Number(g.s[chartKey])/max*85)}%;background:var(--acc)"></div><div class="bar-lbl">${teamLink(g.o)}</div></div>`).join("")}</div>`);
    }
    const shotSeason=shot?.seasons?.[D.season]?D.season:Object.keys(shot?.seasons||{}).sort().reverse()[0];
    const zones=shot?.seasons?.[shotSeason]?.zones||[];
    const shotTable=table(["Zone","FGM / FGA","FG%"],zones.filter(z=>z.fga>0&&num(z.fgm)).map(z=>`<tr>${cell(E(z.k))}${cell(E(z.fgm)+" / "+E(z.fga))}${cell((100*z.fgm/z.fga).toFixed(1)+"%")}</tr>`));
    shell(p.name+" · Player profile",`<header class="profile-header">${/^\d+$/.test(id)?`<img src="https://a.espncdn.com/i/headshots/nba/players/full/${E(id)}.png" alt="" onerror="this.hidden=true">`:""}<div><h2 id="nba-profile-title">${E(p.name)}</h2><div class="mut">${teamLink(p.team,D.teams[p.team]?.name||p.team)} · ${E(p.pos||"")}${p.role?" · "+E(p.role):""}${p.status?" · "+E(p.status):""}</div></div></header>
      ${!allLogs?'<p class="mut" role="status">Game stats are temporarily unavailable. Close and reopen to retry.</p>':""}
      ${section("season",D.season+" · Current-team season averages",season.length?statSummary(season):"")}
      ${section("injuries","Status & updates",injuryCards(injuries))}
      ${matchup(p.team)}
      ${p.cascade?section("opportunity","Injury-adjusted opportunity",table(["","MIN","PTS","REB","AST"],[ ["Baseline",p.cascade.base],["Projection",p.cascade.est] ].filter(([,v])=>v).map(([label,v])=>`<tr>${cell(label)}${["min","pts","reb","ast"].map(k=>cell(val(v[k]))).join("")}</tr>`))):""}
      ${section("h2h","Recorded games vs "+opp,h2h.length?statSummary(h2h)+`<p class="mut">${h2h.length} available games across recorded seasons · ${E(h2h[h2h.length-1].d)} – ${E(h2h[0].d)}</p>`:"")}
      ${section("props","Available props",propRows(props))}${chart}
      ${section("logs","Recent games · recorded seasons",logTable)}
      ${section("shots","Shot zones · "+shotSeason,shotTable)}
      ${!season.length&&!recent.length&&!props.length&&!injuries.length?'<p class="mut">No recorded game stats or props are available for this player yet.</p>':""}`);
  }
  function renderTeam(team,allLogs) {
    const t=D.teams[team];if(!t)return;
    const roster=[...people.values()].filter(p=>p.team===team).sort((a,b)=>(a.role==="Projected starter"?-1:1)-(b.role==="Projected starter"?-1:1)||a.name.localeCompare(b.name));
    const injuries=(D.injuries||[]).filter(p=>p.team===team);
    const season=section("season",D.season+" · Season",kpis([["Record",t.record_26],["Offensive rating",t.ortg],["Defensive rating",t.drtg],["Net rating",t.net],["Pace",t.pace],["Points / game",t.ppg],["Allowed / game",t.oppg],["Projected W-L",t.proj_wl]]));
    const rosterHTML=table(["Player","Role / status","GP",...stats.map(x=>x[0])],roster.map(p=>{
      const logs=seasonLogs(allLogs?.[p.id]||[],team);
      return `<tr>${cell(playerLink(p)+` <span class="mut">${E(p.pos||"")}</span>`)}${cell(E([p.role,p.status].filter(Boolean).join(" · ")))}${cell(logs.length||"—")}${stats.map(([,key])=>cell(logs.length?val(average(logs,key)):"—")).join("")}</tr>`;
    }));
    const results=table(["Date","Opponent","Result","Pace"],(t.l5_form||[]).map(g=>`<tr>${cell(E(g.d.replace(/^(\d{4})(\d{2})(\d{2})$/,"$1-$2-$3")))}${cell(E(g.opp))}${cell(E(g.res))}${cell(val(g.pace))}</tr>`));
    const unit=(D.units||[]).find(u=>u.team===team);
    const depth=unit?section("rotation","Projected rotation",[ ["Starting five",unit.first?.players],["Second unit",unit.second?.players] ].filter(([,ps])=>ps?.length).map(([label,ps])=>`<div class="profile-note"><b>${label}</b><br>${ps.map(p=>playerLink(people.get(String(p.id)))+" "+E(p.slot||p.pos||"")).join(" · ")}</div>`).join("")):"";
    shell(t.name+" · Team profile",`<header class="profile-header">${t.logo?`<img src="${E(t.logo)}" alt="">`:""}<div><h2 id="nba-profile-title">${E(t.name)}</h2><div class="mut">${E(team)} · ${E(t.conf)} · ${E(t.div)}</div></div></header>
      <nav class="profile-tabs" aria-label="Team profile sections"><a href="#profile-season">Season</a>${roster.length?'<a href="#profile-roster">Roster</a>':""}${depth?'<a href="#profile-rotation">Rotation</a>':""}${injuries.length?'<a href="#profile-injuries">Updates</a>':""}${results?'<a href="#profile-results">Results</a>':""}</nav>
      ${season}${matchup(team)}${depth}
      ${section("roster",D.season+" · Hub roster & current-team season averages",rosterHTML)}
      ${!allLogs?'<p class="mut" role="status">Roster game stats are temporarily unavailable. Close and reopen to retry.</p>':""}
      ${section("injuries","Injuries & updates",injuryCards(injuries))}${section("results","Recent results",results)}`);
    // Section navigation scrolls only the sheet, never the hub or its URL.
    md.querySelectorAll('.profile-tabs a').forEach(a=>a.onclick=e=>{e.preventDefault();const target=md.querySelector(a.getAttribute("href"));if(target)md.scrollTo({top:md.scrollTop+target.getBoundingClientRect().top-md.getBoundingClientRect().top-56,behavior:"smooth"});});
  }
  window.NBAHubProfiles={init,wire,openPlayer:(id,market)=>open({type:"player",id:String(id),market}),openTeam:id=>{if(D.teams[id])open({type:"team",id});},close};
})();
