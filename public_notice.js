/* GitHub Pages read-only announcement (never includes an editing API). */
(()=>{'use strict';
 const targets=()=>document.querySelectorAll('[data-nslg-notice-text]');
 const scriptUrl=document.currentScript?.src||new URL('public_notice.js',document.baseURI).href;
 let lastRevision='';
 async function refresh(){
  try{
   const response=await fetch(new URL('notice.json?refresh='+Date.now(),scriptUrl),{cache:'no-store'});
   if(!response.ok)return;
   const notice=await response.json();
   if(typeof notice.text!=='string'||notice.text.length>2000||!notice.revision)return;
   if(notice.revision===lastRevision)return;
   lastRevision=notice.revision;
   targets().forEach(el=>{if(el.textContent!==notice.text)el.textContent=notice.text});
  }catch(_){} // Default server-rendered notice remains visible if CDN is stale or offline.
 }
 refresh();setInterval(()=>{if(!document.hidden)refresh()},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
