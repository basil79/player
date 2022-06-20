import {
  parseManifest,
  addPropertiesToMaster,
  masterForMedia,
  setupMediaPlaylist,
  forEachMediaGroup
} from './manifest';
import {mergeObjects, resolveManifestRedirect, resolveUrl, xhr} from './utils';
import {getKnownPartCount} from './playlist';
import EventBus from './event-bus';

export default class PlaylistLoader extends EventBus {
  constructor(src, options = {}) {
    super();

    if(!src) {
      throw new Error('A non-empty playlist URL or object is required');
    }

    console.log('> PlaylistLoader');
    const { withCredentials = false, handleManifestRedirects = false } = options;

    this.src = src;
    this.withCredentials = withCredentials;
    this.handleManifestRedirects = handleManifestRedirects;

    this.experimentalLLHLS = false;

    // initialize the loader state
    this.state = 'HAVE_NOTHING';
    this.master = {
      uri: src,
      playlists: []
    }

    // live playlist staleness timeout
    this._handleMediaupdatetimeout = this._handleMediaupdatetimeout.bind(this);
    this.on('mediaupdatetimeout', this._handleMediaupdatetimeout);
  }
  _handleMediaupdatetimeout() {
    if (this.state !== 'HAVE_METADATA') {
      // only refresh the media playlist if no other activity is going on
      return;
    }
    const media = this.media();

    let uri = resolveUrl(this.master.uri, media.uri);

    if (this.experimentalLLHLS) {
      uri = addLLHLSQueryDirectives(uri, media);
    }
    this.state = 'HAVE_CURRENT_METADATA';

    this.request = xhr({
      uri,
      withCredentials: this.withCredentials
    }, (error, req) => {
      // disposed
      if (!this.request) {
        return;
      }

      if (error) {
        return this.playlistRequestError(this.request, this.media(), 'HAVE_METADATA');
      }

      this.haveMetadata({
        playlistString: this.request.responseText,
        url: this.media().uri,
        id: this.media().id
      });
    });

  }
  playlistRequestError(xhr, playlist, startingState) {
    const {
      uri,
      id
    } = playlist;

    // any in-flight request is now finished
    this.request = null;

    if (startingState) {
      this.state = startingState;
    }

    this.error = {
      playlist: this.master.playlists[id],
      status: xhr.status,
      message: `HLS playlist request error at URL: ${uri}.`,
      responseText: xhr.responseText,
      code: (xhr.status >= 500) ? 4 : 2
    };

    this.trigger('error');
  }
  _updateMediaUpdateTimeout(delay) {
    if (this.mediaUpdateTimeout) {
      window.clearTimeout(this.mediaUpdateTimeout);
      this.mediaUpdateTimeout = null;
    }

    // we only have use mediaupdatetimeout for live playlists.
    if (!this.media() || this.media().endList) {
      return;
    }

    this.mediaUpdateTimeout = window.setTimeout(() => {
      this.mediaUpdateTimeout = null;
      this.trigger('mediaupdatetimeout');
      this._updateMediaUpdateTimeout(delay);
    }, delay);
  }
  dispose() {
    this.trigger('dispose');
    this.stopRequest();
    window.clearTimeout(this.mediaUpdateTimeout);
    window.clearTimeout(this.finalRenditionTimeout);

    this.off();
  }
  stopRequest() {
    if (this.request) {
      const oldRequest = this.request;

      this.request = null;
      oldRequest.onreadystatechange = null;
      oldRequest.abort();
    }
  }
  start() {
    this.started = true;

    console.log('start');

    // request the specified URL
    this.request = xhr({
      uri: this.src,
      withCredentials: this.withCredentials
    }, (error, req) => {
      // disposed
      if (!this.request) {
        return;
      }

      // clear the loader's request reference
      this.request = null;

      if (error) {
        this.error = {
          status: req.status,
          message: `HLS playlist request error at URL: ${this.src}.`,
          responseText: req.responseText,
          // MEDIA_ERR_NETWORK
          code: 2
        };
        if (this.state === 'HAVE_NOTHING') {
          this.started = false;
        }
        return this.trigger('error');
      }

      this.src = resolveManifestRedirect(this.handleManifestRedirects, this.src, req);

      const manifest = this._parseManifest({
        manifestString: req.responseText,
        url: this.src
      });

      this.setupInitialPlaylist(manifest);
    });
  }
  pause() {
    if (this.mediaUpdateTimeout) {
      window.clearTimeout(this.mediaUpdateTimeout);
      this.mediaUpdateTimeout = null;
    }

    this.stopRequest();
    if (this.state === 'HAVE_NOTHING') {
      // If we pause the loader before any data has been retrieved, its as if we never
      // started, so reset to an unstarted state.
      this.started = false;
    }
    // Need to restore state now that no activity is happening
    if (this.state === 'SWITCHING_MEDIA') {
      // if the loader was in the process of switching media, it should either return to
      // HAVE_MASTER or HAVE_METADATA depending on if the loader has loaded a media
      // playlist yet. This is determined by the existence of loader.media_
      if (this._media) {
        this.state = 'HAVE_METADATA';
      } else {
        this.state = 'HAVE_MASTER';
      }
    } else if (this.state === 'HAVE_CURRENT_METADATA') {
      this.state = 'HAVE_METADATA';
    }
  }
  load(shouldDelay) {
    if (this.mediaUpdateTimeout) {
      window.clearTimeout(this.mediaUpdateTimeout);
      this.mediaUpdateTimeout = null;
    }
    const media = this.media();

    if (shouldDelay) {
      const delay = media ? ((media.partTargetDuration || media.targetDuration) / 2) * 1000 : 5 * 1000;

      this.mediaUpdateTimeout = window.setTimeout(() => {
        this.mediaUpdateTimeout = null;
        this.load();
      }, delay);

      return;
    }

    if (!this.started) {
      this.start();
      return;
    }

    if (media && !media.endList) {
      this.trigger('mediaupdatetimeout');
    } else {
      this.trigger('loadedplaylist');
    }
  }
  _parseManifest({url, manifestString}) {
    console.log('parse manifest', url);
    return parseManifest({
      manifestString,
      customTagParsers: [],
      customTagMappers: [],
      experimentalLLHLS: false
    });
  }
  setupInitialPlaylist(manifest) {
    this.state = 'HAVE_MASTER';

    if(manifest.playlists) {
      console.log('has playlists');
      this.master = manifest;
      console.log('master', this.master);
      console.log('manifest', manifest);

      addPropertiesToMaster(this.master, this.src);

      // If the initial master playlist has playlists wtih segments already resolved,
      // then resolve URIs in advance, as they are usually done after a playlist request,
      // which may not happen if the playlist is resolved.
      manifest.playlists.forEach((playlist) => {
        console.log('playlist', playlist);
        playlist.segments = getAllSegments(playlist);

        playlist.segments.forEach((segment) => {
          resolveSegmentUris(segment, playlist.resolvedUri);
        });
      });
      this.trigger('loadedplaylist');
      console.log('master', this.master);

      if (!this.request) {
        // no media playlist was specifically selected so start
        // from the first listed one
        this.media(this.master.playlists[0]);
      }

      return;
    }

    console.log('CONTINUE');

    // In order to support media playlists passed in as vhs-json, the case where the uri
    // is not provided as part of the manifest should be considered, and an appropriate
    // default used.
    const uri = this.src || window.location.href;
    console.log(uri);

    this.master = masterForMedia(manifest, uri);
    console.log(this.master);

    this.haveMetadata({
      playlistObject: manifest,
      url: uri,
      id: this.master.playlists[0].id
    });
    this.trigger('loadedmetadata');



    /*
    manifest.segments.forEach((segment) => {
      resolveSegmentUris(segment, uri);
    });
     */

    //console.log(manifest);



    /*




    // Replace this value with your files codec info
    const mime = 'video/mp4; codecs="mp4a.40.2,avc1.64001f"';


  // segments
    let segments = [
      'https://test-streams.mux.dev/x36xhzz/url_2/url_526/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_527/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_528/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_529/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_530/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_531/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_532/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_533/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_534/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_535/193039199_mp4_h264_aac_ld_7.ts',
      'https://test-streams.mux.dev/x36xhzz/url_2/url_536/193039199_mp4_h264_aac_ld_7.ts'
    ];

    if(manifest.segments) {
      segments = [];
      manifest.segments.forEach((segment) => {
        segments.push(segment.resolvedUri);
      });
    }

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
     */
  }
  haveMetadata({ playlistString, playlistObject, url, id }) {
    // any in-flight request is now finished
    this.request = null;
    this.state = 'HAVE_METADATA';

    const playlist = playlistObject || this._parseManifest({
      url,
      manifestString: playlistString
    });

    playlist.lastRequest = Date.now();

    setupMediaPlaylist({
      playlist,
      uri: url,
      id
    });

    // merge this playlist into the master
    const update = updateMaster(this.master, playlist);

    this.targetDuration = playlist.partTargetDuration || playlist.targetDuration;

    this._pendingMedia = null;

    if (update) {
      this.master = update;
      this._media = this.master.playlists[id];
    } else {
      this.trigger('playlistunchanged');
    }

    this._updateMediaUpdateTimeout(refreshDelay(this.media(), !!update));

    this.trigger('loadedplaylist');
  }
  media(playlist, shouldDelay) {
    // getter
    if (!playlist) {
      return this._media;
    }

    // setter
    if (this.state === 'HAVE_NOTHING') {
      throw new Error('Cannot switch media playlist from ' + this.state);
    }

    // find the playlist object if the target playlist has been
    // specified by URI
    if (typeof playlist === 'string') {
      if (!this.master.playlists[playlist]) {
        throw new Error('Unknown playlist URI: ' + playlist);
      }
      playlist = this.master.playlists[playlist];
    }

    window.clearTimeout(this.finalRenditionTimeout);

    if (shouldDelay) {
      const delay = ((playlist.partTargetDuration || playlist.targetDuration) / 2) * 1000 || 5 * 1000;

      this.finalRenditionTimeout =
        window.setTimeout(this.media.bind(this, playlist, false), delay);
      return;
    }

    const startingState = this.state;
    const mediaChange = !this._media || playlist.id !== this._media.id;
    const masterPlaylistRef = this.master.playlists[playlist.id];

    // switch to fully loaded playlists immediately
    if (masterPlaylistRef && masterPlaylistRef.endList ||
      // handle the case of a playlist object (e.g., if using vhs-json with a resolved
      // media playlist or, for the case of demuxed audio, a resolved audio media group)
      (playlist.endList && playlist.segments.length)) {

      // abort outstanding playlist requests
      if (this.request) {
        this.request.onreadystatechange = null;
        this.request.abort();
        this.request = null;
      }
      this.state = 'HAVE_METADATA';
      this._media = playlist;

      // trigger media change if the active media has been updated
      if (mediaChange) {
        this.trigger('mediachanging');

        if (startingState === 'HAVE_MASTER') {
          // The initial playlist was a master manifest, and the first media selected was
          // also provided (in the form of a resolved playlist object) as part of the
          // source object (rather than just a URL). Therefore, since the media playlist
          // doesn't need to be requested, loadedmetadata won't trigger as part of the
          // normal flow, and needs an explicit trigger here.
          this.trigger('loadedmetadata');
        } else {
          this.trigger('mediachange');
        }
      }
      return;
    }

    // We update/set the timeout here so that live playlists
    // that are not a media change will "start" the loader as expected.
    // We expect that this function will start the media update timeout
    // cycle again. This also prevents a playlist switch failure from
    // causing us to stall during live.
    this._updateMediaUpdateTimeout(refreshDelay(playlist, true));

    // switching to the active playlist is a no-op
    if (!mediaChange) {
      return;
    }

    this.state = 'SWITCHING_MEDIA';

    // there is already an outstanding playlist request
    if (this.request) {
      if (playlist.resolvedUri === this.request.url) {
        // requesting to switch to the same playlist multiple times
        // has no effect after the first
        return;
      }
      this.request.onreadystatechange = null;
      this.request.abort();
      this.request = null;
    }

    // request the new playlist
    if (this._media) {
      this.trigger('mediachanging');
    }

    this._pendingMedia = playlist;

    // TODO:
    this.request = xhr({
      uri: playlist.resolvedUri,
      withCredentials: this.withCredentials
    }, (error, req) => {
      // disposed
      if (!this.request) {
        return;
      }

      playlist.lastRequest = Date.now();

      playlist.resolvedUri = resolveManifestRedirect(this.handleManifestRedirects, playlist.resolvedUri, req);

      if (error) {
        return this.playlistRequestError(this.request, playlist, startingState);
      }

      console.log(req.responseText);

      this.haveMetadata({
        playlistString: req.responseText,
        url: playlist.uri,
        id: playlist.id
      });

      // fire loadedmetadata the first time a media playlist is loaded
      if (startingState === 'HAVE_MASTER') {
        this.trigger('loadedmetadata');
      } else {
        this.trigger('mediachange');
      }
    });
  }
}

const addLLHLSQueryDirectives = (uri, media) => {
  if (media.endList || !media.serverControl) {
    return uri;
  }

  const parameters = {};

  if (media.serverControl.canBlockReload) {
    const {preloadSegment} = media;
    // next msn is a zero based value, length is not.
    let nextMSN = media.mediaSequence + media.segments.length;

    // If preload segment has parts then it is likely
    // that we are going to request a part of that preload segment.
    // the logic below is used to determine that.
    if (preloadSegment) {
      const parts = preloadSegment.parts || [];
      // _HLS_part is a zero based index
      const nextPart = getKnownPartCount(media) - 1;

      // if nextPart is > -1 and not equal to just the
      // length of parts, then we know we had part preload hints
      // and we need to add the _HLS_part= query
      if (nextPart > -1 && nextPart !== (parts.length - 1)) {
        // add existing parts to our preload hints
        // eslint-disable-next-line
        parameters._HLS_part = nextPart;
      }

      // this if statement makes sure that we request the msn
      // of the preload segment if:
      // 1. the preload segment had parts (and was not yet a full segment)
      //    but was added to our segments array
      // 2. the preload segment had preload hints for parts that are not in
      //    the manifest yet.
      // in all other cases we want the segment after the preload segment
      // which will be given by using media.segments.length because it is 1 based
      // rather than 0 based.
      if (nextPart > -1 || parts.length) {
        nextMSN--;
      }
    }

    // add _HLS_msn= in front of any _HLS_part query
    // eslint-disable-next-line
    parameters._HLS_msn = nextMSN;
  }

  if (media.serverControl && media.serverControl.canSkipUntil) {
    // add _HLS_skip= infront of all other queries.
    // eslint-disable-next-line
    parameters._HLS_skip = (media.serverControl.canSkipDateranges ? 'v2' : 'YES');
  }

  if (Object.keys(parameters).length) {
    const parsedUri = new window.URL(uri);

    ['_HLS_skip', '_HLS_msn', '_HLS_part'].forEach(function(name) {
      if (!parameters.hasOwnProperty(name)) {
        return;
      }

      parsedUri.searchParams.set(name, parameters[name]);
    });

    uri = parsedUri.toString();
  }

  return uri;
};

export const refreshDelay = (media, update) => {
  const segments = media.segments || [];
  const lastSegment = segments[segments.length - 1];
  const lastPart = lastSegment && lastSegment.parts && lastSegment.parts[lastSegment.parts.length - 1];
  const lastDuration = lastPart && lastPart.duration || lastSegment && lastSegment.duration;

  if (update && lastDuration) {
    return lastDuration * 1000;
  }

  // if the playlist is unchanged since the last reload or last segment duration
  // cannot be determined, try again after half the target duration
  return (media.partTargetDuration || media.targetDuration || 10) * 500;
};

export const updateSegment = (a, b) => {
  if (!a) {
    return b;
  }

  const result = mergeObjects(a, b);

  // if only the old segment has preload hints
  // and the new one does not, remove preload hints.
  if (a.preloadHints && !b.preloadHints) {
    delete result.preloadHints;
  }

  // if only the old segment has parts
  // then the parts are no longer valid
  if (a.parts && !b.parts) {
    delete result.parts;
    // if both segments have parts
    // copy part propeties from the old segment
    // to the new one.
  } else if (a.parts && b.parts) {
    for (let i = 0; i < b.parts.length; i++) {
      if (a.parts && a.parts[i]) {
        result.parts[i] = mergeObjects(a.parts[i], b.parts[i]);
      }
    }
  }

  // set skipped to false for segments that have
  // have had information merged from the old segment.
  if (!a.skipped && b.skipped) {
    result.skipped = false;
  }

  // set preload to false for segments that have
  // had information added in the new segment.
  if (a.preload && !b.preload) {
    result.preload = false;
  }

  return result;
};

export const updateSegments = (original, update, offset) => {
  const oldSegments = original.slice();
  const newSegments = update.slice();

  offset = offset || 0;
  const result = [];

  let currentMap;

  for (let newIndex = 0; newIndex < newSegments.length; newIndex++) {
    const oldSegment = oldSegments[newIndex + offset];
    const newSegment = newSegments[newIndex];

    if (oldSegment) {
      currentMap = oldSegment.map || currentMap;

      result.push(updateSegment(oldSegment, newSegment));
    } else {
      // carry over map to new segment if it is missing
      if (currentMap && !newSegment.map) {
        newSegment.map = currentMap;
      }

      result.push(newSegment);

    }
  }
  return result;
};

export const resolveSegmentUris = (segment, baseUri) => {
  // preloadSegment will not have a uri at all
  // as the segment isn't actually in the manifest yet, only parts
  if (!segment.resolvedUri && segment.uri) {
    segment.resolvedUri = resolveUrl(baseUri, segment.uri);
  }
  if (segment.key && !segment.key.resolvedUri) {
    segment.key.resolvedUri = resolveUrl(baseUri, segment.key.uri);
  }
  if (segment.map && !segment.map.resolvedUri) {
    segment.map.resolvedUri = resolveUrl(baseUri, segment.map.uri);
  }

  if (segment.map && segment.map.key && !segment.map.key.resolvedUri) {
    segment.map.key.resolvedUri = resolveUrl(baseUri, segment.map.key.uri);
  }
  if (segment.parts && segment.parts.length) {
    segment.parts.forEach((p) => {
      if (p.resolvedUri) {
        return;
      }
      p.resolvedUri = resolveUrl(baseUri, p.uri);
    });
  }

  if (segment.preloadHints && segment.preloadHints.length) {
    segment.preloadHints.forEach((p) => {
      if (p.resolvedUri) {
        return;
      }
      p.resolvedUri = resolveUrl(baseUri, p.uri);
    });
  }
}

export const getAllSegments = function(media) {
  const segments = media.segments || [];
  const preloadSegment = media.preloadSegment;

  // a preloadSegment with only preloadHints is not currently
  // a usable segment, only include a preloadSegment that has
  // parts.
  if (preloadSegment && preloadSegment.parts && preloadSegment.parts.length) {
    // if preloadHints has a MAP that means that the
    // init segment is going to change. We cannot use any of the parts
    // from this preload segment.
    if (preloadSegment.preloadHints) {
      for (let i = 0; i < preloadSegment.preloadHints.length; i++) {
        if (preloadSegment.preloadHints[i].type === 'MAP') {
          return segments;
        }
      }
    }
    // set the duration for our preload segment to target duration.
    preloadSegment.duration = media.targetDuration;
    preloadSegment.preload = true;

    segments.push(preloadSegment);
  }

  return segments;
}

export const isPlaylistUnchanged = (a, b) => a === b ||
  (a.segments && b.segments && a.segments.length === b.segments.length &&
    a.endList === b.endList &&
    a.mediaSequence === b.mediaSequence &&
    a.preloadSegment === b.preloadSegment);

export const updateMaster = (master, newMedia, unchangedCheck = isPlaylistUnchanged) => {
  const result = mergeObjects(master, {});
  const oldMedia = result.playlists[newMedia.id];

  if (!oldMedia) {
    return null;
  }

  if (unchangedCheck(oldMedia, newMedia)) {
    return null;
  }

  newMedia.segments = getAllSegments(newMedia);

  const mergedPlaylist = mergeObjects(oldMedia, newMedia);

  // always use the new media's preload segment
  if (mergedPlaylist.preloadSegment && !newMedia.preloadSegment) {
    delete mergedPlaylist.preloadSegment;
  }

  // if the update could overlap existing segment information, merge the two segment lists
  if (oldMedia.segments) {
    if (newMedia.skip) {
      newMedia.segments = newMedia.segments || [];
      // add back in objects for skipped segments, so that we merge
      // old properties into the new segments
      for (let i = 0; i < newMedia.skip.skippedSegments; i++) {
        newMedia.segments.unshift({skipped: true});
      }
    }
    mergedPlaylist.segments = updateSegments(
      oldMedia.segments,
      newMedia.segments,
      newMedia.mediaSequence - oldMedia.mediaSequence
    );
  }

  // resolve any segment URIs to prevent us from having to do it later
  mergedPlaylist.segments.forEach((segment) => {
    resolveSegmentUris(segment, mergedPlaylist.resolvedUri);
  });

  // TODO Right now in the playlists array there are two references to each playlist, one
  // that is referenced by index, and one by URI. The index reference may no longer be
  // necessary.
  for (let i = 0; i < result.playlists.length; i++) {
    if (result.playlists[i].id === newMedia.id) {
      result.playlists[i] = mergedPlaylist;
    }
  }
  result.playlists[newMedia.id] = mergedPlaylist;
  // URI reference added for backwards compatibility
  result.playlists[newMedia.uri] = mergedPlaylist;

  // update media group playlist references.
  forEachMediaGroup(master, (properties, mediaType, groupKey, labelKey) => {
    if (!properties.playlists) {
      return;
    }
    for (let i = 0; i < properties.playlists.length; i++) {
      if (newMedia.id === properties.playlists[i].id) {
        properties.playlists[i] = mergedPlaylist;
      }
    }
  });

  return result;
}
