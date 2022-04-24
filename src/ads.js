import {addHandler as initTimeBus} from './time-bus';
import {getRunTime, millisecondsToSeconds} from './utils';
import {IS_MOBILE_AND_TABLET} from './browser';
import {AdsManager} from 'ads-manager';

// TODO:
let lastAdHasError = false;
let lastAdErrorRuntime = 0;
let lastAdRequestRuntime = 0;
let lastAdCompleteRuntime = 0;
let isAdPlaying = false;

// TODO:
let instance = null;
let adContainer = null;
let adsManager = null;
let options = {
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
    },
  },
  gdpr: false, // GDPR
  consent: '', // GDPR Consent
  usp: '', // US Privacy
  schain: null // Supply Chain
};

function getInViewVastUrl() {
  return IS_MOBILE_AND_TABLET
    ? options.mobile.inView.vastUrl
    : options.desktop.inView.vastUrl;
}

function getNotInViewVastUrl() {
  return IS_MOBILE_AND_TABLET
    ? options.mobile.notInView.vastUrl
    : options.desktop.notInView.vastUrl;
}

function getVastUrl() {
  return instance.visible()
    ? getInViewVastUrl()
    : getNotInViewVastUrl();
}

function getInViewInterval() {
  return IS_MOBILE_AND_TABLET
    ? options.mobile.inView.interval
    : options.desktop.inView.interval;
}

function getNotInViewInterval() {
  return IS_MOBILE_AND_TABLET
    ? options.mobile.notInView.interval
    : options.desktop.notInView.interval;
}

function getInViewRetryInterval() {
  return IS_MOBILE_AND_TABLET
    ? options.mobile.inView.retryInterval
    : options.desktop.inView.retryInterval;
}

function getNotInViewRetryInterval() {
  return IS_MOBILE_AND_TABLET
    ? options.mobile.notInView.retryInterval
    : options.desktop.notInView.retryInterval;
}

function getRetryInterval() {
  return instance.visible()
    ? millisecondsToSeconds(getInViewRetryInterval())
    : millisecondsToSeconds(getNotInViewRetryInterval());
}

function getInterval() {
  if(lastAdHasError) {
    // Retry ad interval
    const retryAdInterval = getRetryInterval() * 1000;
    const diff = lastAdErrorRuntime - lastAdRequestRuntime;
    let newRetryAdInterval = 0;
    if(diff < retryAdInterval) {
      newRetryAdInterval = retryAdInterval - diff;
    }
    return millisecondsToSeconds(newRetryAdInterval);
  }
  // Ad interval
  return instance.visible()
    ? millisecondsToSeconds(getInViewInterval())
    : millisecondsToSeconds(getNotInViewInterval());
}

function playAd() {
  if(adsManager) {
    isAdPlaying = true;
    lastAdRequestRuntime = getRunTime();
    adsManager.requestAds(getVastUrl());
  }
}

function checkIfPlayAds() {

  /*
  if(lastAdCompleteRuntime === 0 && !instance.paused()) {
    console.log('pre roll');
    playAd();
  }
   */

  if(getRunTime() - lastAdCompleteRuntime >= getInterval() * 1000 && !isAdPlaying && !instance.ended() && !instance.paused()) {
    console.log(getInterval() * 1000);
    playAd();
  }

  return;
}

function initAds(playerInstance, givenAdContainer, givenOptions) {

  // TODO:
  instance = playerInstance; // Player instance
  adContainer = givenAdContainer;
  Object.assign(options, givenOptions);

  // TODO:
  if(adContainer) {

    adsManager = new AdsManager(adContainer);

    const handleAdError = (adError) => {
      console.log('AdError', adError);

      lastAdHasError = true;
      isAdPlaying = false;
      lastAdErrorRuntime = getRunTime();
      lastAdCompleteRuntime = lastAdErrorRuntime;

      if(adsManager) {
        adsManager.destroy();
      }
      // If player paused, then play
      if(instance.paused()) {
        instance.play();
      }
    };
    // Subscribe for events
    adsManager.addEventListener('AdError', handleAdError);
    adsManager.addEventListener('AdsManagerLoaded', function() {
      console.log('AdsManagerLoaded', instance._videoSlot.clientWidth, instance._videoSlot.clientHeight);
      const width = instance._videoSlot.clientWidth;
      const height = instance._videoSlot.clientHeight;
      const viewMode = 'normal'; // fullscreen

      try {
        adsManager.init(width, height, viewMode);
      } catch (adError) {
        // Play the video without ads, if an error occurs
        console.log('AdsManager could not initialize ad');
        handleAdError(adError);
      }

    });
    adsManager.addEventListener('AdLoaded', function(adEvent) {
      console.log('AdLoaded');
      if(adEvent.type === 'linear') {
        try {
          adsManager.start();
        } catch (adError) {
          // Play the video without ads, if an error occurs
          console.log('AdsManager could not be started');
          handleAdError(adError);
        }
      } else {
        console.log('AdsManager > AdLoaded > ad is not linear');
      }
    });
    adsManager.addEventListener('AdStarted', function() {
      console.log('AdStarted');
    });
    adsManager.addEventListener('AdDurationChange', function() {
      console.log('AdDurationChange', adsManager.getDuration());
    });
    adsManager.addEventListener('AdSizeChange', function() {
      console.log('AdSizeChange');
    });
    adsManager.addEventListener('AdVideoStart', function() {
      console.log('AdVideoStart');
      // Pause player
      instance._el.classList.add('ads');
      if(!instance.paused()) {
        instance.pause();
      }
    });
    adsManager.addEventListener('AdImpression', function() {
      console.log('AdImpression');
    });
    adsManager.addEventListener('AdVideoFirstQuartile', function() {
      console.log('AdVideoFirstQuartile');
    });
    adsManager.addEventListener('AdVideoMidpoint', function() {
      console.log('AdVideoMidpoint');
    });
    adsManager.addEventListener('AdVideoThirdQuartile', function() {
      console.log('AdVideoThirdQuartile');
    });
    adsManager.addEventListener('AdPaused', function() {
      console.log('AdPaused');
    });
    adsManager.addEventListener('AdPlaying', function() {
      console.log('AdPlaying');
    });
    adsManager.addEventListener('AdVideoComplete', function () {
      console.log('AdVideoComplete');
    });
    adsManager.addEventListener('AdStopped', function () {
      console.log('AdStopped');
    });
    adsManager.addEventListener('AdSkipped', function() {
      console.log('AdSkipped');
    });
    adsManager.addEventListener('AdClickThru', function(url, id) {
      console.log('AdClickThru', url);
    });
    adsManager.addEventListener('AllAdsCompleted', function () {
      console.log('AllAdsCompleted');
      lastAdHasError = false;
      isAdPlaying = false;
      lastAdCompleteRuntime = getRunTime();

      // Resume player
      instance._el.classList.remove('ads');
      if(!instance.ended()) {
        instance.play();
      }

    });


    // Initialize time bus
    initTimeBus(checkIfPlayAds);

  }

}

export {
  initAds
}
