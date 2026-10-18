/* Shared Bet Lab sidebar: one component for every page. State in localStorage("bl-sidebar"). */
(function(){
  var H=function(x){return 'https://'+x+'.sportslabshq.com/'};
  var G=[['Bet Lab',[['🏈 NFL Game Day','./nfl.html','nfl'],['💎 Sharp Picks','./sharp.html','sharp'],['Props','./index.html','props'],['⚡ Today\'s Edge','./index.html#view=edge','edge-z'],['⚽ Soccer SGPs & Blowouts','./index.html#view=sgp','sgp-z'],['📊 Market Board','./markets.html','markets'],['🎯 Results','./edge.html','edge'],['🌙 Overnight','./overnight.html','overnight'],['🔥 Perfect Streaks','./streaks.html','streaks'],['Sports Analyst','./index.html#view=analyst','analyst'],['MLB Statcast','./statcast.html','statcast'],['📈 Betting Trends',H('nfllab')+'trends.html']]],
         ['Sport Hubs',[['🏈 NFL Hub',H('nfllab')],['🛡️ NFL Defense vs Position',H('nfllab')+'defense.html'],['🧱 NFL Defensive props',H('nfllab')+'defense-props.html'],['⚾ MLB Lab',H('mlblab')],['🏒 NHL Lab',H('nhllab')],['⚽ Soccer Hub',H('soccerlab')]]],
         ['Tools',[['⚡ Arb Lab',H('arblab')]]],
         ['',[['Sports Labs home','https://sportslabshq.com/'],['Request a demo','#','demo-lead']]]];
  var f=(location.pathname.split('/').pop()||'index.html').replace('.html','')||'index';
  var cur=f==='index'?(/view=analyst/.test(location.hash)?'analyst':/view=edge/.test(location.hash)?'edge-z':/view=sgp/.test(location.hash)?'sgp-z':'props'):f;
  var mob=function(){return innerWidth<768};
  var saved=localStorage.getItem('bl-sidebar');
  var open=saved?saved==='open':!mob();
  function set(o,ns){open=o;document.body.classList.toggle('sl-open',o);if(!ns)localStorage.setItem('bl-sidebar',o?'open':'closed');tog.setAttribute('aria-expanded',o)}
  var side=document.createElement('aside');side.className='sl-side';side.setAttribute('aria-label','Site navigation');
  side.innerHTML='<div class="sl-brand"><span>🧪 Sports Labs</span><button class="sl-x" aria-label="Close menu">‹</button></div>'+G.map(function(g){return (g[0]?'<h4>'+g[0]+'</h4>':'<h4>&nbsp;</h4>')+g[1].map(function(l){return '<a href="'+l[1]+'"'+(l[2]==='demo-lead'?' data-lead="demo"':'')+(l[2]?' data-k="'+l[2]+'"':'')+(l[2]===cur?' class="cur" aria-current="page"':'')+'>'+l[0]+'</a>'}).join('')}).join('');
  var scrim=document.createElement('div');scrim.className='sl-scrim';
  var tog=document.createElement('button');tog.className='sl-tog';tog.type='button';tog.setAttribute('aria-label','Toggle menu');tog.innerHTML='☰';
  document.body.prepend(scrim);document.body.prepend(side);
  var hd=document.querySelector('header');if(hd)hd.prepend(tog);else{tog.classList.add('sl-float');document.body.prepend(tog);document.body.style.paddingTop='52px'}
  tog.onclick=function(){set(!open)};side.querySelector('.sl-x').onclick=function(){set(false)};scrim.onclick=function(){set(false)};
  side.addEventListener('click',function(e){if(e.target.tagName==='A'&&mob())set(false)});
  set(mob()?false:open,true);
  if(f==='index')addEventListener('hashchange',function(){var h=location.hash,k=/view=analyst/.test(h)?'analyst':/view=edge/.test(h)?'edge-z':/view=sgp/.test(h)?'sgp-z':'props';side.querySelectorAll('a[data-k]').forEach(function(a){var on=a.dataset.k===k;a.classList.toggle('cur',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})});
  if(cur==='analyst')addEventListener('load',function(){var b=document.querySelector('[data-v="analyst"]');if(b)b.click()});
})();
(function(){if(document.querySelector('script[src*="search.js"]'))return;var s=document.createElement('script');s.src='./search.js?v=1';s.defer=true;document.head.appendChild(s)})();
