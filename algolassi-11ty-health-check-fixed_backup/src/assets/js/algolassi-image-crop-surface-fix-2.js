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
      ".image-preview-stage.image-crop-active{padding:0!important;}"+
      ".image-preview-stage.image-crop-active #image-preview-img{margin:0!important;border:0!important;padding:0!important;outline:0!important;box-shadow:none!important;}"+
      ".image-preview-stage.image-crop-active #image-crop-overlay{margin:0!important;padding:0!important;}"+
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
    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    if(!ir.width||!ir.height)return;
    overlay.style.left=(ir.left-sr.left)+"px";
    overlay.style.top=(ir.top-sr.top)+"px";
    overlay.style.width=ir.width+"px";
    overlay.style.height=ir.height+"px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
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
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
  window.addEventListener("resize",function(){requestAnimationFrame(sync);},{passive:true});
})();
