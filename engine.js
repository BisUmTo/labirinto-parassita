/* Pure rules, independent from rendering. */
const MazeGame=(()=>{
 const vectors=[[-1,0],[0,1],[1,0],[0,-1]];
 function createRound(board,pond){
  if(!Number.isInteger(pond)||pond<0||pond>3)throw new RangeError('Invalid pond');
  let phase='private',position=[...board.start],exit=null,moves=0;
  const snapshot=()=>({phase,position:[...position],exit,moves,pond:['secret','finished'].includes(phase)?pond:null,winner:phase==='finished'?(exit===pond?'parassita':'insetto'):null});
  return {
   snapshot,
   reveal(){if(phase==='private')phase='secret';},
   cover(){if(phase==='secret')phase='private';},
   handoff(){if(phase==='secret')phase='handoff';},
   start(){if(phase==='handoff')phase='playing';},
   move(direction){
    if(phase!=='playing'||!Number.isInteger(direction)||direction<0||direction>3)return {moved:false};
    const [r,c]=position;
    if(board.walls[r][c][direction])return {moved:false};
    const [dr,dc]=vectors[direction],nr=r+dr,nc=c+dc;
    moves++;
    if(nr<0||nc<0||nr>=board.size||nc>=board.size){exit=direction;phase='finished';}
    else position=[nr,nc];
    return {moved:true,finished:phase==='finished'};
   }
  };
 }
 function swipeDirection(dx,dy){
  if(Math.max(Math.abs(dx),Math.abs(dy))<18)return null;
  return Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
 }
 return {createRound,swipeDirection};
})();
if(typeof module!=='undefined')module.exports=MazeGame;
