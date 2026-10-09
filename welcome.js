(function(){
  'use strict';
  const dialog=document.getElementById('welcome-dialog');
  const params=new URLSearchParams(location.search);
  const friends=document.getElementById('welcome-friends');
  friends.innerHTML=Array.from({length:6},(_,index)=>`<span class="welcome-doll" style="background-position:${index%3*50}% ${Math.floor(index/3)*100}%">✧</span>`).join('');
  const atlas=new Image();atlas.src='assets/welcome-friends.webp';
  atlas.decode().then(()=>friends.classList.add('is-ready')).catch(()=>{});
  document.querySelector('.welcome-scene-art').decode().then(()=>document.querySelector('.welcome-scene').classList.add('is-ready')).catch(()=>{});
  if(!params.has('review')||params.has('welcome'))dialog.showModal();
  document.getElementById('welcome-enter').addEventListener('click',()=>dialog.close());
})();
