/* Algolassi Image Tools - make Crop use the same visible surface as the image. */
(function(){
  "use strict";
  var ro=null,mo=null;
  function q(id){return document.getElementById(id);}

  function visibleSurface(){
    var stage=q("image-preview-stage");
    if(!stage)return null;
    var layers=stage.classList.contains("image-layers-active")?q("image-layers-canvas"):null;
    if(layers&&!layers.classList.contains("image-hidden")&&layers.width&&layers.height){
      var lr=layers.getBoundingClientRect(),sr=stage.getBoundingClientRect(),ratio=layers.width/layers.height;
      if(!lr.width||!lr.height||!ratio)return null;
      var width=lr.width,height=lr.height,left=lr.left,top=lr.top;
      if(lr.width/lr.height>ratio){width=lr.height*ratio;left=lr.left+(lr.width-width)/2;}
      else if(lr.width/lr.height<ratio){height=lr.width/ratio;top=lr.top+(lr.height-height)/2;}
      return {left:left,top:top,width:width,height:height,stageLeft:sr.left,stageTop:sr.top};
    }
    var img=q("image-preview-img");
    if(!img||img.classList.contains("image-hidden")||!img.naturalWidth)return null;
    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    if(!ir.width||!ir.height)return null;
    return {left:ir.left,top:ir.top,width:ir.width,height:ir.height,stageLeft:sr.left,stageTop:sr.top};
  }

  function sync(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel"),overlay=q("image-crop-overlay"),box=q("image-crop-rectangle");
    if(!stage||!panel||!overlay||!box)return;
    var surface=visibleSurface();
    var active=!panel.classList.contains("image-hidden");
    stage.classList.toggle("image-crop-active",active);
    if(!active||!surface)return;
    overlay.style.left=(surface.left-surface.stageLeft)+"px";
    overlay.style.top=(surface.top-surface.stageTop)+"px";
    overlay.style.width=surface.width+"px";
    overlay.style.height=surface.height+"px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
    overlay.style.margin="0";
    overlay.style.padding="0";
    overlay.style.boxSizing="border-box";
    box.style.margin="0";
    box.style.padding="0";
    box.style.boxSizing="border-box";
    box.style.transform="none";
  }

  function init(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel");
    if(!stage||!panel)return;
    sync();
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
