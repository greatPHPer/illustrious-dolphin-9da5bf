/* Algolassi Image Tools - visual-only crop rectangle alignment. */
(function(){
  "use strict";

  function q(id){return document.getElementById(id);}
  var observer=null;

  function align(){
    var box=q("image-crop-rectangle"),stage=q("image-preview-stage"),img=q("image-preview-img");
    if(!box||!stage||!img||img.classList.contains("image-hidden")||!img.getBoundingClientRect)return;
    var cs=window.getComputedStyle(box);
    if(cs.display==="none")return;
    var left=parseFloat(box.style.left),top=parseFloat(box.style.top);
    if(!Number.isFinite(left)||!Number.isFinite(top))return;

    var ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    var offsetX=ir.left-sr.left,offsetY=ir.top-sr.top;
    var rawLeft=box.dataset.cropVisualRawLeft,rawTop=box.dataset.cropVisualRawTop;
    var currentLeft=box.style.left,currentTop=box.style.top;
    if(rawLeft===currentLeft&&rawTop===currentTop)return;

    box.dataset.cropVisualRawLeft=currentLeft;
    box.dataset.cropVisualRawTop=currentTop;
    box.style.boxSizing="border-box";
    box.style.left=Math.round(left+offsetX)+"px";
    box.style.top=Math.round(top+offsetY)+"px";
  }

  function init(){
    var stage=q("image-preview-stage"),box=q("image-crop-rectangle");
    if(!stage||!box)return;
    if(box.dataset.cropVisualFixBound==="1")return;
    box.dataset.cropVisualFixBound="1";
    align();
    observer=new MutationObserver(function(){requestAnimationFrame(align);});
    observer.observe(box,{attributes:true,attributeFilter:["style","class"]});
    window.addEventListener("resize",align);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.addEventListener("algolassi:spa-navigation",function(){requestAnimationFrame(init);});
})();
