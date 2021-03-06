// GDPR
let gdprApplies;
let consentString = '';
let triesLeft = 5;
const cmpCallbacks = {};
// version 2.0

function lookupConsent() {
  consentString = '';
  if(!window.__tcfapi && window !== window.top) {
    let frame = window;
    let cmpFrame;
    while (!cmpFrame) {
      try {
        if(frame.frames['__tcfapiLocator']) cmpFrame = frame;
      } catch (e) {}

      if(frame === window.top) break;
      frame = frame.parent;
    }

    window.__tcfapi = function(cmd, version, callback, arg) {
      if(!cmpFrame) {
        callback({ msg: 'CMP not found' }, false);
      } else {
        const callId = Math.random() + '';
        const msg = {
          __tcfapiCall: {
            command: cmd,
            parameter: arg,
            version,
            callId
          }
        };

        cmpCallbacks[callId] = callback;
        cmpFrame.postMessage(msg, '*');
      }
    }

    window.addEventListener('message', function(event) {
      let data;
      if(typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data);
        } catch (e) {}
      } else {
        data = event.data;
      }

      if(data && data.__tcfapiReturn) {
        const r = data.__tcfapiReturn;
        if(r && cmpCallbacks.hasOwnProperty(r.callId)) {
          try {
            cmpCallbacks[r.callId](
              r.returnValue,
              r.success
            );
            delete cmpCallbacks[r.callId];
          } catch (e) {}
        }
      }

    });

  }

  if(typeof window.__tcfapi !== 'function') {
    if(triesLeft-- > 0) {
      window.setTimeout(lookupConsent, 1200);
    } else {
      // There's no CMP on the page
      console.log('GDPR', 'There\'s no CMP on the page');
    }
    return;
  }

  window.__tcfapi('ping', 2, (pingReturn, success) => {
    if(success) {
      console.log('GDPR', 'Ping', pingReturn);
    }
  });

  window.__tcfapi('getTCData', 2, (tcData, success) => {
    if(success) {
      gdprApplies = tcData.gdprApplies;
      consentString = tcData.tcString;
      console.log('GDPR', tcData);
    } else {
      if(triesLeft-- == 0) {
        // There's no CMP on the page
        console.log('GDPR', 'There\'s no CMP on the page');
      } else {
        window.setTimeout(lookupConsent, 1200);
      }
    }
  });
}

function getConsentString() {
  if(typeof consentString !== 'string') {
    return '';
  }
  return consentString;
}

export {
  lookupConsent,
  getConsentString,
  gdprApplies
}
