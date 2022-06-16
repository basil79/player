export const getLastParts = (media) => {
  const lastSegment = media.segments && media.segments.length && media.segments[media.segments.length - 1];
  return lastSegment && lastSegment.parts || [];
}

export const getKnownPartCount = ({preloadSegment}) => {
  if (!preloadSegment) {
    return;
  }
  const {parts, preloadHints} = preloadSegment;
  let partCount = (preloadHints || [])
    .reduce((count, hint) => count + (hint.type === 'PART' ? 1 : 0), 0);

  partCount += (parts && parts.length) ? parts.length : 0;

  return partCount;
};

export const playlistMatch = (a, b) => {
  // both playlits are null
  // or only one playlist is non-null
  // no match
  if (!a && !b || (!a && b) || (a && !b)) {
    return false;
  }

  // playlist objects are the same, match
  if (a === b) {
    return true;
  }

  // first try to use id as it should be the most
  // accurate
  if (a.id && b.id && a.id === b.id) {
    return true;
  }

  // next try to use reslovedUri as it should be the
  // second most accurate.
  if (a.resolvedUri && b.resolvedUri && a.resolvedUri === b.resolvedUri) {
    return true;
  }

  // finally try to use uri as it should be accurate
  // but might miss a few cases for relative uris
  if (a.uri && b.uri && a.uri === b.uri) {
    return true;
  }

  return false;
}

const someAudioVariant = function(master, callback) {
  const AUDIO = master && master.mediaGroups && master.mediaGroups.AUDIO || {};
  let found = false;

  for (const groupName in AUDIO) {
    for (const label in AUDIO[groupName]) {
      found = callback(AUDIO[groupName][label]);

      if (found) {
        break;
      }
    }

    if (found) {
      break;
    }
  }

  return !!found;
}

const regexs = {
  // to determine mime types
  mp4: /^(av0?1|avc0?[1234]|vp0?9|flac|opus|mp3|mp4a|mp4v|stpp.ttml.im1t)/,
  webm: /^(vp0?[89]|av0?1|opus|vorbis)/,
  ogg: /^(vp0?[89]|theora|flac|opus|vorbis)/,
  // to determine if a codec is audio or video
  video: /^(av0?1|avc0?[1234]|vp0?[89]|hvc1|hev1|theora|mp4v)/,
  audio: /^(mp4a|flac|vorbis|opus|ac-[34]|ec-3|alac|mp3|speex|aac)/,
  text: /^(stpp.ttml.im1t)/,
  // mux.js support regex
  muxerVideo: /^(avc0?1)/,
  muxerAudio: /^(mp4a)/,
  // match nothing as muxer does not support text right now.
  // there cannot never be a character before the start of a string
  // so this matches nothing.
  muxerText: /a^/
};
const mediaTypes = ['video', 'audio', 'text'];
const upperMediaTypes = ['Video', 'Audio', 'Text'];

function isAudioCodec(codec) {
  if (codec === void 0) {
    codec = '';
  }

  return regexs.audio.test(codec.trim().toLowerCase());
}

export const isAudioOnly = (master) => {
  // we are audio only if we have no main playlists but do
  // have media group playlists.
  if (!master || !master.playlists || !master.playlists.length) {
    // without audio variants or playlists this
    // is not an audio only master.
    const found = someAudioVariant(master, (variant) =>
      (variant.playlists && variant.playlists.length) || variant.uri);

    return found;
  }

  // if every playlist has only an audio codec it is audio only
  for (let i = 0; i < master.playlists.length; i++) {
    const playlist = master.playlists[i];
    const CODECS = playlist.attributes && playlist.attributes.CODECS;

    // all codecs are audio, this is an audio playlist.
    if (CODECS && CODECS.split(',').every((c) => isAudioCodec(c))) {
      continue;
    }

    // playlist is in an audio group it is audio only
    const found = someAudioVariant(master, (variant) => playlistMatch(playlist, variant));

    if (found) {
      continue;
    }

    // if we make it here this playlist isn't audio and we
    // are not audio only
    return false;
  }

  // if we make it past every playlist without returning, then
  // this is an audio only playlist.
  return true;
}
