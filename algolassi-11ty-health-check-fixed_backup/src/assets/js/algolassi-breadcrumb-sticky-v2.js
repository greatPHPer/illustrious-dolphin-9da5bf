/* Algolassi sticky breadcrumb refreshed loader. */
(function () {
  "use strict";
  var ID="algolassi-breadcrumb-sticky-v2";
  function load(){
    if(document.getElementById(ID))return;
    var s=document.createElement("script");s.id=ID;s.src="/assets/js/algolassi-devtools-brown-icons.js?v=20260903-brown-icons-3";s.defer=true;document.body.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
  window.addEventListener("algolassi:spa-navigation",function(){setTimeout(load,0);});
})();
