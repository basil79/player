import EventBus from './event-bus';
import PlaylistLoader from './playlist-loader';

export class MasterPlaylistController extends EventBus {
  constructor(options) {
    super();

    const {
      src,
      handleManifestRedirects,
      withCredentials
    } = options;

    if (!src) {
      throw new Error('A non-empty playlist URL or JSON manifest string is required');
    }

    this.withCredentials = withCredentials;
    this._requestOptions = {
      withCredentials,
      handleManifestRedirects
    };

    this.mediaSource = new window.MediaSource();

    this._handleDurationChange = this._handleDurationChange.bind(this);
    this._handleSourceOpen = this._handleSourceOpen.bind(this);
    this._handleSourceEnded = this._handleSourceEnded.bind(this);

    this.mediaSource.addEventListener('durationchange', this._handleDurationChange);

    // load the media source into the player
    this.mediaSource.addEventListener('sourceopen', this._handleSourceOpen);
    this.mediaSource.addEventListener('sourceended', this._handleSourceEnded);
    // we don't have to handle sourceclose since dispose will handle termination of
    // everything, and the MediaSource should not be detached without a proper disposal


    // Playlist loader
    this._masterPlaylistLoader = new PlaylistLoader(src, this._requestOptions);
    this._setupMasterPlaylistLoaderListeners();

    // load
    this._masterPlaylistLoader.load();
  }
  _handleDurationChange() {
    console.log('durationchange');
    this.trigger('durationchange');
  }
  _handleSourceOpen() {
    console.log('sourceopen');
    this.trigger('sourceopen');
  }
  _handleSourceEnded() {
    console.log('sourceended');
  }
  _setupMasterPlaylistLoaderListeners() {
    // subscribe for events
    this._masterPlaylistLoader.on('loadedmetadata', () => {
      console.log('player > loadedmetadata');
      const media = this._masterPlaylistLoader.media();
      const requestTimeout = (media.targetDuration * 1.5) * 1000;

      // If we don't have any more available playlists, we don't want to
      // timeout the request.
      // TODO:

      // if this isn't a live video and preload permits, start
      // downloading segments
      if(media.endList) {
        console.log('not live');
      }

      console.log(media);
      console.log(requestTimeout);

      // segment loader


    });

    this._masterPlaylistLoader.on('loadedplaylist', () => {
      console.log('player > loadedplaylist');
    });
  }
}
