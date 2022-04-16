import { AdsManager } from 'ads-manager';
import {
  existFullscreen,
  getMimeType,
  isFullscreen,
  observeVisibility,
  requestFullscreen,
  supportsHLS,
  visible
} from './utils';
import {
  BigPlayButton,
  FullscreenButton, Gradient, Header,
  NextButton,
  PlayButton,
  PrevButton,
  Timeline,
  Timer,
  VolumeButton
} from './controls';

const Player = function(el, options = {}, callback) {
  console.log('player', el, options);

  if(!(el instanceof Element || el instanceof HTMLDocument)) {
    throw new Error('player element is not defined');
  }

  // Player HTML element
  this._el = el;
  // Set paused
  this._el.classList.add('paused');

  this._slot = null;
  this._videoSlot = null;

  // Header
  this._header = null;
  // Gradient
  this._gradient = null;

  // Controls
  this._timeline = null;
  this._prevButton = null;
  this._playButton = null;
  this._nextButton = null;
  this._timer = null;
  this._fullscreenButton = null;
  this._bigPlayButton = null;

  this._attributes = {
    isReady: false, // TODO: change to true when ready
    poster: null,
    src: null,
    autoplay: true,
    preload: false,
    duration: 0,
    remainingTime: 0,
    currentTime: 0,
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
    version: '!!#Version#!!'
  };
  // Options
  this._options = {
    width: 'auto',
    height: 'auto',
    title: null,
    url: null,
    poster: null,
    src: null,
    autoplay: true,
    loop: false,
    muted: true,
    volume: 1,
    controls: true,
    ads: {}
  };

  // Assign options
  Object.assign(this._options, options);

  // Set attributed
  // Muted
  this._attributes.muted = this._options.muted;
  this._attributes.volume = this._attributes.muted ? 0 : this._options.volume;
  if(!this._attributes.muted && this._attributes.volume == 0) {
    this._attributes.muted = true;
  }

  this.EVENTS = {
    PlayerReady: 'PlayerReady',
    PlayerVisibilityChange: 'PlayerVisibilityChange',
    PlayerFullscreenChange: 'PlayerFullscreenChange',
    PlayerVolumeChange: 'PlayerVolumeChange',
    PlayerVideoPlaying: 'PlayerVideoPlaying',
    PlayerVideoPaused: 'PlayerVideoPaused',
    PlayerVideoComplete: 'PlayerVideoComplete'
  }

  this._callback = callback;
  this._eventCallbacks = {};

  // Observe visibility
  observeVisibility(this._el, (intersectionEntries) => {
    const { intersectionRatio } = intersectionEntries[intersectionEntries.length - 1];
    this._attributes.intersectionRatio = intersectionRatio;
    this.onVisibilityChange();
  });

  // Hover
  this._el.addEventListener('mouseover', (event) => {
    this._el.classList.add('hovered');
  }, false);
  this._el.addEventListener('mouseout', (event) => {
    this._el.classList.remove('hovered');
  }, false);

  // Fullscreen change
  document.addEventListener('fullscreenchange', () => {
    this.onFullscreenChange();
  });
  // Webkit Fullscreen change
  document.addEventListener('webkitfullscreenchange', () => {
    this.onFullscreenChange();
  });

  // Tab change, document hidden
  // TODO: 1 time
  document.addEventListener('visibilitychange', () => {
    this.onVisibilityChange();
  });

  // Create slot
  this.createSlot();

  // TODO: ads
  if(options.hasOwnProperty('adContainer')) {
    const adsManager = new AdsManager(options.adContainer);
    console.log(adsManager);
  }

}
Player.prototype.createSlot = function() {
  this._slot = document.createElement('div');
  this._slot.classList.add('video-container');
  this._el.classList.add('adserve-tv-player');
  this._el.appendChild(this._slot);
  this.createVideoSlot();
}
Player.prototype.createVideoSlot = function() {
  this._videoSlot = document.createElement('video');
  this._videoSlot.setAttribute('webkit-playsinline', true);
  this._videoSlot.setAttribute('playsinline', true);
  // x-webkit-airplay="allow"
  //this._videoSlot.setAttribute('preload', 'auto');
  this._videoSlot.setAttribute('tabindex', -1);
  this._videoSlot.style.backgroundColor = 'rgb(0, 0, 0)'; // TODO: remove
  this._videoSlot.classList.add('video');

  if(this._attributes.muted) {
    this._videoSlot.muted = true;
  }

  this._slot.appendChild(this._videoSlot);

  console.log(this._attributes.visible);

  // Create controls
  if(this._options.controls) {
    this.createControls(); // TODO:
  }


  // Set source
  this.setSrc(this._options.src);
  // Poster
  this.setPoster(this._options.poster);

  // TODO:
  setTimeout(() => {
    this._attributes.isReady = true;
    Players.push(this);
    // Player ready callback
    if(this._callback
      && typeof this._callback === 'function') {
      this._callback();
    }
    this.onPlayerReady();
  }, 75);

}
Player.prototype.createControls = function() {
  console.log('create controls');

  // Overlay
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  // Header
  this._header = new Header();
  overlay.appendChild(this._header.render());

  // Gradient
  this._gradient = new Gradient();
  overlay.appendChild(this._gradient.render());

  // Timeline
  this._timeline = new Timeline();
  overlay.appendChild(this._timeline.render());

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
  if(this._attributes.muted) {
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

  // Append controls to overlay
  overlay.appendChild(controls);

  // Big Play
  this._bigPlayButton = new BigPlayButton();
  overlay.appendChild(this._bigPlayButton.render());


  this._el.appendChild(overlay);
}
Player.prototype.onFullscreenChange = function() {
  this._attributes.fullscreen = isFullscreen(document);
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
Player.prototype.onPlayerVisibilityChange = function(visiblity) {
  if(this.EVENTS.PlayerVisibilityChange in this._eventCallbacks) {
    if(typeof this._eventCallbacks[this.EVENTS.PlayerVisibilityChange] === 'function') {
      this._eventCallbacks[this.EVENTS.PlayerVisibilityChange](visiblity);
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
Player.prototype.addEventListener = function(eventName, callback, context) {
  console.log('add event listener', eventName);
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
    this._attributes.supportsHLS = supportsHLS();

    console.log('play > source mime type is', this._attributes.mimeType);

    // Check if HLS
    if(this._attributes.mimeType === 'application/x-mpegurl'
      && !this._attributes.supportsHLS) {
      console.log('source is HLS, this browser does not support it, requires HLS plugin');
      return;
    }
    // Check for MPEG-DASH
    if(this._attributes.mimeType === 'application/dash+xml') {
      console.log('source is MPEG-DASH, this browser does not support it, requires MPEG-DASH plugin');
      return;
    }

    // Attach events
    this._videoSlot.addEventListener('play', (event) => {
      this._el.classList.remove('ended');
      this._el.classList.remove('paused');
      // Update play button
      this._playButton && this._playButton.setState(true);
      this.onPlayerVideoPlaying();
    }, false);

    this._videoSlot.addEventListener('pause', (event) => {
      this._el.classList.remove('ended');
      this._el.classList.add('paused');
      // Update play button
      this._playButton && this._playButton.setState(false);
      this.onPlayerVideoPaused();
    }, false);

    this._videoSlot.addEventListener('volumechange', (event) => {
      console.log('event > volume change', this.getVolume());
      this._volumeButton && this._volumeButton.setState(!this.getVolume());
      this.onPlayerVolumeChange();
    }, false);

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

        //console.log('loading...', loadPercentage);
        this._timeline && this._timeline.updateBuffer(loadPercentage);
      } catch (e) {}
    }, false);

    this._videoSlot.addEventListener('timeupdate', (event) => {
      const percentPlayed = event.target.currentTime * 100.0 / event.target.duration;
      this._attributes.currentTime = event.target.currentTime;
      this._attributes.remainingTime = event.target.duration - event.target.currentTime;

      // Update timeline
      this._timeline && this._timeline.updateProgress(event.target.currentTime > 0 && event.target.duration > 0 ? event.target.currentTime / event.target.duration : 0);
      // Update timer
      this._timer && this._timer.updateTimeElapsed(event.target.currentTime);

    }, false);

    this._videoSlot.addEventListener('loadedmetadata', (event) => {
      this._attributes.duration = event.target.duration;
      // Update timer
      this._timer && this._timer.setDuration(event.target.duration);

    }, false);

    this._videoSlot.addEventListener('ended', (event) => {
      console.log('ended', event.target);
      this._playButton && this._playButton.setState(false);
      this.onContentComplete();
    });

    // Set source
    this._videoSlot.setAttribute('src', this._attributes.src);
    if(this._options.title) {
      this._header && this._header.setTitle(this._options.title, this._options.url);
    }

    // Play button
    this._playButton && this._playButton.onClick(() => {
      if(!this._videoSlot.paused) {
        this._videoSlot.pause();
      } else {
        if(this._attributes.muted) {
          this._videoSlot.muted = true;
          this._videoSlot.volume = 0;
          // Set attributes
          this._attributes.muted = true;
          this._attributes.volume = 0;
        }
        this._videoSlot.play();
      }
    });

    // Volume button
    this._volumeButton && this._volumeButton.onClick(() => {
      console.log('volume button click', this.getVolume());
      if(!this.getVolume()) {
        this.setVolume(1)
      } else {
        this.setVolume(0)
      }
    });

    // Fullscreen button
    this._fullscreenButton && this._fullscreenButton.onClick(() => {
      if(isFullscreen(document)) {
        existFullscreen(document);
      } else {
        requestFullscreen(this._el);
      }
    });

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
Player.prototype.load = function() {

}
Player.prototype.play = function(source) {

  if(source) {
    // Try to play source from given source
    this.setSrc(source);
  }

  console.log('play > visible', this._attributes.visible, source);

  if(this._attributes.src) {

    console.log('play > source exists > try to play', this._attributes.mimeType, this._attributes.src, this._videoSlot.paused)
    if(this._videoSlot.paused) {
      if(this._attributes.muted) {
        this._videoSlot.muted = true;
        this._videoSlot.volume = 0;
        // Set attributes
        this._attributes.muted = true;
        this._attributes.volume = 0;
      }
      this._videoSlot.play();
    }

  } else {
    // Error
    console.log('source not exists');
  }

}
Player.prototype.paused = function() {
  return this._videoSlot && this._videoSlot.paused;
}
Player.prototype.pause = function() {
  if(this._videoSlot && !this._videoSlot.paused) {
    this._videoSlot.pause();
  }
}
Player.prototype.getVolume = function() {
  return this._videoSlot.muted ? 0 : this._videoSlot.volume;
}
Player.prototype.setVolume = function(value) {
  // TODO: muted
  console.log('set volume >', value, this._videoSlot.volume);
  if(value) {
    this._videoSlot.muted = false;
    // Set attributes
    this._attributes.muted = false;
  } else {
    this._videoSlot.muted = true;
    // Set attributes
    this._attributes.muted = true;
  }
  const isVolumeChanged = value !== this._videoSlot.volume;
  if(isVolumeChanged) {
    console.log('set volume > volume changed');
    this._videoSlot.volume = value;
    this._attributes.volume = value;
  }
}
Player.prototype.readyState = function() {
  return null;
}
Player.prototype.getDuration = function() {
  return this._attributes.duration;
}
Player.prototype.getCurrentTime = function() {
  return this._attributes.currentTime;
}
Player.prototype.setCurrentTime = function(seconds) {
  if (typeof seconds !== 'undefined') {
    if (seconds < 0) {
      seconds = 0;
    }
    if (this._attributes.src) {
      this._videoSlot.currentTime = seconds;
    }
  }
}
Player.prototype.getRemainingTime = function() {
  return this._attributes.remainingTime;
}
Player.prototype.visible = function() {
  return this._attributes.visible;
}
Player.prototype.hidden = function() {
  return this._attributes.hidden;
}
Player.prototype.fullscreen = function() {
  return this._attributes.fullscreen;
}
Player.prototype.requestFullscreen = function() {
  if(this._attributes.src && !isFullscreen(document)) {
    requestFullscreen(this._el);
  }
}
Player.prototype.exitFullscreen = function() {
  if(this._attributes.src && isFullscreen(document)) {
    existFullscreen(document);
  }
}
Player.prototype.getWidth = function() {
  return this._videoSlot.clientWidth;
}
Player.prototype.getHeight = function() {
  return this._videoSlot.clientHeight;
}
Player.prototype.destroy = function() {
  // TODO: destroy
}
Player.prototype.getVersion = function() {
  return this._attributes.version;
}

let Players = [{}];
(function() {
  Players = window.adserve && window.adserve.tv ? window.adserve.tv.Players : []
})();

export { Player, Players }
