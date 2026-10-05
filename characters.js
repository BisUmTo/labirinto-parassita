/* Hand-built skeletal animation. The mantis body is illustrated; limbs and
   antennae are jointed and animated here. The hairworm is a smooth spline. */
const Characters=(()=>{
 const body=new Image();body.src='assets/characters/mantis-body.webp';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function limb(ctx,points,width){
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const [color,w] of [['#172417',width+1.8],['#8b9a53',width],['#c6c284',width*.27]]){
   ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();
  }
 }
 function mantis(ctx,x,y,size,angle,time,walk=0,stride=time){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  const t=reduce.matches?0:time,pace=(reduce.matches?0:stride)*.017,bob=Math.sin(pace*2)*walk*.014*size;
  ctx.translate(Math.sin(pace)*walk*size*.008,bob);
  ctx.scale(size/100,size/100);
  ctx.shadowColor='#102012aa';ctx.shadowBlur=2;ctx.shadowOffsetY=1.5;
  // Middle and hind legs alternate footfalls. Each has a femur, tibia, tarsus.
  for(const side of [-1,1])for(const j of [0,1]){
   const phase=pace+(side===1?Math.PI:0)+j*Math.PI;
   const step=Math.sin(phase)*walk,reach=Math.cos(phase)*walk;
   const hip=[side*5,j===0?0:13];
   const knee=[side*(j===0?25:22), (j===0?0:24)+step*5];
   const ankle=[side*(j===0?32:29),(j===0?18:39)+step*8];
   const toe=[side*(j===0?38:33)+reach*2,(j===0?22:46)+step*8];
   limb(ctx,[hip,knee,ankle,toe],j===0?2.1:1.9);
  }
  // Raptorial forelegs stay folded forward, flexing gently as the animal walks.
  for(const side of [-1,1]){
   const flex=Math.sin(t*.0022+side)*1.4+Math.sin(pace+side)*walk*2;
   const points=[[side*3,-23],[side*(17+flex),-36],[side*(21+flex),-14],[side*12,-31]];
   limb(ctx,points,3.1);
   ctx.strokeStyle='#5c692d';ctx.lineWidth=.7;
   for(let k=0;k<5;k++){const yy=-17-k*2.4;ctx.beginPath();ctx.moveTo(side*(19+flex),yy);ctx.lineTo(side*(15+flex),yy-2);ctx.stroke();}
  }
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // Illustrated body, head above, folded wings behind the long prothorax.
  if(body.complete&&body.naturalWidth){const h=82,w=h*body.naturalWidth/body.naturalHeight;ctx.save();ctx.filter='brightness(1.18) saturate(1.18)';ctx.drawImage(body,-w/2,-42,w,h);ctx.restore();}
  // Two independently searching antennae, attached to the triangular head.
  ctx.strokeStyle='#a6ac71';ctx.lineWidth=.65;
  for(const side of [-1,1]){const feel=Math.sin(t*.002+side)*2;ctx.beginPath();ctx.moveTo(side*4,-38);ctx.quadraticCurveTo(side*(11+feel),-52,side*(16+feel),-61);ctx.stroke();}
  ctx.restore();
 }
 function worm(ctx,x,y,size,time,emerge=1){
  const t=reduce.matches?0:time*.00055;ctx.save();ctx.translate(x,y);ctx.scale(size/100,size/100);
  const points=[];
  for(let i=0;i<=Math.max(2,Math.round(130*emerge));i++){const u=i/130,angle=u*Math.PI*3.3+t*.12;const radius=24+8*Math.sin(u*8+t);points.push([Math.cos(angle)*radius+Math.sin(u*13-t)*4,Math.sin(angle)*radius*.85]);}
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const [c,w,offset] of [['#080c0788',3.6,1],['#50351c',2.9,0],['#ae8047',1.5,0],['#e2bc75',.45,-.25]]){
   ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]+offset):ctx.moveTo(p[0],p[1]+offset));ctx.stroke();
  }ctx.restore();
 }
 function canvas(el){const d=Math.min(devicePixelRatio||1,2);const rect=el.getBoundingClientRect();const w=Math.max(1,Math.round(rect.width*d)),h=Math.max(1,Math.round(rect.height*d));if(el.width!==w||el.height!==h){el.width=w;el.height=h;}const ctx=el.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w/d,h/d);return{ctx,w:w/d,h:h/d};}
 return{mantis,worm,canvas,ready:()=>body.decode().catch(()=>{}),reduced:()=>reduce.matches};
})();
