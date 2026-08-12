/* Algolassi Chat - independent hide/reopen control */
(function () {
  "use strict";
  var STORAGE_KEY = "algolassi-chat-hidden-v2";
  var BUTTON_ID = "algolassi-chat-reopen-button";
  var GAP = 14;
  var ICON_SIZE = 42;
  var applying = false;

  function hidden(){try{return localStorage.getItem(STORAGE_KEY)==="1";}catch(e){return false;}}
  function setHidden(v){try{localStorage.setItem(STORAGE_KEY,v?"1":"0");}catch(e){}}
  function host(){return document.getElementById("algolassi-chat-presence-host");}

  function addStyles(){
    if(document.getElementById("algolassi-chat-toggle-styles"))return;
    var s=document.createElement("style");s.id="algolassi-chat-toggle-styles";
    s.textContent="#algolassi-chat-presence-host.algolassi-chat-toggle-hidden{display:none!important;}#"+BUTTON_ID+"{display:none!important;position:fixed;right:18px;bottom:18px;width:"+ICON_SIZE+"px;height:"+ICON_SIZE+"px;border:0;border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.28);font-size:21px;line-height:"+ICON_SIZE+"px;text-align:center;cursor:pointer;z-index:2147483647;padding:0}#"+BUTTON_ID+".is-visible{display:flex!important;align-items:center;justify-content:center}#"+BUTTON_ID+":hover{transform:scale(1.06)}#algolassi-chat-presence-host .algolassi-chat-toggle-hide{margin-left:auto;border:0;border-radius:7px;background:transparent;color:inherit;font-size:12px;line-height:1;cursor:pointer;padding:5px 8px}#algolassi-chat-presence-host .algolassi-chat-toggle-hide:hover{background:rgba(0,0,0,.08)}@media(max-width:600px){#"+BUTTON_ID+"{right:10px;width:40px;height:40px;line-height:40px;font-size:20px}}";
    document.head.appendChild(s);
  }

  function ensureButton(){
    var b=document.getElementById(BUTTON_ID);if(b)return b;
    b=document.createElement("button");b.id=BUTTON_ID;b.type="button";b.textContent="💬";b.setAttribute("aria-label","Open Algolassi Chat");b.title="Open Algolassi Chat";
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();setHidden(false);apply();var h=host();if(h)h.classList.remove("algolassi-chat-toggle-hidden","algolassi-chat-is-hidden");});
    document.body.appendChild(b);return b;
  }

  function visibleRect(el){if(!el)return null;var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<window.innerHeight?r:null;}

  function positionButton(){
    var b=document.getElementById(BUTTON_ID);if(!b)return;
    var base=window.innerWidth<=600?10:18;
    var radio=document.getElementById("algolassi-radio-host");
    var target=null;
    if(radio){target=visibleRect(radio.querySelector(".algolassi-radio-toast"));if(!target)target=visibleRect(radio.querySelector("button"));if(!target)target=visibleRect(radio);}
    if(target){var bottom=window.innerHeight-target.top+GAP;b.style.bottom=Math.max(bottom,base+ICON_SIZE+GAP)+"px";}
    else if(radio && hiddenRadioReopenLikely(radio)){b.style.bottom=(base+ICON_SIZE+GAP)+"px";}
    else{b.style.bottom=base+"px";}
    b.style.right=window.innerWidth<=600?"10px":"18px";
  }

  function hiddenRadioReopenLikely(radio){
    if(!radio)return false;
    var toast=radio.querySelector(".algolassi-radio-toast");
    if(toast && !visibleRect(toast))return true;
    var buttons=radio.querySelectorAll("button");
    if(buttons.length){for(var i=0;i<buttons.length;i++){if(!visibleRect(buttons[i]))continue;return false;}}
    return true;
  }

  /* The old X button performed the simple, reliable hide operation.
     Keep exactly that behavior on the new Hide button. */
  function hideChat(e){
    if(e){e.preventDefault();e.stopPropagation();}
    setHidden(true);
    var h=host();
    if(h)h.classList.add("algolassi-chat-toggle-hidden");
    var b=ensureButton();
    b.classList.add("is-visible");
    positionButton();
  }

  function showChat(e){
    if(e){e.preventDefault();e.stopPropagation();}
    setHidden(false);
    var h=host();
    if(h)h.classList.remove("algolassi-chat-toggle-hidden","algolassi-chat-is-hidden");
    var b=ensureButton();
    b.classList.remove("is-visible");
    positionButton();
  }

  /* Do not mutate the chat DOM from a MutationObserver. The chat renderer
     rebuilds its header, and observing those changes was causing the loop. */
  function bindHideClick(){
    if(document.documentElement.dataset.algolassiChatHideBound==="true")return;
    document.documentElement.dataset.algolassiChatHideBound="true";
    document.addEventListener("click",function(e){
      var target=e.target;
      if(!target||!target.closest)return;
      var hide=target.closest("#algolassi-chat-presence-host .algolassi-chat-toggle-hide");
      if(hide){hideChat(e);return;}
      var oldClose=target.closest("#algolassi-chat-presence-host #algolassi-chat-hide, #algolassi-chat-presence-host .algolassi-chat-hide");
      if(oldClose){hideChat(e);return;}
    },true);
  }

  function removeOldCloseButtons(){
    var h=host();if(!h)return;
    Array.prototype.slice.call(h.querySelectorAll("#algolassi-chat-hide, .algolassi-chat-hide, [aria-label='Close chat'], [title='Close chat']")).forEach(function(old){old.remove();});
  }

  function apply(){
    if(applying)return;applying=true;
    try{
      addStyles();
      var b=ensureButton(),h=host(),isHidden=hidden();
      removeOldCloseButtons();
      if(h&&isHidden)h.classList.add("algolassi-chat-toggle-hidden");
      else if(h)h.classList.remove("algolassi-chat-toggle-hidden","algolassi-chat-is-hidden");
      b.classList.toggle("is-visible",isHidden);
      positionButton();
    }finally{applying=false;}
  }

  function init(){
    addStyles();ensureButton();bindHideClick();
    try{if(localStorage.getItem(STORAGE_KEY)===null)localStorage.setItem(STORAGE_KEY,"0");}catch(e){}
    apply();
    window.addEventListener("resize",positionButton,{passive:true});
    window.addEventListener("scroll",positionButton,{passive:true});
    window.addEventListener("algolassi:spa-navigation",function(){setTimeout(apply,100);setTimeout(apply,600);});
    /* Re-apply state only; no DOM observer, so chat rendering cannot loop. */
    setInterval(apply,1500);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
