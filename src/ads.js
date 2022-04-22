import {addHandler as initTimeBus} from './time-bus';
import {getRunTime} from './utils';

// TODO:

let options = {
  beforeClip: 0, // start ads before clip
  desktop: {
    inView: {
      vastUrl: null,
      interval: 5000, // Ad request interval after AdImpression
      retryInterval: 10000, // Ad request retry interval after AdError
      useSmartInterval: true
    },
    notInView: {
      vastUrl: null,
      interval: 5000,
      retryInterval: 10000,
      useSmartInterval: true
    },
  },
  gdpr: false, // GDPR
  consent: '', // GDPR Consent
  usp : '', // US Privacy
  schain: { // Supply Chain Object
    ver: '1.0',
    complete: 1,
    nodes: [{
      asi: '',
      hp: 1,
      sid: ''
    }]
  }
};

function setAdsOptions(givenOptions) {
  Object.assign(options, givenOptions);
}

function getAdInterval() {
  //return options.desktop.inView.interval;
  return 5000;
}

function checkIfPlayAds() {
  //console.log('check if play ad', getRunTime(), getAdInterval());
  return;
  //this.playAd();
}

export {
  setAdsOptions,
  checkIfPlayAds
}
