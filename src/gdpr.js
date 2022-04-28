// GDPR
let consentString = '';
let triesLeft = 5;
const cmpCallbacks = {};

// Version 2.0
function lookupConsent() {
  return new Promise((res) => {
    consentString = '';
    if(!window.__tcfapi && window !== window.top) {
      let win = window;
      let cmpFrame;
      while (!cmpFrame) {
        try {
          if(win.frames['__tcfapiLocator']) cmpFrame = win;
        } catch (e) {}
        if(win === window.top) break;
        win = win.parent;
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
        // resolve
        res();
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
        consentString = tcData.tcString;
        console.log('GDPR', consentString);
        // resolve
        res();
      } else {
        if(triesLeft-- == 0) {
          // There's no CMP on the page
          console.log('GDPR', 'There\'s no CMP on the page');
          // resolve
          res()
        } else {
          window.setTimeout(lookupConsent, 1200);
        }
      }
    });

  });
}

function getConsentString() {
  if(typeof consentString !== 'string') {
    return '';
  }
  return consentString;
}

function isConsentString() {
  return typeof consentString === 'string' && consentString.length > 0;
}

export {
  lookupConsent,
  getConsentString,
  isConsentString
}
