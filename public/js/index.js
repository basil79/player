(function() {

  // player 1
  const player1 = new adserve.tv.Player(document.getElementById('player1'), {
    width: 'auto', // not required
    height: 'auto', // not required
    title: 'Big Buck Bunny',
    url: '', // url
    //src: 'https://playertest.longtailvideo.com/adaptive/elephants_dream_v4/redundant.m3u8', // .mp4, .webm, .ogv .m3u8 (manifests and segments)
    src: 'https://va.media.tumblr.com/tumblr_ptc9j9pX4j1rkfg7k_480.mp4',
    poster: '', // poster
    autoplay: false, // video autoplay - false, true, 'muted', 'play', 'any'
    loop: false, // loop
    muted: true, // video muted
    volume: 0, // video volume
    controls: true, // show controls
    textTracks: {},
    stickyFloating: false, // TODO: position, close button, margins
    ads: {
      enabled: true,
      desktop: {
        inView: {
          vastUrl: 'https://v.adserve.tv/pg/vast-vpaid.xml?cb=[CACHEBUSTER]&ts=[TIMESTAMP]&w=[WIDTH]&h=[HEIGHT]&schain=[SCHAIN]&dur=[DURATION]&v=[IS_VISIBLE]&ua=[USER_AGENT]&dnt=[DNT]&dev=[DEVICE]&domain=[DOMAIN]&url=[URL]&categories=[CATEGORIES]&tags=[TAGS]&gdpr=[GDPR]&gdpr_consent=[GDPR_CONSENT]&usp=[US_PRIVACY]&ab=[ABC]',
          interval: 5000, // ad request interval after AdImpression
          retryInterval: 10000 // ad request retry interval after AdError
        },
        notInView: {
          vastUrl: 'https://v.adserve.tv/rama/vast.xml',
          interval: 15000,
          retryInterval: 10000
        },
      },
      mobile: {
        inView: {
          vastUrl: 'https://v.adserve.tv/rama/vast.xml',
          interval: 5000, // ad request interval after AdImpression
          retryInterval: 10000 // ad request retry interval after AdError
        },
        notInView: {
          vastUrl: 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%204.0%20Samples/Inline_Simple.xml',
          interval: 15000,
          retryInterval: 10000
        },
      },
      gdpr: true, // if true check GDPR (EU)
      usp: true, // if true check CCPA (US Privacy)
      schain: { // Supply Chain Object
        ver: '1.0',
        complete: 1,
        nodes: [{
          asi: 'adserve.tv',
          hp: 1,
          sid: ''
        }]
      },
      customMacros: {
        gptTargeting: function(key) {
          if(window.googletag && googletag.apiReady) {
            const data = googletag.pubads().getTargeting(key);
            return data.length != 0 ? data.toString() : '';
          } else {
            return '';
          }
        },
        'CATEGORIES': function() {
          return this.gptTargeting('categories');
        },
        'TAGS': '1,2,3'
      }
    },
    /*
    timeRanges: [{
      enabled: true,
      range: ['10:30', '10:32'], // Time range in UTC, [from, to] - example 19:00 EDT (New York) is 23:00 UTC
      options: {
        ads: {
          desktop: {
            inView: {
              interval: 2500
            }
          }
        }
      }
    }, {
      enabled: true,
      range: ['23:00', '00:00'], // Time range in UTC, [from, to] - example 19:00 EDT (New York) is 23:00 UTC
      options: {
        ads: {
          desktop: {
            inView: {
              interval: 2500
            }
          }
        }
      }
    }],
     */
    abTest: {
      enabled: true,
      variants: [{
        name: 'localhost|A|50',
        percentage: 50,
        options: {}
      }, {
        name: 'localhost|B|50',
        percentage: 50,
        options: {
          title: 'Title',
          src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // 0
          //src: 'https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8', // 1
          //src: 'https://di-mi68vc46.leasewebultracdn.com/storage/box2/vm_videos/0036/36751/hls/640x360/index.m3u8',
          preload: 'none',
          //src: 'https://test-streams.mux.dev/x36xhzz/url_2/193039199_mp4_h264_aac_ld_7.m3u8',
          //src: 'https://s3.amazonaws.com/_bc_dml/example-content/bipbop-advanced/bipbop_16x9_variant.m3u8', // 'application/x-mpegURL'
          //src: 'https://d2zihajmogu5jn.cloudfront.net/ts-fmp4/index.m3u8',
          //src: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
          //src: 'https://cdn.7pass.de/5e709c4c696a0a5e2a0053c4/assets/imgs/splash-8cedc0a51c85ea851875f15fb2831ba963fe3577b916370c890f209a210ff2cd.mp4',
          controls: true,
          ads: {
            enabled: false
          }
        }
      }]
    }
  }, function() {
    // Play
    this.play();
  });
  player1.addEventListener('PlayerVisibilityChange', function(visible) {
    console.log('player1 visibility change >', visible);
  });
  player1.addEventListener('PlayerFullscreenChange', function() {
    console.log('player 1 fullscreen change', player1.fullscreen());
    if(!player1.fullscreen() && player1.paused()) {
      player1.play();
    }
  });
  player1.addEventListener('PlayerVideoComplete', function() {
    console.log('player 1 video complete');
    if(player1.fullscreen()) {
      player1.exitFullscreen();
    }
  });
  player1.addEventListener('PlayerError', function(message) {
    console.log('player 1 error', message);
  });


  /*
  // player 2
  const player2 = new adserve.tv.Player(document.getElementById('player2'), {
    title: 'Elephants Dream',
  }, function() {
    // Play
    // MPEG-DASH
    //this.play('https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd');
    // //src: 'https://playertest.longtailvideo.com/adaptive/elephants_dream_v4/redundant.m3u8', // .mp4, .webm, .ogv .m3u8 (manifests and segments)
    this.play('https://playertest.longtailvideo.com/adaptive/elephants_dream_v4/redundant.m3u8')
  });
  player2.addEventListener('PlayerError', function(message) {
    console.log('player 2 error', message);
  });
   */

  /*
  // player 3
  const player3 = new adserve.tv.Player(document.getElementById('player3'), {
    aspectRatio: '1:1',
    title: 'Title',
    controls: false,
    loop: true,
    ads: {
      desktop: {
        inView: {
          vastUrl: 'https://v.adserve.tv/rama/vast.xml?cb=[CACHEBUSTER]&ts=[TIMESTAMP]&w=[WIDTH]&h=[HEIGHT]&schain=[SCHAIN]&dur=[DURATION]&v=[IS_VISIBLE]&ua=[USER_AGENT]&dnt=[DNT]&dev=[DEVICE]&domain=[DOMAIN]&url=[URL]&categories=[CATEGORIES]&tags=[TAGS]&gdpr=[GDPR]&gdpr_consent=[GDPR_CONSENT]&usp=[US_PRIVACY]',
          interval: 15000, // Ad request interval after AdImpression
          retryInterval: 10000 // Ad request retry interval after AdError
        },
        notInView: {
          vastUrl: 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%204.0%20Samples/Inline_Simple.xml?cb=[CACHEBUSTER]&ts=[TIMESTAMP]&w=[WIDTH]&h=[HEIGHT]&schain=[SCHAIN]&dur=[DURATION]&v=[IS_VISIBLE]',
          interval: 15000,
          retryInterval: 10000
        },
      },
      mobile: {
        inView: {
          vastUrl: 'https://v.adserve.tv/rama/vast.xml',
          interval: 15000, // Ad request interval after AdImpression
          retryInterval: 10000 // Ad request retry interval after AdError
        },
        notInView: {
          vastUrl: 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%204.0%20Samples/Inline_Simple.xml',
          interval: 15000,
          retryInterval: 10000
        },
      },
      schain: { // Supply Chain Object
        ver: '1.0',
        complete: 1,
        nodes: [{
          asi: 'adserve.tv',
          hp: 1,
          sid: ''
        }]
      }
    }
  });
  player3.addEventListener('PlayerReady', function() {
    // Play
    // MP4
    player3.play('https://cdn.7pass.de/5e709c4c696a0a5e2a0053c4/assets/imgs/splash-8cedc0a51c85ea851875f15fb2831ba963fe3577b916370c890f209a210ff2cd.mp4');
  });
  player3.addEventListener('PlayerVisibilityChange', function(visible) {
    console.log('player3 visibility change >', visible);
  });
  player3.addEventListener('PlayerError', function(message) {
    console.log('player 3 error', message);
  });
  console.log('Player version is', player3.getVersion());


  // player 4
  const player4 = new adserve.tv.Player(document.getElementById('player4'), {
    title: 'The solution to California\'s drought: if you eat beef, don\'t wash',
    poster: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/audio/video/2015/7/17/1437143214172/KP_356964_crop_1200x720.jpg?width=640&quality=85&auto=format&fit=max&s=723ea784ae21864c46aad3aae6aeda8b',
    src: 'https://cdn.theguardian.tv/mainwebsite/2015/07/20/150716YesMen_desk.mp4',
    muted: false,
    // src: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd'
    // src: 'https://cdn.theguardian.tv/HLS/2015/07/20/150716YesMen.m3u8',
    // src: 'https://cdn.theguardian.tv/webM/2015/07/20/150716YesMen_synd_768k_vp8.webm',
    // src: 'https://cdn.theguardian.tv/3gp/large/2015/07/20/150716YesMen_large.3gp',
    // src: 'https://cdn.theguardian.tv/3gp/small/2015/07/20/150716YesMen_small.3gp'
  }, function() {
    // Play
    // MPEG-DASH
    //player4.play();
  });
  player4.addEventListener('PlayerError', function(message) {
    console.log('player 4 error', message);
  });

  // player 5
  const player5 = new adserve.tv.Player(document.getElementById('player5'), {
    // source base64
    title: 'Cyberpunk 2077: Our Thoughts After Seeing 50 Minutes of New Gameplay - E3 2019',
    url: 'http://adserve.tv',
    poster: 'https://assets1.ignimgs.com/thumbs/userUploaded/2019/6/11/36190303cyberpunk-blogroll-1560300058540.jpg',
    src: 'https://play.aniview.com/58d7dc4328a0611e7a4535da/5ea6a187bd93817a6624ac47/1587786324562_video.mp4' // 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAC721kYXQhEAUgpBv/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3pwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcCEQBSCkG//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADengAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAsJtb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAALwABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAB7HRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAIAAAAAAAAALwAAAAAAAAAAAAAAAQEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAC8AAAAAAAEAAAAAAWRtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAAKxEAAAIAFXEAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAAEPbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAADTc3RibAAAAGdzdHNkAAAAAAAAAAEAAABXbXA0YQAAAAAAAAABAAAAAAAAAAAAAgAQAAAAAKxEAAAAAAAzZXNkcwAAAAADgICAIgACAASAgIAUQBUAAAAAAfQAAAHz+QWAgIACEhAGgICAAQIAAAAYc3R0cwAAAAAAAAABAAAAAgAABAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAIAAAABAAAAHHN0c3oAAAAAAAAAAAAAAAIAAAFzAAABdAAAABRzdGNvAAAAAAAAAAEAAAAsAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY1Ni40MC4xMDE='
  }, function() {
    //player5.play();
  });
  player5.addEventListener('PlayerError', function(message) {
    console.log('player 5 error', message);
  });
  */

  /*
  // player 6
  const player6 = new adserve.tv.Player(document.getElementById('player6'), {
    title: 'My Title',
    //src: 'https://res.cloudinary.com/demo/video/upload/vc_vp9/outdoors.webm?_s=vp-1.8.0',
    src: 'https://res.cloudinary.com/demo/video/upload/outdoors.mp4?_s=vp-1.8.0',
    autoplay: 'any', // false, true, 'muted', 'play', 'any'
    muted: false,
    volume: 1,
    textTracks: {
      subtitles: [{
        label: 'English',
        language: 'en',
        url: 'https://res.cloudinary.com/demo/raw/upload/outdoors.vtt'
      }]
    }
  }, function() {
    console.log('player6 - ready');
  });
   */

})()
