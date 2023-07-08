export type MseDecoderConfigType = {
  videoElement: HTMLVideoElement;
};

export type MediaTrackType = 'audio' | 'video';
export type SegmentWithStatusPromise = {
  data: ArrayBuffer;
  resolveStatusPromise: (status: Status) => void;
};
export type TrackBuffer = {
  mimeCodecType: string;
  buffer: SegmentWithStatusPromise[];
  sourceBuffer: SourceBuffer;
};
export type TrackBuffers = Record<MediaTrackType, TrackBuffer>;
export type Status = 'OK' | 'ERROR';
export type TrackWriter = (data: ArrayBuffer) => Promise<Status>;
export type PendingTracksNeedingBuffers = {
  mimeCodecType: string;
  resolveWriteTrackPromise: (trackWriter: TrackWriter) => void;
}[];

export type MseDecoderStatsType = {
  bytesReceived: number;
  bytesDecoded: number;
  framesReceived: number;
  framesDecoded: number;
  currentTime: number;
  width: number;
  height: number;
};

export default class MseDecoder {
  public status: ReadyState;
  private _videoElement: HTMLVideoElement;
  private _mediaSource: MediaSource;
  private _trackBuffers: TrackBuffers;
  private _pendingTracksNeedingBuffers: PendingTracksNeedingBuffers;
  private _stats: MseDecoderStatsType;

  constructor({ videoElement }: MseDecoderConfigType) {
    this.status = 'closed';
    this._videoElement = videoElement;
    this._mediaSource = new MediaSource();
    this._trackBuffers = {} as TrackBuffers;
    this._pendingTracksNeedingBuffers = [];
    this._stats = {
      currentTime: 0,
      width: 0,
      height: 0,
      bytesReceived: 0,
      bytesDecoded: 0,
      framesReceived: 0,
      framesDecoded: 0
    };

    this._initialize();
  }

  public async createWriterForTrack(mimeCodecType: string): Promise<TrackWriter> {
    return new Promise(resolveWriteTrackPromise => {
      this._generateNewTrackBufferForTrack(mimeCodecType, resolveWriteTrackPromise);
    });
  }

  public getStats(): MseDecoderStatsType {
    return this._stats;
  }

  private _initialize() {
    this._mediaSource.onsourceended = () => {
      console.warn('[MseDecoder] [MediaSource] [sourceended]');
      this.status = 'ended';
      this._videoElement.src = '';
    };
    this._mediaSource.onsourceclose = () => {
      console.log('[MseDecoder] [MediaSource] [sourceclose]');
      this.status = 'closed';
      this._videoElement.src = URL.createObjectURL(this._mediaSource);
    };
    this._mediaSource.onsourceopen = () => {
      console.log('[MseDecoder] [MediaSource] [sourceopen]');
      this.status = 'open';
      URL.revokeObjectURL(this._videoElement.src);
      console.log('[MseDecoder] [MediaSource] [sourceopen] revoked ObjectURL [%s]', this._videoElement.src);

      console.log('[MseDecoder] [MediaSource] [sourceopen] pendingTracksNeedingBuffers [%s]', this._pendingTracksNeedingBuffers.length);
      while (this._pendingTracksNeedingBuffers.length > 0) {
        const { mimeCodecType, resolveWriteTrackPromise } = this._pendingTracksNeedingBuffers.shift();

        this._createTrackBufferForTrack(mimeCodecType, resolveWriteTrackPromise);
      }

      console.log('[MseDecoder] [MediaSource] [sourceopen] pendingTracksNeedingSourceBuffers [%s] END', this._pendingTracksNeedingBuffers.length)
    };
    this._videoElement.src = URL.createObjectURL(this._mediaSource);
  }

  private _generateNewTrackBufferForTrack(mimeCodecType: string, resolveWriteTrackPromise: (trackWriter: TrackWriter) => void): void {
    console.log('[MseDecoder] [generateNewTrackBufferForTrack] mimeCodecType [%s] writeTrackPromise [%o] Start', mimeCodecType, resolveWriteTrackPromise);

    if (this._mediaSource.readyState === 'open') {
      return this._createTrackBufferForTrack(mimeCodecType, resolveWriteTrackPromise);
    }

    console.warn('[MseDecoder][generateNewTrackBufferForTrack] mediaSource readyState [%s]', this._mediaSource.readyState);
    this._pendingTracksNeedingBuffers.push({
      mimeCodecType,
      resolveWriteTrackPromise
    });

    console.warn('[MseDecoder] [generateNewTrackBufferForTrack] pendingTracksNeedingBuffers [%o]', this._pendingTracksNeedingBuffers);
  }

  private _createTrackBufferForTrack(mimeCodecType: string, resolveWriteTrackPromise?: (trackWriter: TrackWriter) => void) {
    console.log('[MseDecoder] [createTrackBufferForTrack] Start\nResolve WritePromise [%o]', resolveWriteTrackPromise);
    const trackType = mimeCodecType.split('/').shift();

    if (!isMediaTrackType(trackType)) {
      throw new Error(`TrackType is unknwon [${trackType}]`);
    }

    const sourceBuffer = this._mediaSource.addSourceBuffer(mimeCodecType);
    console.log('[MseDecoder] [createTrackBufferForTrack] trackType [%s] createdSourceBuffer [%o]', trackType, sourceBuffer);

    this._trackBuffers[trackType] = {
      mimeCodecType,
      buffer: [],
      sourceBuffer
    };

    sourceBuffer.onerror = () => {
      console.warn('[MseDecoder] [SourceBuffer] [%s] Error!', trackType);
    };
    sourceBuffer.onupdatestart = () => {
      console.log('[MseDecoder] [SourceBuffer] [%s] [updatestart]', trackType);
    }
    sourceBuffer.onupdate = () => {
      console.log('[MseDecoder] [SourceBuffer] [%s] [update]', trackType);
      const updatedSegment = this._trackBuffers[trackType].buffer.shift();

      if (updatedSegment) {
        updatedSegment.resolveStatusPromise('OK');
      }

      if (!sourceBuffer.updating && this._trackBuffers[trackType].buffer.length) {
        sourceBuffer.appendBuffer(new Uint8Array(this._trackBuffers[trackType].buffer[0].data));
      }
    };

    const trackWriter = (data: ArrayBuffer): Promise<Status> => {
      console.log('[MseDecoder] [trackWriter] data [%o]', data)
      return new Promise(resolveStatusPromise => {
        this._trackBuffers[trackType].buffer.push({
          data,
          resolveStatusPromise
        });

        if (!this._trackBuffers[trackType].sourceBuffer.updating) {
          this._trackBuffers[trackType].sourceBuffer.appendBuffer(new Uint8Array(this._trackBuffers[trackType].buffer[0].data))
        }
      });
     
    };

    if (resolveWriteTrackPromise) {
      console.log('[MseDecoder] [createTrackBufferForTrack] resolving writeTrackPromise');
      resolveWriteTrackPromise(trackWriter);
    }
  }
}

function isMediaTrackType(item: unknown): item is MediaTrackType {
  return typeof item === 'string' && (item === 'audio' || item === 'video');
}
