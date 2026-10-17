/* NSLG v6.37.2 PRECISION WINRATE + MATCHUP ANALYSIS
   - strict baseline win-rate sample (supply >= threshold is equal-condition)
   - low-troop / low-supply reversal battles retained as separate matchup evidence
   - troop-balance weighting only inside the strict baseline sample
   - repeat-user-pair downweighting
   - player/deck nuisance adjustment (regularized logistic model)
   - conservative bounded reversal-evidence adjustment for matchup estimate
   - baseline-model 95% interval + independent-user confidence gates
*/
(function(){
'use strict';
const V6370_VERSION='v6.37.2';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sigmoid=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
const logit=p=>Math.log(clamp(p,1e-6,1-1e-6)/(1-clamp(p,1e-6,1-1e-6)));
const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:NaN};
const pct1=v=>Number.isFinite(v)?(100*v).toFixed(1)+'%':'-';
const pct0=v=>Number.isFinite(v)?Math.round(100*v)+'%':'-';
const esc2=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function v6370StartTroops(v){
  const m=String(v||'').replace(/,/g,'').match(/(\d+)\s*\/\s*(\d+)/);
  return m?Number(m[2]):NaN;
}
function v6370UpsetType(r){
  const sel=String(r?.selectionType||'').trim();
  return sel==='저공급 역전'||sel==='저병력 역전'?sel:'';
}
function v6370CommonEligible(r){
  if(!r||!['승','패'].includes(r.result))return false;
  if(String(r.user||'')==='xxxx'||String(r.oppUser||'')==='xxxx'||!r.user||!r.oppUser)return false;
  if(/후속전투/.test(String(r.decisionReason||'')))return false; // 손상 상태의 개별 후속전투는 별도 지속전투 영역
  if(Number(r.chainCount||1)>1&&typeof chainIntegrity==='function'&&!chainIntegrity(r).ok)return false;
  if((typeof heroes==='function'&&heroes(r).length!==3)||(typeof heroes==='function'&&heroes(r,true).length!==3))return false;
  return true;
}
function v6370PrecisionEligible(r){
  if(!v6370CommonEligible(r))return false;
  const sel=String(r.selectionType||'').trim();
  if(sel&&sel!=='기본 기준')return false; // 승률 기준표본은 결과에 따라 선택되는 역전 표본과 분리
  const ta=v6370StartTroops(r.troops),tb=v6370StartTroops(r.oppTroops),sa=num(r.mySupply),sb=num(r.oppSupply);
  const mt=Number(META?.minTroops||25000),ms=Number(META?.minSupply||80);
  if(!Number.isFinite(ta)||!Number.isFinite(tb)||ta<mt||tb<mt)return false;
  if(!Number.isFinite(sa)||!Number.isFinite(sb)||sa<ms||sb<ms)return false;
  return true;
}
function v6370PracticalEligible(r){
  if(!v6370CommonEligible(r))return false;
  const sel=String(r.selectionType||'').trim();
  if(sel==='저공급 역전'||sel==='저병력 역전')return true; // 상성의 역전 근거로 보존
  return v6370PrecisionEligible(r);
}
function v6370Balance(r){
  const ta=v6370StartTroops(r.troops),tb=v6370StartTroops(r.oppTroops),sa=num(r.mySupply),sb=num(r.oppSupply);
  const tr=(Number.isFinite(ta)&&Number.isFinite(tb)&&Math.max(ta,tb)>0)?Math.min(ta,tb)/Math.max(ta,tb):0;
  const ms=Number(META?.minSupply||80),bothSupplyFair=Number.isFinite(sa)&&Number.isFinite(sb)&&sa>=ms&&sb>=ms;
  // 사용자 규칙: 양쪽 공급이 기준(기본 80) 이상이면 80/100, 95/100 모두 동등 조건이다.
  const sr=bothSupplyFair?1:((Number.isFinite(sa)&&Number.isFinite(sb)&&Math.max(sa,sb)>0)?Math.min(sa,sb)/Math.max(sa,sb):0);
  const quality=clamp(Math.pow(clamp(tr,0,1),1.35),0.35,1); // 정밀 승률 가중치는 병력 균형만 반영
  return{troopRatio:tr,supplyRatio:sr,supplyEqual:bothSupplyFair,quality};
}
function v6370RangeFilter(rows,{ignoreUi=false,ignoreAlliance=false,ignoreText=false,ignoreDeck=false,eligible=v6370PrecisionEligible}={}){
  const range=typeof activeDateRange==='function'?activeDateRange():{from:0,to:Number.MAX_SAFE_INTEGER};
  const sf=document.querySelector('#seasonFilter')?.value||'';
  const af=document.querySelector('#allianceFilter')?.value||'';
  const q=(document.querySelector('#q')?.value||'').trim().toLowerCase();
  const oh=document.querySelector('#ownHero')?.value||'',ph=document.querySelector('#oppHero')?.value||'';
  return (rows||[]).filter(r=>{
    if(!eligible(r))return false;
    const t=typeof parseTime==='function'?parseTime(r.time):Date.parse(r.time);
    if(Number.isFinite(t)&&(t<range.from||t>range.to))return false;
    if(sf&&(r.season||'현재 시즌')!==sf)return false;
    if(ignoreUi)return true;
    if(!ignoreAlliance&&af&&r.alliance!==af&&r.oppAlliance!==af)return false;
    if(oh&&!(heroes(r)||[]).includes(oh))return false;
    if(ph&&!(heroes(r,true)||[]).includes(ph))return false;
    if(!ignoreDeck&&typeof activeKeyMode!=='undefined'&&activeKeyMode==='hero'){
      const ak=canon(heroes(r)),bk=canon(heroes(r,true));
      if(typeof activeOwnDeck!=='undefined'&&activeOwnDeck&&ak!==activeOwnDeck)return false;
      if(typeof activeOppDeck!=='undefined'&&activeOppDeck&&bk!==activeOppDeck)return false;
      if(typeof activeAnyDeck!=='undefined'&&activeAnyDeck&&ak!==activeAnyDeck&&bk!==activeAnyDeck)return false;
    }
    if(!ignoreText&&q){const hay=typeof searchableText==='function'?searchableText(r):Object.values(r).join(' ');if(!String(hay).toLowerCase().includes(q))return false}
    return true;
  });
}
function v6370FairRows(){return v6370RangeFilter(DATA)}
function v6370PracticalRows(){return v6370RangeFilter(DATA,{eligible:v6370PracticalEligible})}
function v6370ModelRows(){return v6370RangeFilter(DATA,{ignoreUi:true})}
function v6370MatchRows(){return v6370RangeFilter(DATA,{ignoreAlliance:true,ignoreDeck:true})}
function v6370PracticalMatchRows(){return v6370RangeFilter(DATA,{ignoreAlliance:true,ignoreDeck:true,eligible:v6370PracticalEligible})}

function v6370ObsFromRows(rows){
  const mode=document.querySelector('#analysisMode')?.value||'hero',base=[];
  for(const r of rows||[]){
    const a=deckDescriptor(r,false,mode),b=deckDescriptor(r,true,mode);
    if(!a.complete||!b.complete||!a.key||!b.key)continue;
    const y=r.result==='승'?1:r.result==='패'?0:NaN;if(!Number.isFinite(y))continue;
    const bal=v6370Balance(r),ua=String(r.user||''),ub=String(r.oppUser||'');
    if(!ua||!ub||ua==='xxxx'||ub==='xxxx')continue;
    const pairUsers=[ua,ub].sort().join('↔'),pairDecks=[a.key,b.key].sort().join('↔');
    base.push({r,a:a.key,b:b.key,ah:a.heroKey,bh:b.heroKey,al:a.label,bl:b.label,at:a.title,bt:b.title,ua,ub,y,time:parseTime(r.time)||0,quality:bal.quality,troopRatio:bal.troopRatio,supplyRatio:bal.supplyRatio,upsetType:v6370UpsetType(r),repeatKey:pairUsers+'§'+pairDecks});
  }
  const counts=new Map();for(const o of base)counts.set(o.repeatKey,(counts.get(o.repeatKey)||0)+1);
  for(const o of base){o.repeatCount=counts.get(o.repeatKey)||1;o.repeatWeight=1/Math.sqrt(o.repeatCount);o.weight=o.quality*o.repeatWeight}
  return base;
}
function v6370CenterMap(m){if(!m.size)return;let s=0;for(const v of m.values())s+=v;const avg=s/m.size;for(const [k,v] of m)m.set(k,v-avg)}
let V6370_MODEL_CACHE={sig:'',model:null};
function v6370ModelSig(){const rows=v6370ModelRows(),first=rows[0]?.battleId||'',last=rows[rows.length-1]?.battleId||'',mode=document.querySelector('#analysisMode')?.value||'hero',range=activeDateRange(),sf=document.querySelector('#seasonFilter')?.value||'';return`${rows.length}|${first}|${last}|${mode}|${range.from}|${range.to}|${sf}`}
function v6370FitModel(){
  const sig=v6370ModelSig();if(V6370_MODEL_CACHE.sig===sig&&V6370_MODEL_CACHE.model)return V6370_MODEL_CACHE.model;
  const obs=v6370ObsFromRows(v6370ModelRows()),players=new Map(),decks=new Map();
  for(const o of obs){if(!players.has(o.ua))players.set(o.ua,0);if(!players.has(o.ub))players.set(o.ub,0);if(!decks.has(o.a))decks.set(o.a,0);if(!decks.has(o.b))decks.set(o.b,0)}
  const epochs=obs.length>20000?22:obs.length>7000?30:42,regP=.004,regD=.003;
  for(let ep=0;ep<epochs;ep++){
    const lr=.075/Math.sqrt(1+ep/5),rev=ep%2===1;
    for(let ii=0;ii<obs.length;ii++){
      const o=obs[rev?obs.length-1-ii:ii],pa=players.get(o.ua)||0,pb=players.get(o.ub)||0,da=decks.get(o.a)||0,db=decks.get(o.b)||0;
      const pr=sigmoid(clamp(pa-pb+da-db,-6,6)),e=(o.y-pr)*o.weight;
      players.set(o.ua,clamp(pa+lr*(e-regP*pa),-2.8,2.8));players.set(o.ub,clamp(pb+lr*(-e-regP*pb),-2.8,2.8));
      decks.set(o.a,clamp(da+lr*(e-regD*da),-2.8,2.8));decks.set(o.b,clamp(db+lr*(-e-regD*db),-2.8,2.8));
    }
    v6370CenterMap(players);v6370CenterMap(decks);
  }
  const model={obs,players,decks,epochs};V6370_MODEL_CACHE={sig,model};return model;
}
function v6370Kish(xs){let sw=0,sw2=0;for(const x of xs){const w=Math.max(0,Number(x.weight||0));sw+=w;sw2+=w*w}return sw2>0?sw*sw/sw2:0}
function v6370Wilson(p,n,z=1.96){if(!(n>0))return[0,1];p=clamp(p,0,1);const z2=z*z,den=1+z2/n,mid=(p+z2/(2*n))/den,half=z*Math.sqrt((p*(1-p)/n)+(z2/(4*n*n)))/den;return[clamp(mid-half,0,1),clamp(mid+half,0,1)]}
function v6370WeightedCore(xs){
  let sw=0,sy=0,sw2=0,q=0;for(const o of xs){const w=Math.max(0,Number(o.weight||0));sw+=w;sy+=w*Number(o.y||0);sw2+=w*w;q+=w*Number(o.quality||0)}const p=sw?sy/sw:.5,neff=sw2?sw*sw/sw2:0,quality=sw?q/sw:0;return{n:xs.length,sw,p,neff,quality};
}
function v6370EmpiricalPrior(groups,minStrength=3,maxStrength=36){
  const gs=(groups||[]).map(v6370WeightedCore).filter(g=>g.neff>=3);if(gs.length<4)return{mean:.5,strength:8,source:'fallback'};const den=gs.reduce((a,g)=>a+g.neff,0),mean=clamp(gs.reduce((a,g)=>a+g.neff*g.p,0)/Math.max(den,1),.35,.65),obsVar=gs.reduce((a,g)=>a+g.neff*Math.pow(g.p-mean,2),0)/Math.max(den,1),noise=gs.reduce((a,g)=>a+g.neff*(g.p*(1-g.p)/Math.max(g.neff,1)),0)/Math.max(den,1),trueVar=Math.max(.0008,obsVar-noise),raw=mean*(1-mean)/trueVar-1,strength=clamp(Number.isFinite(raw)?raw:8,minStrength,maxStrength);return{mean,strength,source:'empirical'};
}
function v6370BayesWeighted(xs,prior={mean:.5,strength:1}){
  const c=v6370WeightedCore(xs),k=Math.max(0,Number(prior?.strength??1)),mu=clamp(Number(prior?.mean??.5),.05,.95),a=mu*k+c.p*c.neff,b=(1-mu)*k+(1-c.p)*c.neff,sum=a+b,est=sum?a/sum:.5,sd=sum>0?Math.sqrt((a*b)/(sum*sum*(sum+1))):.5,low=clamp(est-1.96*sd,0,1),high=clamp(est+1.96*sd,0,1);return{...c,est,low,high,priorMean:mu,priorStrength:k};
}
function v6370JeffreysWeighted(xs){return v6370BayesWeighted(xs,{mean:.5,strength:1})}
function v6370SolveMatch(xs,model){
  if(!xs.length)return null;const lambda=.85;let theta=0,info=lambda;
  for(let it=0;it<24;it++){
    let g=-lambda*theta,h=-lambda;for(const o of xs){const off=(model.players.get(o.ua)||0)-(model.players.get(o.ub)||0),pr=sigmoid(clamp(off+theta,-8,8)),w=o.weight;g+=w*(o.y-pr);h-=w*pr*(1-pr)}
    const step=g/Math.min(-1e-8,h),next=clamp(theta-step,-4.5,4.5);if(Math.abs(next-theta)<1e-6){theta=next;break}theta=next;
  }
  info=lambda;let sw=0,sw2=0,rawW=0,qsum=0,wins=0;const pairs=new Set();
  for(const o of xs){const off=(model.players.get(o.ua)||0)-(model.players.get(o.ub)||0),pr=sigmoid(clamp(off+theta,-8,8)),w=o.weight;info+=w*pr*(1-pr);sw+=w;sw2+=w*w;rawW+=w*o.y;qsum+=w*o.quality;if(o.y===1)wins++;pairs.add([o.ua,o.ub].sort().join('↔'))}
  const est=sigmoid(theta),se=Math.sqrt(1/Math.max(info,1e-6)),low=sigmoid(theta-1.96*se),high=sigmoid(theta+1.96*se),neff=sw2?sw*sw/sw2:0,raw=xs.length?wins/xs.length:.5,weighted=sw?rawW/sw:.5,quality=sw?qsum/sw:0;
  return{n:xs.length,wins,losses:xs.length-wins,est,theta,se,low,high,neff,raw,weighted,quality,pairs:pairs.size};
}
function v6370Confidence(m){
  if(!m||m.n<3)return{label:'매우 낮음',cls:'conf-vlow',score:0};
  const width=m.high-m.low,n=Math.min(1,m.neff/28),u=Math.min(1,m.pairs/12),w=clamp(1-width/.62,0,1),q=clamp(m.quality,0,1),score=100*(.38*n+.27*u+.23*w+.12*q);
  const label=score>=78?'매우 높음':score>=62?'높음':score>=43?'보통':score>=25?'낮음':'매우 낮음';return{label,cls:label==='매우 높음'?'conf-vhigh':label==='높음'?'conf-high':label==='보통'?'conf-mid':label==='낮음'?'conf-low':'conf-vlow',score};
}
function v6370Grade(m){
  if(!m||m.neff<4||m.pairs<2)return'판단 보류';
  if(m.low>=.65)return'대우세';if(m.low>=.575)return'우세';if(m.low>=.525)return'약우세';
  if(m.high<=.35)return'대열세';if(m.high<=.425)return'열세';if(m.high<=.475)return'약열세';
  if(m.low>=.45&&m.high<=.55)return'호각';return'판단 보류';
}
function v6370CellClass(est){const v=100*est;return v>=60?'g3':v>50?'g2':Math.abs(v-50)<.5?'even':v>=41?'r2':'r3'}
function v6370OrientedMatchObs(rows){
  const base=v6370ObsFromRows(rows),out=[];for(const o of base){out.push(o);out.push({...o,a:o.b,b:o.a,ah:o.bh,bh:o.ah,al:o.bl,bl:o.al,at:o.bt,bt:o.at,ua:o.ub,ub:o.ua,y:1-o.y})}return out;
}
function v6370PairMetric(a,b,oriented,model){const xs=oriented.filter(o=>o.a===a&&o.b===b);return v6370SolveMatch(xs,model)}

function v6371UpsetEvidence(xs){
  const ev={n:0,wins:0,losses:0,lowTroop:0,lowSupply:0,pairs:0};const ps=new Set();
  for(const o of xs||[]){if(!o.upsetType)continue;ev.n++;o.y===1?ev.wins++:ev.losses++;if(o.upsetType==='저병력 역전')ev.lowTroop++;if(o.upsetType==='저공급 역전')ev.lowSupply++;ps.add([o.ua,o.ub].sort().join('↔'))}ev.pairs=ps.size;return ev;
}
function v6371BlendMatch(base,upsetXs){
  const ev=v6371UpsetEvidence(upsetXs),baseTheta=base?.theta??0,baseSe=base?.se??1.6;
  // 역전 표본은 '불리한 쪽이 이긴 경우'를 의도적으로 수집한 조건부 표본이므로 일반 승패와 1:1로 섞지 않는다.
  // 대신 방향성 근거로만 사용하고 로그오즈 이동량을 보수적으로 제한한다(대량 표본이어도 약 ±6%p 수준).
  const support=ev.n?(ev.wins-ev.losses)/(ev.n+4):0,strength=Math.min(1,ev.n/6),delta=0.28*support*strength;
  const finalTheta=clamp(baseTheta+delta,-4.5,4.5),est=sigmoid(finalTheta);
  return{...(base||{n:0,wins:0,losses:0,neff:0,raw:.5,weighted:.5,quality:1,pairs:0,theta:0,se:baseSe,low:sigmoid(-1.96*baseSe),high:sigmoid(1.96*baseSe)}),baseEst:base?.est??.5,baseLow:base?.low??sigmoid(-1.96*baseSe),baseHigh:base?.high??sigmoid(1.96*baseSe),baseN:base?.n??0,baseNeff:base?.neff??0,basePairs:base?.pairs??0,est,theta:finalTheta,upset:ev,upsetDelta:delta};
}
function v6371UpsetText(ev){if(!ev?.n)return'역전 근거 없음';return`역전 ${ev.wins} · 피역전 ${ev.losses} (저병력 ${ev.lowTroop} / 저공급 ${ev.lowSupply})`}

// Quality bar: strict win-rate sample + reversal evidence are displayed separately.
const v6370OldRenderQuality=renderQuality;
renderQuality=function(){
  try{v6370OldRenderQuality()}catch(_){ }
  const strictAll=(DATA||[]).filter(v6370PrecisionEligible),upsets=(DATA||[]).filter(r=>v6370PracticalEligible(r)&&!!v6370UpsetType(r)),raw=Number(STATUS?.rawCount||META?.rawPvpCount||ALL_DATA?.length||DATA?.length||0),post=(DATA||[]).filter(r=>/후속전투/.test(String(r.decisionReason||''))).length;
  const qa=document.querySelector('#qAnalysis');if(qa){qa.textContent=strictAll.length.toLocaleString()+'건';const p=qa.parentElement;if(p&&p.firstChild&&p.firstChild.nodeType===3)p.firstChild.nodeValue='정밀 표본 '}
  const qe=document.querySelector('#qExcluded');if(qe)qe.textContent=Math.max(0,raw-strictAll.length).toLocaleString()+'건';
  const qu=document.querySelector('#qUpset');if(qu){qu.textContent=upsets.length.toLocaleString()+'건 · 상성 근거';qu.title='저공급/저병력 역전은 일반 승률에 1:1로 섞지 않고 상성의 방향성 근거로 별도 반영합니다. 공급 80 이상은 모두 동등 조건입니다.'}
  const u=document.querySelector('#updated');if(u){u.textContent=(META?.generatedAt?`데이터 ${META.generatedAt}`:'데이터 준비됨')+` · 전체 PVP ${(ALL_DATA||[]).length.toLocaleString()}건 · 정밀승률 ${strictAll.length.toLocaleString()}건 · 역전상성 ${upsets.length.toLocaleString()}건`;u.title=`정밀 승률은 기본조건 ${strictAll.length.toLocaleString()}건으로 계산하고, 저병력/저공급 역전 ${upsets.length.toLocaleString()}건은 상성 근거로 분리 반영합니다. 후속 개별전투 ${post.toLocaleString()}건은 지속전투 영역으로 분리합니다.`}
};

// Strict fair rows become the sole source for win-rate statistics.
try{v6366FairRows=v6370FairRows}catch(_){ }

// v6.38.2: matchup drill-down must use the exact same FULL observed battles shown in the matrix.
// The selected row deck is always normalized to the left side so cards/records/results stay in the same perspective.
const v6370BaseFiltered=baseFiltered;
var V6382_MATCHUP_ORIENTED_BY_BID=new Map();
function v6382SwapChainFlow(raw){
  const s=String(raw||'').trim();if(!s)return s;
  return s.split('||').map(part=>{const a=part.split('~');if(a.length<5)return part;return[a[0],a[1],a[3],a[2],invertResult(a[4])].join('~')}).join('||');
}
function v6382OrientMatchupRecord(r,swap){
  if(!swap)return {...r,_v6382MatchupOriented:true};
  const x={...r,_v6382MatchupOriented:true};
  [x.user,x.oppUser]=[r.oppUser,r.user];[x.alliance,x.oppAlliance]=[r.oppAlliance,r.alliance];
  [x.h1,x.oh1]=[r.oh1,r.h1];[x.h2,x.oh2]=[r.oh2,r.h2];[x.h3,x.oh3]=[r.oh3,r.h3];
  [x.troops,x.oppTroops]=[r.oppTroops,r.troops];[x.mySupply,x.oppSupply]=[r.oppSupply,r.mySupply];
  x.result=invertResult(r.result);x.chainFlow=v6382SwapChainFlow(r.chainFlow);return x;
}
baseFiltered=function(){
  if(typeof activePureMatchupPair==='undefined'||!activePureMatchupPair)return v6370BaseFiltered();
  const rows=typeof v6372FullMatchRows==='function'?v6372FullMatchRows():(ALL_DATA||[]),out=[];V6382_MATCHUP_ORIENTED_BY_BID=new Map();
  for(const r of rows){
    const a=deckDescriptor(r,false,activeKeyMode).key,b=deckDescriptor(r,true,activeKeyMode).key;
    if(!activeOwnDeck||!activeOppDeck)continue;
    if(a===activeOwnDeck&&b===activeOppDeck){const x=v6382OrientMatchupRecord(r,false);out.push(x);V6382_MATCHUP_ORIENTED_BY_BID.set(String(r.battleId),x)}
    else if(a===activeOppDeck&&b===activeOwnDeck){const x=v6382OrientMatchupRecord(r,true);out.push(x);V6382_MATCHUP_ORIENTED_BY_BID.set(String(r.battleId),x)}
  }
  out.sort((a,b)=>(parseTime(b.time)||0)-(parseTime(a.time)||0));return out;
};

// Entity/detail clicks must keep the same normalized matchup perspective too.
if(typeof v628EnhanceRecordEntities==='function'){
  const v6382BaseEnhanceRecordEntities=v628EnhanceRecordEntities;
  v628EnhanceRecordEntities=function(){
    if(!activePureMatchupPair)return v6382BaseEnhanceRecordEntities();
    try{v6382BaseEnhanceRecordEntities()}catch(_){}
    const body=document.querySelector('#recordRows');if(!body)return;
    body.querySelectorAll('tr[data-bid]').forEach(tr=>{
      const r=V6382_MATCHUP_ORIENTED_BY_BID.get(String(tr.dataset.bid));if(!r)return;const t=tr.querySelectorAll('td');if(t.length<8)return;
      tr.style.cursor='pointer';tr.onclick=e=>{if(e.target.closest('.entityHot'))return;openDetail(r)};
      const bindPlayer=(cell,name)=>{if(!cell||!name)return;cell.classList.add('entityHot');cell.title='클릭: 유저 분석 · 우클릭: 빠른 메뉴';cell.onclick=e=>{e.stopPropagation();openPlayerAnalysis(name)};cell.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();v628OpenEntityMenu('player',name,name,e.clientX,e.clientY)}};
      bindPlayer(t[1],r.user||'');bindPlayer(t[4],r.oppUser||'');
      [[t[2],false],[t[5],true]].forEach(([cell,isOpp])=>{if(!cell)return;const d=deckDescriptor(r,isOpp,'hero');if(!d?.key)return;cell.classList.add('entityHot');cell.title='클릭: 덱 빠른 메뉴';cell.onclick=e=>{e.stopPropagation();v628OpenEntityMenu('deck',d.key,ALIASES[d.key]||d.label,e.clientX,e.clientY)};cell.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();v628OpenEntityMenu('deck',d.key,ALIASES[d.key]||d.label,e.clientX,e.clientY)}});
    });
  };
}

// Make it explicit that matchup evidence is the full observed record from the selected row-deck perspective.
if(typeof renderRecords==='function'){
  const v6382BaseRenderRecords=renderRecords;
  renderRecords=function(rows){v6382BaseRenderRecords(rows);if(activePureMatchupPair){const c=document.querySelector('#recordCount');if(c)c.textContent+=(c.textContent?' · ':'')+'상성표 전체 전적 · 기준 덱 관점'}};
}

// v6.38.2 matchup matrix: the cell itself is deliberately literal.
// Large number = FULL observed win rate. Second line = the exact same full W/L record opened on click.
// Precision/model estimates remain available internally for AI/detail analysis, but never replace the observed rate here.
function v6372FullMatchRows(){
  const range=typeof activeDateRange==='function'?activeDateRange():{from:0,to:Number.MAX_SAFE_INTEGER};
  const sf=document.querySelector('#seasonFilter')?.value||'',q=(document.querySelector('#q')?.value||'').trim().toLowerCase(),oh=document.querySelector('#ownHero')?.value||'',ph=document.querySelector('#oppHero')?.value||'';
  return (ALL_DATA||[]).filter(r=>{
    if(!r||!['승','패'].includes(r.result))return false;
    const t=typeof parseTime==='function'?parseTime(r.time):Date.parse(r.time);if(Number.isFinite(t)&&(t<range.from||t>range.to))return false;
    if(sf&&(r.season||'현재 시즌')!==sf)return false;
    const ha=typeof heroes==='function'?heroes(r):[],hb=typeof heroes==='function'?heroes(r,true):[];if(ha.length!==3||hb.length!==3)return false;
    if(oh&&!ha.includes(oh))return false;if(ph&&!hb.includes(ph))return false;
    if(q){const hay=typeof searchableText==='function'?searchableText(r):Object.values(r).join(' ');if(!String(hay).toLowerCase().includes(q))return false}
    return true;
  });
}
function v6372FullOrientedMatchObs(rows){
  const mode=document.querySelector('#analysisMode')?.value||'hero',out=[];
  for(const r of rows||[]){
    const a=deckDescriptor(r,false,mode),b=deckDescriptor(r,true,mode);if(!a.complete||!b.complete||!a.key||!b.key)continue;
    const y=r.result==='승'?1:r.result==='패'?0:NaN;if(!Number.isFinite(y))continue;
    const base={r,a:a.key,b:b.key,al:a.label,bl:b.label,at:a.title,bt:b.title,y};out.push(base);
    // Mirror matchups are one real battle, so do not double-count the reverse orientation.
    if(a.key!==b.key)out.push({...base,a:b.key,b:a.key,al:b.label,bl:a.label,at:b.title,bt:a.title,y:1-y});
  }
  return out;
}
renderMatchMatrix=function(){
  const rows=v6370MatchRows(),practicalRows=v6370PracticalMatchRows(),fullRows=v6372FullMatchRows(),model=v6370FitModel(),oriented=v6370OrientedMatchObs(rows),practicalOriented=v6370OrientedMatchObs(practicalRows),fullOriented=v6372FullOrientedMatchObs(fullRows),min=Number(document.querySelector('#minSample')?.value||1),counts=new Map(),meta=new Map(),cells=new Map(),upsetCells=new Map(),fullCells=new Map();
  for(const o of practicalOriented){counts.set(o.a,(counts.get(o.a)||0)+1);if(!meta.has(o.a))meta.set(o.a,{l:o.al,t:o.at});const k=o.a+'@@'+o.b;if(o.upsetType){if(!upsetCells.has(k))upsetCells.set(k,[]);upsetCells.get(k).push(o)}}
  for(const o of oriented){if(!meta.has(o.a))meta.set(o.a,{l:o.al,t:o.at});const k=o.a+'@@'+o.b;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(o)}
  for(const o of fullOriented){if(!meta.has(o.a))meta.set(o.a,{l:o.al,t:o.at});const k=o.a+'@@'+o.b;if(!fullCells.has(k))fullCells.set(k,[]);fullCells.get(k).push(o);if(!counts.has(o.a))counts.set(o.a,0)}
  const decks=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko')).map(x=>x[0]);
  const head=document.querySelector('#matchHead'),body=document.querySelector('#matchRows');if(!head||!body)return;
  head.innerHTML='<tr><th class="corner">기준 덱 ↓ / 상대 덱 →</th>'+decks.map(k=>`<th title="${esc2(meta.get(k)?.t||'')}">${esc2(meta.get(k)?.l||k)}</th>`).join('')+'</tr>';
  if(!decks.length){body.innerHTML='<tr><td class="empty" colspan="17">상성 분석 표본이 없습니다.</td></tr>';v6370RenderMatchSummary(rows,fullRows,model);return}
  body.innerHTML=decks.map(a=>`<tr><th class="rowdeck" title="${esc2(meta.get(a)?.t||'')}">${esc2(meta.get(a)?.l||a)}</th>`+decks.map(b=>{
    const xs=cells.get(a+'@@'+b)||[],ux=upsetCells.get(a+'@@'+b)||[],fx=fullCells.get(a+'@@'+b)||[],fullN=fx.length;
    if(!fullN||fullN<min)return'<td class="mx empty">—</td>';
    if(a===b){return`<td class="mx even v6370Mx v6372SimpleMx" data-own="${esc2(a)}" data-opp="${esc2(b)}" title="동일 덱 미러전 · 전체 ${fullN}전 · 기준 승률 50%"><div class="mxrate">50%</div><div class="mxn">전체 ${fullN}전 · 미러전</div></td>`}
    const fw=fx.filter(o=>o.y===1).length,fl=fullN-fw,raw=fullN?fw/fullN:.5,rate=(100*raw).toFixed(1),title=`전체 관측 승률 ${rate}% · 전체 ${fullN}전 · ${fw}승 ${fl}패`;
    return`<td class="mx v6370Mx v6372SimpleMx ${v6370CellClass(raw)}" data-own="${esc2(a)}" data-opp="${esc2(b)}" title="${esc2(title)}"><div class="mxrate">${rate}%</div><div class="mxn">전체 ${fullN}전 · ${fw}승 ${fl}패</div></td>`
  }).join('')+'</tr>').join('');
  body.querySelectorAll('td[data-own]').forEach(td=>td.onclick=()=>{activePureMatchupPair=true;activeAnyDeck='';activeOwnDeck=td.dataset.own;activeOppDeck=td.dataset.opp;activeKeyMode=document.querySelector('#analysisMode')?.value||'hero';if(document.querySelector('#allianceFilter'))document.querySelector('#allianceFilter').value='';if(document.querySelector('#resultFilter'))document.querySelector('#resultFilter').value='';if(document.querySelector('#recordViewMode'))document.querySelector('#recordViewMode').value='battle';showTab('records');render()});
  v6370RenderMatchSummary(rows,fullRows,model);
};
function v6370RenderMatchSummary(rows,fullRows,model){
  const box=document.querySelector('#v6370PrecisionSummary');if(!box)return;const players=model.players.size,decks=model.decks.size;
  box.innerHTML=`<div><b>전체 관측 전적</b><strong>${(fullRows||[]).length.toLocaleString()}전</strong><span>현재 기간·시즌의 전체 PVP</span></div><div><b>정밀 계산 표본</b><strong>${(rows||[]).length.toLocaleString()}전</strong><span>AI·상세 정밀 분석에만 사용</span></div><div><b>분석 범위</b><strong>${decks}덱</strong><span>${players}명 관측 기반 보정</span></div><div><b>상성표 표시</b><strong>실제 승률 + 전체 전적</strong><span>셀 클릭 시 동일한 전체 전보를 기준 덱 관점으로 표시</span></div>`;
}

// Deck table uses strict fair rows and weighted Jeffreys estimate rather than the old fixed 10-game prior.
function v6370DeckMetrics(rows){
  const oriented=v6370OrientedMatchObs(rows),m=new Map();for(const o of oriented){let z=m.get(o.a);if(!z)z={key:o.a,label:o.al,title:o.at,heroKey:o.ah||o.a,obs:[],n:0,w:0,l:0,latest:0};z.obs.push(o);z.n++;o.y?z.w++:z.l++;z.latest=Math.max(z.latest,o.time||0);m.set(o.a,z)}
  const prior=v6370EmpiricalPrior([...m.values()].map(z=>z.obs),6,36);for(const z of m.values()){const q=v6370BayesWeighted(z.obs,prior);Object.assign(z,q);z.conf=v6370Confidence({...q,pairs:new Set(z.obs.map(o=>[o.ua,o.ub].sort().join('↔'))).size});z.pairs=new Set(z.obs.map(o=>[o.ua,o.ub].sort().join('↔'))).size;z.prior=prior}return m;
}
function v6371DeckUpsetMetrics(rows){
  const m=new Map();for(const o of v6370OrientedMatchObs(rows).filter(o=>!!o.upsetType)){let z=m.get(o.a);if(!z)z={wins:0,losses:0,lowTroop:0,lowSupply:0};o.y===1?z.wins++:z.losses++;if(o.upsetType==='저병력 역전')z.lowTroop++;else if(o.upsetType==='저공급 역전')z.lowSupply++;m.set(o.a,z)}return m;
}

renderStats=function(){
  v6366InsertGuides?.();const fairRows=v6370FairRows(),practicalRows=v6370PracticalRows(),fullRows=v6366FullRows(),fm=v6370DeckMetrics(fairRows),um=v6371DeckUpsetMetrics(practicalRows),fullMap=v6366DeckAgg(fullRows,false),min=Number(document.querySelector('#minSample')?.value||1),mode=document.querySelector('#analysisMode')?.value||'hero';
  const head=document.querySelector('#decks thead tr');if(head)head.innerHTML='<th class="deckSortHead" data-sort="label">덱/세팅</th><th>전체 전적</th><th>전체 승률</th><th>정밀 표본</th><th>정밀 승/패</th><th>관측 승률</th><th>정밀 추정</th><th>95% 범위</th><th>역전 근거</th><th>최근 등장</th><th>신뢰도</th><th>병력 균형</th>';
  const list=[...fm.values()].filter(z=>z.n>=min).sort((a,b)=>b.n-a.n||b.est-a.est||a.label.localeCompare(b.label,'ko')),body=document.querySelector('#deckRows');
  if(document.querySelector('#deckModeText'))document.querySelector('#deckModeText').innerHTML=(mode==='setup'?'세팅별':'장수 조합')+' · <span class="v6370PrecisionTag">정밀 공정조건 + 경험적 Bayes 보정</span>';
  body.innerHTML=list.map(z=>{const full=fullMap.get(z.heroKey)||fullMap.get(z.key)||{n:0,w:0,l:0},u=um.get(z.key)||um.get(z.heroKey)||{wins:0,losses:0};return`<tr class="clickable" data-deck="${esc2(z.key)}" title="${esc2(z.title||'')}"><td class="deck">${esc2(z.label)}</td><td class="v6366DeckRecord"><span class="all">${full.n||0}전 · ${full.w||0}승 ${full.l||0}패</span></td><td class="rate">${full.n?v6366Fmt(full.w,full.l):'-'}</td><td>${z.n}</td><td><span class="fair">${z.w}승 ${z.l}패</span></td><td class="rate">${pct1(z.n?z.w/z.n:NaN)}</td><td class="adjRate v6370Estimate">${pct1(z.est)}</td><td class="v6370Ci">${pct0(z.low)}~${pct0(z.high)}</td><td>${u.wins||u.losses?`역전 ${u.wins} · 피역전 ${u.losses}`:'-'}</td><td>${z.latest?esc2(shortTime(new Date(z.latest).toISOString())):'-'}</td><td>${z.conf.label}<div class="small">유효 ${z.neff.toFixed(1)} · ${z.pairs}쌍</div></td><td>${Math.round(100*z.quality)}%</td></tr>`}).join('')||'<tr><td colspan="12" class="empty">정밀 공정조건 표본에 맞는 덱이 없습니다.</td></tr>';
  body.querySelectorAll('tr[data-deck]').forEach(tr=>tr.onclick=()=>{activePureMatchupPair=false;activeOwnDeck=tr.dataset.deck;activeOppDeck='';activeAnyDeck='';activeKeyMode=mode;showTab('records');render()});
  try{renderMatchMatrix()}catch(e){console.error('precision matchup render',e)}
  try{v632RenderDeckQuadrant?.()}catch(_){ }
};

// Keep meta quadrant on strict rows even though it retains the compact visual score.
try{
  const oldQuad=v632RenderDeckQuadrant;
  v632RenderDeckQuadrant=function(){
    const save=baseFiltered;baseFiltered=()=>v6370FairRows();try{oldQuad()}finally{baseFiltered=save}
    const box=document.querySelector('#v632DeckQuadrant');if(!box)return;const metrics=v6370DeckMetrics(v6370FairRows()),qt={tl:['숨은 강대','적게 쓰이지만 정밀 추정이 높은 조합'],tr:['메타 핵심','많이 쓰이며 정밀 추정도 높은 조합'],bl:['비주류','표본이 적거나 정밀 추정이 낮은 조합'],br:['과사용 주의','많이 쓰이지만 정밀 추정은 낮은 조합']};
    const tip=box.querySelector('#v632QuadTooltip');for(const b of box.querySelectorAll('[data-deck]')){const m=metrics.get(b.dataset.deck);if(!m)continue;const x=parseFloat(b.style.left)||50,y=92-84*clamp(((100*m.est)-25)/50,0,1),q=y<50?(x<50?'tl':'tr'):(x<50?'bl':'br');b.style.top=y.toFixed(2)+'%';b.classList.remove('q-tl','q-tr','q-bl','q-br');b.classList.add('q-'+q);b.dataset.adj=(100*m.est).toFixed(1);b.dataset.score=(100*m.low).toFixed(1);b.dataset.qtitle=qt[q][0];b.dataset.qtext=qt[q][1];const sub=b.querySelector('.sub');if(sub)sub.textContent=`정밀 ${(100*m.est).toFixed(1)}%`;b.title=`${b.dataset.label||''} · ${m.n}전 · 정밀 ${(100*m.est).toFixed(1)}% · 95% ${Math.round(100*m.low)}~${Math.round(100*m.high)}% · 유효 ${m.neff.toFixed(1)}`;const show=()=>{if(!tip)return;tip.classList.remove('hidden');tip.innerHTML=`<div class="ttl">${esc2(b.dataset.label)}</div><div class="meta"><span>사분면</span><b>${esc2(b.dataset.qtitle)}</b><span>표본</span><b>${m.n}전</b><span>정밀 추정</span><b>${(100*m.est).toFixed(1)}%</b><span>95% 범위</span><b>${Math.round(100*m.low)}~${Math.round(100*m.high)}%</b><span>유효 표본</span><b>${m.neff.toFixed(1)}</b></div><div class="hint">${esc2(b.dataset.qtext)} · 정확한 상대 덱별 판정은 상성 분석을 우선 확인하세요.</div>`};b.onmouseenter=show;b.onfocus=show;b.onmouseleave=()=>tip?.classList.add('hidden');b.onblur=()=>tip?.classList.add('hidden')}
    const core=document.querySelector('#v637MetaCoreList'),minSample=Number(window.V637_QUAD_MIN_SAMPLE||3);if(core){const arr=[...metrics.values()].filter(m=>m.n>=minSample).sort((a,b)=>b.n-a.n),max=Math.max(1,...arr.map(m=>m.n)),top=arr.map(m=>({m,x:6+88*Math.sqrt(m.n/max),y:92-84*clamp(((100*m.est)-25)/50,0,1)})).filter(z=>z.x>=50&&z.y<50).sort((a,b)=>b.m.low-a.m.low||b.m.est-a.m.est||b.m.n-a.m.n).slice(0,5);core.innerHTML=`<div class="v637MetaCoreHead"><b>메타 핵심 요약</b><span>${minSample}전 이상 · 정밀 추정/95% 하한 참고</span></div><div class="v637MetaCoreItems">${top.length?top.map((z,i)=>`<button class="v637CoreDeck" data-core-deck="${esc2(z.m.key)}"><span class="rank">${i+1}</span><span class="name">${esc2(z.m.label)}</span><span class="meta">${z.m.n}전 · 정밀 ${(100*z.m.est).toFixed(1)}% · 95%하한 ${Math.round(100*z.m.low)}%</span></button>`).join(''):'<div class="empty">현재 기준에서 메타 핵심 구간에 들어온 덱이 없습니다.</div>'}</div>`;core.querySelectorAll('[data-core-deck]').forEach(b=>b.onclick=()=>{activeAnyDeck=b.dataset.coreDeck;activeOwnDeck='';activeOppDeck='';showTab('records');render()})}
  }
}catch(_){ }

function v6370UserPrior(rows){
  const groups=new Map();for(const o of v6370ObsFromRows(rows)){if(!groups.has(o.ua))groups.set(o.ua,[]);if(!groups.has(o.ub))groups.set(o.ub,[]);groups.get(o.ua).push(o);groups.get(o.ub).push({...o,a:o.b,b:o.a,al:o.bl,bl:o.al,ua:o.ub,ub:o.ua,y:1-o.y})}return v6370EmpiricalPrior([...groups.values()],1,16);
}
function v6370UserMetric(name,rows){
  const base=v6370ObsFromRows(rows),xs=[];for(const o of base){if(o.ua===name)xs.push(o);else if(o.ub===name)xs.push({...o,a:o.b,b:o.a,al:o.bl,bl:o.al,ua:o.ub,ub:o.ua,y:1-o.y})}return v6370BayesWeighted(xs,v6370UserPrior(rows))
}
function v6370AlliancePrior(rows){
  const groups=new Map();for(const o of v6370ObsFromRows(rows)){const a=o.r.alliance||'',b=o.r.oppAlliance||'';if(a){if(!groups.has(a))groups.set(a,[]);groups.get(a).push(o)}if(b){if(!groups.has(b))groups.set(b,[]);groups.get(b).push({...o,a:o.b,b:o.a,al:o.bl,bl:o.al,ua:o.ub,ub:o.ua,y:1-o.y})}}return v6370EmpiricalPrior([...groups.values()],2,20);
}
function v6370AllianceMetric(alliance,rows){
  const base=v6370ObsFromRows(rows),xs=[];for(const o of base){if(o.r.alliance===alliance)xs.push(o);else if(o.r.oppAlliance===alliance)xs.push({...o,a:o.b,b:o.a,al:o.bl,bl:o.al,ua:o.ub,ub:o.ua,y:1-o.y})}return v6370BayesWeighted(xs,v6370AlliancePrior(rows))
}
function v6370UserObs(name,rows){const out=[];for(const o of v6370ObsFromRows(rows)){if(o.ua===name)out.push(o);else if(o.ub===name)out.push({...o,a:o.b,b:o.a,ah:o.bh,bh:o.ah,al:o.bl,bl:o.al,ua:o.ub,ub:o.ua,y:1-o.y})}return out}
function v6370GroupMetric(xs,keyFn,labelFn){const m=new Map();for(const o of xs){const k=keyFn(o);if(!k)continue;let z=m.get(k);if(!z)z={key:k,label:labelFn(o),obs:[],w:0,l:0,n:0};z.obs.push(o);z.n++;o.y?z.w++:z.l++;m.set(k,z)}const prior=v6370EmpiricalPrior([...m.values()].map(z=>z.obs),3,18);for(const z of m.values())Object.assign(z,v6370BayesWeighted(z.obs,prior));return[...m.values()].sort((a,b)=>b.n-a.n||b.est-a.est)}
function v6370RenderPlayerTables(name,rows){
  const xs=v6370UserObs(name,rows),decks=v6370GroupMetric(xs,o=>o.a,o=>o.al),opps=v6370GroupMetric(xs,o=>o.ub,o=>o.ub),dr=document.querySelector('#playerDeckRows'),or=document.querySelector('#playerOppRows');
  const dh=dr?.closest('table')?.querySelector('thead tr');if(dh)dh.innerHTML='<th>사용 덱</th><th>교전</th><th>승</th><th>패</th><th>관측승률</th><th>정밀추정</th><th>95% 범위</th>';
  const oh=or?.closest('table')?.querySelector('thead tr');if(oh)oh.innerHTML='<th>상대</th><th>교전</th><th>승</th><th>패</th><th>관측승률</th><th>정밀추정</th><th>95% 범위</th>';
  if(dr)dr.innerHTML=decks.map(z=>`<tr><td class="deck">${esc2(z.label)}</td><td>${z.n}</td><td class="win">${z.w}</td><td class="loss">${z.l}</td><td class="rate">${pct1(z.n?z.w/z.n:NaN)}</td><td class="adjRate">${pct1(z.est)}</td><td class="v6370Ci">${pct0(z.low)}~${pct0(z.high)} <span class="small">유효 ${z.neff.toFixed(1)}</span></td></tr>`).join('')||'<tr><td colspan="7" class="empty">정밀 덱 데이터 없음</td></tr>';
  if(or){or.innerHTML=opps.slice(0,20).map(z=>`<tr class="clickable" data-player="${esc2(z.key)}"><td><b>${esc2(z.label)}</b></td><td>${z.n}</td><td class="win">${z.w}</td><td class="loss">${z.l}</td><td class="rate">${pct1(z.n?z.w/z.n:NaN)}</td><td class="adjRate">${pct1(z.est)}</td><td class="v6370Ci">${pct0(z.low)}~${pct0(z.high)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">정밀 상대 데이터 없음</td></tr>';or.querySelectorAll('[data-player]').forEach(tr=>tr.onclick=()=>openPlayerAnalysis(tr.dataset.player))}
  const main=document.querySelector('#pMainDeck');if(main&&decks[0])main.textContent=`${decks[0].label} · ${decks[0].n}교전 · 정밀 ${pct1(decks[0].est)}`;
}
function v6370RenderAllianceTables(alliance,rows){
  const base=v6370ObsFromRows(rows),xs=[];for(const o of base){if(o.r.alliance===alliance)xs.push({...o,oppAlliance:o.r.oppAlliance||'동맹 없음',player:o.ua});else if(o.r.oppAlliance===alliance)xs.push({...o,a:o.b,b:o.a,ah:o.bh,bh:o.ah,al:o.bl,bl:o.al,ua:o.ub,ub:o.ua,y:1-o.y,oppAlliance:o.r.alliance||'동맹 없음',player:o.ub})}
  const opps=v6370GroupMetric(xs,o=>o.oppAlliance,o=>o.oppAlliance),players=v6370GroupMetric(xs,o=>o.player,o=>o.player),or=document.querySelector('#allianceOppRows'),pr=document.querySelector('#alliancePlayerRows');
  const oh=or?.closest('table')?.querySelector('thead tr');if(oh)oh.innerHTML='<th>상대 연맹</th><th>교전</th><th>승</th><th>패</th><th>관측승률</th><th>정밀추정</th><th>95% 범위</th><th>유효표본</th>';
  const ph=pr?.closest('table')?.querySelector('thead tr');if(ph)ph.innerHTML='<th>플레이어</th><th>교전</th><th>승</th><th>패</th><th>관측승률</th><th>정밀추정</th><th>95% 범위</th><th>유효표본</th>';
  const row=z=>`<td>${z.n}</td><td class="win">${z.w}</td><td class="loss">${z.l}</td><td class="rate">${pct1(z.n?z.w/z.n:NaN)}</td><td class="adjRate">${pct1(z.est)}</td><td class="v6370Ci">${pct0(z.low)}~${pct0(z.high)}</td><td>${z.neff.toFixed(1)}</td>`;
  if(or)or.innerHTML=opps.map(z=>`<tr><td>${esc2(z.label)}</td>${row(z)}</tr>`).join('')||'<tr><td colspan="8" class="empty">정밀 상대 연맹 데이터 없음</td></tr>';
  if(pr)pr.innerHTML=players.slice(0,30).map(z=>`<tr class="clickable" data-player="${esc2(z.key)}"><td><b>${esc2(z.label)}</b></td>${row(z)}</tr>`).join('')||'<tr><td colspan="8" class="empty">정밀 플레이어 데이터 없음</td></tr>';pr?.querySelectorAll('[data-player]').forEach(tr=>tr.onclick=()=>openPlayerAnalysis(tr.dataset.player));
}

function v6370PlayerStrictRows(name,rows){
  const ctx=typeof playerAllianceContext!=='undefined'?String(playerAllianceContext||''):'';
  return (rows||[]).filter(r=>(r.user===name&&(!ctx||r.alliance===ctx))||(r.oppUser===name&&(!ctx||r.oppAlliance===ctx)));
}
function v6370PlayerRawCount(name,rows){
  let w=0,l=0,d=0,battles=0,chains=0,longest=1,last=0;const recent=[];
  for(const r of v6370PlayerStrictRows(name,rows)){let rr='';if(r.user===name)rr=r.result;else rr=invertResult(r.result);if(rr==='승')w++;else if(rr==='패')l++;else d++;const cc=Math.max(1,Number(r.chainCount||1)||1);battles+=cc;if(cc>1){chains++;longest=Math.max(longest,cc)}const tm=parseTime(r.time)||0;last=Math.max(last,tm);recent.push({time:tm,result:rr})}
  recent.sort((a,b)=>b.time-a.time);const r10=recent.slice(0,10),rw=r10.filter(x=>x.result==='승').length,rl=r10.filter(x=>x.result==='패').length;
  return{n:w+l+d,w,l,d,battles,chains,longest,last,recentW:rw,recentL:rl};
}
function v6370SetCardMetric(id,label,value,title=''){
  const el=document.querySelector('#'+id);if(!el)return;el.textContent=value;const card=el.closest('.mini,.diagCard,.trendCard');const k=card?.querySelector('.k');if(k&&label)k.textContent=label;if(title)el.title=title;
}
v6366RenderPlayerCompare=function(){
  const box=document.querySelector('#v6366PlayerCompare'),name=document.querySelector('#playerInput')?.value.trim();if(!box||!name||document.querySelector('#playerSummary')?.classList.contains('hidden')){if(box)box.innerHTML='';return}
  const ctx=typeof playerAllianceContext!=='undefined'?playerAllianceContext:'',fullRows=v6366FullRows(),full=v6366RawPerspective(name,fullRows,ctx),fs=v6366Count(full),fairRows=v6370PlayerStrictRows(name,v6370FairRows()),strict=v6370PlayerRawCount(name,fairRows),m=v6370UserMetric(name,fairRows),model=v6370FitModel(),skill=model.players.has(name)?sigmoid(model.players.get(name)):NaN,excluded=Math.max(0,fs.n-strict.battles);
  box.innerHTML=`<div class="v6366CompareCard full"><div class="v6366CompareHead"><b>전체 관측 전적</b><span>모든 PVP 개별 전투</span></div><div class="v6366CompareMain">${fs.w}승 ${fs.l}패 · ${fs.w+fs.l?pct1(fs.w/(fs.w+fs.l)):'-'}</div><div class="v6366CompareSub">${fs.n.toLocaleString()}전${fs.d?` · 무 ${fs.d}`:''}</div><div class="v6366CompareFoot">실제 수집 기록${excluded?` · 정밀조건 외 개별전투 약 ${excluded.toLocaleString()}전`:''}</div></div><div class="v6366CompareCard fair"><div class="v6366CompareHead"><b>정밀 공정조건 관측</b><span>기본 승률 표본</span></div><div class="v6366CompareMain">${strict.w}승 ${strict.l}패 · ${strict.w+strict.l?pct1(strict.w/(strict.w+strict.l)):'-'}</div><div class="v6366CompareSub">${strict.n.toLocaleString()}교전 · ${strict.battles.toLocaleString()}개별전투 · 역전표본은 상성 근거로 분리</div><div class="v6366CompareFoot">양측 시작병력 기준과 공급 하한을 적용하며, 공급은 기준 이상이면 모두 동일 조건으로 봅니다.</div></div>${m.n?`<div class="v6366CompareCard v6370Precise"><div class="v6366CompareHead"><b>정밀 추정</b><span>반복·병력균형 보정</span></div><div class="v6366CompareMain">${pct1(m.est)} <small>95% ${pct0(m.low)}~${pct0(m.high)}</small></div><div class="v6366CompareSub">유효표본 ${m.neff.toFixed(1)} · 병력균형 ${Math.round(100*m.quality)}%${Number.isFinite(skill)?` · 평균조건 실력지수 ${pct1(skill)}`:''}</div><div class="v6366CompareFoot">같은 상대·같은 덱의 반복 교전은 감쇠해 한 유저의 반복 표본이 통계를 지배하지 않게 합니다.</div></div>`:''}`;
  v6370SetCardMetric('pBattles','정밀조건 개별 전투',strict.battles.toLocaleString());
  v6370SetCardMetric('pTotal','정밀조건 교전',strict.n.toLocaleString());
  v6370SetCardMetric('pRecord','정밀조건 승/패',`${strict.w}승 ${strict.l}패`);
  v6370SetCardMetric('pRate','관측 승률',strict.w+strict.l?pct1(strict.w/(strict.w+strict.l)):'-');
  v6370SetCardMetric('pAdjRate','정밀 추정 승률',m.n?pct1(m.est):'-',m.n?`95% ${pct1(m.low)} ~ ${pct1(m.high)} · 유효표본 ${m.neff.toFixed(1)}`:'');
  v6370SetCardMetric('pScore','95% 하한',m.n?pct1(m.low):'-','보수적으로 볼 때의 95% 구간 하한');
  v6370SetCardMetric('pRecent','최근 10 정밀교전',`${strict.recentW}승 ${strict.recentL}패`);
  v6370SetCardMetric('pChains','연속교전',strict.chains.toLocaleString());
  v6370SetCardMetric('pLongest','최장 연속전투',`${strict.longest}전`);
  v6370SetCardMetric('pLast','최근 정밀표본',strict.last?shortTime(new Date(strict.last).toISOString()):'-');
  v6370RenderPlayerTables(name,fairRows);
};
function v6370AllianceRawCount(alliance,rows){let w=0,l=0,d=0,n=0,battles=0,last=0;for(const r of rows||[]){let rr='';if(r.alliance===alliance)rr=r.result;else if(r.oppAlliance===alliance)rr=invertResult(r.result);else continue;n++;battles+=Math.max(1,Number(r.chainCount||1)||1);last=Math.max(last,parseTime(r.time)||0);if(rr==='승')w++;else if(rr==='패')l++;else d++}return{n,w,l,d,battles,last}}
v6366RenderAllianceCompare=function(){
  const box=document.querySelector('#v6366AllianceCompare'),a=document.querySelector('#allianceAnalysisSelect')?.value||'';if(!box||!a){if(box)box.innerHTML='';return}const full=v6370AllianceRawCount(a,v6366FullRows()),fairRows=v6370FairRows(),strict=v6370AllianceRawCount(a,fairRows),m=v6370AllianceMetric(a,fairRows),players=new Set();for(const r of fairRows){if(r.alliance===a&&r.user)players.add(r.user);if(r.oppAlliance===a&&r.oppUser)players.add(r.oppUser)}
  box.innerHTML=`<div class="v6366CompareCard full"><div class="v6366CompareHead"><b>전체 관측 전적</b><span>모든 PVP 개별 전투</span></div><div class="v6366CompareMain">${full.w}승 ${full.l}패 · ${full.w+full.l?pct1(full.w/(full.w+full.l)):'-'}</div><div class="v6366CompareSub">${full.n.toLocaleString()}전</div><div class="v6366CompareFoot">병력·공급 조건과 관계없는 실제 수집 기록</div></div><div class="v6366CompareCard fair"><div class="v6366CompareHead"><b>정밀 공정조건 관측</b><span>기본 승률 표본</span></div><div class="v6366CompareMain">${strict.w}승 ${strict.l}패 · ${strict.w+strict.l?pct1(strict.w/(strict.w+strict.l)):'-'}</div><div class="v6366CompareSub">${strict.n.toLocaleString()}교전 · ${strict.battles.toLocaleString()}개별전투 · 참전 ${players.size.toLocaleString()}명</div><div class="v6366CompareFoot">역전 표본은 승률과 분리해 상성 근거로 사용 · 후속 재교전/연결이상 제외</div></div>${m.n?`<div class="v6366CompareCard v6370Precise"><div class="v6366CompareHead"><b>정밀 추정</b><span>공정조건 가중</span></div><div class="v6366CompareMain">${pct1(m.est)} <small>95% ${pct0(m.low)}~${pct0(m.high)}</small></div><div class="v6366CompareSub">유효표본 ${m.neff.toFixed(1)} · 병력균형 ${Math.round(100*m.quality)}%</div><div class="v6366CompareFoot">동일 유저쌍 반복과 시작병력 불균형의 영향력을 낮춘 값입니다. 공급 80 이상은 동등합니다.</div></div>`:''}`;
  v6370SetCardMetric('aBattles','정밀조건 개별 전투',strict.battles.toLocaleString());
  v6370SetCardMetric('aEngagements','정밀조건 교전',strict.n.toLocaleString());
  v6370SetCardMetric('aRecord','정밀조건 승/패',`${strict.w}승 ${strict.l}패`);
  v6370SetCardMetric('aRate','관측 승률',strict.w+strict.l?pct1(strict.w/(strict.w+strict.l)):'-');
  v6370SetCardMetric('aAdjRate','정밀 추정 승률',m.n?pct1(m.est):'-',m.n?`95% ${pct1(m.low)} ~ ${pct1(m.high)} · 유효표본 ${m.neff.toFixed(1)}`:'');
  v6370SetCardMetric('aScore','95% 하한',m.n?pct1(m.low):'-','보수적으로 볼 때의 95% 구간 하한');
  v6370SetCardMetric('aPlayers','정밀조건 참전 인원',players.size.toLocaleString());
  v6370RenderAllianceTables(a,fairRows);
};

function v6370RowsForRange(range){const sf=document.querySelector('#seasonFilter')?.value||'';return (DATA||[]).filter(r=>{if(!v6370PrecisionEligible(r))return false;const t=parseTime(r.time);if(!Number.isFinite(t)||t<range.from||t>range.to)return false;if(sf&&(r.season||'현재 시즌')!==sf)return false;return true})}
function v6370TrendDecks(){
  const m=new Map();for(const r of v6370ModelRows()){for(const opp of [false,true]){const hs=heroes(r,opp);if(hs.length!==3)continue;const k=canon(hs);let z=m.get(k);if(!z)z={key:k,label:ordered(hs),n:0};z.n++;m.set(k,z)}}return[...m.values()].sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label,'ko'));
}
function v6370PopulateTrendDeck(){const el=document.querySelector('#trendDeck');if(!el)return;const keep=el.value,ds=v6370TrendDecks();el.innerHTML='<option value="">덱 선택</option>'+ds.map(d=>`<option value="${esc2(d.key)}">${esc2(ALIASES[d.key]||d.label)} · ${d.n}정밀표본</option>`).join('');if(keep&&ds.some(d=>d.key===keep))el.value=keep;else if(ds[0])el.value=ds[0].key}
const v6370LegacyTrendRange=v626TrendRange;v626TrendRange=function(){const mode=document.querySelector('#trendWindow')?.value||'current';if(mode==='current')return activeDateRange();if(mode==='all')return{from:0,to:Number.MAX_SAFE_INTEGER};const h={"7d":168,"14d":336,"30d":720}[mode]||0,anchor=typeof v627AnchorNow==='function'?v627AnchorNow():Date.now();return{from:anchor-h*3600000,to:anchor}}
function v6370TrendObs(deckKey,range){const out=[];for(const o of v6370OrientedMatchObs(v6370RowsForRange(range))){if(o.a===deckKey)out.push(o)}return out}
renderTrendAnalysis=function(){if(!document.querySelector('#trendRows'))return;
  v6370PopulateTrendDeck();const key=document.querySelector('#trendDeck')?.value;if(!key){document.querySelector('#trendRows').innerHTML='<tr><td colspan="8" class="empty">덱을 선택하세요.</td></tr>';return}const ds=v6370TrendDecks(),meta=ds.find(x=>x.key===key),range=v626TrendRange(),days=v626BucketDays(range),obs=v6370TrendObs(key,range),bm=new Map();
  for(const o of obs){const k=v626DateFloor(o.time,days);let z=bm.get(k);if(!z)z={start:k,obs:[]};z.obs.push(o);bm.set(k,z)}const buckets=[...bm.values()].sort((a,b)=>a.start-b.start);
  const priorMap=v6370DeckMetrics(v6370RowsForRange(range)),prior=priorMap.get(key)?.prior||{mean:.5,strength:8};for(const z of buckets){const m=v6370BayesWeighted(z.obs,prior);z.n=m.n;z.w=z.obs.filter(o=>o.y===1).length;z.l=z.n-z.w;z.adjusted=100*m.est;z.score=100*m.low;z.low=m.low;z.high=m.high;z.neff=m.neff;z.label=v626FmtBucket(z.start,days)}
  const all=v6370BayesWeighted(obs,prior),w=obs.filter(o=>o.y===1).length,l=obs.length-w;document.querySelector('#trendDeckName').textContent=ALIASES[key]||meta?.label||key;v6370SetCardMetric('trendTotal','정밀 공정 표본',obs.length.toLocaleString());v6370SetCardMetric('trendAdjusted','정밀 추정',obs.length?pct1(all.est):'-',obs.length?`95% ${pct1(all.low)} ~ ${pct1(all.high)}`:'');v6370SetCardMetric('trendScore','95% 하한',obs.length?pct1(all.low):'-');
  const metric=document.querySelector('#trendMetric')?.value||'adjusted';let delta='-',dc='trendDeltaFlat';if(buckets.length>=2){const a=buckets[buckets.length-2],b=buckets[buckets.length-1],va=metric==='sample'?a.n:metric==='score'?a.score:a.adjusted,vb=metric==='sample'?b.n:metric==='score'?b.score:b.adjusted,d=vb-va;delta=(d>0?'+':'')+d.toFixed(metric==='sample'?0:1)+(metric==='sample'?'':'p');dc=d>0?'trendDeltaUp':d<0?'trendDeltaDown':'trendDeltaFlat'}const de=document.querySelector('#trendDelta');de.textContent=delta;de.className='v '+dc;
  const head=document.querySelector('#trends thead tr');if(head)head.innerHTML='<th>기간</th><th>표본</th><th>승</th><th>패</th><th>관측승률</th><th>정밀추정</th><th>95% 범위</th><th>전 구간 대비</th>';
  let prev=null;document.querySelector('#trendRows').innerHTML=buckets.map(z=>{const cur=metric==='sample'?z.n:metric==='score'?z.score:z.adjusted,d=prev===null?null:cur-prev;prev=cur;return`<tr><td>${esc2(z.label)}</td><td>${z.n}<div class="small">유효 ${z.neff.toFixed(1)}</div></td><td class="win">${z.w}</td><td class="loss">${z.l}</td><td class="rate">${pct1(z.n?z.w/z.n:NaN)}</td><td class="adjRate">${z.adjusted.toFixed(1)}%</td><td class="v6370Ci">${pct0(z.low)}~${pct0(z.high)}</td><td class="${d>0?'win':d<0?'loss':'muted'}">${d===null?'-':(d>0?'+':'')+d.toFixed(metric==='sample'?0:1)+(metric==='sample'?'':'p')}</td></tr>`}).join('')||'<tr><td colspan="8" class="empty">선택 기간에 정밀 공정조건 표본이 없습니다.</td></tr>';v626RenderTrendChart(buckets,metric)
};

function v6370InstallUi(){
  const winOpt=document.querySelector('#playerRankMode option[value="winrate"]');if(winOpt)winOpt.textContent='정밀조건 관측 승률 · 5교전+';
  const tm=document.querySelector('#trendMetric option[value="adjusted"]');if(tm)tm.textContent='정밀 추정 승률';const ts=document.querySelector('#trendMetric option[value="score"]');if(ts)ts.textContent='95% 하한';
  const trh=document.querySelector('#trends h2 .small');if(trh)trh.textContent='정밀 기본조건만 사용 · 공급 80+ 동일 · 반복 표본/병력 균형 가중 · 기간별 95% 범위';
  const metaSub=document.querySelector('.v632DeckMetaHead span');if(metaSub)metaSub.textContent='정밀 공정조건 · 사용량 × 보수적 추정 성적 · 메타 위치는 참고용, 정확한 상성은 상성 분석에서 확인';
  const ls=document.querySelector('label.checkLine input#setLowSupplyUpset')?.parentElement;if(ls)ls.lastChild.textContent=' 저공급 역전 보존 (승률과 분리 · 상성 근거로 사용)';const lt=document.querySelector('label.checkLine input#setLowTroopUpset')?.parentElement;if(lt)lt.lastChild.textContent=' 저병력 역전 보존 (승률과 분리 · 상성 근거로 사용)';
  const sec=document.querySelector('#matchups');if(sec&&!document.querySelector('#v6370PrecisionSummary')){
    const tools=sec.querySelector('.v632MatchTools');tools?.insertAdjacentHTML('beforebegin','<div id="v6370PrecisionSummary" class="v6370PrecisionSummary"></div>');
    const small=sec.querySelector('h2 .small');if(small)small.textContent='셀 = 정밀 상성 승률 + 전체 관측 전적 · 클릭 = 근거 전보';
    const lg=sec.querySelector('.matrixLegend');if(lg)lg.innerHTML='<span class="lg good">우세 60%+</span><span class="lg midgood">근소우세 51~59%</span><span class="lg even">50%</span><span class="lg midbad">근소열세 41~49%</span><span class="lg bad">열세 40%-</span><span class="small">각 셀에는 승률과 전체 전적만 표시합니다.</span>';
  }
  const style=document.createElement('style');style.id='v6370PrecisionStyle';style.textContent=`
  .v6370PrecisionSummary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:11px 14px;border-bottom:1px solid var(--line);background:#10151a}.v6370PrecisionSummary>div{border:1px solid #2a333d;border-radius:10px;padding:9px 10px;background:#151a20}.v6370PrecisionSummary b,.v6370PrecisionSummary span{display:block}.v6370PrecisionSummary b{font-size:9px;color:#929ca7}.v6370PrecisionSummary strong{display:block;margin:3px 0;color:var(--gold2);font-size:16px}.v6370PrecisionSummary span{font-size:9px;color:#858f99}.v6370Mx{height:68px}.v6370Mx .mxci{font-size:9px;margin-top:3px;color:#d2d7dd}.v6372SimpleMx{padding:8px 7px!important}.v6372SimpleMx .mxrate{font-size:18px!important;line-height:1.05}.v6372SimpleMx .mxn{margin-top:7px!important;font-size:10px!important;color:#c0c8d1!important;white-space:nowrap}.v6370Hold{filter:saturate(.62);outline:1px dashed rgba(255,255,255,.12);outline-offset:-2px}.v6370PrecisionTag{color:#9ee2bd}.v6370Estimate{color:#aee7c8}.v6370Ci{font-size:11px;color:#cbd2da}.v6366CompareCard.v6370Precise{border-color:#365f4b;background:linear-gradient(180deg,rgba(26,57,44,.48),rgba(18,32,27,.45))}.v6370Precise small{font-size:11px;color:#b8c7be}.v6366ScopeGuide .v6366FairTag{background:#173225;border-color:#35694e}.v6370Warn{color:#ffb2aa}
  @media(max-width:800px){.v6370PrecisionSummary{grid-template-columns:1fr 1fr}.v6370Mx{height:64px}.v6370Mx .mxci{display:none}.v6372SimpleMx .mxrate{font-size:16px!important}.v6372SimpleMx .mxn{font-size:9px!important}}
  `;if(!document.querySelector('#v6370PrecisionStyle'))document.head.appendChild(style);
  const guide=document.querySelector('#v6366DeckGuide');if(guide)guide.innerHTML='<b>승률 기준</b><span><span class="v6366FullTag">전체 전적</span> 모든 PVP 기록</span><span class="sep">│</span><span><span class="v6366FairTag">정밀 기본조건</span> 시작병력 기준 + 공급 80 이상은 모두 동등</span><span class="sep">│</span><span>저병력/저공급 역전 = 승률과 분리해 상성 근거로 보수적 반영</span>';
  const hint=document.querySelector('#analysisRuleHint');if(hint)hint.textContent=`정밀 승률: 양측 시작병력 ${Number(META?.minTroops||25000).toLocaleString()}+ · 양측 공급 ${Number(META?.minSupply||80)}+ (이상은 모두 동등) · 역전 표본은 승률과 분리해 상성 근거로 보수적 반영 · 상성은 유저 실력/반복/병력 불균형 보정`;
}
function v6370Refresh(){V6370_MODEL_CACHE={sig:'',model:null};try{v625ClearMemoryCaches?.()}catch(_){}try{render();if(!document.querySelector('#trends')?.classList.contains('hidden'))renderTrendAnalysis()}catch(e){console.error('v6.37.2 precision render',e)}}
function v6370Install(){v6370InstallUi();try{v6366FairRows=v6370FairRows}catch(_){};try{renderQuality()}catch(_){};setTimeout(v6370Refresh,0)}
window.NSLG_PRECISION_ANALYSIS={version:V6370_VERSION,eligible:v6370PrecisionEligible,practicalEligible:v6370PracticalEligible,fairRows:v6370FairRows,practicalRows:v6370PracticalRows,fitModel:v6370FitModel,solveMatch:v6370SolveMatch,blendMatch:v6371BlendMatch};
setTimeout(v6370Install,180);
})();
