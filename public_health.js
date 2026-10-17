/* GitHub Pages data integrity guard. Read-only: no collector/admin APIs. */
(()=>{'use strict';
 if(!window.NSLG_PUBLIC_MODE)return;
 const report=(message,failed)=>{
  let area=document.getElementById('nslg-public-health');
  if(!area){
   area=document.createElement('div');area.id='nslg-public-health';
   area.className='nslg-public-health';area.setAttribute('role','status');
   (document.querySelector('.wrap')||document.querySelector('main')||document.body).prepend(area);
  }
  area.hidden=!failed;
  if(failed){area.textContent='⚠ 전보 데이터 확인 필요 · '+message+' 관리자에게 GitHub 재공유를 요청해 주세요.';}
 };
 const valid=()=>{
  const meta=window.WARMAIL_META;
  const analyzed=window.WARMAIL_DATA;
  const full=window.WARMAIL_ALL_DATA;
  return !!meta && Array.isArray(analyzed) && Array.isArray(full) &&
   Number(meta.analysisCount)===analyzed.length &&
   Number(meta.rawPvpCount)===full.length &&
   (full.length===0 || analyzed.length>0);
 };
 const finish=()=>{
  if(!valid())return false;
  report('',false);
  // Counts are taken from actual arrays, never from stale collector status.js.
  const updated=document.getElementById('updated');
  if(updated && /분석\s*0건/.test(updated.textContent||'') && window.WARMAIL_DATA.length){
   updated.textContent=(window.WARMAIL_META.generatedAt||'공유 데이터')+
    ' · 분석 '+window.WARMAIL_DATA.length.toLocaleString()+'건';
  }
  return true;
 };
 document.addEventListener('DOMContentLoaded',async()=>{
  if(finish())return;
  // A script may have failed during deployment/CDN propagation. Retry once,
  // then apply the recovered rows through the original analysis refresh hooks.
  try{
   await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='data.js?nslg-public-retry='+Date.now();
    script.onload=resolve;script.onerror=()=>reject(new Error('data.js 로딩 실패'));
    document.head.append(script);
   });
   if(valid()){
    if(typeof window.v6261ApplyLoadedGlobals==='function'){
     window.v6261ApplyLoadedGlobals();
     if(typeof window.v6261RenderAfterDataRefresh==='function')
      window.v6261RenderAfterDataRefresh(0);
    }
    if(finish())return;
   }
  }catch(e){console.warn('[NSLG Public] Data retry:',e);}
  const count=Number(window.WARMAIL_META?.analysisCount??0);
  report(count>0?'게시된 데이터 수치와 실제 전보가 일치하지 않습니다.':'분석 데이터를 가져오지 못했습니다.',true);
 },{once:true});
})();
