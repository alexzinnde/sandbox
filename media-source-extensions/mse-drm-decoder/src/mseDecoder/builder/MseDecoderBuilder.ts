import MseDecoder from '../decoder/MseDecoder';
import MseDecoderConfigType from '../decoder/MseDecoderConfigType';

export default class MseDecoderBuilder {
  private _decoderConfig: MseDecoderConfigType;

  constructor() {
    this._decoderConfig = {} as MseDecoderConfigType;
  }

  public forMediaElement(mediaElement: HTMLMediaElement) {
    this._decoderConfig.mediaElement = mediaElement;

    return this;
  }

  // options
  public withSourceBufferMode(sourceBufferMode: AppendMode) {
    if (!this._decoderConfig.options) {
      this._decoderConfig.options = {};
    }

    this._decoderConfig.options.sourceBufferMode = sourceBufferMode;

    return this;
  }

  public build(): MseDecoder {
    return new MseDecoder(this._decoderConfig);
  }
}
