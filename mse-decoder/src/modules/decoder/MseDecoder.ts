import Subject from '../Subject';
import ReadOnlySubject from '../ReadOnlySubject';
import {TrackWriter} from './TrackWriter';

export type MseDecoderStatus = 'initialzing' | 'decoding' | 'error';

export default class MseDecoder {
  private _mediaElement: HTMLMediaElement;
  private _status: Subject<MseDecoderStatus>;
  public status: ReadOnlySubject<MseDecoderStatus>;
  private _mediaSource: MediaSource;
  private _trackWriters: Subject<TrackWriter[]>;
  public trackWriters: ReadOnlySubject<TrackWriter[]>;
  private _trackWriterPromises: (() => void)[];

  constructor(mediaElement: HTMLMediaElement) {
    this._mediaElement = mediaElement;
    this._status = new Subject<MseDecoderStatus>('initialzing');
    this.status = new ReadOnlySubject<MseDecoderStatus>(this._status);
    this._mediaSource = new MediaSource();
    this._trackWriters = new Subject<TrackWriter[]>([]);
    this.trackWriters = new ReadOnlySubject<TrackWriter[]>(this._trackWriters);
    this._trackWriterPromises = [];
    this._initialize();
  }

  public createTrackWriter(mimeType: string): Promise<TrackWriter> {
    return new Promise(resolveTrackWriter => {
      if (this._status.value !== 'decoding') {
        this._trackWriterPromises.push(() => resolveTrackWriter(TrackWriter.create(mimeType, this.status, this._mediaSource)));
        return;
      }

      return resolveTrackWriter(TrackWriter.create(mimeType, this.status, this._mediaSource));
    });
  }

  private _initialize() {
    this._mediaSource.onsourceended = () => {
      console.warn('[MseDecoder] sourceended');
      this._status.value = 'error';
    };
    this._mediaSource.onsourceclose = () => {
      console.warn('[MseDecoder] sourceclose');
      this._status.value = 'initialzing';
    };
    this._mediaSource.onsourceopen = () => {
      console.log('[MseDecoder] sourceopen');
      URL.revokeObjectURL(this._mediaElement.src);
      this._trackWriterPromises.forEach(resolver => resolver());
      this._status.value = 'decoding';
    };
    this._mediaElement.src = URL.createObjectURL(this._mediaSource);
  }
}
