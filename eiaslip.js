// Early Injury: tap a priced prop into the Bet Lab slip (uses the existing slip bar / add mechanism)
window.eiaAdd=function(keys,dis){if(!keys||!keys.length)return ' <span class="add dis" style="opacity:.45;cursor:default" title="'+(dis||"Price pending: can be added once a book posts a real price")+'">+ ⓘ</span>';
 var on=typeof toggleLeg=="function"&&typeof inSlip=="function",k=keys.join(","),all=on&&keys.every(function(x){return inSlip("nfl",x)});
 if(on)return ' <button class="add eiaslip '+(all?"in":"")+'" data-eia="'+k+'" title="Add to slip">'+(all?"✓":"+")+'</button>';
 return ' <a class="add eiaslip" href="https://betlab.sportslabshq.com/#slip='+encodeURIComponent(keys.map(function(x){return "nfl~"+x}).join(","))+'&add=1" target="_blank" rel="noopener" title="Add to Bet Lab slip">+</a>'};
window.addEventListener("click",function(e){if(e.target.closest&&e.target.closest(".add.dis")){e.preventDefault();e.stopImmediatePropagation();return}var b=e.target.closest&&e.target.closest("[data-eia]");if(!b||typeof toggleLeg!="function")return;e.preventDefault();e.stopImmediatePropagation();
 var ks=b.dataset.eia.split(","),all=ks.every(function(x){return inSlip("nfl",x)});ks.forEach(function(x){if(all||!inSlip("nfl",x))toggleLeg("nfl",x)})},true);
