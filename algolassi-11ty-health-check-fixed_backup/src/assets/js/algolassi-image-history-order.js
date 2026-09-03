/* Algolassi Image Tools: newest-first processing history display. */
(function(){
  "use strict";
  if(window.__algolassiImageHistoryOrderLoaded)return;
  window.__algolassiImageHistoryOrderLoaded=true;
  function reorder(){
    var history=document.getElementById("image-history");
    if(!history)return;
    var cards=Array.prototype.slice.call(history.querySelectorAll(":scope > .image-history-card"));
    if(cards.length<2)return;
    var first=cards[0];
    if(first&&first.dataset.index===String(cards.length-1))return;
    cards.reverse();
    while(history.firstChild)history.removeChild(history.firstChild);
    cards.forEach(function(card,index){
      if(index) {
        var connector=document.createElement("div");
        connector.className="image-history-connector";
        connector.setAttribute("aria-hidden","true");
        history.appendChild(connector);
      }
      history.appendChild(card);
    });
  }
  function init(){
    reorder();
    var history=document.getElementById("image-history");
    if(!history||history.dataset.imageHistoryOrderObserved==="1")return;
    history.dataset.imageHistoryOrderObserved="1";
    var observer=new MutationObserver(function(){reorder();});
    observer.observe(history,{childList:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){setTimeout(init,0);});
})();
