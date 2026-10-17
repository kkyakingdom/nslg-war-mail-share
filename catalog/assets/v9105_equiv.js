/* Verified algebraic equivalents of original game fields. Only plain skillLv arithmetic. */
(function(){
const more={"201701":{"0.30+giver.skillLv*0.03":0.036}};
const target=window.NSLG_V9104_EXACT||(window.NSLG_V9104_EXACT={});
for(const [id,values] of Object.entries(more)){const slot=target[id]||(target[id]={});for(const [e,k] of Object.entries(values)){if(!Object.prototype.hasOwnProperty.call(slot,e))slot[e]=k;}}
})();
