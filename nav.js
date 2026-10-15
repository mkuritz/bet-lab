/* Shared Bet Lab sidebar: one component for every page. State in localStorage("bl-sidebar"). */
(function(){
  var H='https://mkuritz.github.io/';
  var G=[['Bet Lab',[['Props','./index.html','props'],['Sharp Picks','./sharp.html','sharp'],['📊 Market Board','./markets.html','markets'],['Edge Tracker','./edge.html','edge'],['Sports Analyst','./index.html#view=analyst','analyst'],['MLB Statcast','./statcast.html','statcast'],['Market check','./sources.html','sources'],['📈 Betting Trends',H+'nfl-lab/#betting-trends']]],
         ['Sport Hubs',[['🏈 NFL Hub',H+'nfl-lab/'],['⚾ MLB Lab',H+'mlb-lab/'],['🏒 NHL Lab',H+'nhl-lab/'],['⚽ Soccer Hub',H+'soccer-lab/']]],
         ['Tools',[['⚡ Arb Lab',H+'arb-lab/']]],
         ['',[['Sports Labs home',H+'sports-labs/'],['Request a demo','#','demo-lead']]]];
  var f=(location.pathname.split('/').pop()||'index.html').replace('.html','')||'index';
  var cur=f==='index'?(/view=analyst/.test(location.hash)?'analyst':'props'):f;
  var mob=function(){return innerWidth<768};
  var saved=localStorage.getItem('bl-sidebar');
  var open=saved?saved==='open':!mob();
  function set(o,ns){open=o;document.body.classList.toggle('sl-open',o);if(!ns)localStorage.setItem('bl-sidebar',o?'open':'closed');tog.setAttribute('aria-expanded',o)}
  var side=document.createElement('aside');side.className='sl-side';side.setAttribute('aria-label','Site navigation');
  side.innerHTML='<div class="sl-brand"><span>🧪 Sports Labs</span><button class="sl-x" aria-label="Close menu">‹</button></div>'+G.map(function(g){return (g[0]?'<h4>'+g[0]+'</h4>':'<h4>&nbsp;</h4>')+g[1].map(function(l){return '<a href="'+l[1]+'"'+(l[2]==='demo-lead'?' data-lead="demo"':'')+(l[2]===cur?' class="cur" aria-current="page"':'')+'>'+l[0]+'</a>'}).join('')}).join('');
  var scrim=document.createElement('div');scrim.className='sl-scrim';
  var tog=document.createElement('button');tog.className='sl-tog';tog.type='button';tog.setAttribute('aria-label','Toggle menu');tog.innerHTML='☰';
  document.body.prepend(scrim);document.body.prepend(side);
  var hd=document.querySelector('header');if(hd)hd.prepend(tog);else{tog.classList.add('sl-float');document.body.prepend(tog);document.body.style.paddingTop='52px'}
  tog.onclick=function(){set(!open)};side.querySelector('.sl-x').onclick=function(){set(false)};scrim.onclick=function(){set(false)};
  side.addEventListener('click',function(e){if(e.target.tagName==='A'&&mob())set(false)});
  set(mob()?false:open,true);
  if(cur==='analyst')addEventListener('load',function(){var b=document.querySelector('[data-v="analyst"]');if(b)b.click()});
})();
