(function(root) {
  'use strict';
  // Source rectangles follow the drawn silhouettes, not the nominal 512px grid.
  // PU-NI's scythe crosses that grid; keeping its two frames separate avoids bleed.
  const frames = [
    [[80,14,404,490],[576,8,415,497],[1085,8,395,496],[78,520,407,490],[576,514,416,497],[1083,518,401,492]],
    [[53,29,403,469],[569,32,426,466],[1092,36,410,468],[53,531,402,462],[570,531,423,462],[1092,532,411,467]],
    [[86,71,398,428],[552,67,418,432],[1071,79,383,419],[84,541,401,420],[552,533,418,429],[1070,548,386,414]],
    [[91,27,385,485],[575,25,385,488],[1060,27,388,485],[96,524,381,480],[579,523,380,481],[1062,525,386,478]],
    [[70,12,412,471],[569,14,407,471],[1081,11,395,475],[80,527,415,473],[569,522,407,480],[1087,521,396,482]],
    [[66,12,392,487],[494,9,503,495],[1101,12,381,488],[76,518,370,482],[494,513,504,486],[1100,518,382,481]]
  ];
  function layout(id,tier,happy=false) {
    const crop=frames[id][tier+(happy?3:0)], scale=Math.min(454/crop[3],470/crop[2]);
    return {crop,w:crop[2]*scale,h:crop[3]*scale,x:(512-crop[2]*scale)/2,y:482-crop[3]*scale};
  }
  function markup(id,tier,happy,url) {
    const f=layout(id,tier,happy);
    return `<span class="sprite" data-character="${id}" data-tier="${tier}" aria-hidden="true"><svg viewBox="0 0 512 512" focusable="false"><svg x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" viewBox="${f.crop.join(' ')}" overflow="hidden"><image href="${url}" width="1536" height="1024"/></svg></svg></span>`;
  }
  function draw(ctx,image,id,tier,x,y,size,happy=false) {
    const f=layout(id,tier,happy),s=size/512;
    ctx.drawImage(image,...f.crop,x-size/2+f.x*s,y-size/2+f.y*s,f.w*s,f.h*s);
  }
  const api={layout,markup,draw};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketArt=api;
})(typeof window!=='undefined'?window:globalThis);
