/* NSLG Deck Planner v9.11.0 — independent preset storage; do not mutate catalog originals. */
(()=>{'use strict';
const panel=document.getElementById('deckPanel'), button=document.getElementById('deckTab');if(!panel||!button)return;
const formations=['일자진','기형진','안형진','방원진','추형진','어린진','구행진','언월진'];
const STORAGE='nslg.decks.v1';const blank=()=>({formation:'',heroes:Array.from({length:3},()=>({id:'',skill1:'',skill2:'',books:['','',''],memo:''}))});
const defaults=()=>Array.from({length:5},()=>Array.from({length:5},blank));
let presets=defaults(),active=0,isOpen=false,openDrop=null;const expanded=[true,false,false,false,false];
try{const old=JSON.parse(localStorage.getItem(STORAGE)||'null');if(Array.isArray(old)&&old.length===5){presets=defaults().map((groups,pi)=>groups.map((unit,ui)=>{const o=old[pi]?.[ui];return o?{formation:formations.includes(o.formation)?o.formation:'',heroes:unit.heroes.map((slot,si)=>({id:String(o.heroes?.[si]?.id||''),skill1:String(o.heroes?.[si]?.skill1||''),skill2:String(o.heroes?.[si]?.skill2||''),books:Array.from({length:3},(_,bi)=>String(o.heroes?.[si]?.books?.[bi]||'')),memo:String(o.heroes?.[si]?.memo||'').slice(0,120)}))}:unit}))}}catch(err){console.warn('덱편성 저장값 읽기 실패',err)}
const heroes=H.filter(x=>x&&x.name_kr&&Number(x.ID)>0&&window.NSLG_CATALOG_VISIBILITY.isVisible(x,"hero"));
const skillIds=new Set(G.filter(x=>x&&x._catalog_role==='일반 장착 전법 후보').map(x=>String(x.ID)));
// Representative equipped-skill records are defined in catalog G; avoid warbook buff fragments.
const skills=G.filter(x=>skillIds.has(String(x.ID))&&x.name_kr&&window.NSLG_CATALOG_VISIBILITY.isVisible(x,"skill")).filter((x,i,a)=>a.findIndex(y=>String(y.ID)===String(x.ID))===i);
const byHero=new Map(heroes.map(h=>[String(h.ID),h])),bySkill=new Map(skills.map(s=>[String(s.ID),s]));
// The public warbook editions are three physical variants. Only the 선본
// edition is offered in hero/deck selection, and each hero's game-provided
// warbook allowed-type list is respected.
const bookMasters=T.filter(t=>String(t.name_kr||'').trim().endsWith('선본'));
const exclusiveBooks=T.filter(t=>t._catalog_role==='장수 전용 병법');
const byBook=new Map([...bookMasters,...exclusiveBooks].map(t=>[String(t.id),t]));
function exclusiveFor(heroId){
 const hero=byHero.get(String(heroId));if(!hero)return [];
 const ownType=Number(hero.ID)*100;
 // A hero's exclusive warbook is explicitly keyed by the game's type ID.
 // These books have names such as <철기령>, not the 선본 suffix.
 const allowed=new Set((hero.warbook||[]).flatMap(g=>Array.isArray(g)?g.filter((v,i)=>i%2===0).map(Number):[]));
 if(!allowed.has(ownType))return [];
 return exclusiveBooks.filter(b=>Number(b.type)===ownType);
}
function slotBooks(heroId,field){
 const common=permittedBooks(heroId);
 return field==='book0'?[...exclusiveFor(heroId),...common]:common;
}

function bookName(id){return byBook.get(String(id))?.name_kr||''}
function permittedBooks(heroId){
 const hero=byHero.get(String(heroId));if(!hero)return [];
 const allowed=new Set();for(const group of (Array.isArray(hero.warbook)?hero.warbook:[])){
  if(!Array.isArray(group))continue;
  for(let i=0;i+1<group.length;i+=2){const t=Number(group[i]);if(t>0)allowed.add(t)}
 }
 return bookMasters.filter(b=>allowed.has(Number(b.type)));
}

const escText=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(presets))}catch(e){notice('브라우저 저장 공간이 부족하거나 저장이 제한되어 있어요.',true)}}
function notice(t,bad=false){let el=panel.querySelector('.deck-status');if(el){el.textContent=t;el.style.color=bad?'#ffad97':'#a8d8ad'}}
function group(){return presets[active]}
function owner(kind,id,ui,si,field){if(!id)return null;for(let i=0;i<5;i++)for(let j=0;j<3;j++){const h=group()[i].heroes[j];if(kind==='hero'&&h.id===id&&!(i===ui&&j===si))return `${i+1}군 사용중`;if(kind==='skill'&&['skill1','skill2'].some(f=>h[f]===id&&!(i===ui&&j===si&&f===field)))return `${i+1}군 사용중`;if(kind==='book'&&i===ui&&j===si&&h.books?.some((value,b)=>value===id&&field!==`book${b}`))return '이 장수에게 사용중';}return null}
function setValue(kind,ui,si,field,id){const err=owner(kind,id,ui,si,field);if(err){notice(err+' — 중복 선택 불가',true);return false}const slot=group()[ui].heroes[si];if(kind==='book'){const n=Number(field.slice(4));if(!slot.id||!slotBooks(slot.id,field).some(b=>String(b.id)===id)){notice('해당 장수나 병법 칸에서는 이 병법을 선택할 수 없습니다.',true);return false}slot.books[n]=id}else slot[field]=id;if(field==='id'){/* Skill assignments belong to the slot; clear when changing hero */slot.skill1='';slot.skill2='';slot.books=['','','']}save();draw();notice((ui+1)+'군 '+(si+1)+'번째 '+(kind==='hero'?'장수':kind==='book'?'병법':'전법')+' 저장됨');return true}
function skillName(id){return bySkill.get(String(id))?.name_kr||SK[String(id)]?.name_kr||''}
function heroName(id){return byHero.get(String(id))?.name_kr||''}
function portrait(id){const hero=byHero.get(String(id));if(!hero)return '<div class="deck-placeholder">장수 선택</div>';return art(hero,'hero')}
function cell(ui,si,field,label){let id=field.startsWith('book')?group()[ui].heroes[si].books[Number(field.slice(4))]:group()[ui].heroes[si][field];let value=field==='id'?heroName(id):field.startsWith('book')?bookName(group()[ui].heroes[si].books[Number(field.slice(4))]):skillName(id);return `<div class="deck-cell"><input class="deck-input" data-u="${ui}" data-s="${si}" data-f="${field}" type="search" autocomplete="off" spellcheck="false" placeholder="${label} 검색" value="${escText(value)}" aria-label="${ui+1}군 ${si+1}번 ${label}"><div class="deck-slot-hint">${value?'선택됨 · 클릭하여 변경':'이름 입력 후 Enter로 선택'}</div></div>`}
function draw(){const top=`<div class="deck-head"><h2>덱편성 · 프리셋 ${active+1}</h2><div class="deck-head-actions"><button class="deck-action" id="deckCopy">이미지 복사</button> <button class="deck-action" id="deckPng">PNG 저장</button> <button type="button" class="deck-action deck-reset" id="deckReset" title="현재 선택한 프리셋의 1~5군만 초기화">프리셋 ${active+1} 초기화</button></div></div><div class="deck-presets">${Array.from({length:5},(_,i)=>`<button type="button" data-preset="${i}" class="${i===active?'active':''}">프리셋 ${i+1}</button>`).join('')}</div><p class="deck-hint">프리셋별 독립 저장 · 같은 프리셋의 1~5군은 장수/장착 전법 중복 불가 · 병법은 동일 장수의 3칸에서만 중복 불가 · 자동완성 방향키·Enter 지원 · 전법에 마우스를 올리면 설명 표시 · 전보 채용률은 수집된 고유 덱 기준(표본 수 표시)</p><div class="nslg-stats-banner" aria-live="polite">전보 통계 불러오는 중…</div><div class="deck-status" role="status"></div>`;
const rows=group().map((u,ui)=>`<section class="deck-unit ${expanded[ui]?'':'deck-unit-closed'}"><div class="deck-unit-title"><button type="button" class="deck-toggle" data-deck-toggle="${ui}" aria-expanded="${expanded[ui]}">${expanded[ui]?'▾':'▸'} ${ui+1}군 <small>${escText(u.heroes.map(h=>heroName(h.id)||'미선택').join(' · '))}</small></button><label class="deck-formation-wrap">진형 <input class="deck-formation" data-formation="${ui}" type="search" autocomplete="off" placeholder="진형 검색" value="${escText(u.formation)}"></label></div><div class="deck-unit-scroll"><div class="deck-table"><div class="deck-lbl">장수</div>${u.heroes.map((h,si)=>cell(ui,si,'id','장수 이름')).join('')}<div class="deck-lbl">초상화</div>${u.heroes.map(h=>`<div class="deck-cell"><div class="deck-portrait">${portrait(h.id)}</div></div>`).join('')}<div class="deck-lbl">고유 전법</div>${u.heroes.map(h=>{const hero=byHero.get(h.id),sid=hero?.init_skill;return `<div class="deck-cell deck-innate" data-tip-skill="${escText(sid||'')}">${escText(SK[String(sid)]?.name_kr||'장수를 선택하세요')}</div>`}).join('')}<div class="deck-lbl">전법 1</div>${u.heroes.map((h,si)=>cell(ui,si,'skill1','전법 1')).join('')}<div class="deck-lbl">전법 2</div>${u.heroes.map((h,si)=>cell(ui,si,'skill2','전법 2')).join('')}${[0,1,2].map((bi)=>`<div class="deck-lbl">병법 ${bi+1}${bi===0?' · 고유/선본':' · 선본'}</div>${u.heroes.map((h,si)=>cell(ui,si,'book'+bi,bi===0?'고유/선본 병법 1':'선본 병법 '+(bi+1))).join('')}`).join('')}<div class="deck-lbl">설명</div>${u.heroes.map((h,si)=>`<div class="deck-cell"><textarea class="deck-memo" data-u="${ui}" data-s="${si}" rows="2" maxlength="120" placeholder="사용자 설명을 입력하세요">${escText(h.memo||'')}</textarea></div>`).join('')}</div></div></section>`).join('');panel.innerHTML=top+rows;
for(const toggle of panel.querySelectorAll('[data-deck-toggle]'))toggle.addEventListener('click',()=>{const i=Number(toggle.dataset.deckToggle);expanded[i]=!expanded[i];closeTip();draw()});
for(const b of panel.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>{active=Number(b.dataset.preset);closeTip();draw()});
for(const input of panel.querySelectorAll('.deck-formation')){
 const ui=Number(input.dataset.formation);let selected=0,opts=[];
 function fill(){input.parentNode.querySelector('.deck-select-list')?.remove();const q=input.value.trim();opts=formations.filter(x=>x.includes(q));selected=0;const list=document.createElement('div');list.className='deck-select-list';list.innerHTML=opts.length?'':'<div class="deck-empty">진형 없음</div>';for(const [i,form] of opts.entries()){const op=document.createElement('button');op.type='button';op.className='deck-option'+(i===0?' highlight':'');op.textContent=form;op.addEventListener('mousedown',e=>e.preventDefault());op.onclick=()=>choose(form);list.append(op)}input.parentNode.append(list)}
 function choose(form){group()[ui].formation=form;save();draw();notice((ui+1)+'군 진형 '+form+' 저장됨')}
 input.addEventListener('input',fill);input.addEventListener('focus',fill);input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!opts.length)return;selected=(selected+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length;input.parentNode.querySelectorAll('.deck-option').forEach((o,i)=>o.classList.toggle('highlight',i===selected))}else if(e.key==='Enter'){e.preventDefault();if(opts.length)choose(opts[selected])}else if(e.key==='Escape'){input.parentNode.querySelector('.deck-select-list')?.remove();input.blur()}});
 input.addEventListener('blur',()=>setTimeout(()=>{if(!input.isConnected)return;input.value=group()[ui].formation;input.parentNode.querySelector('.deck-select-list')?.remove()},180));
 }
for(const inp of panel.querySelectorAll('.deck-input'))bindInput(inp);
for(const box of panel.querySelectorAll('.deck-memo')){
 box.addEventListener('input',()=>{group()[Number(box.dataset.u)].heroes[Number(box.dataset.s)].memo=box.value.slice(0,120);save()});
}

panel.querySelector('#deckCopy').addEventListener('click',()=>exportImage(true));panel.querySelector('#deckPng').addEventListener('click',()=>exportImage(false));
panel.querySelector('#deckReset').addEventListener('click',()=>{
 const target=active;
 if(!window.confirm(`프리셋 ${target+1}의 1~5군 편성을 모두 초기화할까요?\n장수·전법·병법·진형·메모가 삭제됩니다.\n다른 프리셋은 유지되며, 초기화는 되돌릴 수 없습니다.`))return;
 presets[target]=Array.from({length:5},blank);
 save();closeTip();draw();notice(`프리셋 ${target+1}만 초기화했습니다. 다른 프리셋은 유지됩니다.`);
});
}
function adoptionLabel(kind,x,ui,si){
 const api=window.NSLG_INTEGRATION;if(!api?.state?.loaded)return '';
 let rate=null;
 if(kind==='hero'){
  const selected=group()[ui].heroes.map((h,i)=>i===si?'':h.id).filter(Boolean);
  rate=api.rate('hero',String(x.ID),selected);
 }else{
  const slot=group()[ui].heroes[si];if(!slot.id)return '';
  rate=api.rate('skill',String(x._catalog_primary||x.ID),[],slot.id);
 }
 if(!rate)return '';
 if(!rate.den)return '<small class="nslg-rate-none">전보 표본 없음</small>';
 return `<small class="nslg-rate">${kind==='hero'?(group()[ui].heroes.some((h,i)=>i!==si&&h.id)?'동반 편성':'전체 출현'):'전법 채용'} ${rate.pct.toFixed(1)}% <em>${rate.n}/${rate.den}덱</em></small>`;
}
function bindInput(input){const ui=Number(input.dataset.u),si=Number(input.dataset.s),field=input.dataset.f,kind=field==='id'?'hero':field.startsWith('book')?'book':'skill';const source=kind==='hero'?heroes:kind==='book'?slotBooks(group()[ui].heroes[si].id,field):skills;let matches=[],selected=0;
const close=()=>{input.parentNode.querySelector('.deck-select-list')?.remove();if(openDrop===close)openDrop=null};
function fill(){close();const q=input.value.trim().toLocaleLowerCase();const api=window.NSLG_INTEGRATION;const ranked=x=>{if(!api?.state?.loaded)return -1;if(kind==='hero'){const chosen=group()[ui].heroes.map((h,i)=>i===si?'':h.id).filter(Boolean);return api.rate('hero',String(x.ID),chosen)?.pct??-1;}if(kind==='book')return -1;const hid=group()[ui].heroes[si].id;if(!hid)return -1;return api.rate('skill',String(x._catalog_primary||x.ID),[],hid)?.pct??-1;};let candidates=source.filter(x=>!q||String(x.name_kr).toLocaleLowerCase().includes(q)||String(x.ID??x.id).includes(q));if(!q){candidates=candidates.map(x=>({x,p:ranked(x)})).sort((a,b)=>b.p-a.p||String(a.x.name_kr).localeCompare(String(b.x.name_kr),'ko')).map(e=>e.x);}matches=candidates.slice(0,35);selected=Math.max(0,matches.findIndex(x=>!owner(kind,String(x.ID??x.id),ui,si,field)));const list=document.createElement('div');list.className='deck-select-list';list.setAttribute('role','listbox');if(!matches.length)list.innerHTML='<div class="deck-empty">일치하는 항목 없음</div>';for(const [n,x] of matches.entries()){const id=String(x.ID??x.id),taken=owner(kind,id,ui,si,field);const op=document.createElement('button');op.type='button';op.className='deck-option'+(!taken&&n===selected?' highlight':'');if(kind==='skill')op.dataset.tipSkill=id;if(kind==='book')op.dataset.tipBook=id;op.disabled=Boolean(taken);op.innerHTML=`<span>${escText(x.name_kr)} <small>· ${kind==='book'?(x._catalog_role==='장수 전용 병법'?'고유 병법 · ':'선본 병법 · '):kind==='skill'?escText([x.skill_type_kr||x.skill_type||x.type_name||'',x.skill_character_kr||x.skill_character||''].filter(Boolean).join(' · ')||'장착 전법')+' · ':''}ID ${escText(id)}</small></span>${taken?`<small>${escText(taken)}</small>`:(kind==='book'?'':adoptionLabel(kind,x,ui,si))}`;op.addEventListener('mousedown',e=>e.preventDefault());op.addEventListener('click',()=>setValue(kind,ui,si,field,id));list.append(op)}input.parentNode.append(list);openDrop=close}
input.addEventListener('input',fill);input.addEventListener('focus',()=>{input.select();fill()});input.addEventListener('blur',()=>{setTimeout(()=>{if(!input.isConnected)return;close();const id=kind==='book'?group()[ui].heroes[si].books[Number(field.slice(4))]:group()[ui].heroes[si][field];input.value=kind==='hero'?heroName(id):kind==='book'?bookName(id):skillName(id)},180)});
input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();input.blur();return}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!matches.length)return;let delta=e.key==='ArrowDown'?1:-1;for(let n=0;n<matches.length;n++){selected=(selected+delta+matches.length)%matches.length;if(!owner(kind,String(matches[selected].ID??matches[selected].id),ui,si,field))break}input.parentNode.querySelectorAll('.deck-option').forEach((el,i)=>el.classList.toggle('highlight',i===selected));return}if(e.key==='Enter'){e.preventDefault();if(!matches.length)return;let chosen=matches[selected];if(!chosen||owner(kind,String(chosen.ID??chosen.id),ui,si,field)){chosen=matches.find(x=>!owner(kind,String(x.ID??x.id),ui,si,field))}if(chosen)setValue(kind,ui,si,field,String(chosen.ID??chosen.id));else notice('검색한 항목은 다른 군에서 사용중입니다.',true)}})
}
let tip=null;function closeTip(){tip?.remove();tip=null}
function showTip(kind,id,evt){
 const item=kind==='book'?byBook.get(String(id)):SK[String(id)];if(!item)return;
 closeTip();tip=document.createElement('div');tip.className='deck-tooltip';
 let raw='';if(kind==='book'){
  const ov=window.NSLG_TACTIC_EDITOR?.override?.(id)||{};
  raw=ov.description_kr||item.description_kr||'병법 효과 설명이 없습니다.';
 }else{
  raw=item.description_kr||'전법 설명이 없습니다.';
  try{if(window.NSLG_V996?.renderSkill){const out=window.NSLG_V996.renderSkill(item,10,0);if(out&&typeof out.html==='string'){const tmp=document.createElement('div');tmp.innerHTML=out.html;raw=tmp.textContent||raw}}}catch(e){}
 }
 tip.innerHTML=`<strong>${escText(item.name_kr||'효과')} · ${kind==='book'?'병법 효과':'10레벨'}</strong><span>${escText(raw)}</span>`;
 document.body.append(tip);placeTip(evt);
}
function placeTip(e){if(!tip)return;tip.style.maxHeight='min(360px, 60vh)';tip.style.overflowY='auto';const w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(window.innerWidth-w-8,e.clientX+16))+'px';tip.style.top=Math.max(8,Math.min(window.innerHeight-h-8,e.clientY+18))+'px'}
panel.addEventListener('mouseover',e=>{
 const el=e.target.closest('[data-tip-skill],[data-tip-book],.deck-cell');if(!el)return;
 let kind=el.hasAttribute('data-tip-book')?'book':'skill';
 let id=kind==='book'?el.dataset.tipBook:el.dataset.tipSkill;
 if(!id){const inp=el.querySelector('.deck-input');if(inp){const field=inp.dataset.f,slot=group()[Number(inp.dataset.u)].heroes[Number(inp.dataset.s)];if(field.startsWith('book')){kind='book';id=slot.books[Number(field.slice(4))]}else if(field!=='id')id=slot[field]}}
 if(id&&(!tip||tip.dataset.item!==kind+':'+id)){showTip(kind,id,e);if(tip)tip.dataset.item=kind+':'+id}
});
panel.addEventListener('mousemove',placeTip);
panel.addEventListener('mouseout',e=>{if(!panel.contains(e.relatedTarget)||!e.target.closest('.deck-cell,[data-tip-skill],[data-tip-book]')?.contains(e.relatedTarget))closeTip()});
function screen(open){isOpen=open;panel.hidden=!open;button.classList.toggle('active',open);for(const id of ['grid','stats','progress','v90Manager']){const e=document.getElementById(id);if(e)e.style.display=open?'none':''}for(const selector of ['.v9108-filter-row','.v9108-search-row','.legend']){const e=document.querySelector(selector);if(e)e.style.display=open?'none':''}if(open){for(const id of ['allHTab','sTab','allSTab','tTab'])document.getElementById(id)?.classList.remove('active');draw()}else closeTip()}
button.addEventListener('click',()=>{screen(true);panel.scrollIntoView({behavior:'instant',block:'start'})});for(const id of ['allHTab','sTab','allSTab','tTab','v90ManageTab'])document.getElementById(id)?.addEventListener('click',()=>{if(isOpen)screen(false)});
async function loadImg(url){return new Promise(resolve=>{if(!url){resolve(null);return}const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url})}
function wrap(ctx,str,x,y,width,line=19,max=3){const chars=Array.from(String(str||''));let cur='',cnt=0;for(const ch of chars){if(ctx.measureText(cur+ch).width>width&&cur){ctx.fillText(cur,x,y+cnt*line);cnt++;cur='';if(cnt>=max)return}cur+=ch}ctx.fillText(cur,x,y+cnt*line)}
async function exportImage(copy){notice('이미지 생성 중…');try{
const W=1440,unitHeight=369,top=96,between=12,Hh=top+5*(unitHeight+between)+12;
const canvas=document.createElement('canvas');canvas.width=W;canvas.height=Hh;
const c=canvas.getContext('2d');c.fillStyle='#11151d';c.fillRect(0,0,W,Hh);
c.fillStyle='#e8c36a';c.font='bold 30px sans-serif';c.fillText('천하결전 · 덱편성 — 프리셋 '+(active+1),22,44);
c.font='14px sans-serif';c.fillStyle='#abb8c8';c.fillText('장수 · 고유 전법 · 장착 전법 · 병법 3종(고유/선본) · 자유 설명',22,72);
for(let ui=0;ui<5;ui++){
 const u=group()[ui],y=top+ui*(unitHeight+between);
 c.fillStyle='#262b36';c.fillRect(16,y,W-32,unitHeight);
 c.strokeStyle='#907344';c.strokeRect(16.5,y+.5,W-33,unitHeight-1);
 c.fillStyle='#e8c36a';c.font='bold 20px sans-serif';c.fillText((ui+1)+'군 · '+(u.formation||'진형 미선택'),29,y+27);
 for(let si=0;si<3;si++){
  const h=u.heroes[si],hero=byHero.get(h.id),x=27+si*470,cy=y+38;
  c.fillStyle='#1a1e27';c.fillRect(x,cy,459,316);
  c.fillStyle='#fff2c9';c.font='bold 18px sans-serif';c.fillText(hero?.name_kr||'장수 미선택',x+10,cy+24);
  let url='';if(hero){const container=document.createElement('div');container.innerHTML=art(hero,'hero');url=container.querySelector('img')?.getAttribute('src')||''}
  const img=await loadImg(url);
  if(img){const maxW=154,maxH=136,scale=Math.min(maxW/img.width,maxH/img.height);c.drawImage(img,x+8+(maxW-img.width*scale)/2,cy+33+(maxH-img.height*scale)/2,img.width*scale,img.height*scale)}
  else if(hero){c.fillStyle='#bca875';c.font='13px sans-serif';c.fillText('초상화 없음',x+22,cy+101)}
  c.fillStyle='#d8dadd';c.font='14px sans-serif';
  wrap(c,'고유: '+(SK[String(hero?.init_skill)]?.name_kr||'—'),x+170,cy+54,276,20,2);
  wrap(c,'전법 1: '+(skillName(h.skill1)||'—'),x+170,cy+96,276,20,2);
  wrap(c,'전법 2: '+(skillName(h.skill2)||'—'),x+170,cy+138,276,20,2);
  // The three selected master editions appear side-by-side directly beneath the portrait.
  c.fillStyle='#9eabb6';c.font='12px sans-serif';c.fillText('병법 (1: 고유/선본 · 2~3: 선본)',x+11,cy+190);
  for(let bi=0;bi<3;bi++){
   const bx=x+9+bi*149,by=cy+200; c.fillStyle='#282d36';c.fillRect(bx,by,144,35);
   c.strokeStyle='#7b6235';c.strokeRect(bx+.5,by+.5,143,34);
   c.fillStyle='#e7cb8f';c.font='12px sans-serif';
   const book=bookName(h.books?.[bi])||'미선택';const short=book.replace(/\s*선본$/,'');
   wrap(c,(bi+1)+'. '+short,bx+7,by+21,132,13,1);
  }
  c.fillStyle='#9eabb6';c.font='12px sans-serif';c.fillText('설명',x+11,cy+252);
  c.fillStyle='#e6e8ec';c.font='12px sans-serif';wrap(c,(h.memo||'—').slice(0,120),x+42,cy+252,399,16,4);
 }
}
const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 생성 실패');
if(copy&&navigator.clipboard?.write&&window.ClipboardItem){try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);notice('프리셋 '+(active+1)+' 이미지 복사 완료');return}catch(e){notice('클립보드 접근이 제한되어 PNG로 저장합니다.')}}
const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='천하결전_덱편성_프리셋'+(active+1)+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);notice('프리셋 '+(active+1)+' PNG 저장 완료')
}catch(e){console.error(e);notice('이미지 생성 오류: '+e.message,true)}}
})();
