import * as timeBus from './time-bus';
import {
  getCacheBuster,
  getRunTime,
  getTimestamp,
  millisecondsToSeconds,
  replaceMacrosValues,
  serializeSupplyChain
} from './utils';
import {IS_IPHONE, IS_MOBILE_AND_TABLET} from './browser';
import {AdsManager} from 'ads-manager';

const Ads = function(player, adContainer, options) {

  this._player = player;
  this._adContainer = adContainer;
  this._adsManager = null;
  this._options = Object.assign({
    desktop: {
      inView: {
        vastUrl: null,
        interval: 5000, // Ad request interval after AdImpression
        retryInterval: 10000 // Ad request retry interval after AdError
      },
      notInView: {
        vastUrl: null,
        interval: 15000,
        retryInterval: 10000
      }
    },
    mobile: {
      inView: {
        vastUrl: null,
        interval: 5000, // Ad request interval after AdImpression
        retryInterval: 10000 // Ad request retry interval after AdError
      },
      notInView: {
        vastUrl: null,
        interval: 15000,
        retryInterval: 10000
      }
    },
    gdpr: false, // GDPR
    consent: '', // GDPR Consent
    usp: '', // US Privacy
    schain: null, // Supply Chain
    customMacros: []
  }, options);

  this.lastAdHasError = false;
  this.lastAdErrorRuntime = 0;
  this.lastAdRequestRuntime = 0;
  this.lastAdCompleteRuntime = 0;
  this.isAdPlaying = false;

  if(this._adContainer) {
    // Initialize ads manager
    this.initAdsManager();
  }
}
Ads.prototype.getInterval = function() {
  if(this.lastAdHasError) {
    // Retry ad interval
    const retryAdInterval = this.getRetryInterval() * 1000;
    const diff = this.lastAdErrorRuntime - this.lastAdRequestRuntime;
    let newRetryAdInterval = 0;
    if(diff < retryAdInterval) {
      newRetryAdInterval = retryAdInterval - diff;
    }
    return millisecondsToSeconds(newRetryAdInterval);
  }
  // Ad interval
  return this._player.visible()
    ? millisecondsToSeconds(this.getInViewInterval())
    : millisecondsToSeconds(this.getNotInViewInterval());
}
Ads.prototype.getRetryInterval = function() {
  return this._player.visible()
    ? millisecondsToSeconds(this.getInViewRetryInterval())
    : millisecondsToSeconds(this.getNotInViewRetryInterval());
}
// TODO:
Ads.prototype.getInViewInterval = function() {
  return IS_MOBILE_AND_TABLET
    ? this._options.mobile.inView.interval
    : this._options.desktop.inView.interval;
}
Ads.prototype.getNotInViewInterval = function() {
  return IS_MOBILE_AND_TABLET
    ? this._options.mobile.notInView.interval
    : this._options.desktop.notInView.interval;
}
Ads.prototype.getInViewRetryInterval = function() {
  return IS_MOBILE_AND_TABLET
    ? this._options.mobile.inView.retryInterval
    : this._options.desktop.inView.retryInterval;
}
Ads.prototype.getNotInViewRetryInterval = function() {
  return IS_MOBILE_AND_TABLET
    ? this._options.mobile.notInView.retryInterval
    : this._options.desktop.notInView.retryInterval;
}
Ads.prototype.getInViewVastUrl = function() {
  return IS_MOBILE_AND_TABLET
    ? this._options.mobile.inView.vastUrl
    : this._options.desktop.inView.vastUrl;
}
Ads.prototype.getNotInViewVastUrl = function() {
  return IS_MOBILE_AND_TABLET
    ? this._options.mobile.notInView.vastUrl
    : this._options.desktop.notInView.vastUrl;
}
Ads.prototype.getVastUrl = function() {
  return this._player.visible()
    ? this.getInViewVastUrl()
    : this.getNotInViewVastUrl();
}
Ads.prototype.initAdsManager = function() {
  this._adsManager = new AdsManager(this._adContainer);
  console.log('AdsManager version is', this._adsManager.getVersion());

  const handleAdError = (adError) => {
    console.log('AdError', adError);

    this.lastAdHasError = true;
    this.isAdPlaying = false;
    this.lastAdErrorRuntime = getRunTime();
    this.lastAdCompleteRuntime = this.lastAdErrorRuntime;

    if(this._adsManager) {
      this._adsManager.destroy();
    }

    this._player._el.classList.remove('ads');
    // If player paused, then play
    if(this._player.paused()) {
      this._player.play();
    }
  };

  const handleAdStopped = () => {
    // Resume player
    this._player._el.classList.remove('ads');
    if(!this._player.ended()) {
      this._player.play();
    }
  };

  // Subscribe for events
  this._adsManager.addEventListener('AdError', handleAdError);
  this._adsManager.addEventListener('AdsManagerLoaded', () => {
    console.log('AdsManagerLoaded', this._player._videoSlot.clientWidth, this._player._videoSlot.clientHeight);
    const width = this._player._videoSlot.clientWidth;
    const height = this._player._videoSlot.clientHeight;
    // TODO:
    const viewMode = this.getViewMode(); // fullscreen
    console.log('init > viewMode', viewMode);

    try {
      this._adsManager.init(width, height, viewMode);
    } catch (adError) {
      // Play the video without ads, if an error occurs
      console.log('AdsManager could not initialize ad');
      handleAdError(adError);
    }

  });
  this._adsManager.addEventListener('AdLoaded', (adEvent) => {
    console.log('AdLoaded');
    if(adEvent.type === 'linear') {
      try {
        this._adsManager.start();
      } catch (adError) {
        // Play the video without ads, if an error occurs
        console.log('AdsManager could not be started');
        handleAdError(adError);
      }
    } else {
      console.log('AdsManager > AdLoaded > ad is not linear');
    }
  });
  this._adsManager.addEventListener('AdStarted', () => {
    console.log('AdStarted');

    // Pause player
    this._player._el.classList.add('ads');
    if(!this._player.paused()) {
      this._player.pause();
    }

  });
  this._adsManager.addEventListener('AdDurationChange', () => {
    console.log('AdDurationChange', this._adsManager.getDuration());
  });
  this._adsManager.addEventListener('AdSizeChange', () => {
    console.log('AdSizeChange');
  });
  this._adsManager.addEventListener('AdVideoStart', () => {
    console.log('AdVideoStart');
  });
  this._adsManager.addEventListener('AdImpression', () => {
    console.log('AdImpression');
  });
  this._adsManager.addEventListener('AdVideoFirstQuartile', () => {
    console.log('AdVideoFirstQuartile');
  });
  this._adsManager.addEventListener('AdVideoMidpoint', () => {
    console.log('AdVideoMidpoint');
  });
  this._adsManager.addEventListener('AdVideoThirdQuartile', () => {
    console.log('AdVideoThirdQuartile');
  });
  this._adsManager.addEventListener('AdPaused', () => {
    console.log('AdPaused');
  });
  this._adsManager.addEventListener('AdPlaying', () => {
    console.log('AdPlaying');
  });
  this._adsManager.addEventListener('AdVideoComplete', () => {
    console.log('AdVideoComplete');
  });
  this._adsManager.addEventListener('AdStopped', handleAdStopped);
  this._adsManager.addEventListener('AdSkipped', handleAdStopped);
  this._adsManager.addEventListener('AdClickThru', (url, id) => {
    console.log('AdClickThru', url);
  });
  this._adsManager.addEventListener('AllAdsCompleted', () => {
    console.log('AllAdsCompleted');
    this.lastAdHasError = false;
    this.isAdPlaying = false;
    this.lastAdCompleteRuntime = getRunTime();

    // TODO:

  });

  // Initialize time bus for intervals
  timeBus.addHandler(this.checkIfPlayAd.bind(this));
}
Ads.prototype.checkIfPlayAd = function() {

  /*
  if(this.lastAdCompleteRuntime === 0 && !this._player.paused()) {
    console.log('pre roll');
    this.playAd();
  }
   */
  if(IS_IPHONE && this._player.fullscreen()) {
    return;
  }

  if(getRunTime() - this.lastAdCompleteRuntime >= this.getInterval() * 1000
    && !this.isAdPlaying
    && !this._player.ended()
    && !this._player.paused()) {
    this.playAd();
  }

  return;
}
Ads.prototype.getViewMode = function() {
  return this._player.fullscreen() ? 'fullscreen' : 'normal'
}
Ads.prototype.getSChain = function() {
  return serializeSupplyChain(this._options.schain);
}
Ads.prototype.getMacros = function() {
  return {
    'CACHEBUSTER': getCacheBuster(), // random
    'TIMESTAMP': getTimestamp(), // UNIX timestamp
    'HEIGHT': this._player._videoSlot.clientHeight,
    'WIDTH': this._player._videoSlot.clientWidth,
    'DOMAIN': '', // TODO:
    'URL': '', // TODO:
    'USER_AGENT': encodeURIComponent(navigator.userAgent),
    'DEVICE': IS_MOBILE_AND_TABLET ? 2 : 1, // device
    'DNT': (navigator.doNotTrack == 'yes' || navigator.doNotTrack == '1' || navigator.msDoNotTrack == '1') ? 1 : 0, // do not track
    'UTM': '', // TODO: utm params
    'DURATION': this._player.getDuration(), // video duration length in seconds
    'IS_VISIBLE': this._player.visible() ? 1 : 0, // is visible
    'GDPR': this._options.gdpr, // TODO: A flag to indicate user is in the European Union and consent applies
    'CONSENT': this._options.consent, // TODO: A consent string passed from various Consent Management Platforms (CMP's). Also accept numeric value for CTV consent.
    'US_PRIVACY': this._options.usp, // A mandatory string for all publishers in which they must pass the privacy consent for users from California
    'SCHAIN': this.getSChain(), // supply chain object
    'ABC': '', // TODO: AB test name
  }
}
Ads.prototype.playAd = function() {
  if(this._adsManager) {
    this.isAdPlaying = true;
    this.lastAdRequestRuntime = getRunTime();

    // Request ad
    this._adsManager.requestAds(replaceMacrosValues(this.getVastUrl(), this.getMacros()));
  }
}
Ads.prototype.resizeAd = function(width, height) {
  console.log('resize > viewMode', this.getViewMode());
  this._adsManager && this._adsManager.resize(width, height, this.getViewMode());
}

export default Ads;
