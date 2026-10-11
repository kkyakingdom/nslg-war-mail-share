/* 깔개 분석기 v6.33 · 대용량 사전집계 Web Worker */
self.onmessage=function(e){
  const m=e.data||{};if(m.type!=='summary')return;
  const rows=Array.isArray(m.rows)?m.rows:[],decks=new Map(),players=new Map(),alliances=new Map();
  const canon=a=>a.filter(Boolean).sort().join('|');
  const add=(map,k,win)=>{if(!k)return;let z=map.get(k);if(!z)z={n:0,w:0,l:0};z.n++;win?z.w++:z.l++;map.set(k,z)};
  for(const r of rows){
    if(r.result!=='승'&&r.result!=='패')continue;const win=r.result==='승';
    add(decks,canon([r.h1,r.h2,r.h3]),win);add(decks,canon([r.oh1,r.oh2,r.oh3]),!win);
    add(players,r.user,win);add(players,r.oppUser,!win);add(alliances,r.alliance,win);add(alliances,r.oppAlliance,!win);
  }
  const top=map=>[...map.entries()].map(([key,z])=>({key,...z})).sort((a,b)=>b.n-a.n).slice(0,100);
  self.postMessage({type:'summary',count:rows.length,decks:top(decks),players:top(players),alliances:top(alliances),at:Date.now()});
};
