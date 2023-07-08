export type Status = 'OK' | 'ERROR';
type dataWithPromise = {
  data: ArrayBuffer;
  resolveStatusPromise: (status: Status) => void;
};

export type TrackWriter = (data: ArrayBuffer) => Promise<Status>;

type TrackBuffer = {
  mimeCodecType: string;
  buffer: dataWithPromise[];
  sourceBuffer: SourceBuffer;
  resolveTrackWriter?: (trackWriter: TrackWriter) => void;
};

export type TrackType = 'audio' | 'video';
export type TrackBuffers = Record<TrackType, TrackBuffer>;
export type PendingTrackWriterCreates = {
  mimeCodecType: string;
  resolveTrackWriter: (trackWriter: TrackWriter) => void;
}[];

export type MseDecoderOptionsType = {
  sourceBufferMode?: AppendMode;
};

export type MseDecoderStatisticsType = {
  timestamp: number;
  currentTime: number;
  width: number;
  height: number;
  bytesReceived: number;
  bytesDecoded: number;
  framesReceived: number;
  framesDecoded: number;
};

export default class MseDecoder {
  public status: ReadyState;
  private _videoElement: HTMLVideoElement;
  private _options?: MseDecoderOptionsType;
  private _mediaSource: MediaSource;
  private _trackBuffers: TrackBuffers;
  private _pendingTrackWriterCreates: PendingTrackWriterCreates;
  private _stats: MseDecoderStatisticsType;

  constructor(videoElement: HTMLVideoElement, options?: MseDecoderOptionsType) {
    this.status = 'closed';
    this._videoElement = videoElement;
    this._options = options;
    this._trackBuffers = {} as TrackBuffers;
    this._mediaSource = new MediaSource();
    this._pendingTrackWriterCreates = [];
    this._stats = {
      timestamp: 0,
      currentTime: 0,
      width: 0,
      height: 0,
      bytesReceived: 0,
      bytesDecoded: 0,
      framesReceived: 0,
      framesDecoded: 0,
    };

    this._initialize();
  }

  public async createTrackWriter(mimeCodecType: string): Promise<TrackWriter> {
    return new Promise(resolveTrackWriter => {
      if (this._mediaSource.readyState === 'open') {
        return this._createTrackBuffer(mimeCodecType, resolveTrackWriter);
      }

      console.warn('[MseDecoder][createTrackWriter] readyState [%s]', this._mediaSource.readyState);
      this._pendingTrackWriterCreates.push({
        mimeCodecType,
        resolveTrackWriter
      });
    });
  }

  public getStats(): MseDecoderStatisticsType {
    return {
      ...this._stats,
      currentTime: this._videoElement.currentTime,
      width: this._videoElement.videoWidth ?? this._videoElement.style.width ?? 0,
      height: this._videoElement.videoHeight ?? this._videoElement.style.height ?? 0,
      timestamp: Date.now()
    };
  }

  private _initialize() {
    console.log('[MseDecoder] [initialize] START');
    this._mediaSource.onsourceended = () => {
      console.warn('[MseDecoder] [MediaSource] ended');
      this.status = 'ended';
    };
    this._mediaSource.onsourceclose = () => {
      console.log('[MseDecoder] [MediaSource] close');
      this.status = 'closed';
    };
    this._mediaSource.onsourceopen = () => {
      console.log('[MseDecoder] [MediaSource] open');
      this.status = 'open';
      URL.revokeObjectURL(this._videoElement.src);

      const upperLimit = 2;
      let iteration = 0;

      while (this._pendingTrackWriterCreates.length && iteration < upperLimit) {
        const pendingTrackWriter = this._pendingTrackWriterCreates.shift();
        console.log('[MseDecoder] [MediaSource] pendingTrackWriterCreate [%s]', pendingTrackWriter?.mimeCodecType);
        if (pendingTrackWriter) {
          this._createTrackBuffer(pendingTrackWriter.mimeCodecType, pendingTrackWriter?.resolveTrackWriter);
        }
        iteration += 1;
      }
    };
    this._videoElement.src = URL.createObjectURL(this._mediaSource);
    console.log('[MseDecoder] [initialize] END');
  }

  private _createTrackBuffer(mimeCodecType: string, resolveTrackWriter?: (trackWriter: TrackWriter) => void) {
    console.log('[MseDecoder] [MediaSource] creating TrackBuffer for [%s]', mimeCodecType);
    const trackType = mimeCodecType.split('/').shift();
    if (!isOfTrackType(trackType)) {
      throw new Error(`TrackType unknown [${trackType}]`);
    }

    const sourceBuffer = this._mediaSource.addSourceBuffer(mimeCodecType);
    sourceBuffer.mode = this._options?.sourceBufferMode ?? 'segments';
    this._trackBuffers[trackType] = {
      mimeCodecType,
      buffer: [],
      sourceBuffer
    };

    sourceBuffer.onerror = () => {
      console.warn('[MseDecoder] [SourceBuffer] [%s] error', trackType);
    };
    sourceBuffer.onupdate = () => {
      console.log('[MseDecoder] [SourceBuffer] [%s] update', trackType);
      this._trackBuffers[trackType].buffer[0].resolveStatusPromise('OK');
      this._stats.bytesDecoded += this._trackBuffers[trackType].buffer[0].data.byteLength;
      this._stats.framesDecoded += 1;
      this._trackBuffers[trackType].buffer.shift();

      if (this._trackBuffers[trackType].buffer.length) {
        sourceBuffer.appendBuffer(new Uint8Array(this._trackBuffers[trackType].buffer[0].data));
      }
    };

    const trackWriter = (data: ArrayBuffer): Promise<Status> => {
      this._stats.bytesReceived += data.byteLength;
      this._stats.framesReceived += 1;

      return new Promise(resolveStatusPromise => {
        if (!sourceBuffer.updating) {
          sourceBuffer.appendBuffer(new Uint8Array(data));
        }

        this._trackBuffers[trackType].buffer.push({
          data,
          resolveStatusPromise
        });
      });
    };

    if (resolveTrackWriter) {
      resolveTrackWriter(trackWriter);
    }
  }
}

function isOfTrackType(item: unknown): item is TrackType {
  return (typeof item === 'string' && item === 'audio') || item === 'video';
}
