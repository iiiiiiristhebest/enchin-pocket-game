(function(root) {
  'use strict';
  const chapters=[
    {name:'灯火初亮',place:'灯笼街',image:'town',color:'#c5a577',intro:'午夜庆典快开始了。先准备见面礼，再接伙伴们来赴约。'},
    {name:'糖霜小巷',place:'糖霜街',image:'candy-map',color:'#96b8b5',intro:'糖果街亮起了灯。换好衣服，把冻住的糖果带去钟楼。'},
    {name:'午夜集合',place:'月台钟楼',image:'midnight-map',color:'#aaa0d1',intro:'钟声就快响了。收好最后的糖果，六位伙伴，一个都不能少。'}
  ];
  const scenes=[
    ['碰碰见面礼',0,'同样的伙伴碰一碰，换个造型来赴约。','第一份见面礼准备好了。去糖果店看看吧。'],
    ['第一袋糖',4,'把相同伙伴连起来，装好今晚的第一袋糖。','糖果装好了。去接等在街角的伙伴吧。'],
    ['泡泡来客',2,'三位伙伴被泡泡拦住了。找准角度，接他们出来。','大家到了，下一站是糖霜街。'],
    ['换装小聚会',3,'换装派对开场。再凑几次漂亮的碰面。','衣角晃一晃，派对热闹起来。'],
    ['融化小冰块',5,'糖果冻住了。在冰块旁连线，把它们化开。','冰霜化开，前面的路亮了。'],
    ['穿过星星巷',1,'看准移动挡板的空隙，接上四位伙伴去钟楼。','穿过星星巷，钟楼就在前面。'],
    ['口袋里的派对',0,'再来十次碰面，把今晚的热闹攒满。','派对就绪，还差最后一袋糖。'],
    ['最后一袋糖',4,'连得更长一点，为庆典攒够 1000 分。','糖果收好，去和大家会合。'],
    ['午夜全员集合',1,'六位伙伴都在等你。撞开双层泡泡，一起赴约。','六位伙伴，一个不落。午夜庆典，现在开始。']
  ];
  const tokens=['见面礼','第一袋糖','泡泡来客','换装合影','冰霜融化','星星巷','口袋派对','糖果满袋','午夜全员'];
  function stickers(names) {
    return [
      ...tokens.map((name,i)=>({key:'level-'+i,name,id:scenes[i][1],tier:Math.floor(i/3),type:'旅途',condition:`完成第 ${i+1} 关`,earned:s=>s.completed.includes(i)})),
      ...names.map((name,i)=>({key:'friend-'+i,name:name+' · 相伴',id:i,tier:0,type:'伙伴',condition:'和这位伙伴完成一次捏捏或呼吸',earned:s=>(s.companions||[]).includes(i)})),
      ...chapters.map((c,i)=>({key:'chapter-'+i,name:c.name+' · 纪念',id:i*2,tier:i,type:'章节',condition:`完成第 ${i*3+1}—${i*3+3} 关`,earned:s=>[0,1,2].every(n=>s.completed.includes(i*3+n))})),
      ...[['black','午夜火花','将两只同角色黑皮合成清场',5,2],['chain','一线星光','一次连起至少 5 个角色',4,1],['rescue','漂亮反弹','一发球救出至少 2 位伙伴',1,2],['nohelp','轻松闯关','任一关不使用帮助通关',0,0],['parcel','心意拆封','完整拆开一个小包',2,1],['breath','慢慢来','完成一轮吸气与呼气',3,0]].map(([key,name,condition,id,tier])=>({key,name,condition,id,tier,type:'瞬间',earned:s=>(s.achievements||[]).includes(key)}))
    ];
  }
  const api={chapters,scenes,stickers};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketStory=api;
})(typeof window!=='undefined'?window:globalThis);
