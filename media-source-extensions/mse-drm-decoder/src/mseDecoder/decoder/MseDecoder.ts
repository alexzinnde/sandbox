import configureForClearKey, { SupportedKeySystem } from '../mediaKeys/configureMediaKeys';
import MseDecoderConfigType, {MseDecoderOptionsType} from './MseDecoderConfigType';

type TrackKind = 'audio' | 'video';
type DataWithStatusPromise = {
  data: ArrayBuffer;
  resolveStatusPromise: (status: Status) => void;
};
type TrackBuffer = {
  mimeCodecType: string;
  buffer: DataWithStatusPromise[];
  sourceBuffer?: SourceBuffer;
  writer?: (data: ArrayBuffer) => Status;
};
type TrackBuffers = Record<TrackKind, TrackBuffer>;
type TrackWriter = (data: ArrayBuffer) => Promise<Status>;
type TrackWriters = Record<TrackKind, TrackWriter>;
type Status = 'OK' | 'ERROR';
type MseDecoderStatisticsType = {
  width: number;
  height: number;
  currentTime: number;
  bytesReceived: number;
  bytesDecoded: number;
  framesReceived: number;
  framesDecoded: number;
};

export default class MseDecoder {
  public status: ReadyState;
  public trackWriters: TrackWriters;
  private _mediaElement: HTMLMediaElement;
  private _options: MseDecoderOptionsType;
  private _mediaSource: MediaSource;
  private _trackBuffers: TrackBuffers;
  private _stats: MseDecoderStatisticsType;

  constructor({mediaElement, options = {}}: MseDecoderConfigType) {
    this.status = 'closed';
    this.trackWriters = {} as TrackWriters;
    this._mediaElement = mediaElement;
    this._options = options;
    this._mediaSource = new MediaSource();
    this._trackBuffers = {} as TrackBuffers;
    this._stats = {
      width: 0,
      height: 0,
      currentTime: 0,
      bytesReceived: 0,
      bytesDecoded: 0,
      framesReceived: 0,
      framesDecoded: 0
    };

    this._initialize();
  }

  public addTrack(mimeCodecType: string): void {
    console.log('[MseDecoder] addTrack for [%s]', mimeCodecType);
    const trackKind = mimeCodecType.split('/').shift() as TrackKind;
    this._trackBuffers[trackKind] = {
      mimeCodecType,
      buffer: []
    };

    if (this.status === 'open') {
      createTrackWriterForTrackBuffers(this._mediaSource, this._trackBuffers, this.trackWriters, this._stats, this._options);
    }
  }

  public getStats(): MseDecoderStatisticsType {
    return {
      ...this._stats,
      currentTime: this._mediaElement.currentTime,
      width: 0,
      height: 0
    };
  }

  private _initialize(): void {
    const onMediaSourceEnded = () => {
      console.warn('[MseDecoder] MediaSource [sourceended]');
      this.status = 'ended';
      this._mediaElement.src = '';
      removeTrackSourceBuffers(this._trackBuffers);
    };
    const onMediaSourceClose = () => {
      console.log('[MseDecoder] MediaSource [sourceclose]');
      this.status = 'closed';
      this._mediaElement.src = URL.createObjectURL(this._mediaSource);
    };
    const onMediaSourceOpen = () => {
      console.log('[MseDecoder] MediaSource [sourceopen]');
      this.status = 'open';
      URL.revokeObjectURL(this._mediaElement.src);
      createTrackWriterForTrackBuffers(this._mediaSource, this._trackBuffers, this.trackWriters, this._stats, this._options);
    };

    this._mediaSource.onsourceended = onMediaSourceEnded;
    this._mediaSource.onsourceclose = onMediaSourceClose;
    this._mediaSource.onsourceopen = onMediaSourceOpen;
    this._mediaElement.src = URL.createObjectURL(this._mediaSource);
  }
}

function createTrackWriterForTrackBuffers(
  mediaSource: MediaSource,
  trackBuffers: TrackBuffers,
  trackWriters: TrackWriters,
  stats: MseDecoderStatisticsType,
  options: MseDecoderOptionsType
) {
  Object.values(trackBuffers).forEach(trackBuffer => {
    if (!trackBuffer.sourceBuffer) {
      const trackKind = trackBuffer.mimeCodecType.split('/').shift() as TrackKind;
      const sourceBuffer = mediaSource.addSourceBuffer(trackBuffer.mimeCodecType);
      sourceBuffer.mode = options.sourceBufferMode ?? 'segments';
      sourceBuffer.onerror = (...args) => {
        console.warn('[MseDecoder] SourceBuffer ERROR [%o]', ...args);
      };
      sourceBuffer.onupdate = () => {
        stats.framesDecoded += 1;
        const dataWithStatusPromise = trackBuffers[trackKind].buffer.shift();

        if (dataWithStatusPromise) {
          dataWithStatusPromise.resolveStatusPromise('OK')
        }
        
        if (trackBuffers[trackKind].buffer.length) {
          feedSourceBuffer(trackBuffers[trackKind].buffer, sourceBuffer);
        }
      };
      trackWriters[trackKind] = (data: ArrayBuffer): Promise<Status> => {
        return new Promise(resolveStatusPromise => {
          trackBuffer.buffer.push({
            data,
            resolveStatusPromise
          });
          feedSourceBuffer(trackBuffer.buffer, sourceBuffer);
        });
      };
      trackBuffer.sourceBuffer = sourceBuffer;
    }
  });
}

function feedSourceBuffer(buffer: DataWithStatusPromise[], sourceBuffer: SourceBuffer) {
  if (!sourceBuffer.updating) {
    const data = buffer[0].data;

    if (data) {
      sourceBuffer.appendBuffer(new Uint8Array(data));
    }
  }
}

function removeTrackSourceBuffers(trackBuffers: TrackBuffers) {
  Object.values(trackBuffers).forEach(trackBuffer => delete trackBuffer.sourceBuffer);
}
