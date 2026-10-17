/* Public GitHub Pages: read-only catalog, local-only deck presets. */
(()=>{'use strict';
 const originalFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
  const url=String(input||'');
  if(url==='/api/integration-stats')return originalFetch('adoption_stats.json',{cache:'no-store'});
  if(url==='/api/skill-overrides')return originalFetch('assets/public_skill_overrides.json',{cache:'no-store'});
  if(url==='/api/tactic-overrides')return originalFetch('assets/public_tactic_overrides.json',{cache:'no-store'});
  // A tiny version file is published with the snapshot. Open GitHub Pages
  // tabs can detect new collected battles without downloading every deck.
  if(url==='/api/integration-stats-version')return originalFetch('adoption_version.json',{cache:'no-store'});
  if(url.startsWith('/api/'))return Promise.reject(new Error('공개 사이트에서는 관리자 편집을 할 수 없습니다.'));
  return originalFetch(input,init)
 };
 const prepare=()=>{
  const btn=document.getElementById('nslgRefreshStats');if(btn){
   if(!btn.disabled)btn.disabled=true;
   const title='GitHub 공개본은 수집기 자동 공유 후 반영됩니다.';
   if(btn.title!==title)btn.title=title;
   // Reassigning textContent on every MutationObserver callback creates a
   // new childList mutation and can keep the browser in an endless loop.
   if(btn.textContent!=='공유 통계 자동 갱신')btn.textContent='공유 통계 자동 갱신';
  }
  document.querySelectorAll('#v90ManageTab,#v995TacticSave,#editSave').forEach(e=>{
   if(e.style.display!=='none')e.style.display='none';
  });
 };
 const setup=()=>{new MutationObserver(prepare).observe(document.body,{childList:true,subtree:true});prepare()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
