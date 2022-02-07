import { AdsManager } from 'ads-manager';
import {getMimeType, observeVisibility, supportsHLS, visible} from './utils';

const Player = function(el, options = {}, callback) {
  console.log('player', el, options);

  if(!(el instanceof Element || el instanceof HTMLDocument)) {
    throw new Error('player element is not defined');
  }

  // Player HTML element
  this._el = el;

  this._slot = null;
  this._videoSlot = null;

  this._attributes = {
    isReady: false, // TODO: change to true when ready
    src: null,
    poster: null,
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
    src: null,
    poster: null,
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

  // Tab change, document hidden
  // TODO: 1 time
  document.addEventListener('visibilitychange', () => {
    this.onVisibilityChange();
  });

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
  //this._videoSlot.setAttribute('preload', 'auto');
  this._videoSlot.setAttribute('tabindex', -1);
  this._videoSlot.style.backgroundColor = 'rgb(0, 0, 0)'; // TODO: remove
  this._videoSlot.classList.add('video');
  this._slot.appendChild(this._videoSlot);

  console.log(this._attributes.visible);


  // Set source
  // Poster


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

  // String, source Object, Array of Source Objects
  console.log('set > source', source);
}
Player.prototype.getCurrentSrc = function() {
  return this._attributes.src;
}
Player.prototype.load = function() {

}
Player.prototype.play = function(source) {

  if(source) {
    // TODO: play source
    console.log('play > source', source);

  } else {
    // Try to play source from options
    if(this._options.src
      && typeof this._options.src === 'string') {
      console.log('source exists', this._options.src);
      // Set source, detect mime type by file extension
      this._attributes.src = this._options.src;
    }
  }

  console.log('play > visible', this._attributes.visible, source);

  if(this._attributes.src) {

    this._attributes.mimeType = getMimeType(this._attributes.src);
    this._attributes.supportsHLS = supportsHLS();

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

    // Set source
    this._videoSlot.setAttribute('src', this._attributes.src);

    this._videoSlot.muted = true;
    this._videoSlot.load()
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
