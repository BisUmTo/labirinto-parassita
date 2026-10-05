(()=>{
'use strict';
const app=document.querySelector('#app'),dialog=document.querySelector('#dialog');
const announce=document.querySelector('#announcement'),toastEl=document.querySelector('#toast');
const letters=['A','B','C','D'],cardinals=['Nord','Est','Sud','Ovest'];
let game=null,board=null,previous=-1,round=0,phase='title',epoch=0;
let ready=false,busy=false,paused=false,queued=null,swipe=null,hold=null;
let timers=new Set(),portraits=[],trail=[],score={mantide:0,nematomorfo:0};
let motion={x:50,y:50,fromX:50,fromY:50,toX:50,toY:50,angle:0,fromAngle:0,toAngle:0,elapsed:0,duration:155,moving:false,walk:0,onDone:null};
let lastFrame=performance.now(),frame=0,toastTimer=null,audio=null,sound=false,resultTime=0;
let stride=0;
try{sound=localStorage.getItem('parassita-sound')==='on';}catch{}
const reduced=()=>Characters.reduced();
const btn=(text,action,extra='')=>`<button class="play-button ${extra}" data-action="${action}">${text}</button>`;
const quiet=(text,action)=>`<button class="quiet-button" data-action="${action}">${text}</button>`;
const character=(kind,cls='',extra='')=>`<canvas class="character ${cls}" data-character="${kind}" role="img" aria-label="${kind==='mantis'?'Mantide animata':'Nematomorfo animato'}" ${extra}></canvas>`;
const steps=n=>`<div class="stage-steps" aria-label="Fase ${n} di 3">${[1,2,3].map(i=>`<span class="${i<=n?'active':''}">${i}</span>`).join('')}</div>`;
function later(fn,ms){const own=epoch;const id=setTimeout(()=>{timers.delete(id);if(own===epoch)fn();},reduced()?Math.min(ms,40):ms);timers.add(id);return id;}
function stopHold(){if(hold){clearTimeout(hold);hold=null;}document.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed'));}
function resetWork(){epoch++;for(const id of timers)clearTimeout(id);timers.clear();stopHold();swipe=null;queued=null;busy=false;motion.moving=false;motion.onDone=null;announce.textContent='';}
function soundIcon(){const b=document.querySelector('#sound');b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'Disattiva i suoni':'Attiva i suoni');}
function tone(kind){
 if(!sound||document.hidden)return;
 try{
  audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
  const sequences={step:[[260,0,.045,.018]],bump:[[115,0,.07,.025]],click:[[420,0,.065,.025]],card:[[350,0,.07,.025],[520,.035,.10,.02]],win:[[392,0,.17,.04],[494,.14,.18,.04],[587,.29,.24,.045],[784,.47,.35,.04]],pond:[[294,0,.25,.035],[247,.18,.28,.035],[196,.40,.4,.04]]};
  for(const [freq,offset,dur,vol] of sequences[kind]||sequences.click){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+offset;o.type=kind==='step'?'triangle':'sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.88,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+dur+.02);}
 }catch{}
}
function toast(text){toastEl.textContent=text;toastEl.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('visible'),1300);}
function scene(html,name){resetWork();phase=name;app.innerHTML=html;app.dataset.scene=name;portraits=[...document.querySelectorAll('.character')];app.querySelector('h1,h2')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function randomInt(max){const a=new Uint32Array(1);crypto.getRandomValues(a);return Math.floor(a[0]/4294967296*max);}
function title(){
 game=null;board=null;ready=false;
 scene(`<section class="scene title-screen"><p class="kicker">Un gioco di persuasione per due</p><h1 class="game-title" tabindex="-1"><small>Il labirinto del</small>Parassita</h1><p class="title-sub">Una mantide cerca la libertà.<br>Qualcuno ha altri piani.</p><div class="diorama" aria-hidden="true"><img class="mini-map" src="assets/maze-0.webp" alt="" fetchpriority="high">${character('mantis','title-mantis')}${character('worm','title-worm')}</div>${btn('Gioca <span class="arrow" aria-hidden="true">→</span>','new')}<p class="small-note">2 persone · 1 telefono · 4 uscite</p>${quiet('Come si gioca','rules')}${round?`<div class="round-score">Mantide <b>${score.mantide}</b><span>Nematomorfo <b>${score.nematomorfo}</b></span></div>`:''}</section>`,'title');
}
function newRound(){
 let i=randomInt(MAZES.length);if(previous===i)i=(i+1+randomInt(MAZES.length-1))%MAZES.length;
 previous=i;board=MAZES[i];game=MazeGame.createRound(board,randomInt(4));round++;trail=[];ready=false;renderPrivate();
 // Decode privately in advance. This is unrelated to the hidden destination.
 const img=new Image();img.src=board.image;img.decode().catch(()=>{});
}
function renderPrivate(){
 scene(`<section class="scene role-stage">${steps(1)}<article class="role-card"><p class="kicker">Il telefono al parassita</p><div class="role-portrait">${character('worm')}</div><h2 tabindex="-1">Sei il<br>nematomorfo.</h2><p>Tra poco scoprirai dov’è lo stagno.<br><strong>La mantide deve guardare altrove.</strong></p><div class="role-caption">Il segreto è tuo</div></article>${btn('Scopri lo stagno','reveal')}<p class="small-note">Mostra questa schermata solo a chi interpreta il parassita.</p></section>`,'private');
}
function secret(){
 game.reveal();const s=game.snapshot();if(s.phase!=='secret')return;
 scene(`<section class="scene role-stage">${steps(1)}<article class="role-card secret-card"><p class="kicker">Solo tu conosci la destinazione</p><h2 tabindex="-1">Portala qui.</h2><div class="secret-map"><img class="pond-icon" src="assets/pond.webp" alt="Lo stagno">${letters.map((l,i)=>`<span class="compass-letter ${i===s.pond?'active':''}">${l}</span>`).join('')}</div><div class="destination-secret">${letters[s.pond]} · ${cardinals[s.pond]}</div><p><strong>Convincila a scegliere questa uscita.</strong><br>Puoi parlare, suggerire, tentarla.<br>Le zampe, però, le muove lei.</p></article>${btn('Ho memorizzato · Nascondi','handoff')}<p class="small-note">Nascondi il segreto prima di passare il telefono.</p></section>`,'secret');tone('card');
}
function handoff(){
 game.handoff();if(game.snapshot().phase!=='handoff')return;
 scene(`<section class="scene role-stage">${steps(2)}<article class="role-card"><p class="kicker">Il segreto è nascosto</p><div class="role-portrait">${character('mantis')}</div><h2 tabindex="-1">Tocca alla<br>mantide.</h2><p>Passale il telefono.<br><strong>Raggiungi un’uscita ed evita lo stagno.</strong><br>Ascolta i consigli. La scelta è tua.</p><div class="role-caption">Scegli di chi fidarti</div></article>${btn('Sono la mantide · Partiamo','start')}<p class="small-note">Scorri sul labirinto oppure usa le frecce.</p></section>`,'handoff');
}
function exitPosition(i){const t=board.size+board.margin*2,e=board.margin*.46/t*100;return [[50,e],[100-e,50],[50,100-e],[e,50]][i];}
function cellPosition([r,c]){const t=board.size+board.margin*2;return[(board.margin+c+.5)/t*100,(board.margin+r+.5)/t*100];}
function start(){
 game.start();if(game.snapshot().phase!=='playing')return;
 const s=game.snapshot();[motion.x,motion.y]=cellPosition(s.position);motion.angle=0;motion.walk=0;
 scene(`<section class="scene game-screen"><div class="game-hud"><div class="hud-role"><div class="hud-avatar">${character('mantis')}</div><div class="hud-label">Ora giochi tu<b>La mantide</b></div></div><div class="hud-right">PARTITA ${String(round).padStart(2,'0')}<strong id="move-count">0 passi</strong></div></div><div class="board-wrap"><div class="board-frame"><div id="board" class="board" tabindex="0" role="group" aria-label="Labirinto: swipe o frecce per muovere la mantide"><img class="map" src="${board.image}" alt="Labirinto di terra e muschio. A nord, B est, C sud, D ovest." draggable="false"><div class="trail" aria-hidden="true"></div>${letters.map((l,i)=>{const[x,y]=exitPosition(i);return`<div class="exit-card" data-exit="${i}" style="left:${x}%;top:${y}%" role="img" aria-label="Uscita ${l}: destinazione nascosta"><div class="card-turn"><div class="exit-front"><span>${l}</span><small>?</small></div><div class="exit-back"></div></div></div>`;}).join('')}<canvas class="actor-canvas" role="img" aria-label="Mantide, al centro del labirinto"></canvas></div></div></div><p class="below-board" id="game-hint">La tua meta è una delle quattro uscite.</p><div id="controls-slot"><div class="game-controls"><p class="control-caption"><span class="gesture-symbol" aria-hidden="true">↔</span><b>Scorri</b>per camminare</p><nav class="dpad" aria-label="Movimento della mantide"><button data-dir="0" aria-label="Muovi a nord">↑</button><button data-dir="3" aria-label="Muovi a ovest">←</button><button data-dir="2" aria-label="Muovi a sud">↓</button><button data-dir="1" aria-label="Muovi a est">→</button></nav><p class="control-caption"><b>Oppure</b>tieni premute<br>le frecce</p></div></div></section>`,'playing');
 ready=false;busy=true;setControls(true);const img=app.querySelector('.map'),own=epoch;
 const loaded=()=>{if(own!==epoch)return;ready=true;const prompt=document.createElement('div');prompt.className='board-prompt';prompt.innerHTML='<span>Sei la mantide</span>Trova la tua uscita';app.querySelector('#board').append(prompt);later(()=>{prompt.classList.add('leave');busy=false;setControls(false);later(()=>prompt.remove(),360);},850);};
 if(img.complete&&img.naturalWidth)loaded();else img.addEventListener('load',loaded,{once:true});
 img.addEventListener('error',()=>{if(own!==epoch)return;const h=app.querySelector('#game-hint');h.className='error-note';h.innerHTML='Il sentiero non si è caricato. '+quiet('Riprova','retry');},{once:true});
 installSwipe();app.querySelector('#board').focus({preventScroll:true});
}
function setControls(disabled){app.querySelectorAll('[data-dir]').forEach(b=>b.disabled=disabled);}
function updateHUD(){const s=game.snapshot();const label=app.querySelector('#move-count');if(label)label.textContent=s.moves===1?'1 passo':`${s.moves} passi`;const a=app.querySelector('.actor-canvas');a?.setAttribute('aria-label',s.phase==='finished'?`Mantide all’uscita ${letters[s.exit]}`:`Mantide, riga ${s.position[0]+1}, colonna ${s.position[1]+1}`);}
function footstep(point){trail.push(point);if(trail.length>10)trail.shift();const el=app.querySelector('.trail');if(el)el.innerHTML=trail.map((p,i)=>`<i class="trail-dot" style="left:${p[0]}%;top:${p[1]}%;opacity:${(i+1)/trail.length*.7}"></i>`).join('');}
function move(d){
 if(!game||!ready||paused||busy||phase!=='playing'||game.snapshot().phase!=='playing')return;
 if(motion.moving){queued=d;return;}
 const old=game.snapshot(),action=game.move(d);
 if(!action.moved){tone('bump');const b=app.querySelector('#board');if(!reduced())b.animate([{transform:'translateX(0)'},{transform:`translate${d%2?'X':'Y'}(${d===1||d===2?2:-2}px)`},{transform:'translate(0)'}],{duration:130});return;}
 tone('step');footstep(cellPosition(old.position));const s=game.snapshot();const target=action.finished?exitPosition(d):cellPosition(s.position);
 let angle=d*Math.PI/2;while(angle-motion.angle>Math.PI)angle-=Math.PI*2;while(angle-motion.angle<-Math.PI)angle+=Math.PI*2;
 Object.assign(motion,{fromX:motion.x,fromY:motion.y,toX:target[0],toY:target[1],fromAngle:motion.angle,toAngle:angle,elapsed:0,duration:reduced()?35:(action.finished?240:155),moving:true,walk:1,onDone:()=>{if(action.finished)revealEnd();else if(queued!==null){const q=queued;queued=null;move(q);}}});
 updateHUD();if(action.finished){busy=true;queued=null;stopHold();setControls(true);}
}
function revealEnd(){
 if(!game||game.snapshot().phase!=='finished')return;
 phase='revealing';const s=game.snapshot(),hint=app.querySelector('#game-hint');hint.textContent='Le strade svelano il loro segreto…';hint.classList.add('revealing');
 const cards=app.querySelectorAll('.exit-card');cards.forEach((card,i)=>{card.querySelector('.exit-back').innerHTML=`<img src="assets/${i===s.pond?'pond':'foglie'}.webp" alt=""><span>${letters[i]}</span>`;card.setAttribute('aria-label',`Uscita ${letters[i]}: ${i===s.pond?'stagno':'terra sicura'}`);card.style.setProperty('--delay',`${reduced()?0:i*90}ms`);});
 later(()=>{cards.forEach(card=>card.classList.add('revealed'));tone('card');},200);
 later(()=>{cards[s.exit].classList.add('chosen');cards[s.pond].classList.add('pond-reveal');result(s);},1250);
}
function result(s){
 resultTime=performance.now();app.dataset.scene='finished';
 phase='finished';busy=false;const parasite=s.winner==='parassita',name=parasite?'nematomorfo':'mantide';score[name]++;
 tone(parasite?'pond':'win');
 const hint=app.querySelector('#game-hint');hint.textContent=`Uscita scelta: ${letters[s.exit]} · Stagno: ${letters[s.pond]}`;hint.classList.remove('revealing');
 app.querySelector('#controls-slot').innerHTML=`<section class="round-result"><div class="winner-line"><div class="winner-portrait">${character(parasite?'worm':'mantis')}</div><div class="winner-copy"><p class="kicker">${parasite?'Le parole erano una trappola':'Hai seguito il tuo istinto'}</p><h2 tabindex="-1">Vince ${parasite?'il nematomorfo.':'la mantide.'}</h2></div></div><p class="result-description">${parasite?'La mantide è entrata nello stagno. Il nematomorfo ha raggiunto l’acqua dove può riprodursi.':'La mantide ha raggiunto la terra sicura. Questa volta il parassita non l’ha convinta.'}</p>${btn('Scambiatevi i ruoli · Rigioca','new')}${quiet('Torna al titolo','home')}</section>`;
 portraits=[...document.querySelectorAll('.character')];announce.textContent=`Vince ${parasite?'il nematomorfo':'la mantide'}. Lo stagno era all’uscita ${letters[s.pond]}.`;app.querySelector('.winner-copy h2')?.focus({preventScroll:true});
}
function installSwipe(){
 const el=app.querySelector('#board');
 el.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||phase!=='playing'||paused)return;swipe={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};el.setPointerCapture(e.pointerId);});
 el.addEventListener('pointermove',e=>{if(!swipe||e.pointerId!==swipe.id)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;const threshold=Math.max(21,el.clientWidth/(board.size+board.margin*2)*.85);if(Math.max(Math.abs(dx),Math.abs(dy))>=threshold){move(MazeGame.swipeDirection(dx,dy));swipe.x=e.clientX;swipe.y=e.clientY;swipe.moved=true;}});
 el.addEventListener('pointerup',e=>{if(!swipe||e.pointerId!==swipe.id)return;if(!swipe.moved){const d=MazeGame.swipeDirection(e.clientX-swipe.x,e.clientY-swipe.y);if(d!==null)move(d);}swipe=null;});
 for(const name of ['pointercancel','lostpointercapture'])el.addEventListener(name,()=>swipe=null);
}
function openDialog(kind='menu'){
 if(dialog.open)return;stopHold();queued=null;swipe=null;paused=true;
 if(phase==='secret'){game.cover();renderPrivate();}
 if(kind==='rules')dialog.innerHTML=`<p class="dialog-kicker">Due protagonisti, due obiettivi</p><h2 id="dialog-title">Come si gioca</h2><div class="role-rule">${character('mantis')}<div><strong>La mantide</strong><p>Muove la pedina. Deve uscire dal labirinto evitando lo stagno.</p></div></div><div class="role-rule">${character('worm')}<div><strong>Il nematomorfo</strong><p>Conosce lo stagno. Cerca di convincere la mantide a raggiungerlo, solo con le parole.</p></div></div><p>All’inizio il telefono va al parassita. Poi il segreto si nasconde e gioca la mantide. Alla prima uscita si scoprono tutte le caselle.</p><p><strong>Stagno: vince il nematomorfo.<br>Terra: vince la mantide.</strong></p><p>Scorri per camminare. Oppure usa le frecce a schermo e sulla tastiera.</p>${btn('Ho capito','close')}`;
 else dialog.innerHTML=`<p class="dialog-kicker">Il labirinto del parassita</p><h2 id="dialog-title">Una piccola pausa.</h2>${btn(game?'Torna al gioco':'Torna al titolo','close')}<div class="dialog-actions">${quiet('Come si gioca','rules')}${quiet(sound?'Disattiva i suoni':'Attiva i suoni','sound')}${game?quiet('Abbandona la partita','abandon'):''}</div>`;
 dialog.showModal();portraits=[...document.querySelectorAll('.character')];
}
function closeDialog(){dialog.close();paused=false;lastFrame=performance.now();portraits=[...document.querySelectorAll('.character')];}
function abandon(){dialog.innerHTML=`<p class="dialog-kicker">Tornare al titolo?</p><h2 id="dialog-title">Lasci il sentiero?</h2><p>Questa partita verrà interrotta. Il segreto resterà nascosto.</p>${btn('Continua a giocare','close')}${quiet('Sì, torna al titolo','home')}`;}
function toggleSound(){sound=!sound;soundIcon();try{localStorage.setItem('parassita-sound',sound?'on':'off');}catch{}if(sound)tone('click');toast(sound?'Suoni attivati':'Suoni disattivati');}
function perform(action){
 if(!['sound','close'].includes(action))tone('click');
 switch(action){
 case'new':if(dialog.open)closeDialog();newRound();break;
 case'reveal':secret();break;
 case'handoff':handoff();break;
 case'start':start();break;
 case'home':if(dialog.open)closeDialog();title();break;
 case'close':closeDialog();break;
 case'rules':if(dialog.open)dialog.close();openDialog('rules');break;
 case'abandon':abandon();break;
 case'sound':toggleSound();if(dialog.open){dialog.close();openDialog();}break;
 case'retry':start();break;
 }
}
for(const area of [app,dialog])area.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)perform(b.dataset.action);});
app.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-dir]');if(!b||b.disabled||!e.isPrimary)return;e.preventDefault();stopHold();b.classList.add('pressed');const d=Number(b.dataset.dir);move(d);const repeat=()=>{move(d);hold=setTimeout(repeat,165);};hold=setTimeout(repeat,285);b.setPointerCapture(e.pointerId);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(ev,e=>{if(e.target.closest('[data-dir]'))stopHold();});
app.addEventListener('click',e=>{const b=e.target.closest('[data-dir]');if(b&&e.detail===0)move(Number(b.dataset.dir));});
document.addEventListener('keydown',e=>{if(dialog.open)return;const d={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3}[e.key];if(d!==undefined&&phase==='playing'){e.preventDefault();move(d);}if(e.key==='Escape'&&game)openDialog();});
document.querySelector('#menu').addEventListener('click',()=>openDialog());document.querySelector('#brand').addEventListener('click',()=>openDialog());document.querySelector('#sound').addEventListener('click',toggleSound);
dialog.addEventListener('cancel',()=>{paused=false;lastFrame=performance.now();});dialog.addEventListener('close',()=>{paused=false;});
// A brief scattering of dry leaves celebrates a safe exit; no water in the maze.
function drawLeaves(ctx,x,y,size,t){
 if(t<0||t>2.4)return;
 for(let i=0;i<16;i++){
  const a=i*2.39996,speed=size*(.5+(i%4)*.24),life=Math.max(0,1-t/2.4);
  ctx.save();ctx.translate(x+Math.cos(a)*speed*t,y+Math.sin(a)*speed*t+size*.34*t*t);ctx.rotate(a+t*(i%2?2:-2));
  ctx.globalAlpha=life;ctx.fillStyle=['#d4b15f','#9da960','#dfc882'][i%3];ctx.beginPath();ctx.ellipse(0,0,size*.065,size*.024,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
function draw(now){
 frame=requestAnimationFrame(draw);if(document.hidden)return;const dt=Math.min(50,now-lastFrame);lastFrame=now;
 if(motion.moving&&!paused){motion.elapsed+=dt;const p=Math.min(1,motion.elapsed/motion.duration),ease=p*p*(3-2*p);motion.x=motion.fromX+(motion.toX-motion.fromX)*ease;motion.y=motion.fromY+(motion.toY-motion.fromY)*ease;motion.angle=motion.fromAngle+(motion.toAngle-motion.fromAngle)*Math.min(1,p*2.1);if(p===1){motion.moving=false;const done=motion.onDone;motion.onDone=null;done?.();}}
 motion.walk=motion.moving?1:Math.max(0,motion.walk-dt*.004);
 if(!paused)stride+=dt*motion.walk;
 const actor=app.querySelector('.actor-canvas');
 if(actor&&board){const{ctx,w,h}=Characters.canvas(actor);const size=w/(board.size+2*board.margin)*1.16;
  const s=game.snapshot(),inPond=s.phase==='finished'&&s.winner==='parassita'&&phase==='finished';
  if(inPond){
   const emerge=reduced()?1:Math.min(1,(now-resultTime)/1000);
   ctx.save();ctx.globalAlpha=1-emerge*.65;
   Characters.mantis(ctx,motion.x/100*w,motion.y/100*h,size,motion.angle,now,0,stride);ctx.restore();
   ctx.save();ctx.globalAlpha=emerge;Characters.worm(ctx,motion.x/100*w,motion.y/100*h,size*1.15,now,emerge);ctx.restore();
  }
  else {
   const cx=motion.x/100*w,cy=motion.y/100*h;
   ctx.save();ctx.fillStyle='#fff1b889';ctx.strokeStyle='#6b784b66';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(cx,cy,size*.31,size*.31,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
   Characters.mantis(ctx,cx,cy,size,motion.angle,now,paused?0:motion.walk,stride);
   if(phase==='finished'&&!reduced())drawLeaves(ctx,cx,cy,size,(now-resultTime)/1000);
  }
 }
 portraits=portraits.filter(el=>el.isConnected);
 for(const el of portraits){const{ctx,w,h}=Characters.canvas(el);if(el.dataset.character==='worm')Characters.worm(ctx,w/2,h/2,Math.min(w,h)*1.04,now);else Characters.mantis(ctx,w/2,h*.55,Math.min(w,h)*.78,el.classList.contains('title-mantis')?.2:0,now,el.classList.contains('title-mantis')?.16:0);}
}
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('is-hidden',document.hidden);stopHold();queued=null;swipe=null;if(document.hidden&&phase==='secret'){game.cover();renderPrivate();}lastFrame=performance.now();});
window.addEventListener('pagehide',()=>{if(phase==='secret'){game.cover();renderPrivate();}});
window.addEventListener('blur',()=>{stopHold();queued=null;swipe=null;});
soundIcon();title();Characters.ready();frame=requestAnimationFrame(draw);
})();
