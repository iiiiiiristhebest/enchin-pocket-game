(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const enabled = location.protocol === 'https:' && location.hostname === 'closer-deep-talk-d7eyj3heeb45d2a-1365127376.tcloudbaseapp.com' && params.get('review') !== '1';
  const endpoint = 'https://closer-deep-talk-d7eyj3heeb45d2a.service.tcloudbase.com/api/enchin-analytics';
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, digit => (Number(digit) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(digit) / 4).toString(16));
  let visitor = '';
  if (enabled) {
    try {
      visitor = localStorage.getItem('enchin-visitor-v1') || uuid();
      localStorage.setItem('enchin-visitor-v1', visitor);
    } catch { visitor = uuid(); }
  }
  const session = enabled ? uuid() : '';
  function send(type, detail = {}) {
    if (!enabled) return;
    const payload = {id:uuid(),type,visitor,session,...detail};
    fetch(endpoint, {method:'POST',mode:'cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
  }
  window.PocketAnalytics = {send,attempt:uuid};
  send('visit');
})();
