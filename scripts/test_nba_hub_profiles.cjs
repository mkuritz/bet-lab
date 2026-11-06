// npm install --prefix /workspace/nba-profile-qa jsdom
// NODE_PATH=/workspace/nba-profile-qa/node_modules node scripts/test_nba_hub_profiles.cjs
const {JSDOM}=require('jsdom');
const fs=require('fs'), assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..')+'/';
const html=fs.readFileSync(root+'nba-hub.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const dom=new JSDOM(html,{url:'http://localhost:8765/nba-hub.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window; const errors=[];w.addEventListener('error',e=>errors.push(e.message));
let fetches=[];w.fetch=async(url)=>{fetches.push(url);const path=require('path');const p=path.resolve(root,url.split('?')[0]);assert(p.startsWith(path.join(root,'data')+path.sep),'fetch stays in public data directory');return {ok:fs.existsSync(p),json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))};};
w.HTMLElement.prototype.scrollTo=function(){};
w.eval(fs.readFileSync(root+'nba-hub-profiles.js','utf8'));
w.eval(fs.readFileSync(root+'nba-hub.js','utf8'));
const tick=()=>new Promise(r=>setTimeout(r,0));
const $=s=>w.document.querySelector(s);const $$=s=>[...w.document.querySelectorAll(s)];
const click=async el=>{assert(el,'click target exists');el.click();await tick();};
const close=async()=>click($('[data-profile-close]'));
(async()=>{
 await tick();
 const url=w.location.href;
 await click($('.gm-card .team-link[data-team="WSH"] img'));
 assert.equal($('#nba-profile-title').textContent,'Washington Wizards');
 assert($('#profile-roster'));assert($('#profile-season'));assert($('#profile-results'));
 assert.equal(w.location.href,url);assert.equal(w.document.body.style.overflow,'hidden');
 await click($('#profile-roster [data-player-aid]'));
 const firstPlayer=$('#nba-profile-title').textContent;
 assert($('#profile-season'));assert($('#profile-logs'));
 await click($('[data-profile-back]'));assert.equal($('#nba-profile-title').textContent,'Washington Wizards');
 await close();assert(!$('#nba-modal-ov').classList.contains('open'));assert.equal(w.document.body.style.overflow,'');
 const slatePlayer=$('.gm-card [data-player-aid]');const name=slatePlayer.textContent;
 slatePlayer.focus();await click(slatePlayer);assert.equal($('#nba-profile-title').textContent,name);
 assert($('#profile-props'));assert($('#profile-season'));assert($('#profile-matchup'));assert($('#profile-logs'));
 assert.equal(w.location.href,url);await close();assert.equal(w.document.activeElement,slatePlayer);
 slatePlayer.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await tick();
 assert.equal($('#nba-profile-title').textContent,name,'keyboard opens the same in-page profile');
 await click($('#nba-modal-ov'));assert(!$('#nba-modal-ov').classList.contains('open'),'backdrop closes');
 let surfaceCounts={},ids=new Set(),teams=new Set(),rosterIds=new Set();
 for(const tab of ['slate','props','rotations','dvp','streaks','teams']){
  await click($(`[data-tab="${tab}"]`));
  if(tab==='streaks')for(const sub of ['hot','vol','sgp']){await click($(`[data-strk-sub="${sub}"]`));$$('#hub-out [data-player-aid]').forEach(x=>ids.add(x.dataset.playerAid));$$('#hub-out [data-team]').forEach(x=>teams.add(x.dataset.team));}
  const pls=$$('#hub-out [data-player-aid]'),tms=$$('#hub-out [data-team]');
  surfaceCounts[tab]={players:pls.length,teams:tms.length};pls.forEach(x=>ids.add(x.dataset.playerAid));tms.forEach(x=>teams.add(x.dataset.team));
  assert(pls.every(x=>x.tagName==='BUTTON'||x.tabIndex===0),'keyboard player targets');
  assert(!$('#hub-out th [data-team]'),'MIN stat header is not Minnesota');
 }
 for(const id of ids){w.NBAHubProfiles.openPlayer(id);await tick();assert(!$('#nba-modal').textContent.includes('Profile unavailable'),id);assert(!$('#nba-modal').textContent.includes('undefined'),id);assert(!$('#nba-modal').textContent.includes('NaN'),id);await close();}
 for(const team of teams){w.NBAHubProfiles.openTeam(team);await tick();assert($('#profile-roster'),team);$$('#profile-roster [data-player-aid]').forEach(x=>rosterIds.add(x.dataset.playerAid));assert(!$('#nba-modal').textContent.includes('undefined'),team);assert(!$('#nba-modal').textContent.includes('NaN'),team);assert(!/ClutchPoints|AllPHLY|Forbes|Shams Charania|NBA reporter|NBA writer/.test($('#nba-modal').textContent),'source attribution hidden: '+team);await close();}
 for(const id of rosterIds){w.NBAHubProfiles.openPlayer(id);await tick();assert(!$('#nba-modal').textContent.includes('Profile unavailable'),id);await close();}
 // Rapid navigation cannot paint an earlier async profile over the latest.
 w.NBAHubProfiles.openPlayer('5160992');w.NBAHubProfiles.openTeam('ATL');await tick();assert.equal($('#nba-profile-title').textContent,'Atlanta Hawks');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(!$('#nba-modal-ov').classList.contains('open'));
 // Unlisted player ID is a safe empty state, not a fabricated 15.5 line or 70 confidence.
 w.NBAHubProfiles.openPlayer('999999999');await tick();assert($('#nba-modal').textContent.includes('Profile unavailable'));await close();
 assert.equal(w.location.href,url);assert.deepEqual(errors,[]);
 const out={passed:true,playerFromSlate:name,playerFromTeam:firstPlayer,bubbleTeam:'Washington Wizards',playersTested:ids.size,rosterPlayersTested:rosterIds.size,teamsTested:teams.size,surfaceCounts,unchangedURL:w.location.href,errors};
 if(process.env.NBA_PROFILE_TEST_REPORT)fs.writeFileSync(process.env.NBA_PROFILE_TEST_REPORT,JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
 dom.window.close();
 const sparse=new JSDOM('<div id="nba-modal-ov"><div id="nba-modal"></div></div>',{url,runScripts:'outside-only',pretendToBeVisual:true});
 const sw=sparse.window;
 sw.fetch=async()=>({ok:false,json:async()=>({})});
 sw.eval(fs.readFileSync(root+'nba-hub-profiles.js','utf8'));
 const maliciousName='<img src=x onerror=alert(1)>';
 await sw.NBAHubProfiles.init({season:'2026-27',teams:{ATL:{name:'Atlanta Hawks'}},units:[{team:'ATL',first:{players:[{id:'123',name:maliciousName,team:'ATL',pos:'G'}]}}]});
 sw.NBAHubProfiles.openPlayer('123');await tick();
 const panel=sw.document.querySelector('#nba-modal');
 assert.equal(panel.querySelector('h2').textContent,maliciousName);
 assert(!panel.querySelector('img[src="x"]'),'feed markup must be escaped');
 assert(!panel.querySelector('#profile-season'),'missing season stats hidden');
 assert(!panel.querySelector('#profile-trend'),'missing trend hidden');
 assert(!panel.querySelector('#profile-props'),'missing props hidden');
 assert(!panel.textContent.includes('15.5'),'no seeded line');
 assert(!panel.textContent.includes('70/100'),'no seeded confidence');
 assert(panel.textContent.includes('temporarily unavailable'),'failed-feed state');
 sw.NBAHubProfiles.close();sparse.window.close();
 console.log('Sparse-data, failed-feed, and escaped-feed-markup tests passed.');
})().catch(e=>{console.error(e);process.exit(1)});
