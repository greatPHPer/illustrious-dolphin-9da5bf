/* Algolassi Developer Tools refreshed loader. */
(function(){
  "use strict";
  function load(){
    if(document.getElementById("algolassi-image-tools-actions-script"))return;
    if(!document.querySelector(".image-workspace"))return;
    var s=document.createElement("script");s.id="algolassi-image-tools-actions-script";s.src="/assets/js/algolassi-image-tools-actions-v3.js?v=20260903-actions-3";s.defer=true;s.async=true;document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(load);});
})();
