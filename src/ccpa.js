// CCPA
let consentString = '';
let triesLeft = 5;
const cmpCallbacks = {};
const uspVersion = 1;

function lookupConsent() {
  return new Promise((res) => {
    consentString = '';
    if(!window.__uspapi && window !== window.top) {
      // Find the CMP frame
      let win = window;
      let cmpFrame;
      while (!cmpFrame) {
        try {
          if(win.frames['__uspapiLocator']) cmpFrame = win;
        } catch (e) {}
        if(win === window.top) break;
        win = win.parent;
      }

      // Setup a __uspapi function to do the postMessage and stash the callback.
      // This function behaves (from the caller's perspective)
      // identically to the same frame __uspapi call
      window.__uspapi = function(cmd, version, callback) {
        if(!cmpFrame) {
          callback({ msg: 'CMP not found' }, false);
          return;
        }
        const callId = Math.random() + '';
        const msg = {
          __uspapiCall: {
            command: cmd,
            version,
            callId
          }
        };
        cmpCallbacks[callId] = callback;
        cmpFrame.postMessage(msg, '*');
      }

      // When receive message, call the stashed callback
      window.addEventListener('message', function(event) {
        let data;
        if(typeof event.data === 'string') {
          try {
            data = JSON.parse(event.data);
          } catch (e) {}
        } else {
          data = event.data;
        }

        if(data && data.__uspapiReturn) {
          const r = data.__uspapiReturn;
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

    if(typeof window.__uspapi !== 'function') {
      if(triesLeft-- > 0) {
        window.setTimeout(lookupConsent, 1200);
      } else {
        // There's no CMP on the page
        console.log('CCPA', 'There\'s no CMP on the page');
        // resolve
        res();
      }
      return;
    }

    window.__uspapi('getUSPData', uspVersion, (uspData, success) => {
      if(success) {
        consentString = uspData.uspString;
        console.log('CCPA', consentString);
        // resolve
        res();
      } else {
        if(triesLeft-- == 0) {
          // There's no CMP on the page
          console.log('CCPA', 'There\'s no CMP on the page');
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
