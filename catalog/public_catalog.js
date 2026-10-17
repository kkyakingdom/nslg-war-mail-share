/* Public GitHub Pages: read-only catalog, local-only deck presets. */
(()=>{'use strict';
 const originalFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
  const url=String(input||'');
  if(url==='/api/integration-stats')return originalFetch('adoption_stats.json',{cache:'no-store'});
  if(url==='/api/skill-overrides')return originalFetch('assets/public_skill_overrides.json',{cache:'no-store'});
  if(url==='/api/tactic-overrides')return originalFetch('assets/public_tactic_overrides.json',{cache:'no-store'});
  if(url==='/api/integration-stats-version')return Promise.resolve(new Response(JSON.stringify({ok:true,revision:'static-public'}),{headers:{'Content-Type':'application/json'}}));
  if(url.startsWith('/api/'))return Promise.reject(new Error('공개 사이트에서는 관리자 편집을 할 수 없습니다.'));
  return originalFetch(input,init)
 };
 const prepare=()=>{
  const btn=document.getElementById('nslgRefreshStats');if(btn&&!btn.disabled){btn.disabled=true;btn.title='GitHub 공개본은 수집기 자동 공유 후 반영됩니다.';btn.textContent='공유 통계 자동 갱신';}
  document.querySelectorAll('#v90ManageTab,#v995TacticSave,#editSave').forEach(e=>e.style.display='none');
 };
 const setup=()=>{new MutationObserver(prepare).observe(document.body,{childList:true,subtree:true});prepare()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
