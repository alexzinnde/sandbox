import Observable from '../Observable';
import TrackWriter  from './TrackWriter';

export type MseDecoderState = 'initialize' | 'open' | 'decode' | 'error' | 'close';

export default class MseDecoder {
  public status: Observable<MseDecoderState>;
  private _mediaElement: HTMLMediaElement;
  private _mediaSource: MediaSource;

  constructor(mediaElement: HTMLMediaElement) {
    this.status = new Observable<MseDecoderState>('initialize');
    this._mediaElement = mediaElement;
    this._mediaSource = new MediaSource();
    this._initialize();
  }

  public createTrackWriter(mimeType: string) {
    console.log('[MseDecoder] creatTrackWriter status[%s]', this.status.value);

    return this._createTrackWriter(mimeType);
  }

  private _createTrackWriter(mimeType: string) {
    const trackWriter = new TrackWriter(mimeType, this._mediaSource, this.status);

    return trackWriter;
  }

  private _initialize() {
    this._mediaSource.onsourceended = () => {
      console.warn('[MseDecoder] [MediaSource] sourceend!');
      this.status.value = 'error';
      // this._mediaElement.src = '';
      this._mediaElement.load()
    };
    this._mediaSource.onsourceclose = () => {
      console.warn('[MseDecoder] [MediaSource] sourceclose!');
      this.status.value = 'close';
      this._mediaElement.src = URL.createObjectURL(this._mediaSource);
    };
    this._mediaSource.onsourceopen = () => {
      this.status.value = 'open';
      console.warn('[MseDecoder] [MediaSource] sourceopen!');
      URL.revokeObjectURL(this._mediaElement.src);
    };

    this._mediaElement.src = URL.createObjectURL(this._mediaSource);
  }
}
