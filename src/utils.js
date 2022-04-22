
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

const mimeTypes = {
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
  const mimeType = mimeTypes[ext.toLowerCase()];
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

/*
function isIPhone() {
  const platforms = ['iPhone Simulator', 'iPhone'];
  if(!!navigator.platform) {
    while (platforms.length) {
      if(navigator.platform === platforms.pop()) return true;
    }
  }
  return false;
}
 */

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

const aspectRatios = {
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

export {
  observeVisibility,
  visible,
  mimeTypes,
  getMimeType,
  getFileExtension,
  supportsHLS,
  toHHMMSS,
  getBuffer,
  isFullscreen,
  requestFullscreen,
  existFullscreen,
  aspectRatios,
  injectStyle,
  generateSessionId,
  getBoundingClientRect,
  findPosition,
  getPointerPosition
}
