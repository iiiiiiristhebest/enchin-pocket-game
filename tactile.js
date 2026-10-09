(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const point=(e,c)=>{const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};};
  function canvas(stage,copy,label,buttons) {
    stage.innerHTML=`<p class="rest-caption" id="touch-copy">${copy}</p><canvas class="touch-canvas" width="420" height="360" tabindex="0" aria-label="${label}"></canvas><div class="touch-tools">${buttons}</div>`;
    return stage.querySelector('canvas');
  }
  const button=(key,text)=>`<button class="secondary" data-tool="${key}">${text}</button>`;
  function meshPoint(x,y,press) {
    if(!press)return {x,y};
    const dx=x-press.x,dy=y-press.y,r=press.part==='ear'?62:press.part==='body'?100:78;
    const weight=Math.exp(-(dx*dx+dy*dy)/(r*r));
    return {x:x+weight*(press.dx+dx*.2)*press.force,y:y+weight*(press.dy+16-dy*.27)*press.force};
  }
  function triangle(ctx,img,a,b,c,p,q,r) {
    // Slightly overlap raster clip edges so antialiasing cannot reveal mesh seams.
    const cx=(p.x+q.x+r.x)/3,cy=(p.y+q.y+r.y)/3,edge=v=>{const d=Math.hypot(v.x-cx,v.y-cy);return {x:v.x+(v.x-cx)/d*.8,y:v.y+(v.y-cy)/d*.8};},ep=edge(p),eq=edge(q),er=edge(r);
    ctx.save();ctx.beginPath();ctx.moveTo(ep.x,ep.y);ctx.lineTo(eq.x,eq.y);ctx.lineTo(er.x,er.y);ctx.closePath();ctx.clip();
    const det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
    const m11=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,m12=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/det;
    const m21=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/det,m22=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/det;
    ctx.transform(m11,m12,m21,m22,p.x-m11*a.x-m21*a.y,p.y-m12*a.x-m22*a.y);ctx.drawImage(img,0,0);ctx.restore();
  }
  function meshRenderer(c,textures,nodes,n) {
    const gl=c.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
    if(!gl)return null;
    // Shared vertices are rasterized together; no per-triangle alpha compositing seams.
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s;};
    const vs=shader(gl.VERTEX_SHADER,'attribute vec2 position; attribute vec2 texcoord; varying vec2 uv; void main(){gl_Position=vec4(position.x/210.0-1.0,1.0-position.y/210.0,0.0,1.0);uv=texcoord;}');
    const fs=shader(gl.FRAGMENT_SHADER,'precision mediump float; uniform sampler2D picture; varying vec2 uv; void main(){vec4 color=texture2D(picture,uv);gl_FragColor=vec4(color.rgb*color.a,color.a);}');
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.useProgram(program);
    const handles=textures.map(image=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);return t;});
    const indices=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x,b=a+1,d=a+n+1,f=d+1;indices.push(a,b,d,b,f,d);}
    const data=new Float32Array(indices.length*4),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,offset] of [['position',0],['texcoord',8]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
    gl.viewport(0,0,420,420);gl.clearColor(0,0,0,0);
    return {draw(happy){indices.forEach((index,i)=>{const p=nodes[index];data.set([p.x,p.y,p.bx/420,p.by/420],i*4);});gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,handles[happy?1:0]);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,indices.length);},dispose(){handles.forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}};
  }
  function squish(stage,draw,complete,tone) {
    const c=canvas(stage,'试试脸颊、耳朵和肚子。','按住角色局部并拖动，松手回弹；也可使用下方部位按钮',button('ear','揉揉耳朵')+button('cheek','捏捏脸颊')+button('body','按按肚子'));
    c.id='plush';c.height=420;const textures=[false,true].map(h=>{const a=document.createElement('canvas');a.width=a.height=420;draw(a.getContext('2d'),210,210,380,h);return a;});
    const nodes=[],n=14,step=420/n;for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)nodes.push({bx:x*step,by:y*step,x:x*step,y:y*step,vx:0,vy:0});
    const gpu=meshRenderer(c,textures,nodes,n),ctx=gpu?null:c.getContext('2d');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let press=null,pointer=null,raf=0,timeout=0,last=performance.now(),disposed=false,happy=0;
    function begin(p) {const part=p.y<135?'ear':p.y>270?'body':'cheek';press={...p,dx:0,dy:0,force:0,part};happy=1;stage.querySelector('#touch-copy').textContent={ear:'耳朵软软的，轻轻揉。',cheek:'脸颊陷下去一点点。',body:'慢慢按，再慢慢松开。'}[part];tone();}
    function release(reward) {if(!press)return;press=null;happy=.8;if(reward)complete('companion');stage.querySelector('#touch-copy').textContent='松开了，慢慢回到原来的样子。';}
    c.onpointerdown=e=>{if(!e.isPrimary||e.button!==0||pointer!==null)return;e.preventDefault();const p=point(e,c);if(p.x<40||p.x>385||p.y<25||p.y>395)return;clearTimeout(timeout);pointer=e.pointerId;begin(p);c.setPointerCapture(pointer);};
    c.onpointermove=e=>{if(pointer!==e.pointerId||!press)return;const p=point(e,c);press.dx=clamp(p.x-press.x,-65,65);press.dy=clamp(p.y-press.y,-65,65);};
    c.onpointerup=e=>{if(pointer!==e.pointerId)return;pointer=null;release(true);};c.onpointercancel=c.onlostpointercapture=e=>{if(pointer!==e.pointerId)return;pointer=null;release(false);};
    const tap=part=>{if(pointer!==null)return;clearTimeout(timeout);begin({ear:{x:155,y:96},cheek:{x:135,y:210},body:{x:210,y:310}}[part]);timeout=setTimeout(()=>release(true),480);};
    stage.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>tap(b.dataset.tool));c.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(e.repeat)return;tap('cheek');}};
    function render(now) {if(disposed)return;const dt=Math.min(.025,(now-last)/1000);last=now;if(press)press.force=Math.min(1,press.force+dt*4);else happy=Math.max(0,happy-dt);
      for(const p of nodes){const target=meshPoint(p.bx,p.by,press);if(reduced){p.x+=(target.x-p.x)*.3;p.y+=(target.y-p.y)*.3;}else{p.vx+=(target.x-p.x)*160*dt;p.vy+=(target.y-p.y)*160*dt;p.vx*=Math.exp(-15*dt);p.vy*=Math.exp(-15*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;}}
      if(gpu)gpu.draw(happy>0);else {ctx.clearRect(0,0,420,420);const tex=textures[happy>0?1:0];
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=nodes[y*(n+1)+x],b=nodes[y*(n+1)+x+1],d=nodes[(y+1)*(n+1)+x],f=nodes[(y+1)*(n+1)+x+1],base=p=>({x:p.bx,y:p.by});triangle(ctx,tex,base(a),base(b),base(d),a,b,d);triangle(ctx,tex,base(b),base(f),base(d),b,f,d);}
      }
      raf=requestAnimationFrame(render);
    }raf=requestAnimationFrame(render);
    return ()=>{disposed=true;cancelAnimationFrame(raf);clearTimeout(timeout);if(gpu)gpu.dispose();};
  }
  const sand=(...args)=>root.PocketMaterials.sand(...args);
  const clay=(...args)=>root.PocketMaterials.clay(...args);
  const parcel=(...args)=>root.PocketMaterials.parcel(...args);
  const api={squish,sand,clay,parcel,meshPoint};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketTouch=api;
})(typeof window!=='undefined'?window:globalThis);
