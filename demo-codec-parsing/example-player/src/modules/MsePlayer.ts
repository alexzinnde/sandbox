import PreBuffer from './PreBuffer.js'
import MediaElementEventManager from './MediaElementEventManager.js'

export type MsePlayerConfigType = {
  mimeCodecType: string
  sourceBufferMode: AppendMode
  mediaElement?: HTMLMediaElement
}

function logEvent(context: string, eventName: string, level: 'info' | 'warn' | 'error', ...args: unknown[]) {
  switch (level) {
    case 'info':
      console.log('[%s] Event [%s] detected. [%o]', context, eventName, ...args);

      break;
    case 'warn':
      console.warn('[%s] Event [%s] detected. [%o]', context, eventName, ...args);

      break;
    case 'error':
      console.error('[%s] Event [%s] detected. [%o]', context, eventName, ...args);

      break;

    default:
      console.log('[%s] Event [%s] detected. [%o]', context, eventName, ...args);
  }
}

function attachMediaElement(this: MsePlayer, mediaElement: HTMLMediaElement) {
  console.log('[MsePlayer] attachMediaElement this [%o]', this)
  if (this._mediaElement) {
    detachMedia.call(this)
  }

  this._mediaElement = mediaElement
  this._mediaElementEventManager.attachMedia(this._mediaElement)
  initializeMediaSource.call(this);
}

function initializeMediaSource(this: MsePlayer) {
  console.log('[MsePlayer] Creating MediaSource')
  this._mediaSource = new MediaSource();
  this._mediaSource.onsourceopen = () => {
    console.log('[MsePlayer] MediaSource opened')
    URL.revokeObjectURL(this._mediaElement.src);

    console.log('[MsePlayer] Adding SourceBuffer')
    this._sourceBuffer = this._mediaSource.addSourceBuffer(this._mimeCodecType);
    this._sourceBuffer.mode = this._sourceBufferMode;

    this._sourceBuffer.onerror = (e) => {
      console.error('[SourceBuffer] error [%o]', e)
    }
    this._sourceBuffer.onabort = () => {
      // console.warn('[SourceBuffer] abort')
    }
    this._sourceBuffer.onupdatestart = () => {
      // console.warn('[SourceBuffer] updatestart')
    }
    this._sourceBuffer.onupdate = () => {
      // console.warn('[SourceBuffer] update')
    }
    this._sourceBuffer.onupdateend = () => {
      // console.warn('[SourceBuffer] updateend')

    }
  }
  this._mediaSource.onsourceclose = () => {
    // console.error('[MediaSource] Event [sourceclose]')
  }
  this._mediaSource.onsourceended = () => {
    // console.error('[MediaSource] Event [sourceended]')
  }
  this._mediaElement.src = URL.createObjectURL(this._mediaSource);
  this._mediaElement.play()
}

function detachMedia(this: MsePlayer) {
  console.log('[MsePlayer] detachMedia  this [%o]', this)
  this._mediaElement?.pause()
  this._playbackStartedAt = 0
  this._sourceBuffer?.abort()

  if (this._sourceBuffer) {
    this._mediaSource.removeSourceBuffer(this._sourceBuffer)
  }
  this._abortController.abort('detachMedia')

  delete this._sourceBuffer
  this._mediaElement.load()
  delete this._mediaElement
}

function feedSourceBuffer(this: MsePlayer) {
  if (this._sourceBuffer && !this._sourceBuffer?.updating) {
    const chunk = this._preBuffer.shift()
    this._sourceBuffer.appendBuffer(chunk);
  }
}

function onMediaPlay(this: MsePlayer) {
  this._playbackStartedAt = Date.now();
}

function onMediaStalled(this: MsePlayer) {
  console.error('[MediaElement] Event [stalled] detected!')
}

function pushChunk(this: MsePlayer, chunk: ArrayBuffer) {
  this._preBuffer.push(chunk);
}


export default class MsePlayer {
  protected _mimeCodecType: string;
  protected _sourceBufferMode: AppendMode;
  protected _mediaElement?: HTMLMediaElement;
  protected _mediaElementEventManager: MediaElementEventManager
  protected _playbackStartedAt: number;
  protected _preBuffer: PreBuffer;
  protected _mediaSource?: MediaSource;
  protected _sourceBuffer?: SourceBuffer;

  protected _abortController: AbortController;

  constructor({ mimeCodecType, sourceBufferMode, mediaElement }: MsePlayerConfigType) {
    this._mimeCodecType = mimeCodecType;
    this._sourceBufferMode = sourceBufferMode;
    this._mediaElement = mediaElement;
    this._playbackStartedAt = 0;
    this._preBuffer = new PreBuffer({
      onPush: () => {
        if (this._playbackStartedAt > 0) {
          feedSourceBuffer.call(this)
        }
      }
    })
    const abortController = new AbortController()
    this._abortController = abortController;
    this._mediaElementEventManager = new MediaElementEventManager({
      abortController,
      mediaElement,
      listeners: {
        play: onMediaPlay.bind(this),
        stalled: onMediaStalled.bind(this),
        abort: logEvent.bind(this, 'MsePlayer] [MediaElement', 'abort', 'info'),
        cancel: logEvent.bind(this, 'MsePlayer] [MediaElement', 'cancel', 'info'),
        canplaythrough: logEvent.bind(this, 'MsePlayer] [MediaElement', 'canplaythrough', 'info'),
        change: logEvent.bind(this, 'MsePlayer] [MediaElement', 'change', 'info'),
        close: logEvent.bind(this, 'MsePlayer] [MediaElement', 'close', 'info'),
        durationchange: () => { },
        emptied: logEvent.bind(this, 'MsePlayer] [MediaElement', 'emptied', 'error'),
        encrypted: logEvent.bind(this, 'MsePlayer] [MediaElement', 'encrypted', 'warn'),
        ended: logEvent.bind(this, 'MsePlayer] [MediaElement', 'ended', 'info'),
        error: logEvent.bind(this, 'MsePlayer] [MediaElement', 'error', 'error'),
        invalid: logEvent.bind(this, 'MsePlayer] [MediaElement', 'invalid', 'error'),
        pause: logEvent.bind(this, 'MsePlayer] [MediaElement', 'pause', 'info'),
        waiting: logEvent.bind(this, 'MsePlayer] [MediaElement', 'waiting', 'info'),
        playing: () => { },
        progress: () => { },
        ratechange: () => { },
        reset: logEvent.bind(this, 'MsePlayer] [MediaElement', 'reset', 'info'),
        suspend: logEvent.bind(this, 'MsePlayer] [MediaElement', 'suspend', 'info'),
        timeupdate: () => { }
      }
    })
  }

  public log() {
    console.log('[MsePlayer] PreBuffer [%o]', this._preBuffer);
    console.log('[MsePlayer] sourceBuffer [%o]', this._sourceBuffer);

  }

  public pushChunk(chunk: ArrayBuffer) {
    pushChunk.call(this, chunk);
  }

  public startPlayback(mediaElement?: HTMLMediaElement) {
    this._playbackStartedAt = Date.now()
    this._preBuffer.allowIncoming()

    if (!this._mediaElement) {
      attachMediaElement.call(this, mediaElement)
    }
    if (!this._mediaSource) {
      initializeMediaSource.call(this)
    }
  }

  public attachMedia(mediaElement: HTMLMediaElement) {
    attachMediaElement.call(this, mediaElement);
  }

  public stop() {
    detachMedia.call(this);
  }
}