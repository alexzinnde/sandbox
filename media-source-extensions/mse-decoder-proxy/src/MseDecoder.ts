import { Subject } from "@techniker/observable";

export type WriteStatus = 'OK' | 'ERROR';
export type SegmentWithWriteStatusPromise = {
  data: ArrayBuffer;
  resolveWriteStatusPromise: (status: WriteStatus) => void;
}
export type TrackWriter = {
  write: (data: ArrayBuffer) => Promise<WriteStatus>;
  updating: Subject<boolean>,
}

export type TrackBuffer = {
  buffer: SegmentWithWriteStatusPromise[];
}
export type MimeCodecType = string
export type TrackBuffers = Record<MimeCodecType, TrackBuffer>;



export default class MseDecoder {
  public status: Subject<ReadyState>
  private _mediaElement: HTMLMediaElement;
  private _mediaSource: MediaSource;
  private _trackBuffers: TrackBuffers;
  private _pendingTrackWriters: {
    mimeCodecType: string,
    resolveTrackWriter: (trackWriter: TrackWriter) => void
  }[]

  constructor(mediaElement: HTMLMediaElement) {
    this._mediaElement = mediaElement;
    this._mediaSource = new MediaSource();
    this.status = new Subject(this._mediaSource.readyState);
    this._trackBuffers = {};
    this._pendingTrackWriters = []

    this._initialize();
  }

  public createTrackWriter(mimeCodecType: string): Promise<TrackWriter> {
    return new Promise(resolveTrackWriter => {
      if (this._mediaSource.readyState === 'open') {
        return this._createSourceBufferForTrack(mimeCodecType, resolveTrackWriter)
      }

      this._pendingTrackWriters.push({
        mimeCodecType,
        resolveTrackWriter
      })
    })
  }

  private _initialize() {
    this._mediaSource.onsourceended = () => {
      this.status.notify('ended');
      console.log('THIS [%o]', this);
      console.warn('activeSourcebuffers [%o]\nsourceBuffers [%o]', this._mediaSource.activeSourceBuffers, this._mediaSource.sourceBuffers)
      this._mediaElement.src = '';
    };
    this._mediaSource.onsourceclose = () => {
      this.status.notify('close');
      this._mediaElement.src = URL.createObjectURL(this._mediaSource);
      this._mediaElement.play()
    };
    this._mediaSource.onsourceopen = () => {
      this.status.notify('open');
      URL.revokeObjectURL(this._mediaElement.src);
      while (this._pendingTrackWriters.length) {
        const { mimeCodecType, resolveTrackWriter } = this._pendingTrackWriters.shift()
        console.log('[MseDecoder] sourceopen creating track for [%s]', mimeCodecType)
        this._createSourceBufferForTrack(mimeCodecType, resolveTrackWriter);
      }

    };
    this._mediaElement.src = URL.createObjectURL(this._mediaSource);
  }

  private _createSourceBufferForTrack(mimeCodecType: string, resolveTrackWriter: (trackWriter: TrackWriter) => void): TrackWriter {
    console.log('[MseDecoder] createSourceBufferForTrack [%s] resolve', mimeCodecType)
    const trackKind = getTrackKindFromMimeCodecType(mimeCodecType);
    const sourceBuffer = this._mediaSource.addSourceBuffer(mimeCodecType);
    const updating = new Subject<boolean>(sourceBuffer.updating);
    const buffer: SegmentWithWriteStatusPromise[] = [];

    const resolveWriteStatusPromise = (status: WriteStatus) => {
      const segmentWithWriteStatusPromise = buffer.shift();

      if (segmentWithWriteStatusPromise) {
        segmentWithWriteStatusPromise.resolveWriteStatusPromise(status)
      }
    }

    sourceBuffer.onerror = () => {
      resolveWriteStatusPromise('ERROR')
    };
    sourceBuffer.onupdatestart = () => {
      updating.notify(true)
    };
    sourceBuffer.onupdate= () => {
      updating.notify(false)
      resolveWriteStatusPromise('OK');
    };
    sourceBuffer.mode = 'sequence';

    const feedSourceBuffer = (data: ArrayBuffer): Promise<WriteStatus> => new Promise(resolveWriteStatusPromise => {
      console.log('[MseDecoder] [%s] received data [%o]', trackKind, data)
      buffer.push({
        data,
        resolveWriteStatusPromise
      })

      if (!sourceBuffer.updating) {
        sourceBuffer.appendBuffer(new Uint8Array(buffer[0].data))
      }
    });

    this._trackBuffers[mimeCodecType] = buffer;

    resolveTrackWriter({
      write: feedSourceBuffer,
      updating
    })
  }
}

function getTrackKindFromMimeCodecType(mimeCodecType: string) {
  return mimeCodecType.split('/').shift() ?? '';
}