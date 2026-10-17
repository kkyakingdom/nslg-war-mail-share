/* Clear Analytics 2.0 · v1.0.17 accessibility and display controls.
   Presentation-only. No collector, catalog, API, statistics, or saved presets modified. */
(()=>{'use strict';
 const KEY='nslg.clear-analytics.display.v1';
 const DEFAULT={text:'normal',rows:'comfortable',strong:true,spacing:'normal',sticky:true};
 const choices={text:['normal','large','xl'],rows:['compact','comfortable'],spacing:['normal','wide']};
 const clean=v=>{
   const p=v&&typeof v==='object'?v:{};
   return {
     text:choices.text.includes(p.text)?p.text:DEFAULT.text,
     rows:choices.rows.includes(p.rows)?p.rows:DEFAULT.rows,
     strong:typeof p.strong==='boolean'?p.strong:DEFAULT.strong,
     spacing:choices.spacing.includes(p.spacing)?p.spacing:DEFAULT.spacing,
     sticky:typeof p.sticky==='boolean'?p.sticky:DEFAULT.sticky
   };
 };
 const load=()=>{try{return clean(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return {...DEFAULT}}};
 let settings=load();
 function apply(v){
   settings=clean(v);
   const b=document.body;if(!b)return;
   b.dataset.caText=settings.text;
   b.dataset.caRows=settings.rows;
   b.dataset.caStrong=settings.strong?'on':'off';
   b.dataset.caSpacing=settings.spacing;
   b.dataset.caSticky=settings.sticky?'on':'off';
 }
 function save(update){
   const next=clean({...settings,...update});
   try{localStorage.setItem(KEY,JSON.stringify(next))}catch(_){}
   apply(next);
   // Notify the currently opened same-origin analysis/catalog frames immediately.
   try{if(window.parent!==window){window.parent.dispatchEvent(new CustomEvent('nslg-display-change',{detail:next}));}}catch(_){}
   try{if(document.body.classList.contains('nslg-shell'))for(const frame of document.querySelectorAll('iframe'))frame.contentWindow?.NSLG_READABILITY?.apply(next)}catch(_){}
 }
 window.NSLG_READABILITY={get:()=>({...settings}),apply,save,defaults:()=>({...DEFAULT})};
 apply(settings);
 document.addEventListener('DOMContentLoaded',()=>apply(settings),{once:true});
 window.addEventListener('storage',e=>{if(e.key===KEY)apply(load())});
 window.addEventListener('nslg-display-change',e=>{
   apply(e.detail);
   for(const frame of document.querySelectorAll('#view iframe'))try{frame.contentWindow?.NSLG_READABILITY?.apply(e.detail)}catch(_){}
 });
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function renderSettings(mount){
   const S=settings;
   mount.innerHTML=`<div class="nslg-aux-head"><div><h2>관리 · 화면 표시 설정</h2><p>Clear Analytics 단일 디자인을 유지하며 글자와 통계표를 보기 편한 크기로 조절합니다. 이 브라우저에 자동 저장됩니다.</p></div><button id="nslgDisplayReset">기본값 복원</button></div>
    <div class="nslg-manager-tabs"><button id="nslgDisplayImages">이미지 관리</button><button id="nslgDisplayHeroes">장수 관리</button><button id="nslgDisplaySkills">전법 관리</button><button class="active" aria-current="page">화면 표시 설정</button></div>
    <div class="ca-display-grid">
      <label class="ca-display-field"><span>글씨 크기</span><small>본문·표·버튼·설명 크기를 함께 조절</small><select data-ca-control="text"><option value="normal" ${S.text==='normal'?'selected':''}>기본</option><option value="large" ${S.text==='large'?'selected':''}>크게</option><option value="xl" ${S.text==='xl'?'selected':''}>매우 크게</option></select></label>
      <label class="ca-display-field"><span>통계표 행 높이</span><small>전보·덱·상성·병종 표의 행 간격</small><select data-ca-control="rows"><option value="compact" ${S.rows==='compact'?'selected':''}>보통</option><option value="comfortable" ${S.rows==='comfortable'?'selected':''}>넓게</option></select></label>
      <label class="ca-display-field"><span>카드 간격</span><small>정보 카드 사이의 여유 공간</small><select data-ca-control="spacing"><option value="normal" ${S.spacing==='normal'?'selected':''}>보통</option><option value="wide" ${S.spacing==='wide'?'selected':''}>넓게</option></select></label>
      <label class="ca-display-field ca-display-check"><span>중요 숫자 굵게 표시</span><small>전적·승패·승률·점수·평균 돌파 강조</small><input type="checkbox" data-ca-control="strong" ${S.strong?'checked':''}></label>
      <label class="ca-display-field ca-display-check"><span>표 제목과 기준 열 고정</span><small>긴 상성·병종 표 스크롤 중 구분 유지</small><input type="checkbox" data-ca-control="sticky" ${S.sticky?'checked':''}></label>
    </div>
    <div class="ca-display-preview"><strong>화면 미리보기</strong><div class="ca-preview-stats"><span>전체 전적 <b>992전</b></span><span>승리 <b class="ca-preview-win">541승</b></span><span>패배 <b class="ca-preview-loss">451패</b></span><span>승률 <b>54.5%</b></span></div><p>설정은 즉시 반영되며 기존 전보와 프리셋, 분석 계산에는 영향을 주지 않습니다.</p></div>`;
   mount.querySelectorAll('[data-ca-control]').forEach(el=>el.addEventListener('change',()=>{
     const key=el.dataset.caControl;
     save({[key]:el.type==='checkbox'?el.checked:el.value});
     if(key==='text'){
       // Ensure controls in the editor also reflect the selected size immediately.
       el.closest('.ca-display-grid').dataset.font=settings.text;
     }
   }));
   mount.querySelector('#nslgDisplayReset').onclick=()=>{save(DEFAULT);renderSettings(mount)};
   mount.querySelector('#nslgDisplayImages').onclick=()=>document.getElementById('nslgImageManage')?.click();
   // Other manager tabs are wired by integration_catalog_extras.js after injection.
   mount.dispatchEvent(new CustomEvent('nslg-display-settings-rendered'));
 }
 window.NSLG_READABILITY.renderSettings=renderSettings;

 if(document.body.classList.contains('nslg-shell')||document.body.classList.contains('nslg-catalog'))return;
 // The collector renders table rows dynamically. Only decorate rendered markup,
 // never change statistics or the DOM's original event listeners.
 function decorateDeckRecords(){
   const root=document.getElementById('deckRows');if(!root)return;
   for(const el of root.querySelectorAll('.v6366DeckRecord .all,.v6366DeckRecord .fair')){
     if(el.dataset.caDecorated)return;
     const content=el.textContent.trim();
     const hit=content.match(/^([\d,]+)전\s*[·ㆍ]\s*([\d,]+)승\s+([\d,]+)패$/)
       || content.match(/^([\d,]+)승\s+([\d,]+)패$/);
     if(!hit)continue;
     const parts=hit.length===4?[[hit[1],'전','total'],[hit[2],'승','win'],[hit[3],'패','loss']]:[[hit[1],'승','win'],[hit[2],'패','loss']];
     const fragment=document.createDocumentFragment();
     for(const [n,s,cls] of parts){const tag=document.createElement('span');tag.className='ca-record-piece ca-record-'+cls;tag.textContent=n+s;fragment.append(tag)}
     el.replaceChildren(fragment);el.dataset.caDecorated='1';
   }
 }
 const deckRows=document.getElementById('deckRows');
 if(deckRows){decorateDeckRecords();new MutationObserver(decorateDeckRecords).observe(deckRows,{childList:true})}
 function tagPromoRoster(){const p=document.getElementById('v6423AlliancePromo');if(!p)return;
   const selected=p.querySelector('.v6423Band.active')?.dataset.band||'unknown';
   const roster=p.querySelector('.v6423Roster');if(roster)roster.dataset.selected=selected;
 }
 const alliances=document.getElementById('alliances');
 if(alliances){tagPromoRoster();new MutationObserver(tagPromoRoster).observe(alliances,{childList:true,subtree:true})}
})();
