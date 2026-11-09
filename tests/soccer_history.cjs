// node tests/soccer_history.cjs
const fs=require('fs'),path=require('path'),{execSync}=require('child_process'),{JSDOM}=require('jsdom');
const R=path.join(__dirname,'..'),H=require(path.join(R,'soccer-history.js'));
let ok=0,bad=0;const t=(c,m)=>{if(c)ok++;else{bad++;console.log('FAIL',m)}};
const final=(over)=>({orientation:'verified',fav:'ARS',dog:'HUL',fav_score:1,dog_score:0,fav_name:'Arsenal',dog_name:'Hull City',home:'ARS',away:'HUL',home_score:1,away_score:0,home_name:'Arsenal',away_name:'Hull City',...over});
const fx={updated:'2026-11-07T18:40:00Z',auto_refresh:false,games:[
 {game:'1',lg:'eng.1',time:'2026-11-07T15:00:00Z',fav:'ARS',dog:'HUL',status:'final',final:final(),blowout:{fav_name:'Arsenal',dog_name:'Hull City',tier:'main',pf:.83,margin:1,legs:[{leg:'Arsenal to win to nil',res:'win',p:.5,actual:'1-0'},{leg:'Arsenal -1.5',res:'loss',p:.4,actual:'margin +1'}]},sgp:{fav_name:'Arsenal',res:'loss',legs:[{player:'Kai Havertz',market:'Anytime Goal',line:.5,price:-120,res:'loss',actual:0},{player:'X',market:'Assists',line:.5,res:'unknown'}]}},
 {game:'2',lg:'esp.1',time:'2026-11-01T04:30:00Z',fav:'RMA',dog:'X',status:'final',final:final({fav:'RMA',dog:'X',fav_score:3,dog_score:0,fav_name:'Real',dog_name:'X',home:'RMA',away:'X',home_score:3,away_score:0,home_name:'Real',away_name:'X'}),blowout:{fav_name:'Real',dog_name:'X',tier:'watch',legs:[{leg:'Real -1.5',res:'win'}]}},
 {game:'late',lg:'eng.1',time:'2026-11-02T04:30:00Z',status:'final',final:final({fav:'SUN',dog:'DZG',fav_score:0,dog_score:2,fav_name:'Sunderland',dog_name:'Dinamo Zagreb',home:'SUN',away:'DZG',home_score:0,away_score:2,home_name:'Sunderland',away_name:'Dinamo Zagreb'}),sgp:{res:'loss',legs:[{player:'Wilson Isidor',market:'Anytime Goal',line:.5,res:'loss',actual:0}]}},
 {game:'3',time:'2026-11-07T17:00:00Z',status:'unverified',final:null,blowout:{legs:[]}},
 {game:'1',time:'2026-11-07T15:00:00Z',status:'final',final:final()},
 {game:'4',time:'2026-11-05T19:00:00Z',status:'final',final:final({fav:'P',dog:'Q',fav_score:2,dog_score:2,fav_name:'P',dog_name:'Q',home:'P',away:'Q',home_score:2,away_score:2,home_name:'P',away_name:'Q'}),sgp:{legs:[{player:'Y',market:'Shots on Target',line:1.5,res:'push',actual:2}],res:'push'}},
 {game:'5',time:'2026-11-06T19:00:00Z',status:'final',final:final({fav_score:0,dog_score:0,home_score:0,away_score:0})},
 {game:'bad',time:'not-a-date',status:'final',final:final()},
 {game:'nofinal',time:'2026-11-04T12:00:00Z',status:'final',final:{orientation:'teams_only',fav:'A',dog:'B'}}]};
const S=H.settled(fx,{5:1});
t(S.map(g=>g.game).join()==='1,4,late,2','final-only, deduped, active-excluded, untimed dropped, newest kickoff first');
const G=H.group(S);
t(G.map(d=>d.day).join()==='2026-11-07,2026-11-05,2026-11-01','days newest first; both 04:30Z kickoffs land on Nov 1 ET');
t(G[1].games.map(g=>g.game).join()==='4','Nov 5 group keeps its match');
t(G[2].games.map(g=>g.game).join()==='late,2','same ET day stays newest kickoff first');
// EST / EDT calendar dates, including the 2026 fall-back and spring-forward weeks
t(H.dayKey('2026-01-15T04:30:00Z')==='2026-01-14','midwinter 04:30Z is previous EST day');
t(H.dayKey('2026-07-15T03:30:00Z')==='2026-07-14','midsummer 03:30Z is previous EDT day');
t(H.dayKey('2026-03-07T04:30:00Z')==='2026-03-06','before spring forward, 04:30Z is previous EST day');
t(H.dayKey('2026-03-08T06:30:00Z')==='2026-03-08','01:30 EST on spring-forward morning');
t(H.dayKey('2026-03-08T07:30:00Z')==='2026-03-08','03:30 EDT after the spring-forward gap');
t(H.dayKey('2026-03-09T03:30:00Z')==='2026-03-08','after spring forward, 03:30Z is previous EDT day');
t(H.dayKey('2026-10-31T03:30:00Z')==='2026-10-30','before fall back, 03:30Z is previous EDT day');
t(H.dayKey('2026-11-01T03:59:00Z')==='2026-10-31','23:59 EDT on Oct 31');
t(H.dayKey('2026-11-01T04:30:00Z')==='2026-11-01','00:30 EDT on Nov 1, still UTC-4');
t(H.dayKey('2026-11-01T05:59:00Z')==='2026-11-01','01:59 EDT just before the clock falls back');
t(H.dayKey('2026-11-01T06:30:00Z')==='2026-11-01','01:30 EST after the clock falls back');
t(H.dayKey('2026-11-02T04:30:00Z')==='2026-11-01','23:30 EST the next evening is the previous ET day');
t(H.dayKey('not-a-date')==='','invalid kickoff has no day');
const d=new JSDOM('<body>'+H.html(fx,{5:1})+'</body>').window.document,w=d.getElementById('sgp-history');
t(w.tagName==='DETAILS'&&!w.open,'history collapsed by default');
t([...d.querySelectorAll('details.sh-day')].every(x=>!x.open),'match days collapsed');
t([...d.querySelectorAll('details.sh-day')].map(x=>x.getAttribute('data-day')).join()==='2026-11-07,2026-11-05,2026-11-01','day order in the collapsed list');
t(w.querySelector('summary').getAttribute('aria-label'),'accessible summary');
t(d.querySelectorAll('.sh-card').length===4,'no duplicate or excluded cards');
t(d.querySelector('#sgph-1 .sh-score').textContent.includes('Arsenal 1 – 0 Hull City'),'verified favorite-dog score');
t(d.querySelector('#sgph-1 .sh-score').textContent.includes('home Arsenal'),'verified home label');
t(!d.querySelector('#sgph-late .sh-score').textContent.includes('home')===false&&d.querySelector('#sgph-late .sh-score').textContent.includes('Sunderland 0 – 2 Dinamo Zagreb'),'loss score is shown');
t(d.querySelectorAll('#sgph-1 .sh-w').length===1&&d.querySelectorAll('#sgph-1 .sh-l').length>=2,'green checks and red crosses include the loss');
t(d.querySelector('#sgph-1 [aria-label="Not verifiable from stored finals"]'),'unknown stays neutral');
t(d.querySelector('#sgph-4 [aria-label="Push"]')&&d.querySelector('#sgph-4 .sh-n'),'push stays neutral');
t(!d.getElementById('sgph-3')&&!d.getElementById('sgph-5')&&!d.getElementById('sgph-nofinal'),'unfinished, active, and scoreless-identity rows hidden');
t(/does not refresh on its own/.test(d.body.textContent),'snapshot is not described as auto-updating');
t(/Archive built/.test(d.body.textContent),'archive time is shown');
const e=new JSDOM('<body>'+H.html({games:[],auto_refresh:false,updated:'2026-11-07T18:40:00Z'})+'</body>').window.document;
t(/No settled matches/.test(e.body.textContent)&&!e.querySelector('details').open&&/does not refresh/.test(e.body.textContent),'honest empty state stays collapsed');
const nasty='<img src=x onerror="alert(1)">&';
const attack=H.html({auto_refresh:false,games:[{game:'1"><script>',lg:nasty,time:'2026-11-07T15:00:00Z',fav:'A',dog:'B',status:'final',final:{orientation:'verified',fav:'A',dog:'B',fav_score:1,dog_score:0,fav_name:nasty,dog_name:'B',home:'A',away:'B',home_score:1,away_score:0,home_name:nasty,away_name:'B',label:'Final'},blowout:{fav_name:nasty,dog_name:'B',tier:'main',legs:[{leg:nasty,res:'loss',p:.2,actual:nasty}]},sgp:{res:'loss',legs:[{player:nasty,market:'Anytime Goal',line:.5,price:'<b>',res:'win',actual:0}]}}]});
const ad=new JSDOM('<body>'+attack+'</body>').window.document;
t(!attack.includes('<img')&&!attack.includes('<script')&&attack.includes('&lt;img')&&attack.includes('&amp;')&&attack.includes('&quot;'),'escapes names, legs, and the game id');
t(ad.querySelectorAll('img,script').length===0,'escaped text does not become elements');
t(ad.querySelector('.sh-card')&&ad.querySelector('.sh-l')&&ad.querySelector('.sh-w'),'win and loss marks survive escaping');
const cur=fs.readFileSync(path.join(R,'index.html'),'utf8'),base=execSync('git show origin/main:index.html',{cwd:R}).toString();
function between(s,a,b){const i=s.indexOf(a);if(i<0)return null;const j=s.indexOf(b,i+a.length);return j<0?null:s.slice(i,j)}
t(between(cur,'function lopCard()','function sgpCards()')===between(base,'function lopCard()','function sgpCards()'),'lopCard unchanged');
t(between(cur,'function sgpCards()','function hotScorers()')===between(base,'function sgpCards()','function hotScorers()'),'sgpCards unchanged');
t(between(cur,'function blowLite()','function sgpHist()')===between(base,'function blowLite()','function sgpView()'),'blowLite unchanged');
t(between(cur,'const keepT=','const gstate=')===between(base,'const keepT=','const gstate='),'keepT unchanged');
t(between(cur,'const gstate=','const et=')===between(base,'const gstate=','const et='),'gstate unchanged');
t(between(cur,'const liveG=','const keepT=')===between(base,'const liveG=','const keepT='),'liveG unchanged');
t(/No lopsided matches on the board right now[^\n]*\+sgpHist\(\);/.test(cur),'history is appended after the upcoming board');
t(/keepT\(r\.time,r\)&&r\.tier!="-"/.test(cur)&&/keepT\(c\.time,c\)/.test(cur),'history excludes the current keepT window');
t(/soccer-history\.js/.test(cur)&&/soccer_sgp_history\.json/.test(cur),'page loads the archive and renderer');
const file=path.join(R,'data/soccer_sgp_history.json');
t(fs.existsSync(file),'archive built');
if(fs.existsSync(file)){
 const D=JSON.parse(fs.readFileSync(file,'utf8'));
 t(D.auto_refresh===false,'archive flag says it does not auto-refresh');
 const ids=D.games.map(g=>g.game);
 t(new Set(ids).size===ids.length,'real: unique games');
 t(D.games.every(g=>g.status==='final'&&g.final&&Number.isInteger(g.final.fav_score)&&Number.isInteger(g.final.dog_score)),'real: every row has team scores');
 t(D.games.every(g=>g.published_at<g.time),'real: card published before kickoff');
 t(D.games.every(g=>g.time<=D.updated),'real: no future kickoff in the archive');
 t(D.games.every(g=>[...((g.sgp||{}).legs||[]),...((g.blowout||{}).legs||[])].every(l=>['win','loss','push','void','unknown'].includes(l.res))),'real: leg statuses');
 const hull=D.games.find(g=>g.game==='401878760');
 t(hull&&hull.final.orientation==='verified'&&hull.final.home==='ARS'&&hull.final.home_score===1&&hull.final.away==='HUL'&&hull.final.away_score===0,'real: Arsenal 1-0 Hull, Arsenal home');
 const havertz=((hull&&hull.sgp&&hull.sgp.legs)||[]).find(l=>l.player==='Kai Havertz');
const nil=((hull&&hull.blowout&&hull.blowout.legs)||[]).find(l=>/to win to nil/.test(l.leg||''));
t(havertz&&havertz.res==='loss'&&havertz.actual===0,'real: Havertz anytime missed in the 1-0');
t(nil&&nil.res==='win','real: Arsenal win-to-nil hit');
 const slavia=D.games.find(g=>g.game==='401915381');
 t(slavia&&slavia.final.home==='SLP'&&slavia.final.home_score===1&&slavia.final.away==='ARS'&&slavia.final.away_score===2,'real: Slavia 1-2 Arsenal, Slavia home');
 const m15=((slavia&&slavia.blowout&&slavia.blowout.legs)||[]).find(l=>/-1\.5$/.test(l.leg||''));
 t(m15&&m15.res==='loss','real: Arsenal -1.5 missed in a one-goal win');
 const eze=((slavia&&slavia.sgp&&slavia.sgp.legs)||[]).find(l=>l.player==='Eberechi Eze');
 const merino=((slavia&&slavia.sgp&&slavia.sgp.legs)||[]).find(l=>l.player==='Mikel Merino');
 t(eze&&eze.market==='Anytime Goal'&&eze.res==='loss'&&merino&&merino.market==='Shots on Target'&&merino.res==='win'&&slavia.sgp.res==='loss','real: published Eze + Merino card is a loss, not the ledger win');
 const liv=D.games.find(g=>g.game==='401915382');
 t(liv&&liv.final.home==='FEN'&&liv.final.fav_score===2&&liv.final.dog_score===3,'real: Liverpool 2-3 Fenerbahce, Fenerbahce home');
 t(D.games.some(g=>g.sgp&&g.sgp.res==='loss')&&D.games.some(g=>g.sgp&&g.sgp.res==='win'),'real: archive includes cashed and missed SGPs');
 t(D.omitted_no_final>=1&&D.omitted_future>=1,'real: finals-missing and still-upcoming matches are counted, not shown');
}
console.log(`soccer_history: ${ok} passed, ${bad} failed`);
process.exit(bad?1:0);
