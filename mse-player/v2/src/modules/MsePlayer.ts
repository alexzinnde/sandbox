import EventEmitter from "./EventEmitter";

export interface IMsePlayer {
  pushSegment(segment: ArrayBuffer): void
}

export type MsePlayerConfigType = {
  videoElement?: HTMLVideoElement;
  mimeCodecType: string;
  sourceBufferMode: AppendMode;
}

function isArrayBuffer(item: unknown): item is ArrayBuffer {
  return item instanceof ArrayBuffer;
}

function isInitializationSegment(segment: ArrayBuffer): boolean {
  const view = new Uint8Array(segment);
  const firstFourBytes = view.subarray(0, 4);
  const hexString = Array.from(firstFourBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return hexString === '00000018';
}

export enum MsePlayerEvents {
  RequestPLI = 'requestpli'
}

const logEvent = function(eventName: string) {console.log('[VideoElement] Event [%s] detected', eventName)};


function setEventListenersOnVideoElement(videoElement: HTMLVideoElement) {
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
function removeEventListenersOnVideoElement(videoElement: HTMLVideoElement) {
  videoElement.removeEventListener('abort', logEvent.bind(null, 'abort'))
  videoElement.removeEventListener('canplaythrough', logEvent.bind(null, 'canplaythrough'))
  videoElement.removeEventListener('change', logEvent.bind(null, 'change'))
  videoElement.removeEventListener('durationchange', logEvent.bind(null, 'durationchange'))
  videoElement.removeEventListener('emptied', logEvent.bind(null, 'emptied'))
  videoElement.removeEventListener('ended', logEvent.bind(null, 'ended'))
  videoElement.removeEventListener('error', logEvent.bind(null, 'error'))
  videoElement.removeEventListener('fullscreenerror', logEvent.bind(null, 'fullscreenerror'))
  videoElement.removeEventListener('input', logEvent.bind(null, 'input'))
  videoElement.removeEventListener('invalid', logEvent.bind(null, 'invalid'))
  videoElement.removeEventListener('playing', logEvent.bind(null, 'playing'))
  videoElement.removeEventListener('stalled', logEvent.bind(null, 'stalled'))
  videoElement.removeEventListener('suspend', logEvent.bind(null, 'suspend'))
  videoElement.removeEventListener('waiting', logEvent.bind(null, 'waiting')) // THIS ONE
  videoElement.removeEventListener('waitingforkey', logEvent.bind(null, 'waitingforkey'))
}

export default class MsePlayer extends EventEmitter implements IMsePlayer {
  public mimeCodecType: string
  
  private _segments: ArrayBuffer[];
  private _sourceBufferMode: AppendMode;
  private _videoElement?: HTMLVideoElement | null;

  private _initializationSegment: ArrayBuffer;
  private _initializationVector: ArrayBuffer;
  private _setInitializationVector: boolean

  private _mediaSource: MediaSource
  private _sourceBuffer: SourceBuffer
  private _keepFeedingSourceBuffer: boolean;

  private _playbackStartedAt: number;
  

  constructor({mimeCodecType, videoElement, sourceBufferMode}: MsePlayerConfigType) {
    super();
    this.mimeCodecType = mimeCodecType

    this._segments = []
    this._sourceBufferMode = sourceBufferMode;
    this._setInitializationVector = false;
    this._initializationSegment = null;
    this._initializationVector = null;
    this._keepFeedingSourceBuffer = false;
    this._playbackStartedAt = 0;

    if (videoElement) {
      this._videoElement = videoElement;
    }
  }

  public setVideoElement(videoElement: HTMLVideoElement) {
    if (this._videoElement) {
      this.emit(MsePlayerEvents.RequestPLI)
      this._disposeVideoElement();
      this._segments = [];
      this._initializationSegment = null;
      this._initializationVector = null
    }
    this._videoElement = videoElement;

    setEventListenersOnVideoElement(this._videoElement);
    
    this._keepFeedingSourceBuffer = true;
    this._initializeMediaSource();
  }

  public pushSegment(segment: ArrayBuffer): void {
    if (this._setInitializationVector) {
      this._initializationVector = segment;
      this._setInitializationVector = false;
    }

    if (isInitializationSegment(segment)) {
      console.log('[MsePlayer] Received IS')
      this._initializationSegment = segment;
      this._setInitializationVector = true;

      if (!this._keepFeedingSourceBuffer && this._segments.length > 0) {
        console.log('[MsePlayer] Clearing segments')
        this._segments = []
      }
    }

    this._segments.push(segment);

    if (this._playbackStartedAt === 0) {
      this._playbackStartedAt = Date.now();
      this._initializeMediaSource()
    }

    if (this._sourceBuffer && this._keepFeedingSourceBuffer) {
      this._feedSourceBuffer()
    }
  }

  private _disposeVideoElement() {
    removeEventListenersOnVideoElement(this._videoElement!)
    this._keepFeedingSourceBuffer = false;
    this._videoElement?.removeAttribute('src');
    if (this._sourceBuffer.updating) {
      this._sourceBuffer.abort();
    }
    this._videoElement = null;
  }

  private _feedSourceBuffer() {
    const segment = this._segments.shift();

    if (isArrayBuffer(segment)) {
      return this._sourceBuffer.appendBuffer(segment);
    }
  
    console.warn('[MsePlayer] Attempting to append segment not of type [ArrayBuffer]')
  }

  private _initializeMediaSource() {
    this._mediaSource = new MediaSource();
    this._mediaSource.onsourceopen = () => {
      console.log('[MsePlayer] MediaSource [sourceopen]')
      URL.revokeObjectURL(this._videoElement!.src)
      this._sourceBuffer = this._mediaSource.addSourceBuffer(this.mimeCodecType)
      this._sourceBuffer.mode = 'sequence';

      this._sourceBuffer.onerror = () => console.error('[SourceBuffer] Error')
      this._sourceBuffer.onabort = () => console.warn('[SourceBuffer] Error')
      this._sourceBuffer.onupdatestart = () => {
        this._keepFeedingSourceBuffer = false;
      }
      this._sourceBuffer.onupdate = () =>  {
        this._keepFeedingSourceBuffer = true;
      }
      this._sourceBuffer.onupdateend = () => {
        if (this._keepFeedingSourceBuffer && this._segments.length > 0) {
          this._feedSourceBuffer();
        }
      }
    }
    
    if (this._videoElement) {
      this._videoElement.src = URL.createObjectURL(this._mediaSource);
      this._videoElement.play();
    }

    this._keepFeedingSourceBuffer = true;
  }
}