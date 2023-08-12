import ReadOnlySubject from '../ReadOnlySubject';
import Subject from '../Subject';
import {MseDecoderStatus} from './MseDecoder';

export type WriteStatus = 'ok' | 'error';
type SegmentWithStatusPromise = {
  segment: ArrayBuffer;
  resolveWriteStatus: (writeStatus: WriteStatus) => void;
};

export class TrackWriter {
  private _segmentsWithStatusPromise: Subject<SegmentWithStatusPromise[]>;

  private constructor(mimeType: string, mseDecoderStatus: ReadOnlySubject<MseDecoderStatus>, mediaSource: MediaSource) {
    this._segmentsWithStatusPromise = new Subject<SegmentWithStatusPromise[]>([]);
    mseDecoderStatus.subscribe(status => {
      if (status === 'decoding') {
        this._initialize(mimeType, mediaSource);
      }
    });

    if (mseDecoderStatus.value === 'decoding') {
      this._initialize(mimeType, mediaSource);
    }
  }

  static create(mimeType: string, mseDecoderStatus: ReadOnlySubject<MseDecoderStatus>, mediaSource: MediaSource): TrackWriter {
    return new TrackWriter(mimeType, mseDecoderStatus, mediaSource);
  }

  public write(segment: ArrayBuffer): Promise<WriteStatus> {
    return new Promise(resolveWriteStatus => {
      this._segmentsWithStatusPromise.value = [
        ...this._segmentsWithStatusPromise.value,
        {
          segment,
          resolveWriteStatus
        }
      ];
    });
  }

  private _initialize(mimeType: string, mediaSource: MediaSource) {
    console.log('[TrackWriter] [%s] initialize', mimeType);
    const sourceBuffer = mediaSource.addSourceBuffer(mimeType);

    sourceBuffer.onerror = () => {
      console.warn('[TrackWriter] [SourceBuffer] [%s] error', mimeType);
      resolveWriteStatus(this._segmentsWithStatusPromise.value, 'error');
    };
    sourceBuffer.onupdate = () => {};
    sourceBuffer.onupdateend = () => {
      resolveWriteStatus(this._segmentsWithStatusPromise.value, 'ok');
    };

    this._segmentsWithStatusPromise.subscribe(feedSourceBuffer.bind(null, sourceBuffer));
  }
}

function feedSourceBuffer(sourceBuffer: SourceBuffer, segmentsWithStatusPromise: SegmentWithStatusPromise[]) {
  if (!sourceBuffer.updating) {
    sourceBuffer.appendBuffer(segmentsWithStatusPromise[0].segment);
  }
}

function resolveWriteStatus(segmentsWithStatusPromise: SegmentWithStatusPromise[], writeStatus: WriteStatus) {
  const segmentWithStatusPromise = segmentsWithStatusPromise.shift();

  if (segmentWithStatusPromise) {
    const {resolveWriteStatus} = segmentWithStatusPromise;

    resolveWriteStatus(writeStatus);
  }
}
