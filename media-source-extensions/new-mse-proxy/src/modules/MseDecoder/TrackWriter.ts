import Observable from "../Observable";
import { MseDecoderState } from "./MseDecoder";
import SegmentWithStatusPromise from "./SegmentWithStatusPromise";

export type WriteStatus = 'OK' | 'ERROR';

export default class TrackWriter {
  public mimeType: string;
  public data?: Observable<ArrayBuffer>;

  private _sourceBuffer?: SourceBuffer;
  private _segmentsWithStatusPromise: SegmentWithStatusPromise[];

  constructor(mimeType: string, mediaSource: MediaSource, mseDecoderStatus: Observable<MseDecoderState>) {
    this.mimeType = mimeType;
    this._segmentsWithStatusPromise = [];
    this._initialize(mediaSource, mseDecoderStatus);
  }

  public write(data: ArrayBuffer): Promise<WriteStatus> {
    return new Promise(resolveStatusPromise => {
      this._segmentsWithStatusPromise.push({
        data,
        resolveStatusPromise
      });
      if (this._sourceBuffer && !this._sourceBuffer.updating) {
        const segment = new Uint8Array(this._segmentsWithStatusPromise[0].data);

        this._sourceBuffer.appendBuffer(segment);
      }
    });
  }

  private _initialize(mediaSource: MediaSource, mseDecoderStatus: Observable<MseDecoderState>) {
    const sourceBuffer = mediaSource.addSourceBuffer(this.mimeType);
    sourceBuffer.mode = 'sequence';
    sourceBuffer.onerror = () => {
      console.warn('[SouceBuffer][%s] Error', this.mimeType);
      resolveStatusPromise(this._segmentsWithStatusPromise, 'ERROR');
    };
    sourceBuffer.onupdatestart = () => {
      if (mseDecoderStatus.value !== 'decode') {
        mseDecoderStatus.value = 'decode';
      }
    }
    sourceBuffer.onupdate = () => {
      resolveStatusPromise(this._segmentsWithStatusPromise, 'OK');
    };

    this._sourceBuffer = sourceBuffer;
  }
}

function resolveStatusPromise(segmentsWithStatusPromise: SegmentWithStatusPromise[], status: WriteStatus) {
  const segmentWithStatusPromise = segmentsWithStatusPromise.shift();

  if (segmentWithStatusPromise) {
    const {resolveStatusPromise} = segmentWithStatusPromise;

    resolveStatusPromise(status);
  }
}