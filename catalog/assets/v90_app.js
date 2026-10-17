/* NSLG independent encyclopedia v9.2: manual image management and factual effect breakdown.
 * All uploads are local in IndexedDB. Static-site publication requires explicit export + apply tool.
 * No external requests; no dynamic code execution. */
(function(){
'use strict';
const get=id=>document.getElementById(id);
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DBO='nslg-manual-images-v90', STORE='images', MANUAL=new Map();
const SHARED=(window.NSLG_SHARED_IMAGES && typeof window.NSLG_SHARED_IMAGES==='object')?window.NSLG_SHARED_IMAGES:{};
const EFFECTS=(window.NSLG_EFFECT_LINKS && typeof window.NSLG_EFFECT_LINKS==='object')?window.NSLG_EFFECT_LINKS:{};
const GROUPS={hero:'장수 초상화',equip:'장착 전법',innate:'장수 고유 전법',heroall:'전체 장수',skillall:'전체 전법',tactic:'병법'};
const targetHeroes=H.filter(x=>Number(x.is_show)===1 && Number(x.is_custom)===0 && Number(x.is_story)===0);
const targetSkills=EQUIP;
const targetInnates=targetHeroes.map(h=>({hero:h,skill:SK[String(h.init_skill)]})).filter(y=>!!y.skill);
const VALID_KEYS=new Set([...H.map(h=>'hero:'+h.ID),...G.map(s=>'skill:'+s.ID),...T.map(t=>'tactic:'+t.id)]);
let db=null, targetKey=null, pasteTargetKey=null, managePage=0, folderMode=false;
function validImageKey(k){return /^(hero|skill|tactic):[0-9]{1,9}$/.test(k) && VALID_KEYS.has(k)}
function savedInfo(k){const local=MANUAL.get(k);return local?{path:local.dataUrl,source:'manual-local',label:'내가 업로드'}:(SHARED[k]?{path:SHARED[k],source:'manual-shared',label:'사이트 등록 이미지'}:null)}
const originalStatus=statusImage;
statusImage=function(x,kind){const key=(kind==='hero'?'hero:':kind==='tactic'?'tactic:':'skill:')+String(x.ID??x.id);return savedInfo(key)||originalStatus(x,kind)};
const originalArt=art;
art=function(x,kind){const info=statusImage(x,kind);if(info && info.source.startsWith('manual-')){
  return '<img class="art" loading="lazy" src="'+e(info.path)+'" alt="" title="'+e(info.label)+'" onerror="this.style.visibility=\'hidden\'">';
 }return originalArt(x,kind)};
function storageOpen(){return new Promise((resolve,reject)=>{
 if(!('indexedDB' in window))return reject(new Error('이 브라우저에서 IndexedDB를 지원하지 않습니다.'));
 let req;try{req=indexedDB.open(DBO,1)}catch(err){return reject(err)}
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'key'})};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 })}
async function folderRequest(method, value){
 const response=await fetch('/api/manual-images',{method,cache:'no-store',headers:{'Content-Type':'application/json'},...(value?{body:JSON.stringify(value)}:{})});
 const obj=await response.json();if(!response.ok)throw new Error(obj.error||('HTTP '+response.status));return obj;
}
async function persist(value,del=false){
 if(folderMode)return folderRequest(del?'DELETE':'POST',del?{key:value}:value);
 if(db)return dbWrite(value,del);
 throw new Error('영구 저장소가 없습니다. 도감_실행.bat으로 실행해 주세요.');
}
async function loadAll(){
 if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){
  try{const data=await folderRequest('GET');folderMode=true;
   for(const x of data.images||[])if(validImageKey(x.key)&&/^data:image\/(?:webp|png|jpeg|gif);base64,/i.test(x.dataUrl||''))MANUAL.set(x.key,x);
   message('폴더 영구 저장 준비 완료 · assets/manual-local/ · 등록 '+MANUAL.size+'건.');redraw();return;
  }catch(err){message('폴더 저장 API 연결 실패: '+err.message+' · 구버전 서버라면 종료 후 도감_실행.bat으로 다시 실행하세요.',true)}
 }
 try{db=await storageOpen();const rows=await new Promise((resolve,reject)=>{
 const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)
 });for(const x of rows){if(validImageKey(x.key)&&/^data:image\/(?:webp|png|jpeg|gif);base64,/i.test(x.dataUrl||''))MANUAL.set(x.key,x)};
 message('브라우저 저장소 준비 완료 · 등록 '+MANUAL.size+'건. 폴더 보관은 도감_실행.bat으로 실행하세요.');
 }catch(err){message('이미지 영구 저장소 사용 불가: '+err.message+' · 도감_실행.bat으로 실행하세요.',true)}
 redraw();}
function dbWrite(value,del=false){if(!db)return Promise.reject(new Error('IndexedDB 사용 불가'));return new Promise((resolve,reject)=>{
 const tx=db.transaction(STORE,'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('저장 실패'));tx.onabort=()=>reject(tx.error||new Error('저장 중단'));
 const os=tx.objectStore(STORE);if(del)os.delete(value);else os.put(value);
 })}
function message(s,isWarn=false){let n=get('v90Status');if(n){n.textContent=s;n.style.color=isWarn?'#ffa59e':'#e8c36a'}}
function groupRows(){const group=get('v90Group').value;
 if(group==='hero')return targetHeroes.map(h=>({group,kind:'hero',id:h.ID,name:h.name_kr,rarity:h.quality,x:h,key:'hero:'+h.ID}));
 if(group==='heroall')return H.map(h=>({group,kind:'hero',id:h.ID,name:h.name_kr,rarity:h.quality,x:h,key:'hero:'+h.ID}));
 if(group==='skillall')return G.map(s=>({group,kind:'skill',id:s.ID,name:s.name_kr,rarity:s.quality,x:s,key:'skill:'+s.ID}));
 if(group==='tactic')return T.map(t=>({group,kind:'tactic',id:t.id,name:t.name_kr,rarity:t.quality,x:t,key:'tactic:'+t.id}));
 if(group==='equip')return targetSkills.map(s=>({group,kind:'skill',id:s.ID,name:s.name_kr,rarity:s.quality,x:s,key:'skill:'+s.ID}));
 return targetInnates.map(({hero,skill})=>({group,kind:'skill',id:skill.ID,name:hero.name_kr+' · '+skill.name_kr,rarity:hero.quality,x:skill,key:'skill:'+skill.ID}));
}
function managerDraw(){const group=get('v90Group').value, query=get('v90Search').value.toLocaleLowerCase().trim(),missing=get('v90Missing').checked;
 const all=groupRows(), filter=get('v92StatusFilter').value;
 const rows=all.filter(r=>{const original=!!originalStatus(r.x,r.kind), uploaded=MANUAL.has(r.key), displayed=!!statusImage(r.x,r.kind);
 return (!query||r.name.toLocaleLowerCase().includes(query)||String(r.id).includes(query))&&(!missing||!original)&& (filter==='all'||filter==='uploaded'&&uploaded||filter==='default'&&displayed&&!uploaded||filter==='none'&&!displayed);
 });
 const frame=get('v90ManagerGrid');frame.replaceChildren();
 const uploadedCount=all.filter(r=>MANUAL.has(r.key)).length;
 const missingCount=all.filter(r=>!statusImage(r.x,r.kind)).length;
 message(GROUPS[group]+' '+all.length+'건 · 업로드 '+uploadedCount+'건 · 미등록 '+missingCount+'건 · 표시 '+rows.length+'건 · '+(folderMode?'폴더 영구 저장 활성':'브라우저 저장소 모드'));
 // Render at most 75 cards at once for mobile performance.
 const start=managePage*75, selection=rows.slice(start,start+75);
 for(const r of selection){const img=statusImage(r.x,r.kind),custom=MANUAL.has(r.key),isShared=!!SHARED[r.key],card=document.createElement('article');card.className='v90-icard';
 card.innerHTML='<div class="name">'+e(r.name)+'</div><div class="meta">ID '+e(r.id)+' · '+e(GROUPS[group])+'</div><div class="v90-preview">'+(img?'<img loading="lazy" src="'+e(img.path)+'" alt="'+e(r.name)+' 이미지" onerror="this.style.visibility=\'hidden\'">':'<span class="fallback">미등록</span>')+'</div><div class="v90-mini">'+(custom?'✔ 내가 업로드한 이미지':isShared?'✔ 사이트에 반영한 이미지':img?'기존 도감 이미지':'이미지 미등록')+'</div>';
 const paste=document.createElement('button');paste.type='button';paste.className='v9111-paste-target';paste.textContent=pasteTargetKey===r.key?'✓ 붙여넣기 대상':'📋 붙여넣기 선택';paste.title='선택한 뒤 Ctrl+V로 이미지 붙여넣기';paste.setAttribute('aria-pressed',String(pasteTargetKey===r.key));paste.onclick=()=>{pasteTargetKey=r.key;managerDraw();message(r.name+' (ID '+r.id+') 선택됨 · 스크린샷을 복사한 후 Ctrl+V로 붙여넣으세요.')};card.append(paste);
 const upload=document.createElement('button');upload.type='button';upload.textContent=custom?'교체 업로드':'이미지 업로드';upload.onclick=()=>{targetKey=r.key;get('v90Pick').value='';get('v90Pick').click()};card.append(upload);
 if(custom){const remove=document.createElement('button');remove.type='button';remove.textContent='직접 등록 삭제';remove.className='danger';remove.onclick=async()=>{if(!confirm(r.name+'의 직접 등록 이미지를 삭제할까요? (기본 이미지는 복구됩니다.)'))return;try{await persist(r.key,true)}catch(err){message('저장소 삭제 실패: '+err.message,true);return}MANUAL.delete(r.key);redraw()};card.append(remove)}
 card.addEventListener('dragover',ev=>{ev.preventDefault();card.style.borderColor='#e8c36a'});card.addEventListener('dragleave',()=>{card.style.borderColor=''});
 card.addEventListener('drop',async ev=>{ev.preventDefault();card.style.borderColor='';if(ev.dataTransfer.files.length)await uploadFile(ev.dataTransfer.files[0],r.key)});
 frame.append(card);
 }
 if(rows.length>75){const nav=document.createElement('div');nav.style.gridColumn='1/-1';nav.className='v90-controls';nav.innerHTML='<span class="hint">'+(start+1)+'~'+Math.min(rows.length,start+75)+' / '+rows.length+'</span>';
 const prev=document.createElement('button');prev.textContent='이전';prev.disabled=!managePage;prev.onclick=()=>{managePage--;managerDraw()};const next=document.createElement('button');next.textContent='다음';next.disabled=rows.length<=start+75;next.onclick=()=>{managePage++;managerDraw()};nav.append(prev,next);frame.append(nav)}
}
function redraw(){if(tab==='manager')managerDraw();else draw()}
const drawBefore=draw;
draw=function(){if(tab==='manager'){
 get('v90Manager').hidden=false;get('grid').style.display='none';get('stats').style.display='none';get('progress').style.display='none';document.querySelector('.legend').style.display='none';
 for(const id of ['hTab','sTab','allHTab','allSTab','tTab'])get(id)?.classList.remove('active');get('v90ManageTab').classList.add('active');
 for(const node of get('q').closest('.bar').children)if(!['v90ManageTab','hTab','sTab','allHTab','allSTab','tTab'].includes(node.id))node.style.display='none';get('q').closest('.bar').style.padding='8px';managerDraw();return;
 }
 get('v90Manager').hidden=true;get('grid').style.display='';get('stats').style.display='';get('progress').style.display='';document.querySelector('.legend').style.display='';
 for(const node of get('q').closest('.bar').children)node.style.display='';get('q').closest('.bar').style.padding='';
 get('v90ManageTab').classList.remove('active');drawBefore();
};
let v105LastCatalogTab='heroesAll';get('v90ManageTab').onclick=()=>{if(tab==='manager'){tab=v105LastCatalogTab;currentPage=0;draw()}else{v105LastCatalogTab=tab;tab='manager';managePage=0;draw()}};
get('v90Group').addEventListener('change',()=>{managePage=0;managerDraw()});
get('v90Search').addEventListener('input',()=>{managePage=0;managerDraw()});
get('v90Missing').addEventListener('change',()=>{managePage=0;managerDraw()});
get('v92StatusFilter').addEventListener('change',()=>{managePage=0;managerDraw()});
function decodeImg(blob){return new Promise((resolve,reject)=>{
 const url=URL.createObjectURL(blob),im=new Image();im.onload=()=>{try{const scale=Math.min(1,720/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  let data=c.toDataURL('image/webp',.85);if(!data.startsWith('data:image/webp;'))data=c.toDataURL('image/png');resolve(data);
 }catch(err){reject(err)}finally{URL.revokeObjectURL(url)}};
 im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('이미지 파일을 읽을 수 없습니다.'))};im.src=url;
 })}
async function uploadFile(file,key){if(!validImageKey(key))return message('유효하지 않은 장수/전법/병법 ID입니다.',true);
 if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))return message('PNG·JPG·WEBP·GIF 파일만 허용합니다.',true);
 if(file.size>12*1024*1024)return message('이미지 파일은 12MB 이하여야 합니다.',true);
 try{const dataUrl=await decodeImg(file);const item={key,dataUrl,name:file.name,updatedAt:new Date().toISOString()};
  await persist(item);
  MANUAL.set(key,item);redraw();message('저장 완료: '+key+' · '+file.name+' · 도감 이미지에 즉시 반영되었습니다. '+(folderMode?'assets/manual-local/ 폴더에 영구 보관되었습니다.':'브라우저 저장소에 보관되었습니다.'));
 }catch(err){message('업로드 오류: '+err.message,true)}}
document.addEventListener('paste',async ev=>{
 if(tab!=='manager'||!pasteTargetKey)return;
 const f=Array.from(ev.clipboardData?.items||[]).find(item=>item.kind==='file'&&item.type.startsWith('image/'))?.getAsFile();
 if(!f)return;
 ev.preventDefault();
 const imageFile=new File([f],'clipboard-'+Date.now()+'.png',{type:f.type||'image/png'});
 await uploadFile(imageFile,pasteTargetKey);
});
get('v90Pick').addEventListener('change',async(ev)=>{const f=ev.target.files?.[0];if(f&&targetKey)await uploadFile(f,targetKey)});
function download(name,content,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
get('v90Export').onclick=()=>{const all=Array.from(MANUAL.values()).sort((a,b)=>a.key.localeCompare(b.key));const payload={format:'NSLG-MANUAL-IMAGES-v1',exportedAt:new Date().toISOString(),count:all.length,images:all};download('NSLG_이미지수동등록_백업.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8');message('내가 직접 등록한 이미지 '+all.length+'개를 JSON으로 백업했습니다. (기본 제공 이미지는 포함하지 않습니다.)')};
get('v90ImportBtn').onclick=()=>{get('v90Import').value='';get('v90Import').click()};
get('v90Import').addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;if(f.size>100*1024*1024)return message('백업 파일이 너무 큽니다.',true);
 try{const data=JSON.parse(await f.text());if(data.format!=='NSLG-MANUAL-IMAGES-v1'||!Array.isArray(data.images))throw new Error('올바른 NSLG 이미지 백업 형식이 아닙니다.');
 const valid=data.images.filter(x=>x&&validImageKey(x.key)&&/^data:image\/(?:webp|png|jpeg|gif);base64,/i.test(x.dataUrl||''));if(!valid.length)return message('등록 가능한 이미지가 없습니다.',true);
 if(!confirm('유효한 이미지 '+valid.length+'개를 가져올까요? 같은 ID의 이미지는 덮어씁니다.'))return;
 let ok=0;for(const row of valid){if(row.dataUrl.length>12*1024*1024)continue;const item={key:row.key,dataUrl:row.dataUrl,name:String(row.name||'복원 이미지').slice(0,128),updatedAt:new Date().toISOString()};await persist(item);MANUAL.set(item.key,item);ok++}
 redraw();message('가져오기 완료: '+ok+'개. '+(folderMode?'이미지 폴더에 보관되었습니다.':'브라우저에 보관되었습니다.'));
 }catch(err){message('백업 복원 실패: '+err.message,true)} });
// Rich game-data details: note which content is translated reference versus verified native numeric fields.
const SOURCE_LABEL='[게임 데이터 원본] ID·수치·코드·필드 / [기존 한국어 자료] 장수 열전 및 전법 설명. 한국어 번역과 효과 해석은 게임 화면에서 직접 검증되지 않았으며, 수식 대입값은 최종 효과가 아닙니다.';
function row(label,value){return '<tr><th>'+e(label)+'</th><td>'+e(Array.isArray(value)?value.join(', '):value)+'</td></tr>'}
function fval(x){if(x===undefined||x===null||x==='')return '원본 미기록';return String(x)}
function fmtNum(v){if(typeof v!=='number'||!Number.isFinite(v))return '계산 불가';return String(Math.round(v*100000)/100000)}
function safeEval(expr,lv,cls){if(typeof expr!=='string')return null;
 const str=expr.replace(/\bgiver\.skillLv\b/g,String(lv)).replace(/\bgiver\.skillClass\b/g,String(cls));
 if(!/^[\d\s.+\-*/()%]+$/.test(str)||str.length>140)return null;
 // Arithmetic expression parser (no eval, no function calls, no untrusted execution).
 let i=0;const skip=()=>{while(/\s/.test(str[i]||'')&&i<str.length)i++};
 function value(){skip();if(str[i]==='+'||str[i]==='-'){const op=str[i++],a=value();return a===null?null:op==='-'?-a:a}
  if(str[i]==='('){i++;const z=add();skip();if(str[i++]!==')')throw Error('paren');return z}
  let m=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(str.slice(i));if(!m)throw Error('num');i+=m[0].length;return Number(m[0]);}
 function mul(){let a=value();while(true){skip();const op=str[i];if(op!=='*'&&op!=='/'&&op!=='%')break;i++;const b=value();a=op==='*'?a*b:op==='/'?a/b:a%b;}return a}
 function add(){let a=mul();while(true){skip();const op=str[i];if(op!=='+'&&op!=='-')break;i++;const b=mul();a=op==='+'?a+b:a-b}return a}
 try{const result=add();skip();return i===str.length&&Number.isFinite(result)?result:null}catch(_){return null}
}
function previewText(input,lv,cls){let txt=String(input||'');txt=txt.replace(/<\/?color(?:=[^>]+)?>/gi,'').replace(/<\/?(?:i|b)>/gi,'');
 txt=txt.replace(/\$([^$]+)\$%?/g,(_,expression)=>{const calc=safeEval(expression,lv,cls);return calc===null?'[원본 수식: '+expression+' · 계산 보류]':'[원본 계수 산술 대입값 '+fmtNum(calc)+' · 최종 % 환산 미검증]'});
 txt=txt.replace(/#(\d+)#/g,(_,n)=>'[상태 코드 #'+n+' · 명칭 검증 전]');return txt}
function formulaInfo(s,lv,cls){const types=[['기본 발동 관련 값','skill_probability'],['발동 레벨 증가값','skill_probability_levelup'],['돌파별 발동 증가값','skill_probability_classup'],['피해 초기 계수','damage_initial_ratio'],['피해 계수 레벨 증가','damage_ratio_levelup'],['치유 초기 계수','heal_ratio'],['치유 계수 레벨 증가','heal_ratio_levelup'],['버프 계산식·수치','buff_data_tool']];
 let out='<table class="v90-metric-table"><tbody>';
 for(const [label,key] of types){if(s[key]===undefined)continue;const val=String(s[key]);const parsed=val.split(/[|,]/).map(z=>safeEval(z,lv,cls));let note='';if(parsed.some(z=>z!==null)&&val.match(/(?:giver\.skillLv|giver\.skillClass)/))note=' <span class="v90-mini">→ 단순 산술 대입: '+e(parsed.map(z=>z===null?'해석 보류':fmtNum(z)).join(' / '))+'</span>';
 out+='<tr><th>'+e(label)+'</th><td><span class="v90-formula">'+e(val)+'</span>'+note+'</td></tr>'}
 return out+'</tbody></table>'}
function buffsPanel(s){const links=EFFECTS[String(s.ID)]||[];if(!links.length)return '<p class="v90-muted">이 전법에 대해 직접 대응된 버프 참조가 없거나 전용 피해 계수로 기술돼 있습니다. 버프가 전혀 없다고 단정하는 의미는 아닙니다.</p>';
 let out='<details><summary>게임 원본 버프 ID · 지속시간 · 조건 '+links.length+'개 보기</summary><ol class="v90-buff-list">';
 for(const b of links){out+='<li><strong>ID '+e(b.buff_id)+'</strong> · 원본 duration <b>'+e(fval(b.buff_duration_raw))+'</b> · 원본 확률필드 '+e(fval(b.probability_raw))+' · 버프 유형 코드 '+e(fval(b.buff_type_code))+' · 디버프 코드 '+e(fval(b.buff_isdebuff_code))+'<br>태그 '+e(fval(b.tags))+' / 원본 적용조건 '+e(fval(b.tag_filter))+'<br><small>위치 대조: '+e(b.alignment||'미확인')+' / 원본 병합유형 '+e(b.merge_type||b.buff_merge_type_raw||'-')+'</small></li>'}
 return out+'</ol><p class="v90-muted">ID 및 위치 대조는 검증된 원본 구조입니다. 코드의 상세 작동 효과·확률·턴 환산은 게임 실행 결과로 검증한 값이 아닙니다.</p></details>'}
function insertDetailSkills(s){return '<div class="v90-eff" data-v90-sid="'+e(s.ID)+'"><h3>🧪 상세 효과 · 능력 수치</h3><p class="v90-brief">'+e(s.description_laconicism_kr||s.show_effect_kr||'게임 데이터에 추가 효과 요약이 기록돼 있지 않습니다.')+'</p><p class="v90-source">'+e(SOURCE_LABEL)+'</p><div class="v90-level-controls"><label>수식 대입 레벨 <input class="v90-level" type="number" min="1" max="10" value="1" aria-label="수식 대입 레벨"></label><label>원본 skillClass 변수(검증용 · 승품/돌파 아님) <input class="v90-class" type="number" min="0" max="5" value="0" aria-label="수식 대입 돌파"></label></div><p class="v90-muted">이 숫자는 원본 변수 <code>giver.skillLv / giver.skillClass</code>에 대입하는 <strong>계산 예시</strong>입니다. 게임 화면의 실제 최종 효과 또는 정확한 강화 단계 적용 방식은 보장하지 않습니다. 미확인 함수는 계산하지 않습니다.</p><div class="v90-live">'+richContent(s,1,0)+'</div></div>'}
function richContent(s,lv,cls){let out='';if(s.description_kr)out+='<h3>한국어 상세 설명 — 수식·상태코드 표시</h3><div class="v90-effect-text">'+e(previewText(s.description_kr,lv,cls))+'</div>';
 out+='<h3>확률 · 효과 계수 · 계산식 원본</h3>'+formulaInfo(s,lv,cls);
 out+='<h3>대상·조건</h3><p class="v92-note">대상·준비 시간·유형 등은 게임 원본 코드입니다. 게임 내 설명과 일치 여부는 별도 확인이 필요합니다.</p><table class="v90-metric-table"><tbody>'+row('대상 지정 원본',fval(s.target_filter))+row('대상 수 원본',fval(s.target_num))+row('준비 시간 원본',fval(s.prepare_time))+row('발동 유형 코드',fval(s.type))+row('전법 효과 식별자',fval(s.effect))+'</tbody></table>';
 out+='<h3>연결된 버프의 게임 원본 데이터</h3>'+buffsPanel(s);return out}
const originalSkillBlock=skillBlock;
skillBlock=function(s,label){const html=originalSkillBlock(s,label);const extra=insertDetailSkills(s);return html+(extra?'<details class="v998-tech"><summary>원본 효과 · 상세 판정 근거</summary><div class="v998-tech-content">'+extra+'</div></details>':'')};
get('details').addEventListener('input',ev=>{if(!ev.target.matches('.v90-level,.v90-class'))return;const panel=ev.target.closest('.v90-eff');if(!panel)return;const s=SK[String(panel.dataset.v90Sid)];if(!s)return;const lv=Math.max(0,Math.min(10,Number(panel.querySelector('.v90-level').value)||0)),cls=Math.max(0,Math.min(5,Number(panel.querySelector('.v90-class').value)||0));panel.querySelector('.v90-live').innerHTML=richContent(s,lv,cls)});
const originalOpenDetail=openDetail;
openDetail=function(r,contextRows,navMode){originalOpenDetail(r,contextRows,navMode);if(r.kind==='hero'){
 const h=r.x,extra=document.createElement('section');extra.className='v90-hero-extra';extra.innerHTML='<h3>장수 능력 · 상세 원본 정보</h3><p class="v90-source">'+e(SOURCE_LABEL)+'</p><table class="v90-metric-table"><thead><tr><th>능력</th><th>기본값 (원본)</th><th>성장값 (원본)</th></tr></thead><tbody>'+[
  ['무력','might'],['지력','intelligence'],['통솔','defence'],['속도','speed'],['정치','politics'],['매력','charm'],['공성','siege']
 ].map(([name,key])=>'<tr><th>'+e(name)+'</th><td>'+e(fval(h['init_'+key]))+'</td><td>'+e(fval(h['inc_'+key]))+'</td></tr>').join('')+'</tbody></table><table class="v90-metric-table"><tbody>'+row('병종 원본 코드',fval(h.soldier_type))+row('고급 병종 ID',fval(h.arms_advanced_type))+row('추천 능력 코드',fval(h.recommend_attr))+row('특성 코드',fval(h.feature))+row('소속 세력 코드',fval(h.group))+'</tbody></table>'+(h.biography_kr?'<details><summary>장수 열전 (기존 한국어 자료)</summary><div class="v90-effect-text">'+e(h.biography_kr)+'</div></details>':'');
 // Append inside hero detail; built original before showModal, safe DOM insertion.
 const quality=Number(h.quality);
 extra.insertAdjacentHTML('afterbegin','<div class="v92-note"><span class="v92-tag">데이터 기준: 게임 원본 수치</span><span class="v92-tag">한국어 열전: 기존 번역 자료</span><span class="v92-tag">검증 상태: 일부 해석 보류</span></div><p>능력치의 기본값·성장값을 분리해 보여줍니다. 성장값의 실제 레벨 적용 공식은 확정하지 않았습니다.</p>');
 const initial=SK[String(h.init_skill)];
 extra.insertAdjacentHTML('beforeend','<h3>고유 전법 연결 정보</h3>'+(initial?'<table class="v92-table"><tr><th>전법</th><td>'+e(initial.name_kr||initial.name||'이름 미확인')+'</td></tr><tr><th>게임 원본 ID</th><td>'+e(initial.ID)+'</td></tr><tr><th>데이터 근거</th><td>장수 init_skill → 전법 ID 대응</td></tr></table>':'<p class="v92-empty">원본에서 대응 전법을 확인하지 못했습니다.</p>'));
 const container=get('details');const admin=container.querySelector('.v998-hero-dev-content');if(admin)admin.append(extra);else container.append(extra);
 }};
loadAll();
})();
