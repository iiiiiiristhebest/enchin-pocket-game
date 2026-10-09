(function(root){
  'use strict';
  const chapters=[
    {name:'灯火初亮',place:'灯笼街',image:'town',intro:'ENGENE DAY 的聚会约在钟楼。先在街口碰面，把礼物带上。'},
    {name:'糖霜小巷',place:'糖霜街',image:'candy-map',intro:'糖果店开门了。装好礼袋，别忘了给 ENGENE 留一份。'},
    {name:'午夜集合',place:'月台钟楼',image:'midnight-map',intro:'钟楼到了，灯也亮了。等你入座，聚会就开始。'}
  ];
  // Original fan-fiction. Mechanical instructions are selected separately from the actual game.
  const scenes=[
    ['今晚有约',0,'请柬上写好了：10月9日，钟楼见！',2,'给 ENGENE 的那份我收好了。走，去门口等大家！','请柬送出去了，大家约在街口碰面。'],
    ['门口集合',2,'我站门口，会不会挡住大家？',3,'往旁边挪一点，给伙伴留条路。','门口空出来，伙伴陆续到了。'],
    ['多带一份',4,'这一袋好像装不下了。',5,'换个大的，总不能把糖留在这儿。','糖装好了，还多留了一袋给 ENGENE。'],
    ['请柬别倒',1,'这封请柬，好像拿反了。',0,'难怪我刚刚读得那么认真。','请柬排好了，地址也对上了。'],
    ['箱子谁拿',3,'这箱有点大，谁来搭把手？',2,'我拿这边，数到三一起抬。','箱子搬好了，礼物一件也没落下。'],
    ['绕路一点',5,'直走去广场，还是先去糖果街？',4,'糖果街。小橡子和我都准备好了。','路线定好了，先去糖果街。'],
    ['长椅一角',0,'长椅还空着，坐一小会儿？',1,'好，给其他伙伴也留点位置。','休息够了，大家一起继续走。'],
    ['最后清点',2,'请柬、礼物，还有……还有……',5,'还有你。别把自己数漏了。','人数与行李，都清点好了。'],
    ['街口那盏灯',3,'前面那家亮灯了，是不是到了？',4,'到了到了，我看见糖果店的招牌了！','大家在糖果店门口停下。'],
    ['灯火初亮',0,'都到了？来，先合个影！',1,'等一下，请柬拿反了。……好了，拍吧。','合照拍好了，去糖果街！'],
    ['糖果街开门',5,'门开了，哪边是我们的桌子？',2,'有六个位置的那张，我数过了！','庆典小桌找到了。'],
    ['空出一角',3,'桌上快放满了，请柬放哪里？',0,'给它留个角落，别压住名字。','桌面整理好了，请柬也有了位置。'],
    ['礼袋排排站',4,'这一排看着差不多高了。',1,'最右边那只是空袋子。','礼袋装齐了，没有空着的那只。'],
    ['少一点蝴蝶结',0,'再系一个，会不会更热闹？',5,'先留点地方，我们还要打开它呢。','礼袋装饰好了，也很好拆开。'],
    ['甜味分你',2,'这袋给你，那袋也给你。',3,'先停一下，你自己的还没拿。','糖果分好了，大家都有自己的那袋。'],
    ['招牌向哪边',1,'路标朝这边，大家会走回门口。',4,'那转过去，钟楼在另一边。','路标摆正了，下一站是钟楼。'],
    ['椅子借我半边',5,'歇一下？糖果不会自己跑走。',4,'好，小橡子也和我们待一会儿。','歇好啦，剩下的慢慢准备。'],
    ['合照先等等',0,'都站好了，我要数到三。',2,'等一下，我把礼袋放前面！','礼袋排进画面，合照准备好了。'],
    ['带齐再出发',3,'糖果、请柬，最后再看一眼。',1,'都在。我们去钟楼等大家。','糖果街准备完毕，可以出发了。'],
    ['糖果街合影',4,'等一下，招牌没拍进去。',5,'那我往后退一点。现在呢？','照片拍好了。带上糖果，去钟楼！'],
    ['钟楼在前面',2,'看到钟楼了！我是不是走太快了？',0,'先看看身后，我们都跟着呢。','六道身影一起登上月台。'],
    ['请柬留个位',1,'这边怎么还空着？',3,'给 ENGENE 留的，别把礼物堆过去。','桌边给 ENGENE 留好了位置。'],
    ['风的小玩笑',5,'刚才是不是有什么飞过去了？',4,'是纸角。还好礼袋抱得很稳。','松动的纸角压好了，礼物安稳落桌。'],
    ['别站到灯后面',0,'这里拍照会不会更亮？',2,'会，但大家只能看到我的影子。','站位调好了，这次能看清每张脸。'],
    ['甜点排队',3,'这边留给礼物，那边留给甜点。',5,'中间留给大家伸手，别挤满。','月台的小桌终于像一场庆典了。'],
    ['钟声前一刻',4,'还要再数一遍吗？',1,'刚数过，放心。你先坐下。','礼物和糖果都齐了。'],
    ['月台软垫',2,'软垫正好六个。选一个坐下？',3,'坐吧，今晚不用一直赶路。','在月光里歇过，脚步又轻了。'],
    ['灯串一盏盏',1,'灯都亮了。这个位置看得最清楚。',0,'那就把这里留给 ENGENE。','灯串亮了，聚会快开始了。'],
    ['谁还没到',5,'糖果、礼物，都齐了。还差谁？',4,'ENGENE 呀！来，这边给你留了位置。','ENGENE 到了，大家可以开场了。'],
    ['午夜全员集合',0,'ENGENE DAY 快乐！今天一起庆祝吧。',2,'先拍张合照，再来分糖！ENGENE，看这里——','10月9日，ENCHIN 和 ENGENE 的合照。']
  ];
  const actions=['同角色、同造型碰在一起，就能合成。','连起至少三个相邻的同角色。','选好力度和角度，接出泡泡里的伙伴。','记住翻开的伙伴，找到六对相同的名字。','看灯光落到白线，和大家一起接住节拍。','转一转灯路，让光从入口走到星星。'];
  function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(items,rng){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function createLevels(seed){const result=[];
    for(let chapter=0;chapter<3;chapter++){const rng=random((seed+chapter*991)>>>0),order=shuffle([0,1,2,3,4,5,chapter,(chapter+3)%6],rng);let gi=0;
      for(let slot=0;slot<10;slot++){const index=chapter*10+slot,type=slot===6?'rest':slot===9?'story':'game',game=type==='game'?order[gi++]:-1;
        const options=[{goal:3+chapter*3,kind:'merge',desc:'完成 '+(3+chapter*3)+' 次合成'}, {goal:18+chapter*12,kind:'tiles',time:100,ice:chapter*2,desc:'100 秒内消除 '+(18+chapter*12)+' 格'}, {goal:chapter===2?6:3+chapter,kind:'rescue',difficulty:chapter===2?3:chapter,desc:'救出 '+(chapter===2?6:3+chapter)+' 位伙伴 · 初始 7 次发射'+(chapter===2?' · 泡泡需撞两次':'')}, {goal:6,kind:'memory',time:100-chapter*10,desc:(100-chapter*10)+' 秒内找齐 6 对伙伴'}, {goal:10+chapter*2,kind:'rhythm',time:30,desc:'接住 '+(10+chapter*2)+' 次节拍 · 共 18 拍'}, {goal:1,kind:'path',time:120,desc:'120 秒内接通入口与星星'}];
        result.push({id:'c'+(chapter+1)+'-s'+String(slot+1).padStart(2,'0'),name:scenes[index][0],chapter,slot,type,game,seed:(seed+index*7919)>>>0,...(game<0?{goal:1,kind:type,desc:type==='rest'?'做一次喜欢的互动，再继续出发':'和大家合个影'}:options[game])});
      }
    }return result;
  }
  const legacyNames=['碰碰见面礼','第一袋糖','泡泡来客','换装小聚会','融化小冰块','穿过星星巷','口袋里的派对','最后一袋糖','午夜全员集合'];
  function stickers(names){return [
    ...scenes.map((s,i)=>({key:'journey-'+i,name:s[0],id:s[1],tier:Math.floor(i/10),type:'旅途',condition:'完成第 '+(i+1)+' 关',earned:v=>v.completed.includes(i)})),
    ...names.map((name,i)=>({key:'friend-'+i,name:name+' · 相伴',id:i,tier:0,type:'伙伴',condition:'和这位伙伴完成一次捏捏或呼吸',earned:v=>(v.companions||[]).includes(i)})),
    ...chapters.map((c,i)=>({key:'chapter-'+i,name:c.name+' · 纪念',id:i*2,tier:i,type:'章节',condition:'完成本章全部 10 关',earned:v=>Array.from({length:10},(_,n)=>i*10+n).every(n=>v.completed.includes(n))})),
    ...[['black','午夜火花','将两只同角色黑皮合成清场',5,2],['chain','一线星光','一次连起至少 5 个角色',4,1],['rescue','漂亮反弹','一发球救出至少 2 位伙伴',1,2],['nohelp','轻松闯关','任一挑战关不使用帮助通关',0,0],['parcel','心意拆封','完整拆开一个小包',2,1],['breath','慢慢来','完成一轮吸气与呼气',3,0],['memory','记得你呀','完成一次六对记忆挑战',0,1],['rhythm','同一节拍','连续接住 5 拍',5,1],['path','把灯点亮','完成一次灯路挑战',1,0]].map(([key,name,condition,id,tier])=>({key,name,condition,id,tier,type:'瞬间',earned:v=>(v.achievements||[]).includes(key)}))
  ];}
  const api={chapters,scenes,actions,random,shuffle,createLevels,stickers,legacyNames};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketStory=api;
})(typeof window!=='undefined'?window:globalThis);
