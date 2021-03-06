import {
  ASPECT_RATIOS,
  existFullscreen,
  findPosition,
  generateSessionId,
  getMimeType,
  injectStyle,
  isFullscreen,
  isQueryStringContains,
  getQueryStringValue,
  observeVisibility,
  requestFullscreen,
  visible,
  mergeObjects,
  supportsNativeHls,
  supportsNativeDash,
} from './utils';
import {
  BigPlayButton,
  FullscreenButton,
  Gradient,
  Header,
  NextButton,
  PlayButton,
  PrevButton,
  Spinner,
  Timeline,
  Timer,
  VolumeButton
} from './controls';
import * as browser from './browser';
import './css/styles.css';
import Ads from './ads';
import {IS_LIGHTHOUSE} from './browser';

const Player = function(el, options = {}, callback) {

  if(!(el instanceof Element || el instanceof HTMLDocument)) {
    throw new Error('player element is not defined');
  }

  // Player HTML element
  this._el = el;
  // Set paused
  this._el.classList.add('paused');

  this._slot = null;
  this._videoSlot = null;

  this._resizer = null;
  this._ads = null;

  // Play promise
  this._playPromise = null;

  // Gradient
  this._gradient = null;
  // Header
  this._header = null;
  // Spinner
  this._spinner = null;
  // Big Play
  this._bigPlayButton = null;

  // Control Bar
  this._controlBar = null;
  // Controls
  this._timeline = null;
  this._prevButton = null;
  this._playButton = null;
  this._nextButton = null;
  this._timer = null;
  this._fullscreenButton = null;

  // Attributes
  this._attributes = {
    variantName: '',
    sessionId: generateSessionId(),
    isReady: false,
    userActive: false,
    userActivity: false,
    aspectRatioPercentage: null,
    poster: null,
    src: null,
    duration: 0,
    remainingTime: 0,
    currentTime: 0,
    waitingTime: 0,
    muted: true,
    volume: 0,
    get hidden() {
      return document.hidden;
    },
    fullscreen : false,
    visibilityThreshold: 50, // 50%
    intersectionRatio: 1,
    get visible() {
      if(this.hidden) {
        return false;
      } else if(this.fullscreen) {
        return true;
      }
      return visible(this.intersectionRatio, this.visibilityThreshold);
    },
    prevVisible: true,
    inactivityTimeout: 2000,
    version: '!!#Version#!!'
  };

  // Options
  this._options = Object.assign({
    width: 'auto',
    height: 'auto',
    aspectRatio: '16:9', // '16:9', '9:16', '4:3', '1:1'
    title: null,
    url: null,
    poster: null,
    src: null,
    sources: null,
    autoplay: false, // false, true, 'muted', 'play', 'any'
    preload: 'metadata', // 'none', 'auto', 'metadata'
    loop: false,
    playbackRates: null,
    muted: true,
    volume: 1,
    controls: true,
    inactivityTimeout: 2000,
    stickyFloating: false,
    textTracks: null, // closed captions, subtitles
    ads: null, // ads
    timeRanges: null,
    abTest: null //  ab test
  }, options);

  // Check AB test
  if(this._options.abTest
    && this._options.abTest.enabled
    && this._options.abTest.hasOwnProperty('variants')) {

    let selectedVariant = null;

    const createVariantRanges = function(abTestOptions) {
      const ranges = [];
      let lastRange = 0;
      if(abTestOptions) {
        abTestOptions.variants.forEach((variant) => {
          lastRange += variant.percentage;
          ranges.push(lastRange);
        });
      }
      return { ranges, lastRange };
    }

    const randomSelectVariants = function(abTestOptions, ranges, lastRange) {
      let variant = null;
      const random = Math.round(Math.random() * lastRange);
      for(let i = 0; i < ranges.length; i++) {
        if(random <= ranges[i]) {
          variant = abTestOptions.variants[i];
          break;
        }
      }
      return variant;
    }

    const selectVariantByName = function(abTestOptions, variantName) {
      let variant = null;
      const abTestVariants = abTestOptions.variants;
      if(variantName) {
        variant = abTestVariants.find((currentVariant) => currentVariant.name == variantName)
      }
      return variant;
    }
    // Check for external variant name
    let externalVariantName = null;

    // Query String
    if(isQueryStringContains('ab_test_variant_name')) {
      externalVariantName = getQueryStringValue('ab_test_variant_name');
    }
    if(externalVariantName) {
      selectedVariant = selectVariantByName(this._options.abTest, externalVariantName);
    } else {
      const { ranges, lastRange } = createVariantRanges(this._options.abTest);
      selectedVariant = randomSelectVariants(this._options.abTest, ranges, lastRange);
    }

    if(selectedVariant) {
      this._attributes.variantName = selectedVariant.name;
      // Merge select variant options into the options
      this._options = mergeObjects(this._options, selectedVariant.options);
    }

  }

  // Set attributes
  // Muted
  this._attributes.muted = this._options.muted;
  this._attributes.volume = this._attributes.muted ? 0 : this._options.volume;
  if(!this._attributes.muted && this._attributes.volume == 0) {
    this._attributes.muted = true;
  }
  // Autoplay 'muted'
  if(this._options.autoplay === 'muted') {
    this._attributes.muted = true;
    this._attributes.volume = 0;
  }
  // Aspect ratio
  this._attributes.aspectRatioPercentage = ASPECT_RATIOS[this._options.aspectRatio];
  if(this._attributes.aspectRatioPercentage) {
    injectStyle(`adserve-tv-player-${this._attributes.sessionId}`,
      `.adserve-tv-player-${this._attributes.sessionId} .video-container {
        padding-bottom: ${this._attributes.aspectRatioPercentage}
      }`
    )
  }
  // Inactivity Timeout
  if(this._options.inactivityTimeout) {
    this._attributes.inactivityTimeout = this._options.inactivityTimeout;
  }

  // Time Ranges
  if(this._options.timeRanges
    && this._options.timeRanges.length != 0) {
    const ranges = this._options.timeRanges.filter(item => item.enabled);
    if(!ranges.length) return;

    const parseTime = (time) => {
      if(!time) return NaN;
      const tokens = time.split(':');
      //console.log(tokens);
      return (
        parseInt(tokens[0] || '0') * 3600 +
        parseInt(tokens[1] || '0') * 60 +
        parseInt(tokens[2] || '0')
      );
    }

    setInterval(() => {
      const date = new Date();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      //console.log(hours, minutes, seconds);
      const time = hours * 3600 + minutes * 60 + seconds;
      //console.log(time);

      const range = ranges.find((item) => {
        const from = parseTime(item.range[0]);
        const to = parseTime(item.range[1]);
        if(!isNaN(from) && !isNaN(to)) {
          if(from <= to) {
            return time >= from && time <= to;
          }
          return time <= to || time >= from;
        }
      });

      if(range) {
        console.log(range);
      }

    }, 1000);
  }

  this.EVENTS = {
    PlayerReady: 'PlayerReady',
    PlayerVisibilityChange: 'PlayerVisibilityChange',
    PlayerFullscreenChange: 'PlayerFullscreenChange',
    PlayerVolumeChange: 'PlayerVolumeChange',
    PlayerVideoPlaying: 'PlayerVideoPlaying',
    PlayerVideoPaused: 'PlayerVideoPaused',
    PlayerVideoComplete: 'PlayerVideoComplete',
    PlayerUserActive: 'PlayerUserActive',
    PlayerUserInactive: 'PlayerUserInactive',
    PlayerResize: 'PlayerResize',
    PlayerError: 'PlayerError'
  }

  this._callback = callback;
  this._eventCallbacks = {};

  // Observe visibility
  observeVisibility(this._el, (intersectionEntries) => {
    const { intersectionRatio } = intersectionEntries[intersectionEntries.length - 1];
    this._attributes.intersectionRatio = intersectionRatio;
    this.onVisibilityChange();
  });

  // Tab change, document hidden
  // TODO: 1 time
  document.addEventListener('visibilitychange', () => {
    this.onVisibilityChange();
  });

  // Create slot
  this.createSlot();

}
Player.prototype.createSlot = function() {
  this._slot = document.createElement('div');
  this._slot.classList.add('video-container');
  this._el.classList.add('adserve-tv-player');
  // Add classname with session id
  this._el.classList.add('adserve-tv-player-' + this._attributes.sessionId);
  this._el.appendChild(this._slot);
  // Width and Height
  if(this._options.width !== 'auto'
    || this._options.height !== 'auto') {
    this._el.style.width = (typeof this._options.width === 'number') ? this._options.width + 'px' : this._options.width;
    this._el.style.height = (typeof this._options.height === 'number') ? this._options.height + 'px' : this._options.height;
  }

  this.createVideoSlot();
}
Player.prototype.createVideoSlot = function() {
  this._videoSlot = document.createElement('video');
  this._videoSlot.setAttribute('webkit-playsinline', true);
  this._videoSlot.setAttribute('playsinline', true);
  // x-webkit-airplay="allow"
  this._videoSlot.setAttribute('preload', this._options.preload); // none, auto, metadata
  this._videoSlot.setAttribute('tabindex', -1);
  this._videoSlot.style.backgroundColor = 'rgb(0, 0, 0)'; // TODO: remove
  this._videoSlot.classList.add('video');

  if(this._attributes.muted) {
    this._videoSlot.muted = true;
  }
  // Append video slot
  this._slot.appendChild(this._videoSlot);

  // Fullscreen change
  // iOS
  if(browser.IS_IOS) {
    this._videoSlot.addEventListener('webkitbeginfullscreen', () => {
      this.onFullscreenChange();
    });
    this._videoSlot.addEventListener('webkitendfullscreen', () => {
      this.onFullscreenChange();
    });
  } else {
    document.addEventListener('fullscreenchange', () => {
      this.onFullscreenChange();
    });
    document.addEventListener('webkitfullscreenchange', () => {
      this.onFullscreenChange();
    });
    document.addEventListener('mozfullscreenchange', () => {
      this.onFullscreenChange();
    });
  }

  // Create resizer
  this._resizer = document.createElement('iframe');
  this._resizer.classList.add('resizer');
  this._resizer.setAttribute('allowtransparency', true);

  this._slot.appendChild(this._resizer);

  this._resizer.contentWindow.onresize = this.onResize.bind(this);

  // Create overlay
  this.createOverlay();
  // Set source
  this.setSrc(this._options.src);
  // Poster
  this.setPoster(this._options.poster);

  // User Active
  this.userActive(true);
  this.listenForUserActivity();

  // Sticky Floating
  if(this._options.stickyFloating) {
    const position = findPosition(this._el);
    const handleScroll = () => {
      if(window.scrollY > (position.top + position.height)) {
        this._el.classList.add('sticky');
      } else {
        this._el.classList.remove('sticky');
      }
    }
    window.addEventListener('scroll', handleScroll);
  }

  // TODO:
  window.setTimeout(() => {
    this._attributes.isReady = true;
    Players.push(this);
    // Player ready callback
    if(this._callback
      && typeof this._callback === 'function') {
      this._callback();
    }

    // Ads
    if(this._options.ads && this._options.ads.enabled && !IS_LIGHTHOUSE) {
      this.createAdContainer();
    } else {
      console.log('no ads');
    }

    this.onPlayerReady();
  }, 75);

}
Player.prototype.createAdContainer = function() {
  const adContainer = document.createElement('div');
  adContainer.classList.add('ad-container');
  this._slot.appendChild(adContainer);

  // Initialize ads
  this._ads = new Ads(this, adContainer, this._options.ads);

}
Player.prototype.userActive = function(isActive) {
  if(isActive === undefined) {
    return this._attributes.userActive;
  }

  isActive = !!isActive;

  if(isActive === this._attributes.userActive) {
    return;
  }

  this._attributes.userActive = isActive;

  if(this._attributes.userActive) {
    this._attributes.userActivity = true;
    this._el.classList.remove('user-inactive');
    this._el.classList.add('user-active');
    // Trigger onUserActive
    this.onUserActive();
    return;
  }

  // Chrome/Safari/IE have bugs where when you change the cursor it can
  // trigger a mousemove event. This causes an issue when you're hiding
  // the cursor when the user is inactive, and a mousemove signals user
  // activity. Making it impossible to go into inactive mode. Specifically
  // this happens in fullscreen when we really need to hide the cursor.
  this._el.addEventListener('mousemove', (event) => {
    event.stopPropagation();
    event.preventDefault();
  }, { once: true });

  this._attributes.userActivity = false;
  this._el.classList.remove('user-active');
  this._el.classList.add('user-inactive');

  // Trigger onUserInactive
  this.onUserInactive();
}
Player.prototype.reportUserActivity = function() {
  this._attributes.userActivity = true;
}
Player.prototype.listenForUserActivity = function() {
  let mouseInProgress;
  let lastMoveX;
  let lastMoveY;

  const handleActivity = this.reportUserActivity.bind(this);

  const handleMouseMove = (event) => {
    if(event.screenX !== lastMoveX || event.screenY !== lastMoveY) {
      lastMoveX = event.screenX;
      lastMoveY = event.screenY;
      handleActivity();
    }
  };

  const handleMouseDown = () => {
    handleActivity();
    // For as long as they are touching the device or have their mouse down,
    // we consider them active even if they're not moving their finger or mouse.
    // So we want to continue to update that they are active
    window.clearInterval(mouseInProgress);
    // Setting userActivity=true now and setting the interval to the same time
    // as the activityCheck interval (250) should ensure we never miss the
    // next activityCheck
    mouseInProgress = window.setInterval(handleActivity, 250);
  };

  const handleMouseUpAndMouseLeave = () => {
    handleActivity();
    // Stop the interval that maintains activity if the mouse/touch is down
    window.clearInterval(mouseInProgress);
  };

  // Any mouse movement will be considered user activity
  this._el.addEventListener('mousedown', handleMouseDown);
  this._el.addEventListener('mousemove', handleMouseMove);
  this._el.addEventListener('mouseup', handleMouseUpAndMouseLeave);
  this._el.addEventListener('mouseleave', handleMouseUpAndMouseLeave);

  // control bar would no longer be hidden by default timeout.
  if(this._controlBar && !browser.IS_IOS && !browser.IS_ANDROID) {
    this._controlBar.addEventListener('mouseenter', () => {
      this._options.inactivityTimeout = 0;
    });
    this._controlBar.addEventListener('mouseleave', () => {
      this._options.inactivityTimeout = this._attributes.inactivityTimeout;
    });
  }

  // Run an interval every 250 milliseconds instead of stuffing everything into
  // the mousemove/touchmove function itself, to prevent performance degradation.
  let inactivityTimeout;

  window.setInterval(() => {
    // Check to see if mouse/touch activity has happened
    if(!this._attributes.userActivity) {
      return;
    }

    // Reset the activity tracker
    this._attributes.userActivity = false;
    // If the user state was inactive, set the state to active
    this.userActive(true);
    // Clear any existing inactivity timeout to start the timer over
    window.clearTimeout(inactivityTimeout);

    const timeout = this._options.inactivityTimeout;

    if(timeout <= 0) {
      return;
    }

    // In <timeout> milliseconds, if no more activity has occurred the
    // user will be considered inactive
    inactivityTimeout = window.setTimeout(() => {
      // Protect against the case where the inactivityTimeout can trigger just
      // before the next user activity is picked up by the activity check loop
      // causing a flicker
      if(!this._attributes.userActivity) {
        this.userActive(false);
      }
    }, timeout);

  }, 250);

}
Player.prototype.createOverlay = function() {

  // Overlay
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  // Gradient
  this._gradient = new Gradient();
  overlay.appendChild(this._gradient.render());

  // Header
  this._header = new Header();
  overlay.appendChild(this._header.render());

  // Spinner
  this._spinner = new Spinner();
  overlay.appendChild(this._spinner.render());

  // Big Play
  this._bigPlayButton = new BigPlayButton();
  overlay.appendChild(this._bigPlayButton.render());

  if(this._options.controls) {

    // Control Bar
    this._controlBar = document.createElement('div');
    this._controlBar.classList.add('control-bar');

    // Timeline
    this._timeline = new Timeline();
    this._controlBar.appendChild(this._timeline.render());

    // Controls
    const controls = document.createElement('div');
    controls.classList.add('controls');

    // Prev Button
    this._prevButton = new PrevButton();
    controls.appendChild(this._prevButton.render());
    // TODO:
    this._prevButton.hide();

    // Play Button
    this._playButton = new PlayButton();
    controls.appendChild(this._playButton.render());

    // Next Button
    this._nextButton = new NextButton();
    controls.appendChild(this._nextButton.render());
    // TODO:
    this._nextButton.hide();

    // Volume Button
    this._volumeButton = new VolumeButton();
    if (this._attributes.muted) {
      this._volumeButton.setState(true);
    } else {
      console.log('is muted', this._attributes.muted, 'volume', this._attributes.volume)
    }

    controls.appendChild(this._volumeButton.render());

    // Timer
    this._timer = new Timer();
    controls.appendChild(this._timer.render());

    // Fullscreen Button
    this._fullscreenButton = new FullscreenButton();
    controls.appendChild(this._fullscreenButton.render());

    // Append controls to control bar
    this._controlBar.appendChild(controls);
    // Append control bar to overlay
    overlay.appendChild(this._controlBar);

  }

  this._el.appendChild(overlay);
}
Player.prototype.onResize = function() {
  this._ads && this._ads.resizeAd(this._videoSlot.clientWidth, this._videoSlot.clientHeight);
  this.onPlayerResize();
}
Player.prototype.onPlayerResize = function() {
  if(this.EVENTS.PlayerResize in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerResize] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerResize]();
    }
  }
}
Player.prototype.onUserActive = function() {
  this.onPlayerUserActive();
}
Player.prototype.onPlayerUserActive = function() {
  if(this.EVENTS.PlayerUserActive in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerUserActive] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerUserActive]();
    }
  }
}
Player.prototype.onUserInactive = function() {
  this.onPlayerUserInactive();
}
Player.prototype.onPlayerUserInactive = function() {
  if(this.EVENTS.PlayerUserInactive in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerUserInactive] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerUserInactive]();
    }
  }
}
Player.prototype.onFullscreenChange = function() {
  this._attributes.fullscreen = isFullscreen(document, this._videoSlot);
  this._fullscreenButton && this._fullscreenButton.setState(this._attributes.fullscreen);
  this.onPlayerFullscreenChange(this._attributes.fullscreen);
}
Player.prototype.onPlayerFullscreenChange = function(fullscreen) {
  if(this.EVENTS.PlayerFullscreenChange in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerFullscreenChange] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerFullscreenChange](fullscreen);
    }
  }
}
Player.prototype.onVisibilityChange = function() {
  const value = this._attributes.visible;
  const isVisibleChanged = this._attributes.prevVisible !== value;
  if(isVisibleChanged) {
    this._attributes.prevVisible = value;
    this.onPlayerVisibilityChange(value);
  }
}
Player.prototype.onPlayerReady = function() {
  if(this.EVENTS.PlayerReady in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerReady] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerReady]();
    }
  }
}
Player.prototype.onPlayerVisibilityChange = function(visibility) {
  if(this.EVENTS.PlayerVisibilityChange in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerVisibilityChange] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerVisibilityChange](visibility);
    }
  }
}
Player.prototype.onPlayerVolumeChange = function() {
  if(this.EVENTS.PlayerVolumeChange in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerVolumeChange] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerVolumeChange]();
    }
  }
}
Player.prototype.onPlayerVideoPlaying = function() {
  if(this.EVENTS.PlayerVideoPlaying in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerVideoPlaying] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerVideoPlaying]();
    }
  }
}
Player.prototype.onPlayerVideoPaused = function() {
  if(this.EVENTS.PlayerVideoPaused in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerVideoPaused] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerVideoPaused]();
    }
  }
}
Player.prototype.onContentComplete = function() {
  this._el.classList.add('ended');
  if(this._options.loop) {
    this.setCurrentTime(0);
    this.play();
  }
  this.onPlayerVideoComplete();
}
Player.prototype.onPlayerVideoComplete = function() {
  if(this.EVENTS.PlayerVideoComplete in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerVideoComplete] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerVideoComplete]();
    }
  }
}
Player.prototype.onPlayerError = function(message) {
  if(this.EVENTS.PlayerError in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerError] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerError](message);
    }
  }
}
Player.prototype.addEventListener = function(eventName, callback, context) {
  const giveCallback = callback.bind(context);
  this._eventCallbacks[eventName] = giveCallback;
}
Player.prototype.removeEventListener = function(eventName) {
  if(eventName in this._eventCallbacks) {
    this._eventCallbacks[eventName] = null;
  }
}
Player.prototype.setSrc = function(source) {

  if(!source) {
    return;
  }

  // Try to play source from options
  if(source && typeof source === 'string') {
    console.log('source exists', source);
    // Set source, detect mime type by file extension
    this._attributes.src = source;
  }

  if(this._attributes.src) {
    this._attributes.mimeType = getMimeType(this._attributes.src);

    console.log('play > source mime type is', this._attributes.mimeType);

    // Check if HLS
    if(this._attributes.mimeType === 'application/x-mpegurl'
      && !supportsNativeHls()) {
      console.log('source is HLS, this browser does not support it, requires HLS plugin');

      return;
    }
    // Check for MPEG-DASH
    if(this._attributes.mimeType === 'application/dash+xml'
      && !supportsNativeDash()) {
      console.log('source is MPEG-DASH, this browser does not support it, requires MPEG-DASH plugin');

      return;
    }

    // Attach events
    this._videoSlot.addEventListener('loadstart', () => {
      // Autoplay 'muted'
      if(this._options.autoplay === 'muted') {
        this.play();
      }
      // Autoplay 'play' or 'any'
      if(this._options.autoplay === 'play'
        || this._options.autoplay === 'any') {
        this.play();
      }
    });

    this._videoSlot.addEventListener('waiting', () => {
      this._el.classList.add('waiting');
      this._attributes.waitingTime = this.getCurrentTime();
      const timeUpdateListener = () => {
        if(this._attributes.waitingTime !== this.getCurrentTime()) {
          this._el.classList.remove('waiting');
          this._videoSlot.removeEventListener('timeupdate', timeUpdateListener);
        }
      }
      this._videoSlot.addEventListener('timeupdate', timeUpdateListener);
    });

    this._videoSlot.addEventListener('canplay', () => {
      this._el.classList.remove('waiting');
    });

    this._videoSlot.addEventListener('canplaythrough', () => {
      this._el.classList.remove('waiting');
    });

    this._videoSlot.addEventListener('play', () => {
      this._el.classList.remove('ended');
      this._el.classList.remove('paused');
      // Update play button
      this._playButton && this._playButton.setState(true);
      this.onPlayerVideoPlaying();
    });

    this._videoSlot.addEventListener('pause', () => {
      this._el.classList.remove('ended');
      this._el.classList.add('paused');
      // Update play button
      this._playButton && this._playButton.setState(false);
      this.onPlayerVideoPaused();
    });

    this._videoSlot.addEventListener('volumechange', () => {
      this._volumeButton && this._volumeButton.setState(!this.getVolume());
      this.onPlayerVolumeChange();
    });

    this._videoSlot.addEventListener('progress', (event) => {
      let range = 0;
      const bf = event.target.buffered;
      const time = event.target.currentTime;
      try {
        while (!(bf.start(range) <= time && time <= bf.end(range))) {
          range += 1;
        }
        const loadStartPercentage = bf.start(range) / event.target.duration;
        const loadEndPercentage = bf.end(range) / event.target.duration;
        const loadPercentage = loadEndPercentage - loadStartPercentage;
        // Update timeline buffer
        this._timeline && this._timeline.updateBuffer(loadPercentage);
      } catch (e) {}
    });

    this._videoSlot.addEventListener('timeupdate', (event) => {
      const percentPlayed = event.target.currentTime * 100.0 / event.target.duration;
      this._attributes.currentTime = event.target.currentTime;
      this._attributes.remainingTime = event.target.duration - event.target.currentTime;

      // Update timeline
      if(this._timeline) {
        this._timeline.updateProgress(event.target.currentTime > 0 && event.target.duration > 0 ? event.target.currentTime / event.target.duration : 0);
        this._timeline.updateTimeTooltip(event.target.currentTime);
      }
      // Update timer
      this._timer && this._timer.updateTimeElapsed(event.target.currentTime);

    });

    this._videoSlot.addEventListener('loadeddata', (event) => {
      // TODO:
    });

    this._videoSlot.addEventListener('loadedmetadata', (event) => {
      if(event.target.duration === Infinity) {
        return;
      }
      this._attributes.duration = event.target.duration;
      // Update timeline
      this._timeline && this._timeline.setDuration(event.target.duration);
      // Update timer
      this._timer && this._timer.setDuration(event.target.duration);
    });

    this._videoSlot.addEventListener('durationchange', (event) => {
      if(event.target.duration === Infinity) {
        return;
      }
      this._attributes.duration = event.target.duration;
      // Update timeline
      this._timeline && this._timeline.setDuration(event.target.duration);
      // Update timer
      this._timer && this._timer.setDuration(event.target.duration);
    });

    this._videoSlot.addEventListener('ended', () => {
      this._playButton && this._playButton.setState(false);
      this.onContentComplete();
    });

    this._videoSlot.addEventListener('error', (event) => {
      console.log('error - remove waiting');
      console.log('error', event.target);
      this._el.classList.remove('waiting');
      this.pause();
      this.onPlayerError('The media could not be loaded, either because the server or network failed or because the format is not supported.');
    });


    // Set source
    this._videoSlot.setAttribute('src', this._attributes.src);

    // Autoplay
    if(this._options.autoplay === true) {
      this._videoSlot.setAttribute('autoplay', true);
    }

    // Set title
    if(this._options.title) {
      this._header && this._header.setTitle(this._options.title, this._options.url);
    }

    // Play button
    if(this._playButton) {
      this._playButton.onclick = () => {
        if(!this.paused()) {
          this.pause();
        } else {
          this.play();
        }
      }
    }

    // Timeline
    if(this._timeline) {
      // Seek
      let videoWasPlaying = false;
      this._timeline.onmousedown = () => {
        // Slider active
        this._el.classList.add('slider-active');
        videoWasPlaying = !this.paused();
        this.pause();
      }
      this._timeline.onmousemove = (newTime) => {
        this.setCurrentTime(newTime);
      }
      this._timeline.onmouseup = () => {
        // Slider inactive
        this._el.classList.remove('slider-active');
        if(videoWasPlaying && !this._videoSlot.ended) {
          this.play();
        }
      }
    }

    // Volume button
    if(this._volumeButton) {
      this._volumeButton.onclick = () => {
        if(!this.getVolume()) {
          this.setVolume(1)
        } else {
          this.setVolume(0)
        }
      }
    }

    // Fullscreen button
    if(this._fullscreenButton) {
      this._fullscreenButton.onclick = () => {
        if(this.fullscreen()) {
          this.exitFullscreen()
        } else {
          this.requestFullscreen()
        }
      }
    }

  }

  // TODO:
  // String, source Object, Array of Source Objects
  console.log('set > source', source);
}
Player.prototype.getCurrentSrc = function() {
  return this._attributes.src;
}
Player.prototype.setPoster = function(poster) {
  if(!poster) {
    return
  }
  this._attributes.poster = poster
  this._videoSlot.poster = this._attributes.poster;
}
Player.prototype.getPoster = function() {
  return this._attributes.poster;
}
Player.prototype.play = function(source) {

  if(source) {
    // Try to play source from given source
    this.setSrc(source);
  }

  if(this._videoSlot && this._attributes.src) {
    if(this._videoSlot.paused) {
      if(this._attributes.muted) {
        this._videoSlot.muted = true;
        this._videoSlot.volume = 0;
        // Set attributes
        this._attributes.muted = true;
        this._attributes.volume = 0;
      }
      // Play
      const maxPlayRetries = 3;
      let playRetries = 0;
      this._playPromise = this._videoSlot.play();
      if(this._playPromise instanceof Promise) {
        this._playPromise.then(() => {

        }).catch((error) => {
          // Play failed
          console.log('play failed', error);
          if(playRetries <= maxPlayRetries) {
            if (this._options.autoplay === 'any') {
              this._attributes.muted = true;
              this._attributes.volume = 0;
              this.play();
            }
            playRetries++;
          }
        });
      }
    }

  } else {
    // Error
    console.log('source not exists');
  }

}
Player.prototype.paused = function() {
  return this._videoSlot ? this._videoSlot.paused : false;
}
Player.prototype.pause = function() {
  if(this._videoSlot && !this._videoSlot.paused) {
    this._videoSlot.pause();
  }
}
Player.prototype.ended = function() {
  return this._videoSlot ? this._videoSlot.ended : false;
}
Player.prototype.getVolume = function() {
  return this._videoSlot ? (this._videoSlot.muted ? 0 : this._videoSlot.volume) : this._attributes.volume;
}
Player.prototype.setVolume = function(value) {
  if(this._videoSlot) {
    if (value) {
      this._videoSlot.muted = false;
      // Set attributes
      this._attributes.muted = false;
    } else {
      this._videoSlot.muted = true;
      // Set attributes
      this._attributes.muted = true;
    }
    const isVolumeChanged = value !== this._videoSlot.volume;
    if (isVolumeChanged) {
      this._videoSlot.volume = value;
      this._attributes.volume = value;
    }
  }
}
Player.prototype.readyState = function() {
  return null;
}
Player.prototype.getDuration = function() {
  return this._videoSlot && this._attributes.src ? this._attributes.duration : -1;
}
Player.prototype.getCurrentTime = function() {
  return this._videoSlot && this._attributes.src ? this._attributes.currentTime : -1;
}
Player.prototype.setCurrentTime = function(seconds) {
  if (typeof seconds !== 'undefined') {
    if (seconds < 0) {
      seconds = 0;
    }
    if (this._videoSlot && this._attributes.src) {
      if(seconds != this._attributes.duration) {
        this._el.classList.remove('ended');
      }
      this._videoSlot.currentTime = seconds;
    }
  }
}
Player.prototype.getRemainingTime = function() {
  return this._videoSlot && this._attributes.src ? this._attributes.remainingTime : -1;
}
Player.prototype.visible = function() {
  return this._attributes.visible;
}
Player.prototype.hidden = function() {
  return this._attributes.hidden;
}
Player.prototype.fullscreen = function() {
  return this._videoSlot && isFullscreen(document, this._videoSlot);
}
Player.prototype.requestFullscreen = function() {
  if(this._videoSlot && this._attributes.src && !isFullscreen(document, this._videoSlot)) {
    requestFullscreen(this._el, this._videoSlot);
  }
}
Player.prototype.exitFullscreen = function() {
  if(this._videoSlot && this._attributes.src && isFullscreen(document, this._videoSlot)) {
    existFullscreen(document, this._videoSlot);
  }
}
Player.prototype.getWidth = function() {
  return this._el.clientWidth;
}
Player.prototype.getHeight = function() {
  return this._el.clientHeight;
}
Player.prototype.getVariantName = function() {
  return this._attributes.variantName;
}
Player.prototype.destroy = function() {
  // TODO: destroy
}
Player.prototype.getSessionId = function() {
  return this._attributes.sessionId;
}
Player.prototype.getVersion = function() {
  return this._attributes.version;
}

let Players = [{}];
(function() {
  Players = window.adserve && window.adserve.tv ? window.adserve.tv.Players : []
})();

export { Player, Players }
