import { AdsManager } from 'ads-manager';

const Player = function(options = {}) {

    console.log('player', options);

    if(options.hasOwnProperty('adContainer')) {
        const adsManager = new AdsManager(options.adContainer);
        console.log(adsManager);
    }

}

export { Player }
