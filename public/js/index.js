(function() {


  let adContainer = document.getElementById('ad-container');

  // player 1
  const player1 = new adserve.tv.Player(document.getElementById('player1'), {
    width: 'auto', // not required
    height: 'auto', // not required
    src: 'https://playertest.longtailvideo.com/adaptive/elephants_dream_v4/redundant.m3u8', // .mp4, .webm, .ogv .m3u8 (manifests and segments)
    poster: '', // poster
    clickThrough: '', // url
    autoplay: true, // video autoplay
    loop: false, // loop
    muted: true, // video muted
    volume: 0, // video volume
    controls: true, // show controls
    ads: {
      beforeClip: 1, // start ads before clip
      desktop: {
        inView: {
          active: true, // enabled
          vastUrl: 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%204.0%20Samples/Inline_Simple.xml',
          interval: 5000, // Ad request interval after AdImpression
          retryInterval: 10000, // Ad request retry interval after AdError
          useSmartInterval: true
        },
        notInView: {
          active: true,
          vastUrl: 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%204.0%20Samples/Inline_Simple.xml',
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
          asi: 'ssp4.tv',
          hp: 1,
          sid: ''
        }]
      },
      customMacros: []
    },
  }, function() {
    console.log('player1 is ready', this);
    // Play
    // HLS
    this.play();
  });
  player1.addEventListener('PlayerVisibilityChange', function(visible) {
    console.log('player1 visibility change >', visible);
  });
  console.log(player1);


  // player 2
  const player2 = new adserve.tv.Player(document.getElementById('player2'), {}, function() {
    console.log('player2 is ready', this);
    // Play
    // MPEG-DASH
    this.play('https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd');
  });

  console.log(player2);


  // player 3
  const player3 = new adserve.tv.Player(document.getElementById('player3'), {});
  player3.addEventListener('PlayerReady', function() {
    console.log('player3 is ready', player3, player3.visible(), player3.hidden());
    // Play
    // MP4
    player3.play();
  });
  player3.addEventListener('PlayerVisibilityChange', function(visible) {
    console.log('player3 visibility change >', visible);
  });
  console.log(player3);
  console.log('Player version is', player3.getVersion());

  const player4 = new adserve.tv.Player(document.getElementById('player4'), {
    src: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd'
  }, function() {
    // Play
    // MPEG-DASH
    player4.play();
  });

  console.log(player4);


})()
