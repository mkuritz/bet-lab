/* Shared Bet Lab sidebar: one component for every page. State in localStorage("bl-sidebar"). */
(function(){
  var H=function(x){return 'https://'+x+'.sportslabshq.com/'};
  var G=[['Bet Lab',[['🔎 Ask SportsLabs','./index.html#ask','ask'],['🏈 NFL Game Day','./nfl.html','nfl'],['💰 Value Vault','./value.html','value'],['💎 Sharp Picks','./sharp.html','sharp'],['Props','./index.html','props'],['⚡ Today\'s Edge','./index.html#view=edge','edge-z'],['⚽ Soccer SGPs & Blowouts','./index.html#view=sgp','sgp-z'],['📊 Market Board','./markets.html','markets'],['🎯 Results','./edge.html','edge'],['🌙 Overnight','./overnight.html','overnight'],['🔥 Perfect Streaks','./streaks.html','streaks'],['Sports Analyst','./index.html#view=analyst','analyst'],['📈 Betting Trends',H('nfllab')+'trends.html']]],
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
/* Account: sl.js avatar moved to the header top-right + account block pinned at the sidebar bottom (Bet Lab only; same sl.js menu). */
(function(){
  var side=document.querySelector('aside.sl-side');if(!side||window.__blAcct)return;window.__blAcct=1;
  document.body.classList.add('bl-acct');
  var ACC='https://sportslabshq.com/account/';
  var nx=function(m){return ACC+'?mode='+m+'&next='+encodeURIComponent(location.href)};
  var esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var hd=document.querySelector('header');
  var top=document.createElement('div');top.className='bl-top'+(hd?'':' bl-float');
  if(hd){if(getComputedStyle(hd).position==='static')hd.style.position='relative';hd.classList.add('bl-hd');hd.appendChild(top)}else document.body.appendChild(top);
  var box=document.createElement('div');box.className='bl-acct-box';side.appendChild(box);
  /* keep anything sl.js adds to the sidebar later (Discord link) above the pinned block */
  new MutationObserver(function(){var n=box.nextElementSibling;while(n){var x=n.nextElementSibling;side.insertBefore(n,box);n=x}}).observe(side,{childList:true});
  var signed=null,opener=null;
  function btn(){return top.querySelector('.sl-acct')}
  function signedOut(){
    top.innerHTML='<a class="bl-signin" href="'+nx('signin')+'">Sign in</a>';
    box.innerHTML='<div class="bl-out"><a class="bl-b2" href="'+nx('signin')+'">Sign in</a><a class="bl-b1" href="'+nx('signup')+'">Start free trial</a></div>';
  }
  function grab(){
    var a=document.querySelector('body > .sl-acct');
    if(a){a.style.bottom='';if(signed===false){a.remove();return}var o=btn();if(o&&o!==a)o.remove();top.querySelectorAll('.bl-signin').forEach(function(e){e.remove()});top.appendChild(a);a.addEventListener('click',function(){opener=top},true);fill(a)}
    var m=document.querySelector('body > .sl-menu:not(.bl-pos)');if(m)place(m);
    var tg=hd&&hd.querySelector('.sl-tog');if(tg&&tg.offsetHeight){top.style.top=tg.offsetTop+'px';top.style.transform='none'}
    var bar=[].slice.call(document.querySelectorAll('.sl-bar')).reduce(function(h,e){return h+e.offsetHeight},0);
    document.body.style.setProperty('--bl-bar',bar+'px');
  }
  function fill(a){
    if(signed===false)return;var plan='',email='';
    if(!document.querySelector('.sl-menu')){a.onclick&&a.onclick();var m=document.querySelector('.sl-menu');if(m){var d=m.querySelector('div');if(d){var b=d.querySelector('b');plan=b?b.textContent:'';email=d.textContent.slice(plan.length)}m.remove()}}
    if(!plan&&!email)return;
    box.innerHTML='<button type="button" class="bl-ab" aria-haspopup="menu" aria-label="Account menu"><span class="bl-av">'+esc(a.textContent)+'</span><span class="bl-ai"><b>'+esc(plan)+'</b><small>'+esc(email)+'</small></span><span class="bl-car">⌃</span></button>';
    box.querySelector('.bl-ab').onclick=function(e){e.stopPropagation();var m=document.querySelector('.sl-menu');if(m&&opener===box){m.remove();return}if(m)m.remove();opener=box;var b=btn();b&&b.onclick&&b.onclick()};
  }
  function place(m){
    m.classList.add('bl-pos');m.setAttribute('role','menu');var vw=innerWidth,mw=Math.min(260,vw-16);m.style.minWidth=mw+'px';m.style.maxWidth=(vw-16)+'px';
    if(opener===box){var r=box.getBoundingClientRect();m.style.top='auto';m.style.right='auto';m.style.left=Math.max(8,Math.min(r.left+8,vw-mw-8))+'px';m.style.bottom=(innerHeight-r.top+6)+'px';m.classList.add('bl-up')}
    else{var t=(btn()||top).getBoundingClientRect();m.style.bottom='auto';m.style.left='auto';m.style.top=(t.bottom+8)+'px';m.style.right=Math.max(8,vw-t.right)+'px'}
  }
  new MutationObserver(grab).observe(document.body,{childList:true});
  document.addEventListener('click',function(e){var m=document.querySelector('.sl-menu');if(m&&!m.contains(e.target)&&!(btn()&&btn().contains(e.target))&&!box.contains(e.target))m.remove()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var m=document.querySelector('.sl-menu');m&&m.remove()}});
  addEventListener('resize',function(){var m=document.querySelector('.sl-menu');m&&m.remove()});
  (async function(){
    for(var i=0;i<60&&!(window.SL&&SL.client);i++)await new Promise(function(r){setTimeout(r,250)});
    var s=null;try{s=window.SL&&SL.client?(await SL.client.auth.getSession()).data.session:null}catch(e){}
    signed=!!s;if(!s){var a=document.querySelector('.sl-acct');a&&a.remove();if(hd)hd.classList.add('bl-so');signedOut()}grab();
  })();
  grab();
})();
(function(){if(document.querySelector('script[src*="plink.js"]'))return;var s=document.createElement('script');s.src='./plink.js?v=4';s.defer=true;document.head.appendChild(s)})();
(function(){if(document.querySelector('script[src*="search.js"]'))return;var s=document.createElement('script');s.src='./search.js?v=3';s.defer=true;document.head.appendChild(s)})();
