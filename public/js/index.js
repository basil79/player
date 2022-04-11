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
    controls: false, // show controls
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
  const player3 = new adserve.tv.Player(document.getElementById('player3'), {
    controls: true
  });
  player3.addEventListener('PlayerReady', function() {
    console.log('player3 is ready', player3, player3.visible(), player3.hidden());
    // Play
    // MP4
    player3.play('https://cdn.7pass.de/5e709c4c696a0a5e2a0053c4/assets/imgs/splash-8cedc0a51c85ea851875f15fb2831ba963fe3577b916370c890f209a210ff2cd.mp4');
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




  const player5 = new adserve.tv.Player(document.getElementById('player5'), {
    // source base64
    title: '',
    src: 'https://play.aniview.com/58d7dc4328a0611e7a4535da/5ea6a187bd93817a6624ac47/1587786324562_video.mp4' // 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAC721kYXQhEAUgpBv/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3pwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcCEQBSCkG//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADengAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAsJtb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAALwABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAB7HRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAIAAAAAAAAALwAAAAAAAAAAAAAAAQEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAC8AAAAAAAEAAAAAAWRtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAAKxEAAAIAFXEAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAAEPbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAADTc3RibAAAAGdzdHNkAAAAAAAAAAEAAABXbXA0YQAAAAAAAAABAAAAAAAAAAAAAgAQAAAAAKxEAAAAAAAzZXNkcwAAAAADgICAIgACAASAgIAUQBUAAAAAAfQAAAHz+QWAgIACEhAGgICAAQIAAAAYc3R0cwAAAAAAAAABAAAAAgAABAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAIAAAABAAAAHHN0c3oAAAAAAAAAAAAAAAIAAAFzAAABdAAAABRzdGNvAAAAAAAAAAEAAAAsAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY1Ni40MC4xMDE='
  }, function() {
    //player5.play();
  });


})()
