const USER_AGENT = window.navigator && window.navigator.userAgent || '';
const webkitVersionMap = (/AppleWebKit\/([\d.]+)/i).exec(USER_AGENT);
const appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;

export const IS_IPOD = (/iPod/i).test(USER_AGENT);

export const IOS_VERSION = (function() {
  const match = USER_AGENT.match(/OS (\d+)_/i);

  if (match && match[1]) {
    return match[1];
  }
  return null;
}());

export const IS_ANDROID = (/Android/i).test(USER_AGENT);

export const ANDROID_VERSION = (function() {
  // This matches Android Major.Minor.Patch versions
  // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
  const match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);

  if (!match) {
    return null;
  }

  const major = match[1] && parseFloat(match[1]);
  const minor = match[2] && parseFloat(match[2]);

  if (major && minor) {
    return parseFloat(match[1] + '.' + match[2]);
  } else if (major) {
    return major;
  }
  return null;
}());

export const IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;

export const IS_FIREFOX = (/Firefox/i).test(USER_AGENT);

export const IS_EDGE = (/Edg/i).test(USER_AGENT);

export const IS_CHROME = !IS_EDGE && ((/Chrome/i).test(USER_AGENT) || (/CriOS/i).test(USER_AGENT));

export const CHROME_VERSION = (function() {
  const match = USER_AGENT.match(/(Chrome|CriOS)\/(\d+)/);

  if (match && match[2]) {
    return parseFloat(match[2]);
  }
  return null;
}());

export const IE_VERSION = (function() {
  const result = (/MSIE\s(\d+)\.\d/).exec(USER_AGENT);
  let version = result && parseFloat(result[1]);

  if (!version && (/Trident\/7.0/i).test(USER_AGENT) && (/rv:11.0/).test(USER_AGENT)) {
    // IE 11 has a different user agent string than other IE versions
    version = 11.0;
  }

  return version;
}());

export const IS_SAFARI = (/Safari/i).test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;

export const IS_WINDOWS = (/Windows/i).test(USER_AGENT);

export const TOUCH_ENABLED = Boolean((
  'ontouchstart' in window ||
  window.navigator.maxTouchPoints ||
  window.DocumentTouch && window.document instanceof window.DocumentTouch));

export const IS_IPAD = (/iPad/i).test(USER_AGENT) ||
  (IS_SAFARI && TOUCH_ENABLED && !(/iPhone/i).test(USER_AGENT));

export const IS_IPHONE = (/iPhone/i).test(USER_AGENT) && !IS_IPAD;

export const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

export const IS_ANY_SAFARI = (IS_SAFARI || IS_IOS) && !IS_CHROME;
