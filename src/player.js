import { AdsManager } from 'ads-manager';
import {observeVisibility, visible} from './utils';

const Player = function(element, options = {}) {
  console.log('player', element, options);

  if(!(element instanceof Element || element instanceof HTMLDocument)) {
    throw new Error('player element is not defined');
  }

  // Player HTML element
  this._element = element;

  this._attributes = {
    autoplay : true,
    muted : true,
    hidden: false,
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
    }
  };

  this._eventCallbacks = {};

  // Observe visibility
  observeVisibility(this._element, (intersectionEntries) => {
    const { intersectionRatio } = intersectionEntries[intersectionEntries.length - 1];
    console.log('IR > ', intersectionRatio);
    this._attributes.intersectionRatio = intersectionRatio;
  });

  if(options.hasOwnProperty('adContainer')) {
    const adsManager = new AdsManager(options.adContainer);
    console.log(adsManager);
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
Player.prototype.play = function(source) {

  if(source) {
    // TODO: play source
  }

  console.log('PL > play > Visible', this._attributes.visible);

}
Player.prototype.pause = function() {

}
Player.prototype.destroy = function() {
  // TODO: destroy
}

export { Player }
