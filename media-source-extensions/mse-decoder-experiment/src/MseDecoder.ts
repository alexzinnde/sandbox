type Status = "OK" | "ERROR";
type SegmentWithPromise = {
  data: ArrayBuffer;
  statusPromise: (status: Status) => void;
};

type TrackWriter = (data: ArrayBuffer) => Promise<Status>;

type TrackBuffer = {
  mimeCodecType: string;
  buffer: SegmentWithPromise[];
  sourceBuffer: SourceBuffer;
  feeder?: (data: ArrayBuffer) => void;
  trackWriterPromise?: (trackWriter: TrackWriter) => void;
};

type TrackBuffers = Record<string, TrackBuffer>;

export class MseDecoder {
  public readyState: ReadyState;
  private _videoElement: HTMLVideoElement;
  private _mediaSource: MediaSource;
  private _trackBuffers: TrackBuffers;

  constructor(videoElement: HTMLVideoElement) {
    this.readyState = "closed";
    this._videoElement = videoElement;
    this._trackBuffers = {};
    this._mediaSource = new MediaSource();

    this._initialize();
  }

  public createTrackWriter(mimeCodecType: string): Promise<TrackWriter> {
    return new Promise((resolve) => {
      const trackBuffer: TrackBuffer = {
        mimeCodecType,
        buffer: [],
        trackWriterPromise: resolve
      };

      if (this._mediaSource.readyState === "open") {
        console.log('[createTrackWriter] MediaSource was open when invoked')
        this._addSourceBuffer(trackBuffer);

        return
      }

      this._trackBuffers[mimeCodecType] = trackBuffer;
      return;
    });
  }

  private _initialize() {
    const onSourceEnded = () => {
      console.log("[MediaSource] [sourceended]");
      this.readyState = this._mediaSource.readyState;
    };
    const onSourceClose = () => {
      console.log("[MediaSource] [sourceclose]");
      this.readyState = this._mediaSource.readyState;
    };
    const onSourceOpen = () => {
      console.log("[MediaSource] [sourceopen]");
      this.readyState = this._mediaSource.readyState;
      URL.revokeObjectURL(this._videoElement.src);
      Object.values(this._trackBuffers)
        .filter((trackBuffer) => trackBuffer.trackWriterPromise !== undefined)
        .forEach((trackBuffer) => this._addSourceBuffer(trackBuffer));
    };

    this._mediaSource.onsourceended = onSourceEnded;
    this._mediaSource.onsourceclose = onSourceClose;
    this._mediaSource.onsourceopen = onSourceOpen;

    this._videoElement.src = URL.createObjectURL(this._mediaSource);
    console.log("[MseDecoder] initialize complete [%s]", this._videoElement.src);
  }

  private _addSourceBuffer(trackBuffer: TrackBuffer) {
    console.log('[addSourceBuffer] trackBuffer [%o]', trackBuffer)
    const { mimeCodecType, buffer, trackWriterPromise } = trackBuffer;
    const feedSourceBuffer = function (
      buffer: SegmentWithPromise[],
      sourceBuffer: SourceBuffer
    ) {
      console.log("[feedSourceBuffer] trackBuffer [%o]", trackBuffer);
      if (!sourceBuffer.updating) {
        const {data} = buffer[0];
        if (data) {
          sourceBuffer.appendBuffer(new Uint8Array(data))
        }
      }
    };

    const trackWriter = function (buffer: SegmentWithPromise[], sourceBuffer: SourceBuffer, data: ArrayBuffer): Promise<Status> {
      
      return new Promise((statusPromise) => {
        buffer.push({
          data,
          statusPromise,
        });

        feedSourceBuffer.call(null, buffer, sourceBuffer);
      });
    };
    const sourceBuffer = this._mediaSource.addSourceBuffer(mimeCodecType);
    // sourceBuffer.mode = 'sequence';

    sourceBuffer.onupdate = () => {
      console.log('[sourceBuffer] update');
      const {data, statusPromise} = buffer.shift();

      if (statusPromise) {   
        statusPromise('OK')
      }
    }
    trackBuffer.feeder = feedSourceBuffer.bind(this, buffer, sourceBuffer);

    this._trackBuffers[mimeCodecType] = trackBuffer;

    console.log('[SourceBuffer] update trackBuffer [%o]', trackBuffer)
    if (trackWriterPromise) {
      trackWriterPromise(trackWriter.bind(null, buffer, sourceBuffer));
    }
  }
}

export default MseDecoder;
