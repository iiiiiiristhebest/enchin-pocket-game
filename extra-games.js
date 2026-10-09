(function(root){
  'use strict';
  const J=typeof module!=='undefined'&&module.exports?require('./journey.js'):root.PocketStory;
  class Memory {
    constructor(seed){const rng=J.random(seed);this.cards=J.shuffle(Array.from({length:12},(_,i)=>({id:i%6,tier:Math.floor(rng()*3),found:false})),rng);this.open=[];this.wait=0;this.pairs=0;this.moves=0;this.score=0;}
    flip(i){if(this.wait>0||this.cards[i].found||this.open.includes(i))return false;this.open.push(i);if(this.open.length===2){this.moves++;const [a,b]=this.open;if(this.cards[a].id===this.cards[b].id){this.cards[a].found=this.cards[b].found=true;this.open=[];this.pairs++;this.score+=100;}else this.wait=.85;}return true;}
    step(dt){if(this.wait>0){this.wait=Math.max(0,this.wait-dt);if(!this.wait){this.open=[];return true;}}return false;}
  }
  class Rhythm {
    constructor(seed){const rng=J.random(seed);this.notes=Array.from({length:18},(_,i)=>({time:2+i*1.15,lane:Math.floor(rng()*3),state:'waiting'}));this.time=0;this.hits=0;this.combo=0;this.maxCombo=0;this.score=0;this.feedback='灯点落到白线时，按对应一栏。';}
    step(dt){this.time+=dt;this.notes.forEach(n=>{if(n.state==='waiting'&&this.time-n.time>.3){n.state='miss';this.combo=0;this.feedback='这一拍错过了，跟上下一拍。';}});}
    hit(lane){const n=this.notes.find(n=>n.state==='waiting'&&n.lane===lane&&Math.abs(n.time-this.time)<=.3);if(!n){this.combo=0;this.feedback='等灯点靠近白线，再按一次。';return false;}n.state='hit';this.hits++;this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);const perfect=Math.abs(n.time-this.time)<.12;this.score+=perfect?120:80;this.feedback=perfect?'正好这一拍！':'接住了！';return true;}
    get over(){return this.time>this.notes.at(-1).time+.4;}
  }
  const dirs=[[-1,0],[0,1],[1,0],[0,-1]],rotate=mask=>((mask<<1)&15)|(mask>>3);
  class Path {
    constructor(seed){const rng=J.random(seed);this.size=4;this.start=0;this.end=15;this.turns=0;this.score=0;
      // Build a monotone path, then rotate pieces: every initial board is solvable.
      const path=[0];let x=0,y=0;while(x<3||y<3){if(x<3&&(y===3||rng()<.5))x++;else y++;path.push(y*4+x);}this.solution=Array(16).fill(0);
      for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=b-a===1?1:2;this.solution[a]|=1<<d;this.solution[b]|=1<<((d+2)%4);}this.solution[0]|=8;this.solution[15]|=2;
      this.cells=this.solution.map(mask=>{let m=mask||([3,5,6,9][Math.floor(rng()*4)]);for(let j=Math.floor(rng()*4);j>0;j--)m=rotate(m);return m;});if(this.connected().won)this.cells[0]=rotate(this.cells[0]);
    }
    turn(i){this.cells[i]=rotate(this.cells[i]);this.turns++;const result=this.connected();if(result.won)this.score=Math.max(200,1000-this.turns*10);return result;}
    connected(){const seen=new Set();if(!(this.cells[0]&8))return {seen,won:false};const queue=[0];seen.add(0);while(queue.length){const i=queue.shift(),y=Math.floor(i/4),x=i%4;dirs.forEach(([dy,dx],d)=>{const yy=y+dy,xx=x+dx,j=yy*4+xx;if(yy<0||yy>3||xx<0||xx>3||seen.has(j))return;if((this.cells[i]&(1<<d))&&(this.cells[j]&(1<<((d+2)%4)))){seen.add(j);queue.push(j);}});}return {seen,won:seen.has(15)&&!!(this.cells[15]&2)};}
  }
  function mount(index,host,options){
    const {seed=1,limit=100,sprite,onUpdate,onFinish,onAward,tone}=options;
    let target=options.target??12;const names=options.names||['WONCHU','NOXSTAR','JAKEY','SNOWE','KISHU','PU-NI'];
    const model=index===3?new Memory(seed):index===4?new Rhythm(seed):new Path(seed);let time=limit,paused=false,ended=false,raf=0,last=performance.now(),peek=0;
    host.innerHTML=index===3?'<div class="memory-grid" id="memory-board"></div>':index===4?'<div class="beat-track"><div class="beat-notes"></div><div class="beat-line"></div></div><div class="beat-buttons">'+[0,1,2].map((n)=>'<button class="secondary" data-lane="'+n+'">'+sprite(n*2,n)+'<span>'+['← / A','↓ / S','→ / D'][n]+'</span></button>').join('')+'</div><p class="extra-feedback" role="status"></p>':'<div class="path-labels"><span>入口 ↘</span><span>星星 ★</span></div><div class="path-board"></div>';
    const update=()=>onUpdate({target,score:model.score,time:index===4?Math.max(0,model.notes.at(-1).time+.4-model.time):time,progress:index===3?model.pairs:index===4?model.hits:(model.connected().won?1:0)});
    function finish(win){if(ended)return;ended=true;cancelAnimationFrame(raf);update();if(win&&index!==4)onAward(index===3?'memory':'path');onFinish(win);}
    function paintMemory(){const focus=document.activeElement?.dataset.card;host.querySelector('#memory-board').innerHTML=model.cards.map((c,i)=>'<button class="memory-card '+(c.found?'found':'')+'" data-card="'+i+'" aria-label="'+(c.found?'已配对':model.open.includes(i)||peek>0?'已翻开，'+names[c.id]:'翻开第 '+(i+1)+' 张')+'" '+(c.found?'disabled':'')+'>'+(c.found||model.open.includes(i)||peek>0?sprite(c.id,c.tier):'<span class="card-back">✦</span>')+'</button>').join('');if(focus!==undefined)host.querySelector('[data-card="'+focus+'"]')?.focus({preventScroll:true});}
    const pipe=mask=>'<svg viewBox="0 0 100 100" aria-hidden="true">'+[0,1,2,3].filter(d=>mask&(1<<d)).map(d=>'<path d="M50 50 L'+[[50,0],[100,50],[50,100],[0,50]][d].join(' ')+'"/>').join('')+'<circle cx="50" cy="50" r="8"/></svg>';
    function paintPath(){const connected=model.connected(),focus=document.activeElement?.dataset.pipe;host.querySelector('.path-board').innerHTML=model.cells.map((m,i)=>'<button data-pipe="'+i+'" class="pipe '+(connected.seen.has(i)?'lit':'')+'" aria-label="转动第 '+(i+1)+' 块灯路">'+pipe(m)+(i===0?'<b>入口</b>':i===15?'<b>★</b>':'')+'</button>').join('');if(focus!==undefined)host.querySelector('[data-pipe="'+focus+'"]')?.focus({preventScroll:true});}
    if(index===3){paintMemory();host.onclick=e=>{const b=e.target.closest('[data-card]');if(!b||paused||ended||peek>0)return;if(model.flip(+b.dataset.card)){tone();paintMemory();update();if(model.pairs===6)finish(true);}};}
    if(index===5){paintPath();host.onclick=e=>{const b=e.target.closest('[data-pipe]');if(!b||paused||ended)return;const result=model.turn(+b.dataset.pipe);tone();paintPath();update();if(result.won)finish(true);};}
    function hit(lane){if(paused||ended)return;if(model.hit(lane))tone(1);if(model.maxCombo>=5)onAward('rhythm');update();}
    const key=e=>{if(paused||ended||e.target.closest('input,textarea,[contenteditable]'))return;const lane={ArrowLeft:0,a:0,A:0,ArrowDown:1,s:1,S:1,ArrowRight:2,d:2,D:2}[e.key];if(lane!==undefined&&index===4){e.preventDefault();if(!e.repeat)hit(lane);}};
    if(index===4){host.querySelectorAll('[data-lane]').forEach(b=>b.onclick=()=>hit(+b.dataset.lane));window.addEventListener('keydown',key);}
    function tick(now){if(ended)return;const dt=Math.max(0,(now-last)/1000);last=now;if(!paused){time=Math.max(0,time-dt);if(index===3){if(model.step(dt))paintMemory();if(peek>0){peek=Math.max(0,peek-dt);if(!peek)paintMemory();}}if(index===4){model.step(dt);host.querySelector('.beat-notes').innerHTML=model.notes.filter(n=>n.state==='waiting'&&n.time-model.time<2.3).map((n,i)=>'<div class="beat-note" style="left:'+(n.lane*100/3)+'%;top:'+((1-(n.time-model.time)/2.3)*82)+'%">'+sprite((n.lane*2+Math.floor(n.time))%6,n.lane)+'</div>').join('');host.querySelector('.extra-feedback').textContent=model.feedback;if(model.over)finish(model.hits>=target);}else if(time<=0)finish(false);update();}if(!ended)raf=requestAnimationFrame(tick);}
    raf=requestAnimationFrame(tick);update();return {model,setPaused(value){paused=value;last=performance.now();},help(){if(ended||paused)return;if(index===3){peek=2;paintMemory();}if(index===4){target=Math.max(1,target-2);model.feedback='这局目标减少 2 拍。';}if(index===5){const i=model.cells.findIndex((m,i)=>model.solution[i]&&m!==model.solution[i]);if(i>=0)model.cells[i]=model.solution[i];paintPath();if(model.connected().won){model.score=Math.max(200,1000-model.turns*10);finish(true);}}update();},destroy(){ended=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',key);host.onclick=null;}};
  }
  const api={Memory,Rhythm,Path,rotate,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketExtra=api;
})(typeof window!=='undefined'?window:globalThis);
