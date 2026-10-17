(function(){
'use strict';
let overrides={},active=null;
function el(id){return document.getElementById(id)}
async function load(){try{const r=await fetch('/api/tactic-overrides',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);overrides=(await r.json()).overrides||{};}catch(e){console.warn('병법 수정값 로딩 실패',e)}}
async function save(reset){if(!active)return;const row=T.find(x=>String(x.id)===active);if(!row)return;const fields=reset?{}:{name_kr:el('v995TacticName').value.trim(),description_kr:el('v995TacticDesc').value.trim()};for(const k of Object.keys(fields))if(!fields[k])delete fields[k];const notice=el('v995TacticNotice');notice.textContent='저장 중...';try{const r=await fetch('/api/tactic-overrides',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:active,fields})});const o=await r.json();if(!r.ok)throw Error(o.error||'저장 실패');if(Object.keys(fields).length)overrides[active]=fields;else delete overrides[active];notice.textContent='저장 완료. 기존 원본 데이터는 보존됩니다.';if(typeof draw==='function')draw();if(el('detail').open){el('detail').close();openDetail({kind:'tactic',x:row})}}catch(e){notice.textContent='오류: '+e.message}}
window.NSLG_TACTIC_EDITOR={override:id=>overrides[String(id)]||{},open(id){active=String(id);const row=T.find(x=>String(x.id)===active);if(!row)return;const old=overrides[active]||{};el('v995TacticTitle').textContent=row.name_kr+' · ID #'+active;el('v995TacticName').value=old.name_kr||'';el('v995TacticDesc').value=old.description_kr||'';el('v995TacticNotice').textContent='수정하지 않은 항목은 게임 원본의 한국어 정보를 유지합니다.';el('v995TacticEdit').showModal()}};
el('v995TacticSave').onclick=()=>save(false);
el('v995TacticReset').onclick=()=>{if(confirm('이 병법의 수정값을 삭제할까요?'))save(true)};
el('v995TacticClose').onclick=()=>el('v995TacticEdit').close();
load();
})();