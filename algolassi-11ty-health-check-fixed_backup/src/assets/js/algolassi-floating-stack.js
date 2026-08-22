/* Algolassi floating stack - news, radio and chat share one dynamic stack. */
(function () {
  "use strict";
  var GAP=14, BASE_DESKTOP=18, BASE_MOBILE=10, NEWS_BUTTON_ID="algolassi-news-reopen";
  var timer=null, newsObserver=null, applyingNews=false, hiddenNewsToast=null;
  function baseBottom(){return window.innerWidth<=600?BASE_MOBILE:BASE_DESKTOP;}
  function visibleRect(el){if(!el)return null;var cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden"||cs.opacity==="0"||el.getAttribute("aria-hidden")==="true")return null;var r=el.getBoundingClientRect();return r.width>0&&r.height>0?r:null;}
  function assistantHost(){return document.getElementById("algolassi-assistant-host");}
  function newsToast(){var h=assistantHost();if(!h)return null;var t=h.querySelector(".algolassi-assistant-news")||h.querySelector(".algolassi-assistant-toast");return visibleRect(t);}
  function newsLauncher(){return visibleRect(document.getElementById(NEWS_BUTTON_ID));}
  function radioLauncher(){return visibleRect(document.getElementById("algolassi-radio-reopen"));}
  function radioCard(){return visibleRect(document.getElementById("algolassi-radio-host"));}
  function chatLauncher(){var b=document.getElementById("algolassi-chat-reopen-button");return visibleRect(b&&b.classList.contains("is-visible")?b:null);}
  function chatCard(){var h=document.getElementById("algolassi-chat-presence-host");if(!h||h.classList.contains("algolassi-chat-toggle-hidden")||h.classList.contains("algolassi-chat-is-hidden"))return null;return visibleRect(h.querySelector(".algolassi-chat-presence-card"));}
  function ensureNewsButton(toast){
    if(!toast||applyingNews)return;
    var head=toast.querySelector(".algolassi-assistant-head");
    if(!head)return;
    var existing=head.querySelector(".algolassi-news-hide");
    if(existing){existing.style.setProperty("display","inline-flex","important");existing.style.flexShrink="0";existing.style.visibility="visible";existing.style.opacity="1";existing.style.pointerEvents="auto";return;}
    applyingNews=true;
    try{
      var b=document.createElement("button");
      b.type="button";b.className="algolassi-assistant-action algolassi-news-hide";b.setAttribute("aria-label","Hide news");b.title="Hide news";b.textContent="✕ Hide";
      b.style.cssText="margin-left:auto!important;flex-shrink:0;display:inline-flex!important;align-items:center;justify-content:center;border:0;border-radius:7px;background:#111827;color:#fff;font-size:12px;line-height:1;cursor:pointer;padding:6px 9px;white-space:nowrap;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative;z-index:2147483647;";
      b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();hideNewsToast(toast);},false);head.appendChild(b);
    }finally{applyingNews=false;}
  }
  function hideNewsToast(toast){var h=assistantHost();if(!toast||!h||!h.contains(toast))return;hiddenNewsToast=toast;toast.classList.add("algolassi-assistant-toast-hide");setTimeout(function(){if(h.contains(toast))h.removeChild(toast);showNewsLauncher();updateAll();},200);try{window.dispatchEvent(new Event("algolassi:news-layout-change"));}catch(e){}}
  function removeNewsLauncher(){var b=document.getElementById(NEWS_BUTTON_ID);if(b)b.remove();}
  function reopenNews(){var h=assistantHost();if(!h||!hiddenNewsToast)return;hiddenNewsToast.classList.remove("algolassi-assistant-toast-hide");h.innerHTML="";h.appendChild(hiddenNewsToast);ensureNewsButton(hiddenNewsToast);removeNewsLauncher();hiddenNewsToast=null;settle();}
  function showNewsLauncher(){if(document.getElementById(NEWS_BUTTON_ID))return;var b=document.createElement("button");b.id=NEWS_BUTTON_ID;b.type="button";b.textContent="📰";b.setAttribute("aria-label","Show news");b.title="Show news";b.style.cssText="position:fixed;right:14px;bottom:14px;z-index:2147483646;width:46px;height:46px;border:0;border-radius:50%;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);background:#fff;";b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();reopenNews();try{window.dispatchEvent(new Event("algolassi:news-reopen"));}catch(err){}},false);document.body.appendChild(b);updateAll();}
  function syncNewsLauncher(){var t=newsToast(),b=document.getElementById(NEWS_BUTTON_ID);if(t){hiddenNewsToast=null;ensureNewsButton(t);if(b)b.remove();}}
  function setBottom(el,b){if(el)el.style.bottom=Math.max(baseBottom(),b)+"px";}
  function h(rect,fallback){return rect?rect.height:fallback;}
  function bottomAbove(rect){return rect?window.innerHeight-rect.top+GAP:baseBottom();}
  function updateAll(){
    syncNewsLauncher();
    var news=newsToast(),nmini=newsLauncher(),rbEl=document.getElementById("algolassi-radio-reopen"),rb=radioLauncher(),rc=radioCard(),cbEl=document.getElementById("algolassi-chat-reopen-button"),cb=chatLauncher(),ch=document.getElementById("algolassi-chat-presence-host"),radioEl=document.getElementById("algolassi-radio-host");

    /* 1) Place the lower stack first. */
    var cursor=baseBottom();
    if(nmini){setBottom(document.getElementById(NEWS_BUTTON_ID),cursor);cursor+=h(nmini,46)+GAP;}
    else if(news){cursor=bottomAbove(news);}

    if(rb){
      setBottom(rbEl,cursor);
    } else if(rc&&radioEl){
      setBottom(radioEl,news?bottomAbove(news):baseBottom());
    }

    /* Re-read Radio after positioning it. This is important because the Chat
       position must be based on Radio's NEW rectangle, not its previous one. */
    var placedRadio=radioLauncher()||radioCard();

    if(rb){cursor=bottomAbove(placedRadio);}
    else if(rc){cursor=bottomAbove(placedRadio);}
    else if(news){cursor=bottomAbove(news);}
    else if(nmini){cursor+=GAP;}
    else{cursor=baseBottom();}

    /* 2) Place restored/minimized Chat above the now-settled lower item. */
    if(ccSafe()){ 
      var cc=chatCard();
      if(cc&&ch){
        setBottom(ch,cursor);
        ch.style.zIndex="2147483004";
      }
    }
    if(cb){
      setBottom(cbEl,cursor);
      cbEl.style.zIndex="2147483005";
    }

    if(assistantHost())assistantHost().style.zIndex="2147483000";
    if(radioEl)radioEl.style.zIndex="2147483001";
    if(rbEl&&rb)rbEl.style.zIndex="2147483002";
  }
  function ccSafe(){var h=document.getElementById("algolassi-chat-presence-host");return !!h&&!h.classList.contains("algolassi-chat-toggle-hidden")&&!h.classList.contains("algolassi-chat-is-hidden");}
  function settle(){updateAll();[0,20,40,80,120,200,300,500,800].forEach(function(d){setTimeout(updateAll,d);});}
  function start(){settle();window.addEventListener("resize",settle,{passive:true});window.addEventListener("scroll",updateAll,{passive:true});window.addEventListener("algolassi:radio-layout-change",settle);window.addEventListener("algolassi:spa-navigation",settle);window.addEventListener("algolassi:news-layout-change",settle);window.addEventListener("algolassi:news-reopen",settle);window.addEventListener("algolassi:chat-layout-change",settle);window.addEventListener("algolassi:chat-restored",settle);
    if(window.MutationObserver){newsObserver=new MutationObserver(function(){settle();});[document.getElementById("algolassi-chat-presence-host"),document.getElementById("algolassi-radio-host"),document.getElementById("algolassi-radio-reopen"),document.getElementById("algolassi-assistant-host")].forEach(function(x){if(x)newsObserver.observe(x,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class","aria-hidden"]});});}
    if(window.ResizeObserver){var ro=new ResizeObserver(function(){settle();});[document.getElementById("algolassi-chat-presence-host"),document.getElementById("algolassi-radio-host"),document.getElementById("algolassi-radio-reopen"),document.getElementById("algolassi-assistant-host")].forEach(function(x){if(x)ro.observe(x);});}
    timer=setInterval(updateAll,250);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
