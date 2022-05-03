
// IntersectionObserver
// Detect element visibility

import * as browser from './browser';

function observeVisibility(el, callback) {
  const observer = new IntersectionObserver(callback, {
    root: null, // viewport
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] // every 10%
  });
  try {
    observer.observe(el);
  } catch (e) {
    console.log('IntersectionObserver setup failed', e);
  }
  return observer
}

function visible(intersectionRatio, threshold) {
  return intersectionRatio * 100 >= threshold
}

const MIME_TYPES = {
  webm: 'video/webm',
  opus: 'video/ogg',
  ogv: 'video/ogg',
  mp4: 'video/mp4',
  mov: 'video/mp4',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
  treegpv: 'video/3gpp',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  caf: 'audio/x-caf',
  flac: 'audio/flac',
  oga: 'audio/ogg',
  wav: 'audio/wav',
  m3u8: 'application/x-mpegurl',
  mpd: 'application/dash+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp'
}

function getMimeType(src = '') {
  const ext = getFileExtension(src);
  const mimeType = MIME_TYPES[ext.toLowerCase()];
  return mimeType || '';
}

function getFileExtension(path) {
  if (typeof path === 'string') {
    const splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/;
    const pathParts = splitPathRe.exec(path);
    if (pathParts) {
      return pathParts.pop().toLowerCase();
    }
  }
  return '';
}

function supportsHLS() {
  return document.createElement('video').canPlayType('application/x-mpegurl');
}

function toHHMMSS(seconds) {
  let from = 11;
  let length = 8;
  if(seconds < 3600) {
    from = 14;
    length = 5;
  }
  return new Date(seconds * 1000).toISOString().substr(from, length)
}

function getBuffer(value) {
  return value + .1
}

const startTime = new Date().getTime();
function getRunTime() {
  return new Date().getTime() - startTime;
}

function getCacheBuster() {
  return Math.floor(Math.random() * 1000000);
}

function getTimestamp() {
  return Date.now();
}

function millisecondsToSeconds(milliseconds) {
  return Math.floor(milliseconds / 1000);
}

function isFullscreen(el) {
  return hasFullscreen(el) ? true : false
}

function hasFullscreen(el) {
  if('fullscreenElement' in el) return el.fullscreenElement;
  if('webkitFullscreenElement' in el) return el.webkitFullscreenElement;
  return false;
}

function requestFullscreen(el) {
  if(browser.IS_IPHONE) return el.querySelector('video').webkitEnterFullscreen();
  if('requestFullscreen' in el) return el.requestFullscreen();
  if('webkitRequestFullscreen' in el) return el.webkitRequestFullscreen();
  return false;
}

function existFullscreen(el) {
  if('exitFullscreen' in el) return el.exitFullscreen();
  if('webkitExitFullscreen' in el) return el.webkitExitFullscreen();
  return false;
}

const ASPECT_RATIOS = {
  '1:1': '100%',
  '16:9': '56.25%', // 9 / 16 * 100 = 56.25
  '4:3': '75%',
  '3:2': '66.66%',
  '8:5': '62.5%',
  '9:16': '177.77%' // 16 / 9 * 100 = 177.77777777777777
}

function injectStyle(id, cssContent) {
  if(!cssContent || typeof cssContent !== 'string' || cssContent.length < 1) {
    return;
  }
  let style = null;
  if(id) {
    // Update
    style = document.getElementById(id);
    if(!style) {
      style = document.createElement('style');
      style.id = id;
      style.textContent = cssContent;
      document.head.appendChild(style);
    } else {
      style.textContent = cssContent
    }
  } else {
    // Set
    style = document.createElement('style');
    style.textContent = cssContent;
    document.head.appendChild(style);
  }
}

function generateSessionId() {
  let sessionId = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++)
    sessionId += possible.charAt(Math.floor(Math.random() * possible.length));

  return sessionId;
}

function computedStyle(el, prop) {
  if (!el || !prop) {
    return '';
  }

  if (typeof window.getComputedStyle === 'function') {
    let computedStyleValue;

    try {
      computedStyleValue = window.getComputedStyle(el);
    } catch (e) {
      return '';
    }

    return computedStyleValue ? computedStyleValue.getPropertyValue(prop) || computedStyleValue[prop] : '';
  }

  return '';
}

function getBoundingClientRect(el) {
  if (el && el.getBoundingClientRect && el.parentNode) {
    const rect = el.getBoundingClientRect();
    const result = {};

    ['bottom', 'height', 'left', 'right', 'top', 'width'].forEach(k => {
      if (rect[k] !== undefined) {
        result[k] = rect[k];
      }
    });

    if (!result.height) {
      result.height = parseFloat(computedStyle(el, 'height'));
    }

    if (!result.width) {
      result.width = parseFloat(computedStyle(el, 'width'));
    }

    return result;
  }
}

function findPosition(el) {
  if (!el || (el && !el.offsetParent)) {
    return {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
  }
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  let left = 0;
  let top = 0;

  while (el.offsetParent /*&& el !== document[fs.fullscreenElement]*/) {
    left += el.offsetLeft;
    top += el.offsetTop;

    el = el.offsetParent;
  }

  return {
    left,
    top,
    width,
    height
  };
}

function getPointerPosition(el, event) {
  const translated = {
    x: 0,
    y: 0
  };

  if (browser.IS_IOS) {
    let item = el;

    while (item && item.nodeName.toLowerCase() !== 'html') {
      const transform = computedStyle(item, 'transform');

      if (/^matrix/.test(transform)) {
        const values = transform.slice(7, -1).split(/,\s/).map(Number);

        translated.x += values[4];
        translated.y += values[5];
      } else if (/^matrix3d/.test(transform)) {
        const values = transform.slice(9, -1).split(/,\s/).map(Number);

        translated.x += values[12];
        translated.y += values[13];
      }

      item = item.parentNode;
    }
  }

  const position = {};
  const boxTarget = findPosition(event.target);
  const box = findPosition(el);
  const boxW = box.width;
  const boxH = box.height;
  let offsetY = event.offsetY - (box.top - boxTarget.top);
  let offsetX = event.offsetX - (box.left - boxTarget.left);

  if (event.changedTouches) {
    // TODO:
    const _box = getBoundingClientRect(el);
    offsetX = event.changedTouches[0].pageX - _box.left; //box.left;
    offsetY = event.changedTouches[0].pageY + _box.top; //box.top;
    if (browser.IS_IOS) {
      offsetX -= translated.x;
      offsetY -= translated.y;
    }
  }

  position.y = (1 - Math.max(0, Math.min(1, offsetY / boxH)));
  position.x = Math.max(0, Math.min(1, offsetX / boxW));
  return position;
}

function replaceMacrosValues(url, macros) {
  let replacedMacrosUrl = url;
  for (const key in macros) {
    const value = macros[key];
    // this will match [${key}] and %%${key}%% and replace it
    replacedMacrosUrl = replacedMacrosUrl.replace(
      new RegExp(`(?:\\[|%%)(${key})(?:\\]|%%)`, 'g'),
      value
    );
  }
  return replacedMacrosUrl;
}

function serializeSupplyChain(schain) {
  if(!schain || typeof schain !== 'object'
    || !schain.hasOwnProperty('ver')
    || !schain.hasOwnProperty('complete')
    || !schain.hasOwnProperty('nodes')) {
    return '';
  }
  const keys = 'asi sid hp rid name domain'.split(' ');
  return schain.ver + ',' + schain.complete + '!' + schain.nodes.map((function(item) {
    return keys.map((function (key) {
      return item[key] ? encodeURIComponent(item[key]) : ''
    })).join(',');
  })).join('!');
}

function getUrl() {
  const href = window.location.href;
  const referrer = document.referrer;

  // Detect if you inside iframe
  if (window.parent != window) {
    const win = window, doc = document;
    let
      ampUrl = null,
      topAncestorOriginHostname = null,
      topAncestorOrigin = null,
      windowLocationAncestorOriginsHostnames = null,
      windowLocationAncestorOrigins = null,
      documentReferrerHostname = null,
      documentReferrer = null,
      windowTopLocationOrigin = null,
      windowLocationOrigin = null,
      windowTopLocationHostname = null,
      windowLocationHostname = null,
      windowTopLocationHref = null,
      windowLocationHref = null;
    const parents = [], parentLocationHref = [], parentHostnames = [];
    let
      topParentLocationHref = null,
      domainMatchSource = null,
      domainMatch = null,
      //url = null,
      topParentHostname = null,
      iframeHeight = 0,
      topIdxDomain = (iframeHeight = -1);

    const getHostname = function(url) {
      try {
        return new URL(url).hostname;
      } catch (e) {
        const link = document.createElement('a');
        link.href = url;
        return link.hostname;
      }
    }

    const getAmpUrl = function(url) {
      const n = (url = url.replace('.cdn.ampproject.org', '')).lastIndexOf('-');
      return 0 <= n ? ((url = url.substring(0, n) + '.' + url.substring(n + 1)), getHostname(url)) : null;
    }

    try {
      windowLocationHref = win.location.href;
    } catch (e) {}
    try {
      windowTopLocationHref = win.top.location.href;
    } catch (e) {}
    try {
      windowLocationHostname = win.location.hostname;
    } catch (e) {}
    try {
      windowTopLocationHostname = win.top.location.hostname;
    } catch (e) {}
    try {
      windowLocationOrigin = win.location.origin;
    } catch (e) {}
    try {
      windowTopLocationOrigin = win.top.location.origin;
    } catch (e) {}
    try {
      documentReferrer = doc.referrer;
      documentReferrerHostname = getHostname(documentReferrer);
    } catch (e) {}

    // Try to collect window.location.ancestorOrigins
    // ancestorOrigins not support in FF
    try {
      windowLocationAncestorOrigins = [];
      windowLocationAncestorOriginsHostnames = [];
      for(let i = 0; i < win.location.ancestorOrigins.length; i++) {
        const ancestorOrigin = win.location.ancestorOrigins[i];
        windowLocationAncestorOrigins.push(ancestorOrigin);
        const ancestorOriginHostname = getHostname(ancestorOrigin);
        windowLocationAncestorOriginsHostnames.push(
          ancestorOriginHostname
        );
        ancestorOrigin.endsWith('.cdn.ampproject.org') && (ampUrl = getAmpUrl(ancestorOrigin));
      }
    } catch (e) {}
    // If window.location.ancestorOrigins was collected get the last ancestorOrigin from array and set topAncestorOrigin
    windowLocationAncestorOrigins !== null && windowLocationAncestorOrigins.length > 0 && (topAncestorOrigin = windowLocationAncestorOrigins[windowLocationAncestorOrigins.length - 1]);
    windowLocationAncestorOriginsHostnames !== null && windowLocationAncestorOriginsHostnames.length > 0 && (topAncestorOriginHostname = windowLocationAncestorOriginsHostnames[windowLocationAncestorOriginsHostnames.length - 1]);

    try {
      let currentWindow = win;
      iframeHeight = 0;
      do {
        try {
          parents.push(currentWindow);
        } catch (e) {}
        try {
          parentLocationHref.push({
            url: currentWindow.location.href,
          });
          topParentLocationHref = currentWindow.location.href;
        } catch (e) {}
        try {
          parentHostnames.push({
            url: currentWindow.location.hostname,
          });
          topParentHostname = currentWindow.location.hostname;
          topIdxDomain = iframeHeight + 1;
        } catch (e) {}
        currentWindow = currentWindow.parent;
        iframeHeight++;
      } while (currentWindow !== win.top && currentWindow !== currentWindow.parent && 50 > iframeHeight);
    } catch (e) {}

    const getDomainMatchSource = function() {
      if(topAncestorOriginHostname !== null && topAncestorOriginHostname !== '')
        return {
          origin: topAncestorOrigin,
          hostname: topAncestorOriginHostname,
        };
      if(windowTopLocationHostname !== null && windowTopLocationHostname !== '')
        return {
          origin: windowTopLocationOrigin,
          hostname: windowTopLocationHostname,
        };
      if(!(1 >= iframeHeight)) {
        if(!(2 === iframeHeight || 2 >= topIdxDomain) && topParentHostname !== null && topParentHostname !== '')
          return {
            origin: topParentLocationHref,
            hostname: topParentHostname,
          };
        if(documentReferrerHostname !== null && documentReferrerHostname !== '')
          return {
            origin: documentReferrer,
            hostname: documentReferrerHostname,
          };
      }
      return windowLocationHostname !== null && windowLocationHostname !== ''
        ? {
          origin: windowLocationHref,
          hostname: windowLocationHostname
        }
        : {
          origin: null,
          hostname: null
        };
    }

    domainMatch = getDomainMatchSource();
    return domainMatch.origin != null ? domainMatch.origin : referrer;
  } else {
    return href;
  }
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch(e) {
    return null
  }
}

function fetchWithTimeout(url, options, timeout = 20000) {
  return new Promise.race([
    fetch(url, options),
    new Promise((res, rej) => {
      setTimeout(() => rej(new Error('request rejected by timeout of ' + timeout)), timeout);
    })
  ]);
}

export {
  observeVisibility,
  visible,
  MIME_TYPES,
  getMimeType,
  getFileExtension,
  supportsHLS,
  toHHMMSS,
  getBuffer,
  getRunTime,
  getCacheBuster,
  getTimestamp,
  millisecondsToSeconds,
  isFullscreen,
  requestFullscreen,
  existFullscreen,
  ASPECT_RATIOS,
  injectStyle,
  generateSessionId,
  getBoundingClientRect,
  findPosition,
  getPointerPosition,
  replaceMacrosValues,
  serializeSupplyChain,
  getUrl,
  getHostname,
  fetchWithTimeout
}
