/* Game-source buff_data_tool item-level analyzer; verified numeric arithmetic only. */
(function(){'use strict';let DATA=null;let active=null;const H=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=x=>x===null||x===undefined?'—':String(Math.round(Number(x)*100000)/100000);
fetch('data/v9102_effect_stage_audit.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('JSON '+r.status);return r.json()}).then(d=>{DATA=d;update()}).catch(()=>{});
function update(){const id=active;if(!id||!DATA)return;const box=document.querySelector('[data-v9102-for="'+CSS.escape(id)+'"]');if(!box)return;
const found=DATA.byID[id];if(!found){box.innerHTML='<p>이 전법은 원본에서 단순한 <code>giver.skillClass</code> 단계별 배율식이 확인되지 않았어. 효과가 증가하지 않는다는 의미는 아니야.</p>';return;}
const entries=found.items.map(x=>{const head='<div class="v9102-sub"><b>원본 효과 항목 '+H(x.item)+'</b> <small>('+H(x.kind)+')</small></div><code class="v9102-raw">'+H(x.formula)+'</code>';
const table='<div class="v9102-scroll"><table><thead><tr><th>단계</th><th>명시된 배율</th><th>원시 계산값 (10레벨)</th></tr></thead><tbody>'+Array.from({length:6},(_,i)=>'<tr><td>'+i+'</td><td>'+x.multipliers[i].map(y=>'×'+fmt(y)).join(', ')+'</td><td>'+(!x.lv10_values?'능력치·함수 의존 (미확정)':fmt(x.lv10_values[i]))+'</td></tr>').join('')+'</tbody></table></div>';return '<article class="v9102-effect">'+head+table+'</article>'}).join('');
box.innerHTML='<p class="v9102-warning">게임 원본 <code>buff_data_tool</code>에서 확인된 <b>효과 항목별</b> 승품·돌파 배율이야. 10레벨 기준 원시 계산값은 게임 UI의 백분율·피해량이 아니고, 능력치 의존 효과의 실제 값은 확정하지 않았어. 모든 0~5단계는 <b>계산 모델</b>이지 인게임 검증값이 아니야.</p>'+entries;
}
window.NSLG_STAGE_AUDIT={activate(id){active=String(id);setTimeout(update,0)}};
})();