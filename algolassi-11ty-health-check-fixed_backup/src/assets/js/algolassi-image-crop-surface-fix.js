/* Algolassi Image Tools - keep Crop and Layers on the exact same rendered image surface. */
(function(){
  "use strict";
  var ro=null,mo=null,eventsBound=false;
  function q(id){return document.getElementById(id);}

  function renderedImage(){
    var stage=q("image-preview-stage"),img=q("image-preview-img");
    if(!stage||!img||!img.naturalWidth)return null;
    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    if(!ir.width||!ir.height||!sr.width||!sr.height)return null;
    return {stage:stage,img:img,left:ir.left,top:ir.top,width:ir.width,height:ir.height,stageLeft:sr.left,stageTop:sr.top,scaleX:img.naturalWidth/ir.width,scaleY:img.naturalHeight/ir.height};
  }

  function sync(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel"),overlay=q("image-crop-overlay"),box=q("image-crop-rectangle");
    if(!stage||!panel||!overlay||!box)return;
    if(panel.classList.contains("image-hidden"))return;
    var r=renderedImage();if(!r)return;

    overlay.style.position="absolute";
    overlay.style.left=Math.round(r.left-r.stageLeft)+"px";
    overlay.style.top=Math.round(r.top-r.stageTop)+"px";
    overlay.style.width=Math.max(1,Math.round(r.width))+"px";
    overlay.style.height=Math.max(1,Math.round(r.height))+"px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
    overlay.style.margin="0";
    overlay.style.padding="0";
    overlay.style.border="0";
    overlay.style.boxSizing="border-box";
    overlay.style.maxWidth="none";
    overlay.style.maxHeight="none";

    box.style.position="absolute";
    box.style.transform="none";
    box.style.margin="0";
    box.style.padding="0";
    box.style.boxSizing="border-box";
    box.style.maxWidth="none";
    box.style.maxHeight="none";

    var x=parseInt((q("crop-x")||{}).value,10),y=parseInt((q("crop-y")||{}).value,10),w=parseInt((q("crop-width")||{}).value,10),h=parseInt((q("crop-height")||{}).value,10);
    if(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0){
      box.style.left=Math.round(Math.max(0,x)/r.scaleX)+"px";
      box.style.top=Math.round(Math.max(0,y)/r.scaleY)+"px";
      box.style.width=Math.max(1,Math.round(w/r.scaleX))+"px";
      box.style.height=Math.max(1,Math.round(h/r.scaleY))+"px";
    }else{
      box.style.left="0px";
      box.style.top="0px";
    }
  }

  function bindEvents(){
    if(eventsBound)return;
    eventsBound=true;
    var schedule=function(){requestAnimationFrame(sync);};
    document.addEventListener("pointermove",function(){
      var stage=q("image-preview-stage"),panel=q("image-crop-panel");
      if(stage&&panel&&!panel.classList.contains("image-hidden")&&stage.classList.contains("image-layers-active"))schedule();
    },false);
    document.addEventListener("pointerup",function(){
      var stage=q("image-preview-stage"),panel=q("image-crop-panel");
      if(stage&&panel&&!panel.classList.contains("image-hidden")&&stage.classList.contains("image-layers-active"))schedule();
    },false);
  }

  function init(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel");
    if(!stage||!panel)return;
    sync();bindEvents();
    if(window.ResizeObserver){
      if(ro)try{ro.disconnect();}catch(_){ }
      ro=new ResizeObserver(function(){requestAnimationFrame(sync);});
      ro.observe(stage);
      var img=q("image-preview-img"),layers=q("image-layers-canvas");
      if(img)ro.observe(img);
      if(layers)ro.observe(layers);
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
