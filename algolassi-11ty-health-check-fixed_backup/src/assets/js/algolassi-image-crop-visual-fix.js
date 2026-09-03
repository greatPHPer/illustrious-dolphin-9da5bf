/* Algolassi Image Tools - keep crop overlay exactly on the rendered image box. */
(function(){
  "use strict";

  function q(id){return document.getElementById(id);}
  var resizeObserver=null;

  function align(){
    var stage=q("image-preview-stage"),img=q("image-preview-img"),overlay=q("image-crop-overlay");
    if(!stage||!img||!overlay||img.classList.contains("image-hidden"))return;
    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    if(!ir.width||!ir.height||!sr.width||!sr.height)return;
    overlay.style.left=Math.round(ir.left-sr.left)+"px";
    overlay.style.top=Math.round(ir.top-sr.top)+"px";
    overlay.style.width=Math.round(ir.width)+"px";
    overlay.style.height=Math.round(ir.height)+"px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
    overlay.style.boxSizing="border-box";
  }

  function reset(){
    var overlay=q("image-crop-overlay");
    if(!overlay)return;
    overlay.style.left="0px";
    overlay.style.top="0px";
    overlay.style.width="100%";
    overlay.style.height="100%";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
  }

  function init(){
    var stage=q("image-preview-stage"),img=q("image-preview-img"),overlay=q("image-crop-overlay");
    if(!stage||!img||!overlay)return;
    align();
    if(resizeObserver)try{resizeObserver.disconnect();}catch(_){ }
    if(window.ResizeObserver){
      resizeObserver=new ResizeObserver(align);
      resizeObserver.observe(stage);
      resizeObserver.observe(img);
    }
    if(img.dataset.cropVisualFixObserved!=="1"){
      img.dataset.cropVisualFixObserved="1";
      new MutationObserver(function(){requestAnimationFrame(align);}).observe(img,{attributes:true,attributeFilter:["class","src","style"]});
    }
    window.addEventListener("resize",align,{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(function(){reset();init();});});
})();
