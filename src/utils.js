
// IntersectionObserver
// Detect element visibility

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

export {
  observeVisibility,
  visible,
  mimeTypes,
  getMimeType,
  getFileExtension,
  supportsHLS,
  toHHMMSS,
  getBuffer
}
