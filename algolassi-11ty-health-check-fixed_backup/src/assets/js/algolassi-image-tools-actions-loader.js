/* Algolassi Image Tools action loader. */
(function(){
  "use strict";
  function load(){
    if(!document.querySelector(".image-workspace"))return;
    if(!document.getElementById("algolassi-image-tools-actions-loader-script")){
      var s=document.createElement("script");
      s.id="algolassi-image-tools-actions-loader-script";
      s.src="/assets/js/algolassi-image-tools-actions.js?v=20260903-actions-4";
      s.defer=true;
      s.async=true;
      document.head.appendChild(s);
    }
    if(!document.getElementById("algolassi-image-crop-surface-fix-script")){
      var c=document.createElement("script");
      c.id="algolassi-image-crop-surface-fix-script";
      c.src="/assets/js/algolassi-image-crop-surface-fix.js?v=20260903-crop-surface-1";
      c.defer=true;
      c.async=true;
      document.head.appendChild(c);
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(load);});
})();
