(function(root) {
  'use strict';
  const KEY = 'enchin-town-v3';
  const defaults = () => ({journeyVersion:3,seed:20261006,completed:[],best:[0,0,0,0,0,0],scores:{},sound:false,friend:0,skin:1,joy:0});
  function repairKnownReview(record) {
    const result = {...record,completed:[...(record.completed||[])],best:[...(record.best||[0,0,0])],scores:{...record.scores}};
    // The previous review wrote these three records to the player profile.
    // Keep the original v1 snapshot and retain higher scores and later stages.
    [300,360,460].forEach((score,i) => {
      if (result.completed.includes(i) && result.scores[i] === score) {
        result.completed = result.completed.filter(level => level !== i);
        delete result.scores[i];
        if (result.best[i] === score) result.best[i] = 0;
      }
    });
    return result;
  }
  function open(storage,review=false,repairReview=false) {
    let data = defaults();
    if (!review && storage) try {
      const current = JSON.parse(storage.getItem(KEY));
      if (current) data = {...data,...current};
      else {
        data.seed=Math.floor(Math.random()*4294967296)>>>0;
        let previous = JSON.parse(storage.getItem('enchin-town-v2')) || JSON.parse(storage.getItem('enchin-town-v1'));
        if (previous) {
          if(repairReview&&!previous.review20261004Repaired){storage.setItem('enchin-town-before-review-20261004',JSON.stringify(previous));previous={...repairKnownReview(previous),review20261004Repaired:true};}
          data={...data,...previous,journeyVersion:3,seed:data.seed,legacyJourney:{completed:[...(previous.completed||[])],scores:{...previous.scores},best:[...(previous.best||[0,0,0])]},completed:[],scores:{},best:[0,0,0,0,0,0]};
        }
        else {
          const old = JSON.parse(storage.getItem('enchin-pocket-v1'));
          if (old) data = {...data,joy:Number(old.joy)||0,sound:!!old.sound,friend:Math.max(0,['wonchu','noxstar','jakey','snowe','kishu','puni'].indexOf(old.friend)),skin:old.skin==='classic'?0:1};
        }
      }
      if (repairReview && data.legacyJourney && !data.review20261004Repaired) {
        storage.setItem('enchin-town-before-review-20261004',JSON.stringify(data.legacyJourney));
        data = {...data,legacyJourney:repairKnownReview(data.legacyJourney),review20261004Repaired:true};
      }
    } catch {}
    return {data,save(value) { if (!review && storage) try { storage.setItem(KEY,JSON.stringify(value)); } catch {} }};
  }
  const api = {open,repairKnownReview};
  if(typeof module !== 'undefined' && module.exports) module.exports=api; else root.PocketSave=api;
})(typeof window !== 'undefined' ? window : globalThis);
