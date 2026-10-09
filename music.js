(function(){
  'use strict';
  const dialog=document.getElementById('music-dialog');
  const file=document.getElementById('music-file');
  const audio=document.getElementById('music-audio');
  const status=document.getElementById('music-status');
  const launch=document.getElementById('music-open');
  let objectUrl='',resume=()=>{},returnFocus=null;
  launch.addEventListener('click',()=>{
    returnFocus=document.activeElement;
    resume=window.PocketSession?.pauseForCard?.()||(()=>{});
    dialog.showModal();
  });
  dialog.addEventListener('close',()=>{
    resume();resume=()=>{};
    returnFocus?.focus({preventScroll:true});
  });
  launch.disabled=false;
  document.getElementById('music-close').addEventListener('click',()=>dialog.close());
  document.getElementById('music-pick').addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{
    const selected=file.files[0];
    if(!selected)return;
    if(!selected.type.startsWith('audio/')){status.textContent='请选择音频文件。';return;}
    audio.pause();
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    objectUrl=URL.createObjectURL(selected);
    audio.src=objectUrl;
    audio.hidden=false;
    status.textContent='正在播放；离开本页后需重新选择文件。';
    try{await audio.play();}catch{status.textContent='音频已载入，请点播放。';}
  });
  audio.addEventListener('play',()=>{launch.textContent='♫ 播放中';});
  audio.addEventListener('pause',()=>{launch.textContent='♫ 配乐';});
  window.addEventListener('pagehide',()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();
