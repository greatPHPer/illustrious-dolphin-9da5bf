/* Algolassi Image Tools: deterministic newest-first history order. */
(function(){
  "use strict";
  if(window.__algolassiImageHistoryOrderLoaded)return;
  window.__algolassiImageHistoryOrderLoaded=true;

  function history(){return document.getElementById("image-history");}

  function orderHistory(){
    var h=history();
    if(!h)return;

    /* The base stylesheet uses row-reverse for the old history layout.
       Override that so the DOM itself becomes the source of truth. */
    h.style.setProperty("flex-direction","row","important");
    h.style.setProperty("direction","ltr","important");

    var children=Array.prototype.slice.call(h.children);
    if(children.length<2)return;

    var cards=children.filter(function(el){return el.classList&&el.classList.contains("image-history-card");});
    if(cards.length<2)return;

    var newest=parseInt(cards[cards.length-1].dataset.index,10);
    var oldest=parseInt(cards[0].dataset.index,10);

    /* Already newest-first. */
    if(!Number.isNaN(newest) && !Number.isNaN(oldest) && newest===0)return;

    /* The core renderer emits card, connector, card, connector, card...
       Reverse that complete sequence so connectors stay with their cards. */
    var reversed=children.reverse();
    var frag=document.createDocumentFragment();
    reversed.forEach(function(el){frag.appendChild(el);});
    h.appendChild(frag);
  }

  function watch(){
    var h=history();
    if(!h||h.dataset.historyOrderObserver==="1")return;
    h.dataset.historyOrderObserver="1";
    orderHistory();
    var observer=new MutationObserver(function(){
      observer.disconnect();
      orderHistory();
      observer.observe(h,{childList:true});
    });
    observer.observe(h,{childList:true});
  }

  function init(){
    watch();
    window.addEventListener("algolassi:spa-navigation",function(){
      setTimeout(watch,80);
    });
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
