/* Offline, game-derived catalog display helpers. No external requests and no eval(). */
window.NSLG_V996=(function(){
 'use strict';
 const seasonText=s=>Array.isArray(s)&&s.length===2?(String(s[0])+(s[1]<0?'~':'~'+s[1])):'원본 시즌 미확인';
 const html=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let currentLevel=10, currentRank=0;
 const TAGS={};
 // Game-derived status name and description. Populated from D.meta.tags during packaging.
 Object.assign(TAGS,{"1":{"description_hash":"6a358880","description_kr":"이상 상태, 통솔 20포인트 감소","name_hash":"390c984d","name_kr":"홍수","type":"1"},"2":{"description_hash":"7cc038bc","description_kr":"이상 상태, 받는 피해 10% 증가","name_hash":"de032d2d","name_kr":"위협","type":"2"},"3":{"description_hash":"55087a66","description_kr":"이상 상태이자 제어 상태, 병력 회복 효과 70% 감소","name_hash":"f8a6a0ca","name_kr":"군량 고갈","type":"3"},"4":{"description_hash":"2dc8cdec","description_kr":"이상 상태이자 제어 상태, 액티브 전법 발동 불가","name_hash":"33dde108","name_kr":"침묵","type":"4"},"5":{"description_hash":"a320f111","description_kr":"기능성 버프 상태, 받는 피해가 70%~90% 감소하며, 최대 2스택을 보유할 수 있다.","name_hash":"4cc716aa","name_kr":"방어","type":"5"},"6":{"description_hash":"542edfb1","description_kr":"기능성 버프 상태로, 보유 중인 제어 상태(군량 고갈, 침묵, 무장 해제, 조롱, 혼란, 공포, 허약)가 일시적으로 무효화된다.","name_hash":"607f49da","name_kr":"정신 회복","type":"6"},"7":{"description_hash":"db938c81","description_kr":"이상 상태이자 제어 상태, 일반 공격 불가","name_hash":"b4eeb12b","name_kr":"무장 해제","type":"7"},"8":{"description_hash":"8ec9720a","description_kr":"이상 상태이자 제어 상태, 목표가 강제로 자신에게 일반 공격을 가하도록 한다.","name_hash":"f71d59e5","name_kr":"조롱","type":"8"},"9":{"description_hash":"180b2cbd","description_kr":"이상 상태이자 제어 상태. 일반 공격, 액티브 전법, 추격 전법 등의 목표가 랜덤으로 변경된다.","name_hash":"3216abca","name_kr":"혼란","type":"9"},"10":{"description_hash":"7a177ee1","description_kr":"기본 버프 상태. 병기 피해를 줄 때, 주는 피해에 따라 자신의 병력을 회복한다(기타 치유 효과의 영향을 받지 않음).","name_hash":"e8d02a53","name_kr":"회유","type":"10"},"11":{"description_hash":"a0106982","description_kr":"기본 버프 상태, 책략 피해를 줄 때, 주는 피해에 따라 자신의 병력을 회복한다(기타 치유 효과의 영향을 받지 않음).","name_hash":"957120b0","name_kr":"심리 공격","type":"11"},"12":{"description_hash":"561643d9","description_kr":"이상 상태이자 제어 상태, 액티브 전법과 일반 공격 불가","name_hash":"e9c6c590","name_kr":"공포","type":"12"},"13":{"description_hash":"cd4ad8c1","description_kr":"기본 버프 상태, 병기 피해를 줄 때 일정 확률로 병기 피해가 50% 증가한다.","name_hash":"79f6b895","name_kr":"회심","type":"13"},"14":{"description_hash":"04043256","description_kr":"기본 버프 상태, 추가로 일반 공격 1회 부여","name_hash":"519b65e7","name_kr":"연타","type":"14"},"15":{"description_hash":"70edd6bf","description_kr":"이상 상태이자 제어 상태, 주는 최종 피해 70% 감소","name_hash":"8e25e0de","name_kr":"허약","type":"15"},"16":{"description_hash":"a408280a","description_kr":"이상 상태, 선공 30포인트 감소","name_hash":"452980d9","name_kr":"폭풍","type":"16"},"17":{"description_hash":"32d70d12","description_kr":"기본 버프 상태, 책략 피해를 줄 때 일정 확률로 책략 피해가 50% 증가한다.","name_hash":"0e489820","name_kr":"묘책","type":"17"},"18":{"description_hash":"22065246","description_kr":"이상 상태, 지력 15포인트 감소","name_hash":"4e4f333e","name_kr":"화공","type":"18"},"19":{"description_hash":"d36e2983","description_kr":"기본 버프 상태, 병기 피해를 줄 때, 목표의 일부 통솔을 무시한다.","name_hash":"9238e301","name_kr":"관통","type":"19"},"20":{"description_hash":"816e21ba","description_kr":"기본 버프 상태. 책략 피해를 줄 때 목표의 일부 지력을 무시한다.","name_hash":"8f422df5","name_kr":"간파","type":"20"},"21":{"description_hash":"c623b841","description_kr":"기본 버프 상태, 일반 공격을 받으면 일정 확률로 공격자에게 강력한 일반 공격을 1회 시전한다(추격 전법이 발동되지 않음). 턴마다 최대 5회 반격한다.","name_hash":"2331e693","name_kr":"반격","type":"21"},"22":{"description_hash":"89ae948f","description_kr":"이상 상태, 회심과 묘책 피해가 15% 감소한다.","name_hash":"2ee683c4","name_kr":"요술","type":"22"},"23":{"description_hash":"8c572030","description_kr":"기능성 버프 상태로 피해를 받을 때 일정 확률로 이번 피해를 무효화한다.","name_hash":"18b5f732","name_kr":"피신","type":"23"},"24":{"description_hash":"d15f1c08","description_kr":"특수 피해 유형, 피해 수치는 공격자의 속성에만 영향을 받으며, 방어를 무시하고, 피신으로 회피할 수 없다. 그 외 다른 효과는 발동되지 않는다.","name_hash":"3278b1cd","name_kr":"탈주병","type":"24"},"25":{"description_hash":"bc6986f5","description_kr":"공포, 무장 해제, 침묵, 혼란, 조롱, 허약, 군량 고갈","name_hash":"6cf3436a","name_kr":"제어 상태","type":"25"},"26":{"description_hash":"17819033","description_kr":"기능성 버프 상태, 주는 피해를 피신으로 회피할 수 없게 된다.","name_hash":"30c2e10e","name_kr":"백발백중","type":"26"},"27":{"description_hash":"5d36d5bc","description_kr":"기본 버프 상태, 피해를 받은 후, 분담 시전자가 일부 피해를 분담한다(분담 피해는 피신, 피격 효과가 발동되지 않음).","name_hash":"3a24e581","name_kr":"분담","type":"27"},"28":{"description_hash":"a68e94c7","description_kr":"디버프 상태, 매 턴 <color=#6EDB8F>60%</color>*연소 스택수의 책략 피해를 받으며, 최대 5스택 중첩한다.","name_hash":"2dbac45c","name_kr":"연소","type":"28"},"29":{"description_hash":"cf1a1617","description_kr":"디버프 상태, 매 턴 <color=#6EDB8F>60%</color>*짐독 스택수의 책략 피해를 받으며. 최대 5스택 중첩한다.","name_hash":"8c05340f","name_kr":"짐독","type":"29"},"30":{"description_hash":"4eb72196","description_kr":"특수 피해 유형, 해당 피해는 최초 피해의 영향만 받으며, 여러 번 전달할 수 없다.","name_hash":"a51eb960","name_kr":"피해 전달","type":"30"},"31":{"description_hash":"1a2618fb","description_kr":"기능성 버프 상태, 주는 피해가 방어를 무시한다.","name_hash":"dc82eadc","name_kr":"방어파괴","type":"31"},"32":{"description_hash":"2fb1a448","description_kr":"디버프 상태, 매 턴 <color=#6EDB8F>60%</color>*출혈 스택수의 병기 피해를 받으며, 최대 5스택 중첩한다.","name_hash":"14e5c094","name_kr":"출혈","type":"32"},"33":{"description_hash":"98652357","description_kr":"디버프 상태, 무력, 지력, 통솔, 선공 4가지 기본 속성이 감소한다.","name_hash":"e938bc57","name_kr":"속성 감소 상태","type":"33"},"34":{"description_hash":"f9067dbd","description_kr":"기능성 버프 상태로 최대 수량은 1500이다. 피해를 받으면 매복병을 소모해 50%의 피해를 막고, 공격자에게 받은 피해만큼 <color=#E5AD57>탈주병</color>을 생성한다.","name_hash":"3ca87196","name_kr":"매복병","type":"34"},"35":{"description_hash":"bd2852fa","description_kr":"디버프 상태, 지휘, 패시브 전법이 주는 피해가 4% 감소한다, 최대 9스택 중첩된다.","name_hash":"e49a7fc5","name_kr":"지체","type":"35"},"36":{"description_hash":"eab8eb84","description_kr":"기본 버프 상태, 받는 피해가 <color=#6EDB8F>10%</color> 감소하며(통솔의 영향 받음), 관통과 간파가 <color=#6EDB8F>3%</color> 증가한다(통솔의 영향 받음), 중첩이 가능하며, 전투 종료 시까지 지속된다. 피해를 받을 때마다 지의 1스택을 잃게 된다.","name_hash":"543e88ba","name_kr":"성지","type":"36"},"37":{"description_hash":"49c41e38","description_kr":"기본 버프 상태로, 다음 책략 피해가 <color=#6EDB8F>6%</color> 증가하며(통솔 영향을 받음), 최대 3회 중첩 가능하다","name_hash":"7baaeca0","name_kr":"문도","type":"37"},"38":{"description_hash":"6e624d52","description_kr":"기본 버프 상태로, 간파, 관통이 <color=#6EDB8F>10%</color> 증가하며(통솔 영향을 받음), 최대 5회 중첩 가능하다","name_hash":"9b64a0b1","name_kr":"무략","type":"38"},"50":{"description_hash":"1b1ea4cc","description_kr":"진형에 따라 부여되는 기국 버프:\n단일 전열 진형: 전열 아군이 받는 피해 <color=#6EDB8F>12%</color> 감소(지력의 영향 받음), 피격률 <color=#6EDB8F>85%</color>로 고정\n이중 전열 진형: 통솔이 가장 낮은 아군 단일 목표가 전열에 주는 피해 <color=#6EDB8F>20%</color> 증가, 매 턴 행동 시, 랜덤 적군 1~2명에게 <color=#6EDB8F>160%</color>의 피해 부여(피해 유형은 무력 또는 지력 중 높은 항목에 따라 결정)\n삼중 전열 진형: 매 턴 종료 시, 지력이 가장 높은 아군 단일 목표가 전체 적군에게 <color=#6EDB8F>60%</color>의 책략 피해 부여(추가로 부대 전체의 총 치유량 영향 받음)","name_hash":"c7de89c5","name_kr":"기국 버프","type":"50"},"90":{"description_hash":"13319917","description_kr":"정비 후, 부여할 수 있는 기능성 버프 상태: \n정비 1: <color=#E5AD57>정신 회복</color> \n정비 2: <color=#E5AD57>회심</color>과 <color=#E5AD57>묘책</color> <color=#6EDB8F>20%</color> 증가 \n정비 3: 적군에게 가하는 피해가 후열에 고정 \n정비 4: 추격 전법 피해<color=#6EDB8F> 20%</color> 증가 \n정비 5: 추격 전법 발동률 <color=#6EDB8F>10%</color>증가 \n정비 6: 지력과 무력 <color=#6EDB8F>30</color>포인트 증가 \n정비 7: <color=#E5AD57>회심</color> 피해와 <color=#E5AD57>묘책</color> 피해 <color=#6EDB8F>20%</color> 증가 \n정비 8: 연타율 <color=#6EDB8F>40%</color> 증가 \n(이미 정신 회복을 보유한 경우 정비 1을 보유한 것으로 간주)","name_hash":"8576a794","name_kr":"정비 상태","type":"90"},"91":{"description_hash":"a8a860dc","description_kr":"진열을 배치한 후, 부여할 수 있는 기능성 버프 상태: \n진열1: 받는 병기 피해 <color=#6EDB8F>10%</color> 감소 \n진열2: 주는 피해 <color=#6EDB8F>10%</color> 증가 \n진열3: 회유와 심리 공격 <color=#6EDB8F>10%</color> 증가 \n진열4: 묘책과 회심 <color=#6EDB8F>10%</color> 증가 \n진열5: 지력과 무력 <color=#6EDB8F>20</color>포인트 증가 \n진열6: 통솔과 선공 <color=#6EDB8F>20</color>포인트 증가 \n진열7: 받는 책략 피해 <color=#6EDB8F>10%</color> 감소 \n진열8: 받는 피해 <color=#6EDB8F>10%</color> 감소","name_hash":"2094704b","name_kr":"진열 상태","type":"91"},"98":{"description_hash":"f1bbf365","description_kr":"포진 후, 부여할 수 있는 기능성 버프 효과: \n포진1: <color=#E5AD57>정신 회복</color> \n포진2: <color=#E5AD57>방어</color> 1스택 \n포진3: 책략 피해 <color=#6EDB8F>8%</color> 증가 \n포진4: <color=#6EDB8F>15%</color>의 <color=#E5AD57>묘책</color> \n포진5: 심리 공격 <color=#6EDB8F>10%</color> 증가 \n포진6: 통솔 <color=#6EDB8F>20</color>포인트 증가 \n포진7: 지력 <color=#6EDB8F>20</color>포인트 증가 \n포진8: 간파 <color=#6EDB8F>20%</color> 증가 \n(정신 회복과 방어를 이미 보유한 경우 포진1과 포진2를 보유한 것으로 간주)","name_hash":"62f31e94","name_kr":"포진 상태","type":"98"},"99":{"description_hash":"9a656eea","description_kr":"기능성 버프 상태: 정신 회복, 백발백중, 방어파괴, 방어, 매복병 및 일부 특수 전법의 버프 상태(포진 상태, 정비 상태, 진열 상태 등)","name_hash":"c243956e","name_kr":"기능성 버프 상태","type":"99"},"100":{"description_hash":"8336ea04","description_kr":"특수 디버프 상태 종류: 공포, 무장 해제, 침묵, 혼란, 조롱, 허약, 군량 고갈, 홍수, 화공, 폭풍, 위협, 요술, 총 12가지","name_hash":"ad1adce8","name_kr":"이상 상태","type":"100"},"buffid_1000":{"description_hash":"561643d9","description_kr":"이상 상태이자 제어 상태, 액티브 전법과 일반 공격 불가","name_hash":"e9c6c590","name_kr":"공포","type":"buffid_1000"},"buffid_1002":{"description_hash":"db938c81","description_kr":"이상 상태이자 제어 상태, 일반 공격 불가","name_hash":"b4eeb12b","name_kr":"무장 해제","type":"buffid_1002"},"buffid_1003":{"description_hash":"2dc8cdec","description_kr":"이상 상태이자 제어 상태, 액티브 전법 발동 불가","name_hash":"33dde108","name_kr":"침묵","type":"buffid_1003"},"buffid_1004":{"description_hash":"55087a66","description_kr":"이상 상태이자 제어 상태, 병력 회복 효과 70% 감소","name_hash":"f8a6a0ca","name_kr":"군량 고갈","type":"buffid_1004"},"buffid_1005":{"description_hash":"180b2cbd","description_kr":"이상 상태이자 제어 상태. 일반 공격, 액티브 전법, 추격 전법 등의 목표가 랜덤으로 변경된다.","name_hash":"3216abca","name_kr":"혼란","type":"buffid_1005"},"buffid_1006":{"description_hash":"70edd6bf","description_kr":"이상 상태이자 제어 상태, 주는 최종 피해 70% 감소","name_hash":"8e25e0de","name_kr":"허약","type":"buffid_1006"},"buffid_1007":{"description_hash":"542edfb1","description_kr":"기능성 버프 상태로, 보유 중인 제어 상태(군량 고갈, 침묵, 무장 해제, 조롱, 혼란, 공포, 허약)가 일시적으로 무효화된다.","name_hash":"607f49da","name_kr":"정신 회복","type":"buffid_1007"},"buffid_1008":{"description_hash":"db938c81","description_kr":"이상 상태이자 제어 상태, 일반 공격 불가","name_hash":"b4eeb12b","name_kr":"무장 해제","type":"buffid_1008"},"buffid_1009":{"description_hash":"2dc8cdec","description_kr":"이상 상태이자 제어 상태, 액티브 전법 발동 불가","name_hash":"33dde108","name_kr":"침묵","type":"buffid_1009"},"buffid_1010":{"description_hash":"17819033","description_kr":"기능성 버프 상태, 주는 피해를 피신으로 회피할 수 없게 된다.","name_hash":"30c2e10e","name_kr":"백발백중","type":"buffid_1010"},"buffid_1011":{"description_hash":"04043256","description_kr":"기본 버프 상태, 추가로 일반 공격 1회 부여","name_hash":"519b65e7","name_kr":"연타","type":"buffid_1011"},"buffid_1012":{"description_hash":"561643d9","description_kr":"이상 상태이자 제어 상태, 액티브 전법과 일반 공격 불가","name_hash":"e9c6c590","name_kr":"공포","type":"buffid_1012"},"buffid_1013":{"description_hash":"db938c81","description_kr":"이상 상태이자 제어 상태, 일반 공격 불가","name_hash":"b4eeb12b","name_kr":"무장 해제","type":"buffid_1013"},"buffid_1014":{"description_hash":"2dc8cdec","description_kr":"이상 상태이자 제어 상태, 액티브 전법 발동 불가","name_hash":"33dde108","name_kr":"침묵","type":"buffid_1014"},"buffid_1015":{"description_hash":"55087a66","description_kr":"이상 상태이자 제어 상태, 병력 회복 효과 70% 감소","name_hash":"f8a6a0ca","name_kr":"군량 고갈","type":"buffid_1015"},"buffid_1016":{"description_hash":"180b2cbd","description_kr":"이상 상태이자 제어 상태. 일반 공격, 액티브 전법, 추격 전법 등의 목표가 랜덤으로 변경된다.","name_hash":"3216abca","name_kr":"혼란","type":"buffid_1016"},"buffid_1017":{"description_hash":"70edd6bf","description_kr":"이상 상태이자 제어 상태, 주는 최종 피해 70% 감소","name_hash":"8e25e0de","name_kr":"허약","type":"buffid_1017"},"buffid_1018":{"description_hash":"542edfb1","description_kr":"기능성 버프 상태로, 보유 중인 제어 상태(군량 고갈, 침묵, 무장 해제, 조롱, 혼란, 공포, 허약)가 일시적으로 무효화된다.","name_hash":"607f49da","name_kr":"정신 회복","type":"buffid_1018"},"buffid_1019":{"description_hash":"17819033","description_kr":"기능성 버프 상태, 주는 피해를 피신으로 회피할 수 없게 된다.","name_hash":"30c2e10e","name_kr":"백발백중","type":"buffid_1019"},"buffid_1020":{"description_hash":"04043256","description_kr":"기본 버프 상태, 추가로 일반 공격 1회 부여","name_hash":"519b65e7","name_kr":"연타","type":"buffid_1020"},"buffid_1022":{"description_hash":"8ec9720a","description_kr":"이상 상태이자 제어 상태, 목표가 강제로 자신에게 일반 공격을 가하도록 한다.","name_hash":"f71d59e5","name_kr":"조롱","type":"buffid_1022"},"buffid_1026":{"description_hash":"8ec9720a","description_kr":"이상 상태이자 제어 상태, 목표가 강제로 자신에게 일반 공격을 가하도록 한다.","name_hash":"f71d59e5","name_kr":"조롱","type":"buffid_1026"},"buffid_1027":{"description_hash":"8ec9720a","description_kr":"이상 상태이자 제어 상태, 목표가 강제로 자신에게 일반 공격을 가하도록 한다.","name_hash":"f71d59e5","name_kr":"조롱","type":"buffid_1027"},"buffid_90000":{"description_hash":"89ae948f","description_kr":"이상 상태, 회심과 묘책 피해가 15% 감소한다.","name_hash":"2ee683c4","name_kr":"요술","type":"buffid_90000"},"buffid_90001":{"description_hash":"7cc038bc","description_kr":"이상 상태, 받는 피해 10% 증가","name_hash":"de032d2d","name_kr":"위협","type":"buffid_90001"},"buffid_90002":{"description_hash":"6a358880","description_kr":"이상 상태, 통솔 20포인트 감소","name_hash":"390c984d","name_kr":"홍수","type":"buffid_90002"},"buffid_90003":{"description_hash":"a408280a","description_kr":"이상 상태, 선공 30포인트 감소","name_hash":"452980d9","name_kr":"폭풍","type":"buffid_90003"},"buffid_90004":{"description_hash":"22065246","description_kr":"이상 상태, 지력 15포인트 감소","name_hash":"4e4f333e","name_kr":"화공","type":"buffid_90004"},"buffid_90005":{"description_hash":"92c06f67","description_kr":"버프 상태로, 피해를 받으면 매복병을 소모해 일부 피해를 막고, 공격자에게 받은 피해만큼 탈주병을 생성한다.","name_hash":"3ca87196","name_kr":"매복병","type":"buffid_90005"},"buffid_90006":{"description_hash":"ba938029","description_kr":"이상 상태, 적군 무장의 지력을 15포인트 감소시킵니다.","name_hash":"4e4f333e","name_kr":"화공","type":"buffid_90006"},"fightprppid_1":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"3e6e1e7c","name_kr":"무력","type":"fightprppid_1"},"fightprppid_10":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"1eef9b9f","name_kr":"방어 감소율","type":"fightprppid_10"},"fightprppid_11":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"b55e0ef5","name_kr":"속도 증가율","type":"fightprppid_11"},"fightprppid_12":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"60b5c09a","name_kr":"속도 감소율","type":"fightprppid_12"},"fightprppid_13":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"662e6023","name_kr":"공성","type":"fightprppid_13"},"fightprppid_14":{"description_hash":"803bfbc8","description_kr":"부대","name_hash":"ae9a7fc4","name_kr":"병력","type":"fightprppid_14"},"fightprppid_15":{"description_hash":"a274999b","description_kr":"부상 부대","name_hash":"cdee8e3c","name_kr":"부상병","type":"fightprppid_15"},"fightprppid_16":{"description_hash":"1f3b4b23","description_kr":"사망 부대","name_hash":"5ed8b078","name_kr":"사망병","type":"fightprppid_16"},"fightprppid_17":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"b48bb8d7","name_kr":"무력 공격","type":"fightprppid_17"},"fightprppid_18":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"17324fa7","name_kr":"지력 공격","type":"fightprppid_18"},"fightprppid_184":{"description_hash":"20cf035b","description_kr":"지휘 전법 피해","name_hash":"20cf035b","name_kr":"지휘 전법 피해","type":"fightprppid_184"},"fightprppid_19":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"d6550b37","name_kr":"무력 피해율","type":"fightprppid_19"},"fightprppid_190":{"description_hash":"80250830","description_kr":"패시브 전법 피해","name_hash":"80250830","name_kr":"패시브 전법 피해","type":"fightprppid_190"},"fightprppid_2":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"5c154ec0","name_kr":"지력","type":"fightprppid_2"},"fightprppid_20":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"126061d1","name_kr":"지력 피해율","type":"fightprppid_20"},"fightprppid_21":{"description_hash":"b98d551a","description_kr":"피해 증가","name_hash":"3b73d2c1","name_kr":"주는 피해","type":"fightprppid_21"},"fightprppid_22":{"description_hash":"29d5a9b2","description_kr":"피해 감소","name_hash":"c0472d64","name_kr":"주는 피해 감소","type":"fightprppid_22"},"fightprppid_23":{"description_hash":"f214d4d7","description_kr":"병기 피해 감소","name_hash":"321b0fce","name_kr":"주는 무력 피해 감소","type":"fightprppid_23"},"fightprppid_24":{"description_hash":"6627429b","description_kr":"책략 피해 감소","name_hash":"11bac2b2","name_kr":"주는 지력 피해 감소","type":"fightprppid_24"},"fightprppid_25":{"description_hash":"b98d551a","description_kr":"피해 증가","name_hash":"76ff2651","name_kr":"주는 피해 증가","type":"fightprppid_25"},"fightprppid_26":{"description_hash":"d36d1cc4","description_kr":"병기 피해 증가","name_hash":"31d1715c","name_kr":"주는 무력 피해 증가","type":"fightprppid_26"},"fightprppid_27":{"description_hash":"44897d79","description_kr":"책략 피해 증가","name_hash":"2df18686","name_kr":"주는 지력 피해 증가","type":"fightprppid_27"},"fightprppid_28":{"description_hash":"0a2c34e0","description_kr":"받는 피해 감소","name_hash":"e044f82c","name_kr":"받는 피해","type":"fightprppid_28"},"fightprppid_29":{"description_hash":"0a2c34e0","description_kr":"받는 피해 감소","name_hash":"9fbc5d3b","name_kr":"받는 피해 감소","type":"fightprppid_29"},"fightprppid_3":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"2029e612","name_kr":"방어","type":"fightprppid_3"},"fightprppid_30":{"description_hash":"11445184","description_kr":"받는 병기 피해 감소","name_hash":"ce108fb7","name_kr":"받는 무력 피해 감소","type":"fightprppid_30"},"fightprppid_31":{"description_hash":"926b93bd","description_kr":"받는 책략 피해 감소","name_hash":"8f8d0a50","name_kr":"받는 지력 피해 감소","type":"fightprppid_31"},"fightprppid_32":{"description_hash":"2ca89cef","description_kr":"받는 피해 증가","name_hash":"440d20e6","name_kr":"받는 피해 증가","type":"fightprppid_32"},"fightprppid_33":{"description_hash":"8171b9fd","description_kr":"받는 병기 피해 증가","name_hash":"2cc78b5f","name_kr":"받는 무력 피해 증가","type":"fightprppid_33"},"fightprppid_34":{"description_hash":"8809e14b","description_kr":"받는 책략 피해 증가","name_hash":"9c7a0875","name_kr":"받는 지력 피해 증가","type":"fightprppid_34"},"fightprppid_35":{"description_hash":"cd4ad8c1","description_kr":"기본 버프 상태, 병기 피해를 줄 때 일정 확률로 병기 피해가 50% 증가한다.","name_hash":"0aa4d2c8","name_kr":"회심률","type":"fightprppid_35"},"fightprppid_36":{"description_hash":"32d70d12","description_kr":"기본 버프 상태, 책략 피해를 줄 때 일정 확률로 책략 피해가 50% 증가한다.","name_hash":"82edb5e0","name_kr":"묘책률","type":"fightprppid_36"},"fightprppid_37":{"description_hash":"ab6db353","description_kr":"회심 피해","name_hash":"ab6db353","name_kr":"회심 피해","type":"fightprppid_37"},"fightprppid_38":{"description_hash":"2bf432d1","description_kr":"묘책 피해","name_hash":"2bf432d1","name_kr":"묘책 피해","type":"fightprppid_38"},"fightprppid_39":{"description_hash":"3a24e581","description_kr":"분담","name_hash":"158608b7","name_kr":"피해 분담 비율","type":"fightprppid_39"},"fightprppid_4":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"f2fdffbb","name_kr":"속도","type":"fightprppid_4"},"fightprppid_40":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"50f66b03","name_kr":"방어막","type":"fightprppid_40"},"fightprppid_41":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"5c42c048","name_kr":"레벨","type":"fightprppid_41"},"fightprppid_42":{"description_hash":"8c572030","description_kr":"기능성 버프 상태로 피해를 받을 때 일정 확률로 이번 피해를 무효화한다.","name_hash":"18b5f732","name_kr":"피신","type":"fightprppid_42"},"fightprppid_43":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"c7de2bc9","name_kr":"치유 수치","type":"fightprppid_43"},"fightprppid_44":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"79a28d68","name_kr":"공급","type":"fightprppid_44"},"fightprppid_45":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"74145ec8","name_kr":"방어 파괴","type":"fightprppid_45"},"fightprppid_46":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"26e1ceaf","name_kr":"지력 감소","type":"fightprppid_46"},"fightprppid_47":{"description_hash":"93ed4cb1","description_kr":"무장이 통솔한 병종","name_hash":"3fd13891","name_kr":"병종","type":"fightprppid_47"},"fightprppid_48":{"description_hash":"d36e2983","description_kr":"기본 버프 상태, 병기 피해를 줄 때, 목표의 일부 통솔을 무시한다.","name_hash":"9238e301","name_kr":"관통","type":"fightprppid_48"},"fightprppid_49":{"description_hash":"816e21ba","description_kr":"기본 버프 상태. 책략 피해를 줄 때 목표의 일부 지력을 무시한다.","name_hash":"8f422df5","name_kr":"간파","type":"fightprppid_49"},"fightprppid_5":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"53af377e","name_kr":"무력 증가율","type":"fightprppid_5"},"fightprppid_50":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"1022438d","name_kr":"병력 회복","type":"fightprppid_50"},"fightprppid_51":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"5f5ffadb","name_kr":"체력","type":"fightprppid_51"},"fightprppid_52":{"description_hash":"03cdcc9d","description_kr":"액티브 전법 발동률 증가","name_hash":"70ae314d","name_kr":"액티브 전법 발동률","type":"fightprppid_52"},"fightprppid_53":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"21fb1602","name_kr":"독 공격","type":"fightprppid_53"},"fightprppid_54":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"fe52913b","name_kr":"불 공격","type":"fightprppid_54"},"fightprppid_55":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"f5dead66","name_kr":"물 공격","type":"fightprppid_55"},"fightprppid_56":{"description_hash":"918d602b","description_kr":"기본 버프 효과 중 하나, 병기 피해를 주면, 피해만큼 자신의 병력을 일정량 회복한다.","name_hash":"e8d02a53","name_kr":"회유","type":"fightprppid_56"},"fightprppid_57":{"description_hash":"6d13f2ac","description_kr":"기본 버프 효과 중 하나, 책략 피해를 주면, 피해만큼 자신의 병력을 일정량 회복한다.","name_hash":"957120b0","name_kr":"심리 공격","type":"fightprppid_57"},"fightprppid_58":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"d2680687","name_kr":"스킬 레벨","type":"fightprppid_58"},"fightprppid_59":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"3d87acf5","name_kr":"공통 턴","type":"fightprppid_59"},"fightprppid_6":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"01a85813","name_kr":"무력 감소율","type":"fightprppid_6"},"fightprppid_60":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"238eb204","name_kr":"개인 턴","type":"fightprppid_60"},"fightprppid_61":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"06140636","name_kr":"부대 최대 병력치","type":"fightprppid_61"},"fightprppid_62":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"74b0c43e","name_kr":"피해 계수","type":"fightprppid_62"},"fightprppid_63":{"description_hash":"2312f642","description_kr":"액티브 전법 피해","name_hash":"2312f642","name_kr":"액티브 전법 피해","type":"fightprppid_63"},"fightprppid_64":{"description_hash":"46752475","description_kr":"추격 전법 피해","name_hash":"46752475","name_kr":"추격 전법 피해","type":"fightprppid_64"},"fightprppid_65":{"description_hash":"4def6932","description_kr":"추격 전법 발동률","name_hash":"4def6932","name_kr":"추격 전법 발동률","type":"fightprppid_65"},"fightprppid_66":{"description_hash":"0d10ce06","description_kr":"주는 치유 효과 증가","name_hash":"8d3752d0","name_kr":"주는 치유 효과를 증가","type":"fightprppid_66"},"fightprppid_67":{"description_hash":"d0d7d4f3","description_kr":"주는 치유 효과 감소","name_hash":"99deabf8","name_kr":"주는 치유 효과를 감소시킨다.","type":"fightprppid_67"},"fightprppid_68":{"description_hash":"924eb2cb","description_kr":"받는 치료 효과 증가","name_hash":"3999b61e","name_kr":"받는 치료 효과 증가","type":"fightprppid_68"},"fightprppid_69":{"description_hash":"8ee3f966","description_kr":"받는 치료 효과 감소","name_hash":"652e44ab","name_kr":"받는 치료 효과 감소","type":"fightprppid_69"},"fightprppid_7":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"e8d16e37","name_kr":"지력 증가율","type":"fightprppid_7"},"fightprppid_70":{"description_hash":"dd4b6707","description_kr":"일반 공격 피해","name_hash":"dd4b6707","name_kr":"일반 공격 피해","type":"fightprppid_70"},"fightprppid_71":{"description_hash":"a320f111","description_kr":"기능성 버프 상태, 받는 피해가 70%~90% 감소하며, 최대 2스택을 보유할 수 있다.","name_hash":"567b8ac6","name_kr":"방어 횟수","type":"fightprppid_71"},"fightprppid_72":{"description_hash":"6da72ff1","description_kr":"반격 시, 추가로 부여하는 일반 공격 피해.","name_hash":"00f18c17","name_kr":"반격 피해율","type":"fightprppid_72"},"fightprppid_73":{"description_hash":"b3ef160b","description_kr":"반격 발동률","name_hash":"5c5b93fe","name_kr":"반격 발동률","type":"fightprppid_73"},"fightprppid_74":{"description_hash":"31dc4425","description_kr":"추가로 일반 공격 1회 부여","name_hash":"6220ce36","name_kr":"연타율","type":"fightprppid_74"},"fightprppid_8":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"fd2b69af","name_kr":"지력 감소율","type":"fightprppid_8"},"fightprppid_9":{"description_hash":"778b1c17","description_kr":"기본 속성","name_hash":"50d64d2b","name_kr":"방어 증가율","type":"fightprppid_9"}});
 const tokens=s=>{const arr=s.match(/\s*(?:giver\.skillLv|giver\.skillClass|(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/])\s*/g);if(!arr||arr.join('').replace(/\s/g,'')!==String(s).replace(/\s/g,''))throw Error('원본 수식에 미지원 요소가 포함됨');return arr.map(t=>t.trim())};
 function calc(expr,level,rank=currentRank){
  if(!Number.isFinite(level)||level<0||level>10)return null;
  let ts;try{ts=tokens(String(expr))}catch{return null}
  let i=0;
  function atom(){let t=ts[i++];if(t==='+'||t==='-')return (t==='-'?-1:1)*atom();if(t==='('){let n=add();if(ts[i++]!==')')throw Error('괄호');return n;}if(t==='giver.skillLv')return level;if(t==='giver.skillClass')return Math.max(0,Math.min(5,Number(rank)||0));if(/^\d*\.?\d+$/.test(t||''))return Number(t);throw Error('지원하지 않는 항목');}
  function mul(){let n=atom();while(ts[i]==='*'||ts[i]==='/'){const op=ts[i++],v=atom();if(op==='/'&&v===0)throw Error('0으로 나눔');n=op==='*'?n*v:n/v;}return n;}
  function add(){let n=mul();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++],v=mul();n=op==='+'?n+v:n-v;}return n;}
  try{const x=add();return (i===ts.length&&Number.isFinite(x)&&Math.abs(x)<1e12)?Number(x.toFixed(6)):null}catch{return null}
 }
 const internal=level=>(Math.max(1,Math.min(10,Number(level)||10))-1)*10/9;
 const nfmt=n=>Number(n.toFixed(4)).toLocaleString('ko-KR',{maximumFractionDigits:4});
 function tagBlock(code){const t=TAGS[String(code)];if(!t)return '<span title="게임 상태 사전에 연결되지 않은 코드">#'+html(code)+'#</span>';
  return '<strong class="v996-effect" title="'+html('#'+code+' · '+t.description_kr)+'">'+html(t.name_kr)+'</strong>';
 }
 function render(raw,level,rank=currentRank,matched=null){
  const value=internal(level),parts=[];let s=String(raw||'설명 미기록');
  // Preserve calculations while removing original Unity color markup (no html injection).
  s=s.replace(/([\$@])([^\$@]{1,150})\1/g,(text,delim,expr,offset)=>{
   let x=calc(expr,value,rank);if(x===null)return text;
   // Exact-expression link only: no guesses for attr-dependent or ambiguous effects.
   const matchKey=String(expr).replace(/\s/g,'');
   const classCoeff=matched&&Object.prototype.hasOwnProperty.call(matched,matchKey)?Number(matched[matchKey]):null;
   const inferred=rank>0&&classCoeff!==null&&Number.isFinite(classCoeff);
   if(inferred)x=Number((x*(1+rank*classCoeff)).toFixed(8));
   const after=s.slice(offset+text.length);
   // A percent unit can follow the closing game-color tag. Points have no implicit conversion.
   const pct=/^(?:\s*<\/color>\s*)*%/.test(after)||/^\s*%/.test(after);
   const label=nfmt(pct?x*100:x)+(pct?'': '');
   const token='V996CALCTOKEN'+parts.length+'ZZ';
   parts.push('<strong class="v996-value" title="'+html(delim+expr+delim)+' · 내부 Lv '+nfmt(value)+' · skillClass '+html(rank)+' · 원시값 '+nfmt(x)+(pct?' → 백분율 ×100':' (원문 단위)')+(inferred?' · 설명·버프 원본식 일치 · 강화 계수 '+nfmt(classCoeff)+' 적용':'')+'">'+label+'</strong>');return token;
  });
  s=s.replace(/#(\d+)#/g,(_,code)=>{const token='V996CALCTOKEN'+parts.length+'ZZ';parts.push(tagBlock(code));return token;});
  // Only known color markup is removed; any other HTML escaped.
  s=s.replace(/<\/?color(?:=[^>]*)?>/gi,'');
  let safe=html(s);
  safe=safe.replace(/V996CALCTOKEN(\d+)ZZ/g,(_,idx)=>parts[Number(idx)]||'');
  return {html:safe,internal:value};
 }
 function renderSkill(s,level,rank=currentRank){
  const map=window.NSLG_V9104_EXACT||{};
  return render(s.description_kr||'설명 미기록',level,rank,map[String(s.ID)]||null);
 }
 function procText(s,lv,rank=currentRank){
  const a=Number(s.skill_probability),b=Number(s.skill_probability_levelup||0),c=Number(s.skill_probability_classup||0);
  if(!Number.isFinite(a))return '미확인';
  let x=a+b*lv+c*rank;
  return nfmt(100*x)+'%'+((b||c)?' (원본 계수 계산)':'');
 }
 function metaHTML(s){
  const ids=Array.isArray(s._catalog_ids)?s._catalog_ids:[s.ID];
  const hero=(s._catalog_hero_season||[]).map(x=>html(x.hero_name)+' 국내 '+html(seasonText(x.season))+' / 해외 '+html(seasonText(x.season_oversea))).join(' · ');
  const base='원본 분류: '+html(s._catalog_role||'미확인')+' · '+(hero?'시즌: '+hero:'일반 전법 시즌 근거 없음')+' · ID: '+ids.map(html).join(', ');
  return base+(s._catalog_similar_ids?.length?' · 동일 이름·설명이나 다른 조건의 별도 ID: '+s._catalog_similar_ids.map(html).join(', '):'')+'<p class="v996-warning">수동 변경 우선 · 원본 클래스/돌파 보정치('+html(s.skill_probability_classup??'-')+') 존재 여부와 적용 대상은 게임 내 검증 필요</p>';
 }
 function languageHTML(x){
  // Korean source is available. Chinese data is deliberately not invented.
  const simp=x.name_zh_hans||x.name_cn||null,trad=x.name_zh_hant||x.name_tw||null;
  return '<div class="v996-langs"><span>한국어 '+html(x.name_kr||'미확인')+'</span><span>简体 '+html(simp||'원본 미확보')+'</span><span>繁體 '+html(trad||'원본 미확보')+'</span></div>';
 }
 function aliasHTML(x){
  const ids=x._catalog_ids||[x.ID??x.id],msg=ids.length>1?'같은 이름·설명·유형/확률 조건을 충족해 대표 한 항목으로 표시합니다. 원본 ID와 효과 참조는 모두 유지합니다.':'원본 레코드와 1:1 대응하는 항목입니다.';
  return '<div class="v996-alias"><strong>원본 ID</strong> '+ids.map(x=>'#'+html(x)).join(', ')+'<p>'+html(msg)+'</p>'+(x._catalog_similar_ids?.length?'<p>같은 이름·설명이지만 소속이나 유형이 달라 병합하지 않은 관련 ID: '+x._catalog_similar_ids.map(html).join(', ')+'</p>':'')+'</div>';
 }
 function classCoefficients(s){
  const src=String(s.buff_data_tool||'');
  // Only identify multipliers that the original field writes explicitly.
  const coeffs=[...src.matchAll(/\(1\+giver\.skillClass\*([0-9]+(?:\.[0-9]+)?)\)/g)]
   .map(m=>Number(m[1])).filter(x=>Number.isFinite(x)&&x>0&&x<5);
  return [...new Set(coeffs)].sort((a,b)=>a-b);
 }
 function stageEffectHTML(s,rank){
  // These are *effect-specific multipliers* found literally in the original buff_data_tool,
  // not replacements for the skill's written description numbers.
  const coeffs=classCoefficients(s);
  const raw=String(s.description_kr||'');
  const directly=[...raw.matchAll(/([\$@])([^\$@]{1,150})\1/g)]
   .filter(m=>m[2].includes('giver.skillClass'));
  if(rank===0)return '<div class="v9103-stage-note">기본 강화 0단계 · 전법 설명은 10레벨 등 선택된 레벨의 원본식을 따릅니다.</div>';
  if(directly.length){
   const rows=directly.map(m=>{
    const base=calc(m[2],internal(currentLevel),0),now=calc(m[2],internal(currentLevel),rank);
    return '<span class="v9103-stage-pair"><code>'+html(m[0])+'</code> 0단계 '+html(base===null?'해석 불가':nfmt(base))+' → '+rank+'단계 '+html(now===null?'해석 불가':nfmt(now))+' (원시값)</span>';
   });
   return '<div class="v9103-stage-note"><strong>강화 수식 직접 확인</strong> · 설명에 skillClass가 포함되어 선택 단계로 재계산했습니다.'+rows.join('')+'</div>';
  }
  if(coeffs.length){
   return '<div class="v9103-stage-note"><strong>강화 단계 '+rank+' · 효과별 원본 배율</strong> '+coeffs.map(c=>'<span class="v9103-stage-coeff">×'+nfmt(1+c*rank)+'</span>').join(' ')+'<small>해당 계수가 기록된 버프 효과에 한정됩니다. 설명 전체의 피해율·치유율에 일괄 적용하지 않습니다. 설명 속 기본 숫자는 유지합니다.</small></div>';
  }
  return '<div class="v9103-stage-note">'+rank+'단계 · 설명에 적용할 보정 수치가 확인되지 않아 기본 설명을 유지합니다.</div>';
 }
 function classSummary(s,rank){
  const coeffs=classCoefficients(s);
  if(!coeffs.length)return null;
  const a=coeffs.map(c=>'×'+nfmt(1+rank*c)+' (단계당 원본 계수 '+nfmt(c*100)+'%)').join(' · ');
  return '원본 buff_data_tool 일부 항목에서 skillClass '+rank+' 적용 배율 확인: '+a+' · 최종 전법 설명 전체에 일괄 적용한 값은 아닙니다.';
 }
 function formulas(s){
  if(window.NSLG_STAGE_AUDIT)window.NSLG_STAGE_AUDIT.activate(s.ID);
  const raw=String(s.description_kr||'');let seen=new Set(),xs=[];
  for(const m of raw.matchAll(/([\$@])([^\$@]{1,150})\1/g)){
   const key=m[0];if(seen.has(key))continue;seen.add(key);
   const v=calc(m[2],internal(currentLevel));
   xs.push('<tr><td><code>'+html(key)+'</code></td><td>'+html(v===null?'미지원 수식':nfmt(v))+'</td><td>'+html(v===null?'확인 필요':'Lv'+currentLevel+' 내부값 '+nfmt(internal(currentLevel))+'; % 사용 시 ×100')+'</td></tr>');
  }
  const used=[...new Set([...raw.matchAll(/#(\d+)#/g)].map(x=>x[1]))];
  return '<section class="v996-formula" data-skill="'+html(s.ID)+'"><h3>레벨·승품/돌파 원본 수식 / 상태 코드</h3><p>레벨 <b>'+currentLevel+'</b> → 내부 skillLv <b>'+nfmt(internal(currentLevel))+'</b> (1레벨 0, 10레벨 10 보간 가정). <code>$...$</code> 및 <code>@...@</code> 모두 원본 산술식만 평가하며, 뒤에 %가 있으면 백분율로 바꿔 표기합니다. 게임 내 능력치·신물·돌파 판정은 미반영.</p><table class="v996-table"><thead><tr><th>원본 수식</th><th>원시 계산값</th><th>계산 조건</th></tr></thead><tbody>'+xs.join('')+'</tbody></table>'+(used.length?'<h4>상태 코드 원본 정의</h4>'+used.map(id=>'<p><b>#'+html(id)+'# '+html(TAGS[id]?.name_kr||'미해결')+'</b> — '+html(TAGS[id]?.description_kr||'게임 내 정의 미확인')+'</p>').join(''):'')+'<h4>원본 skillClass의 일부 효과 보정</h4><p>'+html(classSummary(s,currentRank)||'현재 buff_data_tool에서 단순 보정 배율을 찾지 못했습니다. 클래스 보정이 없다는 의미는 아닙니다.')+'</p>'+'<details class="v9102-stage"><summary>승품·돌파 0~5단계: 효과 항목별 원본식 계산표 (개발자 검증)</summary><div data-v9102-for="'+html(s.ID)+'">원본 항목 확인 중…</div></details>'+'<h4>등급 관련 원본 필드</h4><p>skill_probability_classup: '+html(s.skill_probability_classup??'없음')+' · class: '+html(s.class??'없음')+' · class_num: '+html(s.class_num??'없음')+' (원본 클래스 계수와 게임 최종 효과 사이 적용 조건은 추가 검증 필요)</p></section>';
 }
 const roles={skill:['장수 고유 전법','일반 장착 전법 후보','병법 효과 전법','기타·이벤트·변형 전법'],tactic:['장수 전용 병법','특수 병법·대상 미확정','공용 병법 조각']};
 function roleOptions(select,which){
  const items=roles[which]||[];
  if(select.dataset.currentRoleType===which)return;
  select.replaceChildren();const first=document.createElement('option');first.value='';first.textContent='전체 분류';select.append(first);
  for(const text of items){const opt=document.createElement('option');opt.value=text;opt.textContent=text;select.append(opt);}select.dataset.currentRoleType=which;
 }
 function groupRows(rows,tab,group){
  if(!group||!(tab==='skillsAll'||tab==='tactics'))return rows;
  return rows.filter(r=>Number(r.x._catalog_primary)===Number(r.x.ID??r.x.id));
 }
 function heroWarbooks(hero,allTactics){
  // The hero.warbook field is an array of up to three profession/formation lists.
  // Each list stores pairs [permitted warbook TYPE, source scalar]; the scalar's
  // meaning is not verified, so it is not interpreted as a level or rank.
  const pairs=[];
  for(const group of (Array.isArray(hero.warbook)?hero.warbook:[])){
   if(!Array.isArray(group))continue;
   for(let i=0;i+1<group.length;i+=2){
    const type=Number(group[i]); if(Number.isInteger(type)&&type>0)pairs.push([type,group[i+1]]);
   }
  }
  const permitted=new Set(pairs.map(p=>p[0]));
  const ownType=Number(hero.ID)*100;
  // Preserve game-provided type permission. The ownType fallback is only a direct,
  // separately evidenced association; it is NOT proof of equippability.
  const choices=allTactics.filter(t=>String(t.name_kr||'').trim().endsWith('선본')&&permitted.has(Number(t.type)));
  const own=choices.filter(t=>Number(t.type)===ownType);
  const common=choices.filter(t=>Number(t.type)!==ownType);
  const fallback=[]; // only game-permitted 선본 variants are presented
  const fmt=items=>{
   const byType=new Map();
   for(const item of items){const type=String(item.type);if(!byType.has(type))byType.set(type,[]);byType.get(type).push(item);}
   let s='';
   for(const [type,list] of byType){
    const byGroup=new Map();
    for(const item of list){const group=String(item.group_id)==='1'?'id_'+item.id:String(item.group_id);if(!byGroup.has(group))byGroup.set(group,[]);byGroup.get(group).push(item);}
    s+='<details class="v997-booktype"><summary>병법 유형 '+html(type)+' · '+byGroup.size+'개 계열 / '+list.length+'종</summary><div class="v997-bookgroups">';
    for(const [,items] of byGroup){
     const title=String(items[0].name_kr||'').replace(/\s*(잔편|수기|선본)$/,'');
     s+='<div class="v997-bookgroup"><div class="v997-bookname">'+html(title)+'</div><div class="v997-booklinks">';
     for(const t of items){
      const label=(String(t.name_kr||'').match(/(잔편|수기|선본)$/)||[])[0]||'상세';
      s+='<button type="button" data-v997-tactic="'+html(t.id)+'" title="'+html(t.name_kr)+' · ID '+html(t.id)+'">'+html(label)+' <small>#'+html(t.id)+'</small></button>';
     }
     s+='</div></div>';
    }
    s+='</div></details>';
   }
   return s;
  };
  let out='<section class="v996-hero-books v997-hero-books"><h3>이 장수가 장착 가능한 병법</h3>';
  out+='<p class="v997-bookhint">게임의 장수 <code>warbook</code> 허용 유형 코드로 연결한 병법입니다. 선본 병법 '+(own.length+common.length)+'종. 각 유형을 펼쳐 병법 상세를 볼 수 있습니다.</p>';
  if(own.length)out+='<h4>장수 고유 병법</h4>'+fmt(own);
  if(common.length)out+='<h4>공용 장착 가능 병법</h4>'+fmt(common);
  if(fallback.length){out+='<h4>장수 ID 직접 연결 · 장착 조건 미확인</h4><p>유형 허용 목록에는 없지만 원본 type/장수 ID가 연결된 항목입니다.</p>'+fmt(fallback);}
  if(!own.length&&!common.length&&!fallback.length)out+='<p>해당 장수의 병법 유형 허용 목록이나 직접 연결 병법을 확인할 수 없습니다.</p>';
  out+='<details class="v997-bookraw"><summary>장수 원본 병법 허용 유형 · 분석 근거</summary><p>유형 코드: '+html([...permitted].join(', ')||'미기록')+'</p><p>각 값의 짝수 번째 숫자는 별도 원본 계수이며, 아직 레벨 상한으로 해석하지 않습니다. 허용 유형이 여러 목록에 반복되어도 중복 병법은 한 번만 표시합니다.</p></details>';
  return out+'</section>';
 }
 function applyLevel(select,SK){
  // One-click level 1/10; +/- adjusts precisely one level or rank, within boundaries.
  const step=select.dataset?.v999Step;
  if(step){
   const [kind,delta]=step.split(':');const d=Number(delta)||0;
   if(kind==='rank')currentRank=Math.max(0,Math.min(5,currentRank+d));
   else currentLevel=Math.max(1,Math.min(10,currentLevel+d));
  }else if(select.dataset?.v999Level){
   currentLevel=Math.max(1,Math.min(10,Number(select.dataset.v999Level)||10));
  }else if(select.classList.contains('v996-rank'))currentRank=Math.max(0,Math.min(5,Number(select.value)||0));
  else currentLevel=Math.max(1,Math.min(10,Number(select.value)||10));
  const root=document.getElementById('details');if(!root)return;
  root.querySelectorAll('[data-v999-level]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.v999Level)===currentLevel)));
  root.querySelectorAll('.v999-level-current').forEach(el=>{el.textContent=currentLevel+'레벨'});
  root.querySelectorAll('.v999-rank-current').forEach(el=>{el.textContent=currentRank+'단계'});
  root.querySelectorAll('.v999-max').forEach(el=>{el.hidden=currentLevel!==10});
  root.querySelectorAll('[data-v999-step]').forEach(el=>{const [kind,delta]=el.dataset.v999Step.split(':');el.disabled=kind==='rank'?(Number(delta)<0?currentRank===0:currentRank===5):(Number(delta)<0?currentLevel===1:currentLevel===10)});
  root.querySelectorAll('.v996-level').forEach(el=>{el.value=String(currentLevel);});
  root.querySelectorAll('.v996-rank').forEach(el=>{el.value=String(currentRank);});
  root.querySelectorAll('.g-description-body[data-skill]').forEach(el=>{
   const s=SK[String(el.dataset.skill)];if(!s)return;
   const manual=window.NSLG_EDITOR?.override(String(s.ID))||{};
   const tier=(el.dataset.rankkind&&currentRank>0)?manual['rank_'+currentRank]:null;
   if(tier){el.textContent=tier;el.dataset.verified='1';}
   else if(manual.description){el.textContent=manual.description;el.dataset.verified='0';}
   else{el.innerHTML=renderSkill(s,currentLevel,currentRank).html;el.dataset.verified='0';}
  });
  root.querySelectorAll('.v9103-stage-holder[data-skill]').forEach(el=>{const sk=SK[String(el.dataset.skill)];if(sk)el.innerHTML=stageEffectHTML(sk,currentRank);});
  root.querySelectorAll('.v997-evolution-body[data-skill]').forEach(el=>{const sk=SK[String(el.dataset.skill)];if(sk)el.innerHTML=render(sk.description_evolution_kr,currentLevel,currentRank).html;});
  root.querySelectorAll('.v997-rank-status[data-skill]').forEach(el=>{
   const s=SK[String(el.dataset.skill)];if(!s)return;
   const manual=window.NSLG_EDITOR?.override(String(s.ID))||{};
   const label=el.dataset.rankkind||'등급';
   el.textContent=currentRank===0?'0단계 · 원본 기본 효과':manual['rank_'+currentRank]?
    label+' '+currentRank+'단계 · 사용자가 확인해 저장한 단계별 설명':(Object.keys((window.NSLG_V9104_EXACT||{})[String(s.ID)]||{}).length?'원본 설명·버프 수식 일치 항목에 강화 배율 반영 · 그 외 효과는 변경하지 않음':'⚠ '+label+' '+currentRank+'단계 · 기본 설명 유지; '+(classSummary(s,currentRank)||'원본에 일부 효과 보정식이 있으나 적용 범위 미확인'));
  });
  root.querySelectorAll('.v996-proc[data-skill]').forEach(el=>{
   const s=SK[String(el.dataset.skill)];if(!s)return;
   const overrides=window.NSLG_EDITOR?.override(String(s.ID))||{};
   // Probability classup is not proof of a universal breakthrough formula.
   el.textContent=overrides.probability||procText(s,currentLevel,0);
  });
  root.querySelectorAll('.v996-formula').forEach(el=>{const s=SK[String(el.dataset.skill)];if(s)el.outerHTML=formulas(s);});
 }
 return {calc,render,renderSkill,internal,procText,metaHTML,languageHTML,aliasHTML,formulas,groupRows,roleOptions,heroWarbooks,classCoefficients,classSummary,stageEffectHTML,applyLevel,get currentLevel(){return currentLevel;},set currentLevel(v){currentLevel=v;},get currentRank(){return currentRank;},set currentRank(v){currentRank=Math.max(0,Math.min(5,Number(v)||0));}};
})();
