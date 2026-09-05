/* Algolassi Image Tools - crop coordinate alignment fix. */
(function(){
  "use strict";
  function q(id){return document.getElementById(id);}

  function imageRect(){
    var stage=q("image-preview-stage"),img=q("image-preview-img");
    if(!stage||!img||!img.naturalWidth)return null;
    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    if(!ir.width||!ir.height)return null;
    return {
      left:ir.left,top:ir.top,width:ir.width,height:ir.height,
      stageLeft:sr.left,stageTop:sr.top,
      scaleX:img.naturalWidth/ir.width,
      scaleY:img.naturalHeight/ir.height
    };
  }

  var active=false,start=null;

  function point(e,r){
    return {x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))};
  }

  function prepareOverlay(overlay,stage){
    var sr=stage.getBoundingClientRect();
    overlay.style.position="absolute";
    overlay.style.left="0px";
    overlay.style.top="0px";
    overlay.style.width=Math.max(1,Math.round(sr.width))+"px";
    overlay.style.height=Math.max(1,Math.round(sr.height))+"px";
    overlay.style.right="auto";
    overlay.style.bottom="auto";
    overlay.style.margin="0";
    overlay.style.padding="0";
    overlay.style.border="0";
    overlay.style.boxSizing="border-box";
    overlay.style.maxWidth="none";
    overlay.style.maxHeight="none";
  }

  function render(a,b,r){
    var stage=q("image-preview-stage"),overlay=q("image-crop-overlay"),box=q("image-crop-rectangle");
    if(!stage||!overlay||!box)return null;
    var x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);
    prepareOverlay(overlay,stage);

    box.style.position="absolute";
    box.style.left=Math.round((r.left-r.stageLeft)+x)+"px";
    box.style.top=Math.round((r.top-r.stageTop)+y)+"px";
    box.style.transform="none";
    box.style.margin="0";
    box.style.padding="0";
    box.style.boxSizing="border-box";
    box.style.maxWidth="none";
    box.style.maxHeight="none";
    box.style.width=Math.max(1,Math.round(w))+"px";
    box.style.height=Math.max(1,Math.round(h))+"px";
    overlay.classList.remove("image-hidden");
    var live=q("crop-live-size");
    if(live)live.textContent=Math.max(1,Math.round(w*r.scaleX))+" × "+Math.max(1,Math.round(h*r.scaleY));
    return {x:x,y:y,w:w,h:h,r:r};
  }

  function finish(sel){
    if(!sel)return;
    var x=Math.round(sel.x*sel.r.scaleX),y=Math.round(sel.y*sel.r.scaleY),w=Math.max(1,Math.round(sel.w*sel.r.scaleX)),h=Math.max(1,Math.round(sel.h*sel.r.scaleY));
    if(q("crop-x"))q("crop-x").value=x;
    if(q("crop-y"))q("crop-y").value=y;
    if(q("crop-width"))q("crop-width").value=w;
    if(q("crop-height"))q("crop-height").value=h;
    if(q("crop-live-size"))q("crop-live-size").textContent=w+" × "+h;
    var s=q("image-status");if(s){s.textContent="Crop selected. Create Cropped Version to apply it.";s.classList.add("image-status-good");}
  }

  function bind(){
    var stage=q("image-preview-stage"),panel=q("image-crop-panel");
    if(!stage||!panel||stage.dataset.cropAlignmentFixBound==="1")return;
    stage.dataset.cropAlignmentFixBound="1";
    stage.addEventListener("pointerdown",function(e){
      if(panel.classList.contains("image-hidden"))return;
      var t=e.target;if(t&&t.closest&&t.closest("button,input,select,textarea,#image-scale-preview"))return;
      var r=imageRect();if(!r)return;active=true;start=point(e,r);
      try{stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);}catch(_){}
      e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    },true);
    stage.addEventListener("pointermove",function(e){
      if(!active||panel.classList.contains("image-hidden"))return;
      var r=imageRect();if(!r)return;render(start,point(e,r),r);
      e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    },true);
    stage.addEventListener("pointerup",function(e){
      if(!active)return;var r=imageRect();active=false;if(r)finish(render(start,point(e,r),r));
      try{stage.releasePointerCapture&&stage.releasePointerCapture(e.pointerId);}catch(_){}
      e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    },true);
    stage.addEventListener("pointercancel",function(e){
      if(!active)return;active=false;start=null;
      try{stage.releasePointerCapture&&stage.releasePointerCapture(e.pointerId);}catch(_){}
      e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    },true);
    if(!window.__algolassiImageToolsResetCropAlignmentFix){
      window.__algolassiImageToolsResetCropAlignmentFix=function(){
        active=false;start=null;var overlay=q("image-crop-overlay"),box=q("image-crop-rectangle");
        if(overlay)overlay.classList.add("image-hidden");if(box)box.style.cssText="";
      };
    }
  }

  function init(){bind();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
})();
