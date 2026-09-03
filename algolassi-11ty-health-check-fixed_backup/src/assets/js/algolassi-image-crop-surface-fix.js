/* Algolassi Image Tools - make Crop use the same visible surface as the image. */
(function(){
  "use strict";
  function q(id){return document.getElementById(id);}
  var ro=null,mo=null;
  function sync(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel"),img=q("image-preview-img"),overlay=q("image-crop-overlay");
    if(!stage||!panel||!img||!overlay)return;
    var active=!panel.classList.contains("image-hidden");
    stage.classList.toggle("image-crop-active",active);
    if(!active||img.classList.contains("image-hidden"))return;
    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    if(!ir.width||!ir.height||!sr.width||!sr.height)return;
    overlay.style.left=(ir.left-sr.left)+"px";
    overlay.style.top=(ir.top-sr.top)+"px";
    overlay.style.width=ir.width+"px";
    overlay.style.height=ir.height+"px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
    overlay.style.margin="0";
    overlay.style.padding="0";
    overlay.style.boxSizing="border-box";
    var box=q("image-crop-rectangle");
    if(box){
      box.style.left=box.style.left||"0px";
      box.style.top=box.style.top||"0px";
      box.style.boxSizing="border-box";
      box.style.margin="0";
      box.style.padding="0";
      box.style.transform="none";
    }
  }
  function init(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel"),img=q("image-preview-img");
    if(!stage||!panel||!img)return;
    sync();
    if(window.ResizeObserver){
      if(ro)try{ro.disconnect();}catch(_){ }
      ro=new ResizeObserver(function(){requestAnimationFrame(sync);});
      ro.observe(stage);ro.observe(img);
    }
    if(window.MutationObserver&&panel.dataset.cropSurfaceObserved!=="1"){
      panel.dataset.cropSurfaceObserved="1";
      mo=new MutationObserver(function(){requestAnimationFrame(sync);});
      mo.observe(panel,{attributes:true,attributeFilter:["class"]});
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
  window.addEventListener("resize",function(){requestAnimationFrame(sync);},{passive:true});
})();
