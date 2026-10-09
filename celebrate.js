(function(){
  'use strict';
  const byId=id=>document.getElementById(id),dialog=byId('celebrate-dialog'),card=byId('card-canvas'),ctx=card.getContext('2d');
  const pictures=['wonchu','noxstar','jakey','snowe','kishu','puni'].map(id=>{const image=new Image();image.src='assets/'+id+'.png';return image;});
  const map=new Image();map.src='assets/midnight-map.png';
  const qr=new Image();qr.src='assets/game-qr.png';
  const labels=['WONCHU','NOXSTAR','JAKEY','SNOWE','KISHU','PU-NI'];
  let returnFocus=null,resume=()=>{},cardBlob=null,drawToken=0,wallToken=0;
  const status=text=>byId('celebrate-status').textContent=text;
  function validPost(url){try{const parsed=new URL(url);return parsed.protocol==='https:'?parsed.href:'';}catch{return '';}}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function fitLines(value,width,maxLines,bySentence){const lines=[''],chars=[...value];for(let i=0;i<chars.length;i++){const ch=chars[i],last=lines.length-1,next=lines[last]+ch;if(ctx.measureText(next).width>width&&lines[last]){if(lines.length===maxLines)return null;lines.push(ch);}else lines[last]=next;if(bySentence&&(ch==='。'||ch==='.')&&i<chars.length-1){if(lines.length===maxLines)return null;lines.push('');}}return lines.filter(Boolean);}
  function draw(){
    if([...pictures,map,qr].some(image=>!image.complete||!image.naturalWidth)){++drawToken;cardBlob=null;byId('card-share').disabled=true;byId('card-save').disabled=true;status([...pictures,map,qr].some(image=>image.complete&&!image.naturalWidth)?'图片未加载成功，请刷新页面后再试。':'图片加载中，请稍等。');return;}
    status('');
    ctx.fillStyle='#242238';ctx.fillRect(0,0,1080,1440);
    if(map.complete&&map.naturalWidth)ctx.drawImage(map,0,0,1080,690);
    const fade=ctx.createLinearGradient(0,0,0,690);fade.addColorStop(0,'#1c1a3dbb');fade.addColorStop(.55,'#24213d26');fade.addColorStop(1,'#242238');ctx.fillStyle=fade;ctx.fillRect(0,0,1080,690);
    ctx.textAlign='center';ctx.fillStyle='#f5da91';ctx.font='700 35px Segoe UI, sans-serif';ctx.letterSpacing='7px';ctx.fillText('10.09  ·  ENGENE DAY',540,110);ctx.letterSpacing='0px';
    ctx.fillStyle='#fffdf8';ctx.font='bold 86px Microsoft YaHei, sans-serif';ctx.fillText('Happy 엔진 Day!',540,250);
    ctx.font='34px Microsoft YaHei, sans-serif';ctx.fillText('ENGENE DAY 快乐，糖果给你留了一份。',540,326);
    ctx.fillStyle='#fbf7f0';roundRect(52,467,976,928,40);ctx.fill();ctx.strokeStyle='#dcccb0';ctx.lineWidth=3;roundRect(71,486,938,890,29);ctx.stroke();
    ctx.fillStyle='#544767';ctx.font='700 28px Segoe UI, sans-serif';ctx.fillText('ENCHIN  ×  ENGENE',540,545);
    const tier=window.PocketSession?.selectedSkin?.()??1;
    for(let i=0;i<6;i++){const x=225+i%3*315,y=681+Math.floor(i/3)*295;const image=pictures[i];if(image.complete&&image.naturalWidth)window.PocketArt.draw(ctx,image,i,tier,x,y,240,true);ctx.fillStyle='#393650';ctx.font='700 22px Segoe UI, sans-serif';ctx.fillText(labels[i],x,y+149);}
    ctx.strokeStyle='#ded1dc';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(142,1138);ctx.lineTo(938,1138);ctx.stroke();
    const note=byId('card-message').value.trim()||'10月9日，ENGENE DAY 快乐！';ctx.textAlign='left';ctx.fillStyle='#3e3a58';let lines;for(let size=31;size>=22;size--){ctx.font=`bold ${size}px Microsoft YaHei, sans-serif`;lines=fitLines(note,610,4,true)||fitLines(note,610,4,false);if(lines)break;}lines.forEach((line,i)=>ctx.fillText(line,130,1200+i*44));
    ctx.font='25px Microsoft YaHei, sans-serif';ctx.fillStyle='#776895';ctx.fillText('— '+(byId('card-name').value.trim()||'一位 ENGENE'),130,1363);
    ctx.fillStyle='#fff';roundRect(765,1155,220,218,16);ctx.fill();ctx.drawImage(qr,790,1168,170,170);ctx.textAlign='center';ctx.font='20px Microsoft YaHei, sans-serif';ctx.fillStyle='#66547f';ctx.fillText('扫码来小镇',875,1361);
    ctx.textAlign='left';ctx.fillStyle='#bdb4c9';ctx.font='20px Microsoft YaHei, sans-serif';ctx.fillText('非盈利同人作品 · 非官方出品',76,1420);
    const token=++drawToken;cardBlob=null;byId('card-share').disabled=true;byId('card-save').disabled=true;
    card.toBlob(blob=>{if(token!==drawToken)return;cardBlob=blob;byId('card-save').disabled=!blob;byId('card-share').disabled=!blob;},'image/png');
  }
  function saveImage(){if(!cardBlob){status('图片还在生成，请稍等。');return;}const url=URL.createObjectURL(cardBlob),a=document.createElement('a');a.href=url;a.download='ENGENE-DAY-2026-纪念卡.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);window.PocketAnalytics?.send('card_save');status('图片存好啦，想晒就晒！');}
  async function shareImage(){if(!cardBlob)return;const file=new File([cardBlob],'ENGENE-DAY-2026.png',{type:'image/png'});if(!navigator.share||!navigator.canShare?.({files:[file]})){status('这个浏览器暂不支持直接分享图片，请先保存图片。');return;}try{await navigator.share({files:[file],title:'ENGENE DAY 纪念卡'});window.PocketAnalytics?.send('card_share');}catch(error){if(error.name!=='AbortError')status('分享面板没有打开，请先保存图片。');}}
  function selectTab(which){for(const tab of dialog.querySelectorAll('[data-celebrate-tab]'))tab.setAttribute('aria-selected',String(tab.dataset.celebrateTab===which));for(const panel of ['card','wall','feedback'])byId('celebrate-'+panel+'-panel').hidden=panel!==which;status('');if(which==='card')draw();if(which==='wall'||which==='feedback')loadWall();}
  async function loadWall(){const wall=byId('approved-wall'),token=++wallToken;wall.replaceChildren();try{const response=await fetch('community.json',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(token!==wallToken)return;for(const [id,url,help,ready] of [['wish-form',data.wishFormUrl,'wish-form-help','在飞书表单写下祝福；作者确认后才会公开。'],['feedback-form',data.feedbackFormUrl,'feedback-form-help','在飞书表单留下意见，只给作者看。']]){const link=byId(id),valid=validPost(url||'');link.hidden=!valid;if(valid)link.href=valid;byId(help).textContent=valid?ready:id==='wish-form'?'祝福入口准备中。':'意见入口准备中。';}let items=Array.isArray(data.messages)?data.messages:[];if(data.wallEndpoint){const endpoint=new URL(data.wallEndpoint,location.href);if(!((endpoint.origin===location.origin&&endpoint.pathname==='/api/enchin-wall')||endpoint.href==='https://closer-deep-talk-d7eyj3heeb45d2a.service.tcloudbase.com/api/enchin-wall'))throw Error();const wallResponse=await fetch(endpoint.href,{cache:'no-store'});if(!wallResponse.ok)throw Error();const wallData=await wallResponse.json();if(token!==wallToken)return;items=Array.isArray(wallData.messages)?wallData.messages:[];}if(!items.length){const empty=document.createElement('p');empty.className='wall-empty';empty.textContent='还没有留言上墙。';wall.append(empty);}for(const item of items.slice(0,24)){if(!item||typeof item.text!=='string')continue;const piece=document.createElement('article'),name=document.createElement('strong'),body=document.createElement('p');name.textContent=String(item.name||'一位 ENGENE').slice(0,20);body.textContent=item.text.slice(0,100);piece.append(name,body);wall.append(piece);}}catch{if(token!==wallToken)return;const empty=document.createElement('p');empty.className='wall-empty';empty.textContent='留言墙暂时打不开，稍后再来看看。';wall.append(empty);}}
  byId('celebrate-open').onclick=()=>{returnFocus=document.activeElement;resume=window.PocketSession?.pauseForCard?.()||(()=>{});dialog.showModal();selectTab('card');byId('card-message').focus();};
  byId('celebrate-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{resume();resume=()=>{};returnFocus?.focus({preventScroll:true});});
  dialog.querySelectorAll('[data-celebrate-tab]').forEach(b=>b.onclick=()=>selectTab(b.dataset.celebrateTab));
  for(const id of ['card-name','card-message'])byId(id).addEventListener('input',draw);
  for(const img of [...pictures,map,qr])for(const event of ['load','error'])img.addEventListener(event,()=>{if(dialog.open&&!byId('celebrate-card-panel').hidden)draw();});
  byId('card-save').onclick=saveImage;byId('card-share').onclick=shareImage;
})();
