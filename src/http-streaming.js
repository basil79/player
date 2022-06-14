import { Parser as M3u8Parser } from 'm3u8-parser';
import muxjs from 'mux.js';

const parseManifest = ({
 manifestString,
 customTagParsers = [],
 customTagMappers = [],
 experimentalLLHLS
}) => {
  const parser = new M3u8Parser();

  customTagParsers.forEach(customParser => parser.addParser(customParser));
  customTagMappers.forEach(mapper => parser.addTagMapper(mapper));

  parser.push(manifestString);
  parser.end();

  const manifest = parser.manifest;

  // remove llhls features from the parsed manifest
  // if we don't want llhls support.
  if (!experimentalLLHLS) {
    [
      'preloadSegment',
      'skip',
      'serverControl',
      'renditionReports',
      'partInf',
      'partTargetDuration'
    ].forEach(function(k) {
      if (manifest.hasOwnProperty(k)) {
        delete manifest[k];
      }
    });

    if (manifest.segments) {
      manifest.segments.forEach(function(segment) {
        ['parts', 'preloadHints'].forEach(function(k) {
          if (segment.hasOwnProperty(k)) {
            delete segment[k];
          }
        });
      });
    }
  }
  if(!manifest.targetDuration) {
    let targetDuration = 10;
    if(manifest.segments && manifest.segments.length) {
      targetDuration = manifest.segments.reduce((acc, s) => Math.max(acc, s.duration), 0);
    }
    console.log('manifest has no targetDuration defaulting to', targetDuration);
    manifest.targetDuration = targetDuration;
  }

  const parts = getLastParts(manifest);
  console.log(parts);
  if(parts.length && !manifest.partTargetDuration) {
    const partTargetDuration = parts.reduce((acc, p) => Math.max(acc, p.duration), 0);
    console.log('manifest has no partTargetDuration defaulting to', partTargetDuration);
    manifest.partTargetDuration = partTargetDuration;
  }

  return manifest;
}

const getLastParts = (media) => {
  const lastSegment = media.segments && media.segments.length && media.segments[media.segments.length - 1];
  return lastSegment && lastSegment.parts || [];
}

const setupInitialPlaylist = (manifest) => {
  if(manifest.playlists) {

  }

  // Replace this value with your files codec info
  const mime = 'video/mp4; codecs="mp4a.40.2,avc1.64001f"';
  // segments
  const segments = [
    /*'https://test-streams.mux.dev/x36xhzz/url_2/url_526/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_527/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_528/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_529/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_530/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_531/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_532/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_533/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_534/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_535/193039199_mp4_h264_aac_ld_7.ts',
    'https://test-streams.mux.dev/x36xhzz/url_2/url_536/193039199_mp4_h264_aac_ld_7.ts'*/
  ];

  const mediaSource = new window.MediaSource();
  const transmuxer = new muxjs.mp4.Transmuxer();
  let sourceBuffer = null;

  const handleFirstSegment = () => {
    if(segments.length == 0) {
      return;
    }

    sourceBuffer = mediaSource.addSourceBuffer(mime);
    sourceBuffer.addEventListener('updateend', handleNextSegment);

    transmuxer.on('data', (segment) => {
      const data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength);
      data.set(segment.initSegment, 0);
      data.set(segment.data, segment.initSegment.byteLength);
      console.log(muxjs.mp4.tools.inspect(data));
      sourceBuffer.appendBuffer(data);
    });

    fetch(segments.shift())
      .then(res => res.arrayBuffer())
      .then(response => {
        transmuxer.push(new Uint8Array(response));
        transmuxer.flush();
      });

  }

  const handleNextSegment = () => {
    // reset the data event listener to just append (moof/mdat) boxes to the Source Buffer
    transmuxer.off('data');
    transmuxer.on('data', (segment) => {
      sourceBuffer.appendBuffer(new Uint8Array(segment.data));
    });

    if(segments.length == 0) {
      // notify MSE that no more segments to append
      mediaSource.endOfStream();
    } else {

      // fetch the next segment from the segments array and pass it into the transmuxer.push method
      fetch(segments.shift())
        .then(res => res.arrayBuffer())
        .then(response => {
          transmuxer.push(new Uint8Array(response));
          transmuxer.flush();
        });
    }
  }

  mediaSource.addEventListener('sourceopen', handleFirstSegment);

  return mediaSource;
}

export {
  parseManifest,
  setupInitialPlaylist
}
