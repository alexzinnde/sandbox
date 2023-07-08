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

export default class MseDecoder {
  public status: ReadyState;
  private _videoElement: HTMLVideoElement;
  private _mediaSource: MediaSource;
  private _trackBuffers: TrackBuffers;
  private _pendingTrackWriterCreates: PendingTrackWriterCreates;

  private _options?: Record<string, string>;

  constructor(videoElement: HTMLVideoElement, options?: {}) {
    this.status = 'closed';
    this._videoElement = videoElement;
    this._trackBuffers = {} as TrackBuffers;
    this._mediaSource = new MediaSource();
    this._pendingTrackWriterCreates = [];
    this._options = options;

    this._initialize();
  }

  public async createTrackWriter(mimeCodecType: string): Promise<TrackWriter> {
    return new Promise(resolveTrackWriter => {
      if (this._mediaSource.readyState === 'open') {
        return this._createTrackBuffer(mimeCodecType, resolveTrackWriter);
      }

      console.warn('[MseDecoder][createTrackWriter] readyState [%s]', this._mediaSource.readyState)
      this._pendingTrackWriterCreates.push({
        mimeCodecType,
        resolveTrackWriter
      });
    });
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
    this._trackBuffers[trackType] = {
      mimeCodecType,
      buffer: [],
      sourceBuffer
    };

    sourceBuffer.onerror = () => {
      console.warn('[MseDecoder] [SourceBuffer] [%s] error', trackType);
    };
    sourceBuffer.onupdate = () => {
      this._options?.debug && console.log('[MseDecoder] [SourceBuffer] [%s] update', trackType);
      this._trackBuffers[trackType].buffer[0].resolveStatusPromise('OK');
      this._trackBuffers[trackType].buffer.shift();

      if (this._trackBuffers[trackType].buffer.length) {
        sourceBuffer.appendBuffer(new Uint8Array(this._trackBuffers[trackType].buffer[0].data));
      }
    };

    const trackWriter = (data: ArrayBuffer): Promise<Status> => {
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
