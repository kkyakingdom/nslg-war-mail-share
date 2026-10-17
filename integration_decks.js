/* Real collection-based observation rates, not game-wide probabilities. */
(function(){'use strict';
const S={decks:[],meta:null,loaded:false,error:'',lastRefreshReport:''};
window.NSLG_INTEGRATION={
 state:S,
 rate(kind,candidate,selected,hero){
  if(!S.loaded)return null;
  const before=Array.from(new Set((selected||[]).filter(Boolean).map(String)));
  
  if(kind==='skill'&&!hero)return null;
  const baseline=S.decks.filter(d=>kind==='hero'?before.every(h=>d.h.includes(h)):d.h.includes(String(hero)));
  const denominator=baseline.length;
  if(!denominator)return {n:0,den:0,pct:null};
  const wanted=String(candidate);
  const matched=baseline.filter(d=>kind==='hero'?d.h.includes(wanted):((d.s[String(hero)]||[]).includes(wanted)));
  return {n:matched.length,den:denominator,pct:Math.round(matched.length*1000/denominator)/10};
 }
};
const PERIOD_MS=window.NSLG_PUBLIC_CATALOG ? 60*1000 : 15*1000; // Version-only poll: public 60s, local 15s.
let isRefreshing=false;
let currentRevision='';
let lastCheckAt=0;
const banner=()=>document.querySelector('#deckPanel .nslg-stats-banner');
// The deck pane is redrawn when heroes/skills or presets change. Attach the
// refresh control after each draw without altering the original deck module.
function attachManualRefresh(){
 const head=document.querySelector('#deckPanel .deck-head');if(!head||head.querySelector('#nslgRefreshStats'))return;
 const controls=head.querySelector('div')||head;
 const btn=document.createElement('button');btn.id='nslgRefreshStats';btn.type='button';btn.className='deck-action';
 btn.textContent='↻ 채용률 지금 갱신';btn.title='지금 저장된 전체 전보를 다시 집계합니다';
 controls.insertBefore(btn,controls.firstChild);
 btn.addEventListener('click',manualRefresh);
 if(S.loaded||S.error)updateBanner(S.error);
}
const deckPanel=document.getElementById('deckPanel');
if(deckPanel){new MutationObserver(attachManualRefresh).observe(deckPanel,{childList:true});attachManualRefresh()}
async function manualRefresh(){
 const before={unique:Number(S.meta?.uniqueDecks||0),sourceRows:Number(S.meta?.sourceDetailRows||0),battles:Number(S.meta?.sourceBattles||0)};
 S.lastRefreshReport='';
 const button=document.querySelector('#nslgRefreshStats');if(button){button.disabled=true;button.textContent='채용률 갱신 중…'}
 try{
  const res=await fetch('/api/integration-stats-refresh',{method:'POST',cache:'no-store'});
  if(!res.ok)throw Error('수동 갱신 요청 HTTP '+res.status);
  const data=await res.json();if(!data.ok)throw Error(data.message||'갱신 요청 실패');
  updateBanner('새 전보의 채용률을 다시 계산 중');
  // Poll only during an explicit refresh, never on every keypress.
  for(let i=0;i<30;i++){
   await new Promise(resolve=>setTimeout(resolve,1500));
   const statusResponse=await fetch('/api/integration-stats-status',{cache:'no-store'});
   if(!statusResponse.ok)throw Error('갱신 상태 확인 실패');
   const stat=await statusResponse.json();
   if(!stat.refreshing){
    if(stat.error)throw Error(stat.error);
    await load(false);
    if(S.error&&String(S.error).includes('집계 중')){
      // A concurrent background request may have delivered an older snapshot.
      await new Promise(resolve=>setTimeout(resolve,300));
      await load(false);
    }
    if(!S.loaded)throw Error(S.error||'갱신된 전보 통계를 불러오지 못했습니다.');
    if(S.meta?.staleReason)throw Error('집계는 끝났지만 서버가 이전 통계를 돌려주었습니다: '+S.meta.staleReason);
    const now={unique:Number(S.meta?.uniqueDecks||0),sourceRows:Number(S.meta?.sourceDetailRows||0),battles:Number(S.meta?.sourceBattles||0)};
    const delta=now.unique-before.unique;
    S.lastRefreshReport=`수동 재집계 완료 · 전보 원본 ${now.battles.toLocaleString('ko-KR')}건 / 장수 상세 ${now.sourceRows.toLocaleString('ko-KR')}행 · 고유 덱 ${delta>0?'+':''}${delta}개${delta===0?' (새 전보가 기존 덱 구성과 같거나 수집 데이터가 아직 반영되지 않았을 수 있습니다)':''}`;
    updateBanner();return;
   }
  }
  throw Error('집계 시간이 오래 걸립니다. 잠시 후 다시 확인해 주세요.');
 }catch(e){updateBanner('수동 갱신 실패 · 이전 정상 채용률 유지: '+String(e.message||e));}
 finally{if(button?.isConnected){button.disabled=false;button.textContent='↻ 채용률 지금 갱신'}}
}
function formatBanner(){
 if(!S.loaded)return '전보 통계 연결 대기 · 채용률은 전보 수집 후 표시됩니다.';
 const count=Number(S.meta?.uniqueDecks||0).toLocaleString('ko-KR');
 const ts=S.meta?.sourceDataUpdatedAt;
 const stamp=ts?(' · 수집 데이터 '+new Date(ts).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})):'';
 return `전보 고유 편성 ${count}개 · 전보 ${Number(S.meta?.sourceBattles||0).toLocaleString('ko-KR')}건 · 장수 상세 ${Number(S.meta?.sourceDetailRows||0).toLocaleString('ko-KR')}행 · ${window.NSLG_PUBLIC_CATALOG?'1분':'15초'} 자동 확인${stamp} · ${S.meta?.source==='누적 전보 CSV'?'누적 CSV 복구 집계':'원본 data.js 집계'}${S.lastRefreshReport?' | '+S.lastRefreshReport:''}`;
}
function updateBanner(error){
 const hint=banner();if(!hint)return;
 if(!error){hint.textContent=formatBanner();return}
 const pending=String(error).includes('집계 중')||String(error).includes('계산 중');
 hint.textContent=pending?`새 전보 집계 중 · 이전 정상 통계 유지 (${error})`:`통계 갱신 실패 · 마지막 정상 채용률 유지 (${error})`;
}
async function load(verifyOnly=false){
 if(isRefreshing){for(let n=0;n<30&&isRefreshing;n++)await new Promise(r=>setTimeout(r,100));if(isRefreshing)throw Error('이전 통계 요청이 완료되지 않았습니다.')}
 isRefreshing=true;lastCheckAt=Date.now();
 try{
  if(verifyOnly&&currentRevision){
    const check=await fetch('/api/integration-stats-version',{cache:'no-store'});
    if(!check.ok)throw Error('변경 검사 HTTP '+check.status);
    const version=await check.json();
    if(!version.ok||!version.revision)throw Error('변경 검사 응답 오류');
    if(version.revision===currentRevision){updateBanner();return}
  }
  const r=await fetch('/api/integration-stats',{cache:'no-store'});
  if(!r.ok){let detail='';try{detail=(await r.json()).error||''}catch(_){}throw Error('통계 HTTP '+r.status+(detail?' · '+detail:''));}
  const data=await r.json();
  if(!Array.isArray(data.decks))throw Error('통계 형식 오류');
  S.decks=data.decks;S.meta=data.meta;S.loaded=true;S.error=String(data.meta?.staleReason||'');
  currentRevision=String(data.meta?.revision||'');
  updateBanner(S.error);
  window.dispatchEvent(new CustomEvent('nslg-stats-ready',{detail:{revision:currentRevision,uniqueDecks:data.meta?.uniqueDecks}}));
  const active=document.activeElement;
  // Reopen matching candidates to update visible percentage without overwriting inputs.
  if(active?.matches?.('#deckPanel .deck-input'))
    active.dispatchEvent(new Event('input',{bubbles:true}));
 }catch(e){
  S.error=String(e.message||e);
  updateBanner(S.error);
  console.warn('전보 통계 갱신 실패',e);
 }finally{isRefreshing=false}
}
load();
window.setInterval(()=>{if(document.visibilityState!=='hidden')load(true)},PERIOD_MS);
// Resume one light revision check when a background browser tab becomes visible.
window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load(true)});
window.addEventListener('click',()=>{if(S.loaded&&!S.error)updateBanner()},true);

})();

/* Deep-link from collected battle IDs to the corresponding catalog detail popup. */
(()=>{'use strict';
const q=new URLSearchParams(location.search);
const rawHero=q.get('hero'),rawSkill=q.get('skill');
if(!rawHero&&!rawSkill)return;
const validId=s=>s&&/^\d{1,9}$/.test(s);
const show=()=>{
 if(typeof window.openDetail!=='function')return;
 if(validId(rawHero)){
  const hero=H.find(x=>String(x.ID)===rawHero);
  if(hero){window.openDetail({kind:'hero',x:hero},H.map(x=>({kind:'hero',x})));return;}
 }
 if(validId(rawSkill)){
  const skill=G.find(x=>String(x.ID)===rawSkill);
  if(skill){window.openDetail({kind:'skill',x:skill},G.map(x=>({kind:'skill',x})));return;}
 }
 const info=document.createElement('p');info.textContent='도감에 일치하는 원본 ID를 찾지 못했습니다.';info.style.color='#dda66e';document.body.prepend(info);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();
})();

/* v1.0.6: catalog is the launch screen, open its deck planner automatically. */
(()=>{
 const params=new URLSearchParams(location.search);
 if(params.get('startDeck')!=='1'||params.has('hero')||params.has('skill'))return;
 const open=()=>{const btn=document.getElementById('deckTab');if(btn)btn.click()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',open,{once:true});else open();
})();
