/* Cache-bust helper for Image Tools action loader. */
(function(){
  "use strict";
  function load(){
    if(!document.querySelector(".image-workspace"))return;
    if(document.getElementById("algolassi-image-tools-actions-loader"))return;
    var s=document.createElement("script");
    s.id="algolassi-image-tools-actions-loader";
    s.src="/assets/js/algolassi-image-tools-actions.js?v=20260903-actions-2";
    s.defer=true;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
  window.addEventListener("algolassi:spa-navigation",function(){setTimeout(load,0);});
})();
