/* Algolassi Developer Tools brown icon system + action bootstrap. */
(function(){
  "use strict";
  var ICONS={"🏠":'<path d="M3 10.6 12 3l9 7.6"/><path d="M5.5 9.4V21h13V9.4"/><path d="M9 21v-6.5h6V21"/>',"🛠️":'<path d="m14 7 3-3 3 3-3 3"/><path d="m3 21 9-9"/><path d="m12 12 3 3"/><path d="M7 4.5a4.5 4.5 0 0 0 5.8 5.8L20 17.5a2.5 2.5 0 0 1-3.5 3.5l-7.2-7.2A4.5 4.5 0 0 0 3.5 8"/>'};
  function icon(markup){var s=document.createElement("span");s.className="algolassi-devtools-brown-icon";s.setAttribute("aria-hidden","true");s.style.cssText="display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;min-width:1em;margin-right:.3em;vertical-align:-.14em;color:#8b5a2b;flex:0 0 auto";var v=document.createElementNS("http://www.w3.org/2000/svg","svg");v.setAttribute("viewBox","0 0 24 24");v.setAttribute("focusable","false");v.style.cssText="width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round";v.innerHTML=markup;s.appendChild(v);return s;}
  function scan(){document.querySelectorAll(".algolassi-toolmenu-managed,.algolassi-toolmenu-home").forEach(function(el){var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n=[];while(w.nextNode())n.push(w.currentNode);n.forEach(function(node){var val=node.nodeValue,p=node.parentNode;if(!p||p.closest(".algolassi-devtools-brown-icon"))return;Object.keys(ICONS).forEach(function(k){var i=val.indexOf(k);if(i<0)return;var a=val.slice(0,i),b=val.slice(i+k.length);if(a)p.insertBefore(document.createTextNode(a),node);p.insertBefore(icon(ICONS[k]),node);node.nodeValue=b;val=b;});});});}
  function loadScript(id,src){if(document.getElementById(id))return;var s=document.createElement("script");s.id=id;s.src=src;s.defer=true;s.async=true;document.head.appendChild(s);}
  function load(){
    if(document.querySelector(".image-workspace")){
      loadScript("algolassi-image-tools-actions-script","/assets/js/algolassi-image-tools-actions-v5.js?v=20260903-actions-5");
      loadScript("algolassi-image-layers-script","/assets/js/algolassi-image-layers.js?v=20260903-layers-1");
      loadScript("algolassi-image-history-order-script","/assets/js/algolassi-image-history-order.js?v=20260903-history-order-1");
    }
    if(!document.getElementById("algolassi-tutorial-quiz-script"))loadScript("algolassi-tutorial-quiz-script","/assets/js/algolassi-tutorial-quiz.js?v=20260903-quiz-2");
  }
  function init(){scan();load();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("load",init);window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
})();
