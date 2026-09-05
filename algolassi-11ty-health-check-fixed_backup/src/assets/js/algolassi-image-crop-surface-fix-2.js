/* Algolassi Image Tools - Crop visual surface fix, revision 2. */
(function(){
  "use strict";
  var STYLE_ID="algolassi-image-crop-surface-style-2";

  function q(id){return document.getElementById(id);}

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    var style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=
      ".image-preview-stage{background-color:#e5e7eb!important;background-image:none!important;}"+
      ".image-preview-stage>img{background-color:#f8fafc!important;background-image:linear-gradient(45deg,#eef2f7 25%,transparent 25%),linear-gradient(-45deg,#eef2f7 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eef2f7 75%),linear-gradient(-45deg,transparent 75%,#eef2f7 75%)!important;background-size:20px 20px!important;background-position:0 0,0 10px,10px -10px,-10px 0!important;}"+
      "html[data-theme=\"dark\"] .image-preview-stage{background-color:#0f172a!important;background-image:none!important;}"+
      "html[data-theme=\"dark\"] .image-preview-stage>img{background-color:#111827!important;background-image:linear-gradient(45deg,#1f2937 25%,transparent 25%),linear-gradient(-45deg,#1f2937 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1f2937 75%),linear-gradient(-45deg,transparent 75%,#1f2937 75%)!important;background-size:20px 20px!important;background-position:0 0,0 10px,10px -10px,-10px 0!important;}"+
      ".image-preview-stage.image-crop-active{padding:0!important;}"+
      ".image-preview-stage.image-crop-active #image-preview-img{margin:0!important;border:0!important;padding:0!important;outline:0!important;box-shadow:none!important;}"+
      ".image-preview-stage.image-crop-active #image-crop-overlay{left:0!important;top:0!important;right:0!important;bottom:0!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;}"+
      ".image-preview-stage.image-crop-active #image-crop-rectangle{box-sizing:border-box!important;margin:0!important;padding:0!important;transform:none!important;}"+
      ".image-preview-stage.image-layers-active #image-crop-rectangle{box-sizing:border-box!important;margin:0!important;padding:0!important;transform:none!important;}";
    document.head.appendChild(style);
  }

  function syncLayersSurface(){
    var stage=q("image-preview-stage"),img=q("image-preview-img"),canvas=q("image-layers-canvas"),selection=q("image-layers-selection");
    if(!stage||!img||!canvas||!selection||!stage.classList.contains("image-layers-active"))return;
    var sr=stage.getBoundingClientRect(),ir=img.getBoundingClientRect();
    if(!sr.width||!sr.height||!ir.width||!ir.height)return;
    var left=ir.left-sr.left,top=ir.top-sr.top;
    [canvas,selection].forEach(function(el){
      el.style.left=left+"px";
      el.style.top=top+"px";
      el.style.right="auto";
      el.style.bottom="auto";
      el.style.width=ir.width+"px";
      el.style.height=ir.height+"px";
      el.style.objectFit="fill";
    });
  }

  function sync(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel"),img=q("image-preview-img"),overlay=q("image-crop-overlay");
    if(!stage||!panel||!img||!overlay)return;
    installStyle();
    syncLayersSurface();
    var active=!panel.classList.contains("image-hidden");
    stage.classList.toggle("image-crop-active",active);
    if(!active||img.classList.contains("image-hidden"))return;
    var sr=stage.getBoundingClientRect();
    if(!sr.width||!sr.height)return;
    overlay.style.left="0px";
    overlay.style.top="0px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
    overlay.style.width=sr.width+"px";
    overlay.style.height=sr.height+"px";
    overlay.style.boxSizing="border-box";
  }

  function init(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel"),img=q("image-preview-img");
    if(!stage||!panel||!img)return;
    installStyle();
    sync();
    if(window.ResizeObserver){
      var ro=new ResizeObserver(function(){requestAnimationFrame(sync);});
      ro.observe(stage);ro.observe(img);
      window.__algolassiCropSurfaceResizeObserver2=ro;
    }
    if(window.MutationObserver&&panel.dataset.cropSurfaceFix2!="1"){
      panel.dataset.cropSurfaceFix2="1";
      var mo=new MutationObserver(function(){requestAnimationFrame(sync);});
      mo.observe(panel,{attributes:true,attributeFilter:["class"]});
      window.__algolassiCropSurfaceMutationObserver2=mo;
    }
    if(window.MutationObserver&&stage.dataset.layersSurfaceObserved!="1"){
      stage.dataset.layersSurfaceObserved="1";
      var smo=new MutationObserver(function(mutations){
        for(var i=0;i<mutations.length;i++){
          if(mutations[i].type==="attributes"&&mutations[i].attributeName==="class"){
            requestAnimationFrame(sync);
            break;
          }
        }
      });
      smo.observe(stage,{attributes:true,attributeFilter:["class"]});
      window.__algolassiLayersSurfaceMutationObserver2=smo;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
  window.addEventListener("resize",function(){requestAnimationFrame(sync);},{passive:true});
})();
