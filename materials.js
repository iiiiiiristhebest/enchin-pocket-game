(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class Surface {
    constructor(w=180,h=156){this.w=w;this.h=h;this.data=new Float32Array(w*h);}
    sample(x,y,data=this.data){x=clamp(x,0,this.w-1);y=clamp(y,0,this.h-1);const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,at=(xx,yy)=>data[Math.min(this.h-1,yy)*this.w+Math.min(this.w-1,xx)];return at(ix,iy)*(1-fx)*(1-fy)+at(ix+1,iy)*fx*(1-fy)+at(ix,iy+1)*(1-fx)*fy+at(ix+1,iy+1)*fx*fy;}
    brush(x,y,mode,dx=0,dy=0){const old=this.data.slice(),r=mode==='pull'?40:26;dx=clamp(dx,-6,6);dy=clamp(dy,-6,6);
      for(let yy=Math.max(1,Math.floor(y-r*2));yy<Math.min(this.h-1,y+r*2);yy++)for(let xx=Math.max(1,Math.floor(x-r*2));xx<Math.min(this.w-1,x+r*2);xx++){const d=Math.hypot(xx-x,yy-y),weight=Math.exp(-d*d/(r*r)),i=yy*this.w+xx;if(mode==='pull')this.data[i]=Math.max((this.base?.[i]||0)*.38,this.sample(xx-dx*weight,yy-dy*weight,old)*.985+(this.base?.[i]||0)*.015);else if(mode==='smooth')this.data[i]*=1-weight*.23;else if(mode==='claypress'){if(old[i]>.4)this.data[i]=Math.max(.5,old[i]-.7*weight+.2*Math.exp(-((d-12)**2)/18));}else this.data[i]=clamp(old[i]+(d<5?-1.2:Math.exp(-((d-8)**2)/8)*.55)*weight,-8,6);}
    }
    imprint(mask,mw,mh,cx,cy,clay=false){for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const xx=Math.round(cx-mw/2+x),yy=Math.round(cy-mh/2+y);if(xx<1||xx>=this.w-1||yy<1||yy>=this.h-1)continue;const i=yy*this.w+xx,m=mask[y*mw+x];if(!m){if(!clay&&x>0&&y>0&&x<mw-1&&y<mh-1&&Math.max(mask[y*mw+x-1],mask[y*mw+x+1],mask[(y-1)*mw+x],mask[(y+1)*mw+x])>1)this.data[i]=clamp(this.data[i]+.55,-8,6);continue;}if(clay)this.data[i]=m;else this.data[i]=clamp(this.data[i]-m*.48,-8,6);}}
    resetClay(mask,mw,mh){this.data.fill(0);this.imprint(mask,mw,mh,this.w/2,this.h/2,true);this.base=this.data.slice();}
  }
  function maskFrom(draw,size){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size/2,size/2,size,false);const rgba=c.getContext('2d').getImageData(0,0,size,size).data,mask=new Float32Array(size*size);for(let i=0;i<mask.length;i++){const a=rgba[i*4+3]/255,lum=(rgba[i*4]*.2126+rgba[i*4+1]*.7152+rgba[i*4+2]*.0722)/255;mask[i]=a>.03?a*(6+(1-lum)*2.5):0;}for(let pass=0;pass<2;pass++){const before=mask.slice();for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){const i=y*size+x;mask[i]=(before[i]*4+before[i-1]+before[i+1]+before[i-size]+before[i+size])/8;}}return mask;}
  function renderer(canvas,surface,clay,color){const ctx=canvas.getContext('2d'),w=surface.w,h=surface.h,small=document.createElement('canvas');small.width=w;small.height=h;const sc=small.getContext('2d'),pixels=sc.createImageData(w,h),base=clay?color:[219,183,137];
    return ()=>{const data=surface.data,rgba=pixels.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,z=data[i],grain=((Math.imul(x+31,73856093)^Math.imul(y+17,19349663))&31)/31-.5;let shade,red,green,blue;
      if(clay&&z<.18){const shadow=data[Math.max(0,y-5)*w+Math.max(0,x-3)];red=237-shadow*.9;green=230-shadow*.95;blue=220-shadow;}
      else{const nx=(data[i+(x? -1:0)]-data[i+(x<w-1?1:0)])*.5,ny=(data[i-(y?w:0)]-data[i+(y<h-1?w:0)])*.5,nz=clay?2.4:1.6,len=Math.hypot(nx,ny,nz),light=clamp((nx*-.38+ny*-.55+nz*.75)/len,0,1),spec=clay?Math.pow(light,18)*24:0;shade=(clay?.69:.72)+light*.35;red=base[0]*shade+spec+grain*(clay?1.3:5);green=base[1]*shade+spec+grain*(clay?1.3:5);blue=base[2]*shade+spec+grain*(clay?1.3:5);if(!clay){const depth=Math.max(0,-z)*1.5;red-=depth;green-=depth;blue-=depth;}}
      rgba[i*4]=clamp(red,0,255);rgba[i*4+1]=clamp(green,0,255);rgba[i*4+2]=clamp(blue,0,255);rgba[i*4+3]=255;
    }sc.putImageData(pixels,0,0);ctx.imageSmoothingEnabled=true;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(small,0,0,canvas.width,canvas.height);};
  }
  function setup(stage,copy,tools){stage.innerHTML='<p class="rest-caption" id="touch-copy">'+copy+'</p><canvas class="touch-canvas material-canvas" width="540" height="468" tabindex="0" aria-label="拖动操作，按回车使用当前工具"></canvas><div class="touch-tools">'+tools.map(([id,label])=>'<button class="secondary" data-tool="'+id+'">'+label+'</button>').join('')+'</div>';return stage.querySelector('canvas');}
  function material(stage,draw,complete,tone,options={},clay=false){const name=options.name||'ENCHIN',c=setup(stage,clay?'试试揉开 '+name+' 的软泥压模。':'把 '+name+' 压进沙里，再轻轻抚平。',clay?[['pull','慢慢揉开'],['claypress','指腹按压'],['mold','重新压模']]:[['rake','拨沙'],['smooth','抚平'],['stamp','压下角色章'],['reset','铺平沙面']]);
    c.width=1080;c.height=936;const surface=new Surface(540,468),size=clay?420:216;let mask;
    try{mask=maskFrom(draw,size);}catch{stage.querySelector('#touch-copy').textContent='角色模具暂时无法加载，请从游戏预览入口打开。';return ()=>{};}
    const color=[[231,191,119],[167,169,180],[215,160,105],[203,193,227],[231,171,191],[231,191,70]][options.friend||0],paint=renderer(c,surface,clay,color);if(clay)surface.resetClay(mask,size,size);
    let mode=clay?'pull':'rake',pointer=null,last=null,changed=false;const pos=e=>{const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*surface.w/r.width,y:(e.clientY-r.top)*surface.h/r.height};};
    function choose(key){if(key==='reset'){surface.data.fill(0);paint();return;}if(key==='mold'){surface.resetClay(mask,size,size);paint();tone();return;}mode=key;stage.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===mode)));}choose(mode);
    function use(p,dx=0,dy=0){if(mode==='stamp'){surface.imprint(mask,size,size,p.x,p.y);tone();}else surface.brush(p.x,p.y,mode,dx,dy);changed=true;}
    stage.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>choose(b.dataset.tool));
    c.onpointerdown=e=>{if(!e.isPrimary||e.button!==0||pointer!==null)return;e.preventDefault();pointer=e.pointerId;c.setPointerCapture(pointer);last=pos(e);changed=false;if(mode!=='pull')use(last);paint();};
    c.onpointermove=e=>{if(pointer!==e.pointerId||mode==='stamp')return;const p=pos(e),dx=p.x-last.x,dy=p.y-last.y,steps=Math.max(1,Math.min(24,Math.ceil(Math.hypot(dx,dy)/4)));for(let i=1;i<=steps;i++)use({x:last.x+dx*i/steps,y:last.y+dy*i/steps},dx/steps,dy/steps);last=p;paint();};
    c.onpointerup=e=>{if(pointer!==e.pointerId)return;pointer=null;if(changed)complete('joy');};c.onpointercancel=c.onlostpointercapture=e=>{if(pointer===e.pointerId)pointer=null;};
    c.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(e.repeat)return;use({x:surface.w/2,y:surface.h/2},mode==='pull'?3:0,0);paint();complete('joy');}};paint();return ()=>{};
  }
  const packages=[
    {name:'丝带礼盒',item:'挂件',color:'#b99ac8',steps:[['抽开丝带','right'],['揭起封签','up'],['拆开左角','left'],['打开盒盖','up'],['拨开纸丝','right'],['揭开薄纸','left']]},
    {name:'抽绳布袋',item:'徽章',color:'#a1bab3',steps:[['松开右绳','right'],['松开左绳','left'],['撑开袋口','up'],['取出纸包','up'],['展开折角','left'],['抽走衬纸','down']]},
    {name:'邮戳信封',item:'书签',color:'#d1b18b',steps:[['揭开邮票封签','up'],['撕开封边','right'],['翻开信封口','up'],['抽出小纸套','down'],['拉开纸套','left'],['展开信纸','right']]}
  ];
  function parcel(stage,draw,complete,tone,options={}){const name=options.name||'ENCHIN',c=setup(stage,'给 '+name+' 的小包，先拆开最外面这一层。',[['open','开始拆包']]);
    stage.insertAdjacentHTML('afterbegin','<div class="package-tabs">'+packages.map((p,i)=>'<button class="secondary" data-package="'+i+'">'+p.name+'</button>').join('')+'</div>');
    const ctx=c.getContext('2d'),action=stage.querySelector('[data-tool]');let type=0,step=0,progress=0,pointer=null,start=null,awarded=false;
    const arrows={right:'向右拉 →',left:'← 向左拉',up:'向上揭 ↑',down:'向下抽 ↓'};
    function paint(){const pack=packages[type],done=step===6;ctx.clearRect(0,0,540,468);ctx.fillStyle='#f1e8df';ctx.fillRect(0,0,540,468);ctx.save();ctx.translate(270,235);ctx.fillStyle='#5e45521c';ctx.beginPath();ctx.ellipse(0,119,161,20,0,0,7);ctx.fill();ctx.shadowColor='#55405633';ctx.shadowBlur=16;ctx.shadowOffsetY=8;
      if(type===1){ctx.fillStyle=pack.color;ctx.beginPath();ctx.moveTo(-129,-115);ctx.quadraticCurveTo(-171,60,-116,118);ctx.quadraticCurveTo(0,147,116,118);ctx.quadraticCurveTo(171,60,129,-115);ctx.closePath();ctx.fill();}else{ctx.fillStyle=pack.color;ctx.fillRect(-157,-119,314,239);}ctx.shadowColor='transparent';
      if(!done){const cover=Math.max(0,1-step/7);ctx.fillStyle='#fbf0df';ctx.fillRect(-137,-99,274,199);ctx.fillStyle=pack.color;ctx.globalAlpha=.75;ctx.fillRect(-137,-99,274,199*cover);ctx.globalAlpha=1;
        if(step<2){ctx.fillStyle='#ede1f2';ctx.fillRect(-155,-10,310*(1-progress),20);ctx.fillStyle='#a38187';ctx.beginPath();ctx.arc(0,0,23,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='17px Georgia';ctx.fillText('✦',0,6);}
        if(step>=2&&step<4){ctx.fillStyle='#ecddc8';ctx.beginPath();ctx.moveTo(-147,-105);ctx.lineTo(147,-105);ctx.lineTo(147,-105+145*(1-progress));ctx.lineTo(-147,-105+175*(1-progress));ctx.closePath();ctx.fill();}
        if(step>=4){for(let i=0;i<12;i++){ctx.strokeStyle=i%2?'#bc9dad':'#d7bd9d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-123+i*21,-80);ctx.quadraticCurveTo(80-i*13,15,-123+i*21,80*(1-progress));ctx.stroke();}}
      }
      if(!done&&type===1){ctx.strokeStyle='#54756d';ctx.lineWidth=2;ctx.setLineDash([3,4]);ctx.strokeRect(-118,-89,236,181);ctx.setLineDash([]);ctx.strokeStyle='#f7efdb';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-135,-109);ctx.quadraticCurveTo(-45,-135,0,-108);ctx.quadraticCurveTo(60,-135,135,-109);ctx.stroke();if(step<2){ctx.beginPath();ctx.moveTo(step===1?-180:-135,-109);ctx.lineTo(-165-progress*25,-62);ctx.moveTo(135,-109);ctx.lineTo(165+progress*25,-62);ctx.stroke();}}
      if(!done&&type===2){ctx.strokeStyle='#a68360';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-157,-119);ctx.lineTo(0,step<3?12:-170-progress*35);ctx.lineTo(157,-119);ctx.stroke();ctx.beginPath();ctx.moveTo(-157,119);ctx.lineTo(-48,24);ctx.moveTo(157,119);ctx.lineTo(48,24);ctx.stroke();if(step===0){ctx.fillStyle='#e9d6b4';ctx.fillRect(60,-85,45,52);ctx.strokeRect(60,-85,45,52);ctx.fillStyle='#725b63';ctx.font='26px Georgia';ctx.fillText('✦',69,-49);}}
      if(!done&&type===0&&step<3){ctx.strokeStyle='#6c4d7d';ctx.lineWidth=2;ctx.strokeRect(-157,-119,314,239);if(step===0){ctx.strokeStyle='#f5dfea';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(0,120);ctx.moveTo(0,0);ctx.bezierCurveTo(-96,-62,-90,50,0,0);ctx.bezierCurveTo(96,-62,90,50,0,0);ctx.stroke();}}
      if(!done&&step===5){ctx.globalAlpha=.25+.5*progress;draw(ctx,0,0,170,true);ctx.globalAlpha=1;ctx.fillStyle='#fff8ec99';ctx.fillRect(-137+progress*210,-99,85,199);}
      ctx.restore();
      if(done){if(type===0){ctx.strokeStyle='#b6985f';ctx.lineWidth=7;ctx.beginPath();ctx.arc(270,119,24,0,7);ctx.stroke();draw(ctx,270,235,199,true);}else if(type===1){ctx.fillStyle='#fcf8ec';ctx.beginPath();ctx.arc(270,235,99,0,7);ctx.fill();draw(ctx,270,235,184,true);}else{ctx.fillStyle='#fff8e7';ctx.fillRect(199,122,142,229);draw(ctx,270,240,164,true);}ctx.fillStyle='#685267';ctx.font='16px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(name+' · '+pack.item,270,407);}
      else{const dir=pack.steps[step][1],p={right:[134+progress*240,240],left:[404-progress*240,240],up:[270,335-progress*195],down:[270,140+progress*195]}[dir];ctx.strokeStyle='#fff';ctx.fillStyle='#6e577480';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1],18,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#594361';ctx.textAlign='center';ctx.font='15px Microsoft YaHei';ctx.fillText(arrows[dir],270,408);}
    }
    function refresh(){const pack=packages[type];stage.querySelector('#touch-copy').textContent=step===6?'拆好了，'+name+' 的'+pack.item+'收进小物盒。':pack.name+' · '+(step+1)+' / 6 · '+pack.steps[step][0];action.textContent=step===6?'换一种包装 →':pack.steps[step][0];stage.querySelectorAll('[data-package]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.package===type)));paint();}
    function advance(){pointer=null;step++;progress=0;tone();if(step===6&&!awarded){awarded=true;complete('parcel',{type,item:packages[type].item});}refresh();}
    function choose(i){pointer=null;type=i;step=0;progress=0;awarded=false;refresh();}
    stage.querySelectorAll('[data-package]').forEach(b=>b.onclick=()=>choose(+b.dataset.package));action.onclick=()=>step===6?choose((type+1)%3):advance();
    const pos=e=>{const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*540/r.width,y:(e.clientY-r.top)*468/r.height};};
    c.onpointerdown=e=>{if(!e.isPrimary||e.button!==0||pointer!==null||step===6)return;const p=pos(e),dir=packages[type].steps[step][1],origin={right:[134,240],left:[404,240],up:[270,335],down:[270,140]}[dir];if(Math.hypot(p.x-origin[0],p.y-origin[1])>55)return;e.preventDefault();pointer=e.pointerId;start=p;c.setPointerCapture(pointer);};
    c.onpointermove=e=>{if(pointer!==e.pointerId)return;const p=pos(e),dir=packages[type].steps[step][1],distance={right:p.x-start.x,left:start.x-p.x,up:start.y-p.y,down:p.y-start.y}[dir];progress=clamp(distance/(dir==='right'||dir==='left'?225:175),0,1);paint();};
    c.onpointerup=e=>{if(pointer!==e.pointerId)return;pointer=null;if(progress>=.85)advance();else{progress=0;paint();}};c.onpointercancel=c.onlostpointercapture=e=>{if(pointer===e.pointerId){pointer=null;progress=0;paint();}};
    c.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)action.click();}};refresh();return ()=>{};
  }
  const api={Surface,packages,sand:(stage,draw,complete,tone,options={})=>material(stage,draw,complete,tone,options,false),clay:(stage,draw,complete,tone,options={})=>material(stage,draw,complete,tone,options,true),parcel};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketMaterials=api;
})(typeof window!=='undefined'?window:globalThis);
