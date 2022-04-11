import { AdsManager } from 'ads-manager';
import {getMimeType, observeVisibility, supportsHLS, visible} from './utils';
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
    loop: false,
    muted: true,
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
    volume: 0,
    controls: true,
    ads: {}
  };

  // Assign options
  Object.assign(this._options, options);

  this.EVENTS = {
    PlayerReady: 'PlayerReady',
    PlayerVisibilityChange: 'PlayerVisibilityChange'
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

    // TODO: _videoSlot
    // Attach events
    this._videoSlot.addEventListener('play', (event) => {
      // Update play button
      this._playButton && this._playButton.setState(true);
    }, false);

    this._videoSlot.addEventListener('pause', (event) => {
      // Update play button
      this._playButton && this._playButton.setState(false);
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
        this._timeline.updateBuffer(loadPercentage);
      } catch (e) {}
    }, false);

    this._videoSlot.addEventListener('timeupdate', (event) => {
      const duration = event.target.duration;
      const currentTime = event.target.currentTime;
      const percentPlayed = currentTime * 100.0 / duration;
      const remainingTime = duration - currentTime;

      // Update timeline
      if(this._timeline) {
        this._timeline.updateProgress(currentTime > 0 && duration > 0 ? currentTime / duration : 0);
        //console.log('buffer', getBuffer(currentTime) > 0 && duration > 0 ? getBuffer(currentTime) / duration : 0);
      }

      // Update timer
      this._timer && this._timer.updateTimeElapsed(event.target.currentTime);

    }, false);

    this._videoSlot.addEventListener('loadedmetadata', (event) => {
      const duration = event.target.duration;
      // Update timer
      this._timer && this._timer.setDuration(duration);

    }, false);

    this._videoSlot.addEventListener('ended', (event) => {
      console.log('ended');
      this._playButton.setState(false);
    }, false);


    // Set source
    this._videoSlot.setAttribute('src', this._attributes.src);
    if(this._options.title) {
      this._header && this._header.setTitle(this._options.title, this._options.url);
    }

    // Play button
    this._playButton && this._playButton.onClick(hasPlay => {
      if(hasPlay) {
        this._videoSlot.pause();
      } else {
        if(this._options.muted) {
          this._videoSlot.muted = this._options.muted;
        }
        this._videoSlot.play();
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

    console.log('play > source exists > try to play', this._attributes.mimeType, this._attributes.src)
    this._videoSlot.muted = true;
    //this._videoSlot.load();
    // Play
    this._videoSlot.play();

  } else {
    // Error
    console.log('source not exists');
  }

}
Player.prototype.paused = function() {
  return this._videoSlot && this._videoSlot.paused;
}
Player.prototype.pause = function() {
  console.log('PL > pause');
}
Player.prototype.getVolume = function() {

}
Player.prototype.setVolume = function(value) {

}
Player.prototype.readyState = function() {
  return null;
}
Player.prototype.currentTime = function() {
  return -1
}
Player.prototype.getDuration = function() {
  return -1
}
Player.prototype.getRemainingTime = function() {
  return -1;
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
  // TODO:
}
Player.prototype.getWidth = function() {

}
Player.prototype.getHeight = function() {

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
