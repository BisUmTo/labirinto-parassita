const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createRound,swipeDirection}=require('../engine.js');
const boards=require('../mazes.js');
const dirs=[[-1,0],[0,1],[1,0],[0,-1]];
function route(board,side){
 const target=board.exits[['NORD','EST','SUD','OVEST'][side]];
 const queue=[[board.start,[]]], seen=new Set([board.start.join()]);
 for(let i=0;i<queue.length;i++){
  const [[r,c],path]=queue[i];if(r===target[0]&&c===target[1])return [...path,side];
  dirs.forEach(([dr,dc],d)=>{let nr=r+dr,nc=c+dc,key=[nr,nc].join();
   if(nr>=0&&nc>=0&&nr<board.size&&nc<board.size&&!board.walls[r][c][d]&&!seen.has(key)){
    seen.add(key);queue.push([[nr,nc],[...path,d]]);
   }
  });
 }
 throw Error('unreachable exit');
}
test('secret visible only to parasite, erased on handoff',()=>{
 const g=createRound(boards[0],2);assert.equal(g.snapshot().pond,null);
 assert.equal(g.move(0).moved,false);g.reveal();assert.equal(g.snapshot().pond,2);
 g.handoff();assert.equal(g.snapshot().pond,null);g.reveal();assert.equal(g.snapshot().pond,null);
 g.start();assert.equal(g.snapshot().pond,null);assert.equal(g.snapshot().phase,'playing');
});
test('all six boards, all four ponds and exits: correct winner and immutable finish',()=>{
 for(const b of boards)for(let pond=0;pond<4;pond++)for(let exit=0;exit<4;exit++){
  const g=createRound(b,pond);g.reveal();g.handoff();g.start();
  for(const d of route(b,exit))assert.equal(g.move(d).moved,true);
  const s=g.snapshot();assert.equal(s.phase,'finished');assert.equal(s.exit,exit);
  assert.equal(s.pond,pond);assert.equal(s.winner,pond===exit?'parassita':'insetto');
  g.move((exit+1)%4);assert.deepEqual(g.snapshot(),s);
 }
});
test('closed walls cannot be crossed, no mutation of maze',()=>{
 for(const b of boards){
  const before=JSON.stringify(b);const g=createRound(b,0);g.reveal();g.handoff();g.start();
  const [r,c]=b.start;
  for(let d=0;d<4;d++)if(b.walls[r][c][d]){assert.equal(g.move(d).moved,false);assert.deepEqual(g.snapshot().position,[r,c]);}
  assert.equal(JSON.stringify(b),before);
 }
});
test('swipe directions, threshold and taps',()=>{
 assert.equal(swipeDirection(30,3),1);assert.equal(swipeDirection(-30,3),3);
 assert.equal(swipeDirection(2,30),2);assert.equal(swipeDirection(2,-30),0);
 assert.equal(swipeDirection(4,4),null);
});
test('private screen can be covered without rerolling secret',()=>{
 const g=createRound(boards[0],1);g.reveal();g.cover();assert.equal(g.snapshot().pond,null);
 g.reveal();assert.equal(g.snapshot().pond,1);
});
test('board topology: reciprocal walls, four boundary exits, all cells reachable',()=>{
 for(const b of boards){
  assert.deepEqual(b.start,[Math.floor(b.size/2),Math.floor(b.size/2)]);
  let boundaries=[];
  for(let r=0;r<b.size;r++)for(let c=0;c<b.size;c++)for(let d=0;d<4;d++){
   const [dr,dc]=dirs[d],nr=r+dr,nc=c+dc;
   if(nr>=0&&nc>=0&&nr<b.size&&nc<b.size)assert.equal(b.walls[r][c][d],b.walls[nr][nc][(d+2)%4]);
   else if(!b.walls[r][c][d])boundaries.push([r,c,d]);
  }
  assert.equal(boundaries.length,4);
  for(let d=0;d<4;d++)assert.deepEqual(boundaries.find(e=>e[2]===d).slice(0,2),b.exits[['NORD','EST','SUD','OVEST'][d]]);
  const queue=[b.start],seen=new Set([b.start.join()]);
  for(let i=0;i<queue.length;i++){
   const [r,c]=queue[i];dirs.forEach(([dr,dc],d)=>{
    const nr=r+dr,nc=c+dc,key=[nr,nc].join();
    if(nr>=0&&nc>=0&&nr<b.size&&nc<b.size&&!b.walls[r][c][d]&&!seen.has(key)){seen.add(key);queue.push([nr,nc]);}
   });
  }
  assert.equal(seen.size,b.size*b.size);
 }
});
