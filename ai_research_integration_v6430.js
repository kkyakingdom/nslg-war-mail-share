(function(){'use strict';
const $=id=>document.getElementById(id);
function num(x){return Number.isFinite(x)?x.toFixed(1):'미확인'}
function snapshot(){const selected=$('v6429Deck')?.value;if(!selected)return null;const groups=typeof gather==='function'?gather():null;return {selected,groups};}
// This integration deliberately retains the existing v6.42.9 matchup calculation unchanged.
// The source module is closure-scoped, so this module independently derives a conservative,
// transparent report from visible result cards and the underlying current DATA rows.
function collect(){const deck=$('v6429Deck')?.value;if(!deck)return null;
 const period=Number($('v6429Period')?.value||0),band=$('v6429Band')?.value||'all',min=Number($('v6429Min')?.value||10);
 const rows=period&&typeof v627Window==='function'?v627Window(period,0).rows:DATA;
 const by=new Map(),seen=new Set();
 for(const r of rows){if(!['승','패'].includes(r.result))continue;const bid=String(r.battleId||'');if(bid&&seen.has(bid))continue;if(bid)seen.add(bid);
 for(const side of [false,true]){const h=heroes(r,side);if(h.length!==3||canon(h)!==deck)continue;const other=heroes(r,!side);if(other.length!==3)continue;
 const promo=s=>{const ds=detailMembers(r,s),hs=heroes(r,s);const values=hs.map((x,i)=>promotionValue(detailMemberForHero(ds,x,i)));return values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0)/3:NaN};
 const d=promo(side)-promo(!side),known=Number.isFinite(d);
 if(band==='even'&&(!known||Math.abs(d)>0.5)||band==='higher'&&(!known||d<=0.5)||band==='lower'&&(!known||d>=-0.5)||band==='unknown'&&known)continue;
 const k=canon(other),g=by.get(k)||{label:ALIASES[k]||ordered(other),w:0,l:0,rows:[],settings:new Map()};
 const win=(side?invertResult(r.result):r.result)==='승';g[win?'w':'l']++;g.rows.push(r);
 const skills=detailMembers(r,side).flatMap(x=>[x.skill1,x.skill2,x.skill3].filter(Boolean)).map(String).sort();if(skills.length===6){const sk=skills.join(' / '),v=g.settings.get(sk)||{w:0,l:0,rows:[]};v[win?'w':'l']++;v.rows.push(r);g.settings.set(sk,v)}by.set(k,g);
 }}const all=[...by.values()].filter(x=>x.w+x.l>=min).map(x=>({...x,n:x.w+x.l,rate:100*x.w/(x.w+x.l)}));return {deck,period,band,min,all};}
function buildReport(){const d=collect();if(!d)return null;const label=$('v6429Deck').selectedOptions[0]?.textContent||'선택 덱';const groups=d.all.slice().sort((a,b)=>b.n-a.n),wins=groups.reduce((a,g)=>a+g.w,0),total=groups.reduce((a,g)=>a+g.n,0);
 const best=groups.filter(g=>g.n>=d.min).slice().sort((a,b)=>b.rate-a.rate).slice(0,3),worst=groups.slice().sort((a,b)=>a.rate-b.rate).slice(0,3);
 const lines=[`분석 대상: ${label}`,`기간: ${d.period?`최근 ${d.period}시간`:'전체'} / 돌파 조건: ${d.band} / 최소 표본: ${d.min}`,`확인된 사실: 조건 충족 ${total}전, ${wins}승 ${total-wins}패, 관측 승률 ${total?num(100*wins/total)+'%':'계산 불가'}.`,`우세 관측 상대: ${best.map(g=>`${g.label} ${g.n}전 ${num(g.rate)}%`).join('; ')||'자료 부족'}`,`열세 관측 상대: ${worst.map(g=>`${g.label} ${g.n}전 ${num(g.rate)}%`).join('; ')||'자료 부족'}`];
 const sets=new Map();for(const g of groups)for(const [name,s] of g.settings){const x=sets.get(name)||{w:0,l:0,rows:[]};x.w+=s.w;x.l+=s.l;x.rows.push(...s.rows);sets.set(name,x)}
 const top=[...sets].map(([name,s])=>({name,n:s.w+s.l,rate:100*s.w/(s.w+s.l)})).filter(x=>x.n>=d.min).sort((a,b)=>b.n-a.n).slice(0,3);
 lines.push(`관측 전법 세팅 TOP: ${top.map(x=>`${x.name} (${x.n}전 ${num(x.rate)}%)`).join('; ')||'확인된 6전법 표본 부족'}`);
 lines.push('분석 원칙: 승률은 관측 통계이며 원인을 입증하지 않는다. 연속전투/동일 유저 반복 표본 보정은 적용하지 않는다. 유리함을 확정하거나 데이터에 없는 전법 효과를 주장하지 않는다. 근거 전보는 연구소 각 행의 버튼에서 확인할 수 있다.');
 return {text:lines.join('\n'),rows:groups.flatMap(g=>g.rows)};}
function install(){const btn=$('v6430AskAi');if(!btn)return;btn.addEventListener('click',()=>{const report=buildReport(),note=$('v6430Notice');if(!report){note.textContent='분석 덱을 먼저 선택하세요.';return}note.textContent='선택 조건의 전보 통계를 AI에 전달합니다.';
 // Dedicated deterministic local response for the research report; remote model uses same evidence.
 const q='[AI_RESEARCH_V6430]\n'+report.text+'\n위 사실과 추정, 한계를 분리하여 종합 분석해줘.';
 if(typeof v630Ask==='function')v630Ask(q);else note.textContent='AI 채팅 기능을 찾을 수 없습니다.';
 });
 const original=window.v630LocalAnswer;
 if(typeof original==='function')window.v630LocalAnswer=function(q){if(String(q).startsWith('[AI_RESEARCH_V6430]')){const r=buildReport();if(!r)return original(q);return {text:'[실제 전보로 확인된 통계]\n'+r.text+'\n\n[통계적 해석]\n상대별 승률과 전법 세팅의 차이는 관측 경향이며 원인이나 향후 승패를 보장하지 않습니다.\n\n[데이터 한계]\n표본 부족, 돌파 미확인, 반복 전투 편중 가능성이 있습니다.',context:{researchReport:r.text,source:'observed battle reports',limitations:'No repeated battle adjustment; no causal inference'},actions:[{type:'evidence',title:'AI 연구소 · 분석 근거 전보',rows:r.rows,label:'근거 전보'}]}}return original(q)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();