import EventEmitter from "./EventEmitter";

interface IMsePlayer {
  pushSegment(segment: ArrayBuffer): void
}

export type MsePlayerConfigType = {
  videoElement: HTMLVideoElement;
  mimeCodecType: string;
  sourceBufferMode: AppendMode;
  // drmConfig: DrmConfigType;
}

export enum MsePlayerEvents {
  SegmentPush = 'segmentpush',
  SourceBufferError = 'sourcebuffererror',
  AppendToSourceBuffer = 'appendtosourcebuffer',
  VideoElementError = 'videoelementerror',
  ISReceived = 'isreceived',
  RequestPLI = 'requestpli'
}

function isArrayBuffer(item: unknown): item is ArrayBuffer {
  return item instanceof ArrayBuffer;
}

function isIS(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  const firstFourBytes = view.subarray(0, 4);
  const hexString = Array.from(firstFourBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return hexString === '00000018';
}

function feedSourceBuffer(sourceBuffer: SourceBuffer, isoBmffSegments: IsoBmffSegments) {
  if (!sourceBuffer.updating) {
    const segment = isoBmffSegments.shift();
    if (isArrayBuffer(segment)) {
      sourceBuffer.appendBuffer(segment);
    }

    return true;
  }

  return false;
}

function setEventListenersOnVideoElement(videoElement: HTMLVideoElement) {
  const logEvent = function(eventName: string) {console.log('[VideoElement] Event [%s] detected', eventName)};
  videoElement.addEventListener('abort', logEvent.bind(null, 'abort'))
  videoElement.addEventListener('canplaythrough', logEvent.bind(null, 'canplaythrough'))
  videoElement.addEventListener('change', logEvent.bind(null, 'change'))
  videoElement.addEventListener('durationchange', logEvent.bind(null, 'durationchange'))
  videoElement.addEventListener('emptied', logEvent.bind(null, 'emptied'))
  videoElement.addEventListener('ended', logEvent.bind(null, 'ended'))
  videoElement.addEventListener('error', logEvent.bind(null, 'error'))
  videoElement.addEventListener('fullscreenerror', logEvent.bind(null, 'fullscreenerror'))
  videoElement.addEventListener('input', logEvent.bind(null, 'input'))
  videoElement.addEventListener('invalid', logEvent.bind(null, 'invalid'))
  videoElement.addEventListener('playing', logEvent.bind(null, 'playing'))
  videoElement.addEventListener('stalled', logEvent.bind(null, 'stalled'))
  videoElement.addEventListener('suspend', logEvent.bind(null, 'suspend'))
  videoElement.addEventListener('waiting', logEvent.bind(null, 'waiting')) // THIS ONE
  videoElement.addEventListener('waitingforkey', logEvent.bind(null, 'waitingforkey'))
}

export class IsoBmffSegments {
  private _queue: ArrayBuffer[]
  constructor() {
    this._queue = []
  }

  get length() {
    return this._queue.length;
  }

  public push(item: ArrayBuffer) {
    this._queue.push(item)
  }

  public shift() {
    return this._queue.shift()
  }
}

export default class MsePlayer extends EventEmitter implements IMsePlayer {
  protected _videoElement?: HTMLVideoElement;
  protected _isoBmffSegments: IsoBmffSegments;
  protected _mediaSource: MediaSource;
  protected _sourceBuffer: SourceBuffer;
  public mimeCodecType: string;
  public sourceBufferMode: AppendMode;

  private _playbackStartedAt: number;
  private _initializationSegment: ArrayBuffer;

  constructor({videoElement, sourceBufferMode, mimeCodecType}: MsePlayerConfigType) {
    super();
    this._isoBmffSegments = new IsoBmffSegments();

    this.mimeCodecType = mimeCodecType;
    this.sourceBufferMode = sourceBufferMode;
    this._videoElement = videoElement;
    this._playbackStartedAt = 0;

    this._initialize();
  }

  public getIsoBmffSegmentsLength() {
    return this._isoBmffSegments.length;
  }

  public pushSegment(segment: ArrayBuffer): void {
    if (isArrayBuffer(segment)) {
      if (isIS(segment)) {
        this.emit(MsePlayerEvents.ISReceived)
        this._initializationSegment = segment;
      }

      this._isoBmffSegments.push(segment);
      this.emit('segmentpush', {isoBmffSegments: this._isoBmffSegments.length});
    } else {
      console.warn('[MsePlayer] Segment not of type [ArrayBuffer], discarding [%o]', segment);
    }

    if (this._sourceBuffer && this._playbackStartedAt === 0) {
      this._startPlayback();
    }

    if (!this._sourceBuffer?.updating) {
      feedSourceBuffer(this._sourceBuffer, this._isoBmffSegments);
    }
  }

  private _startPlayback() {
    console.log('[MsePlayer] Starting playback')
    if (this._playbackStartedAt !== 0) {
      throw new Error('Attempting to start playback after it playback has started')
    }

    const now = Date.now()
    this._playbackStartedAt = now;
    feedSourceBuffer(this._sourceBuffer, this._isoBmffSegments);
  }

  private _initialize() {
    this._mediaSource  = new MediaSource();

    if (this._videoElement) {
      this._videoElement.src = URL.createObjectURL(this._mediaSource);
      setEventListenersOnVideoElement(this._videoElement);
    }

    this._mediaSource.onsourceopen = onMediaSourceOpen.bind(this);
    this._videoElement?.play();
  }
}

function onMediaSourceOpen(this: MsePlayer) {
  URL.revokeObjectURL(this._videoElement!.src);
  this._sourceBuffer = this._mediaSource.addSourceBuffer(this.mimeCodecType);
  this._sourceBuffer.mode = this.sourceBufferMode;
  this._sourceBuffer.onerror = (event: Event) => {
    this.emit(MsePlayerEvents.SourceBufferError, {sourceBufferError: event})
  };
  this._sourceBuffer.onupdateend = () => {
    if (feedSourceBuffer(this._sourceBuffer, this._isoBmffSegments)) {
      this.emit(MsePlayerEvents.AppendToSourceBuffer)
    } else {
      feedSourceBuffer(this._sourceBuffer, this._isoBmffSegments)
    }
  }
}