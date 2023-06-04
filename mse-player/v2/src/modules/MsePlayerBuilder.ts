// import {DrmConfigType} from './EncryptedMediaHandler';
import MsePlayer, {MsePlayerConfigType} from './MsePlayer';

export default class MsePlayerBuilder {
  private _playerConfig: MsePlayerConfigType;

  constructor() {
    this._playerConfig = {} as MsePlayerConfigType;
  }

  // Builder Setters ===================================================
  public forVideoElement(videoElement: HTMLVideoElement): MsePlayerBuilder {
    this._playerConfig.videoElement = videoElement;

    return this;
  }

  public withMimeCodecType(mimeCodecType: string): MsePlayerBuilder {
    this._playerConfig.mimeCodecType = mimeCodecType;

    return this;
  }

  public withSourceBufferMode(sourceBufferMode: AppendMode): MsePlayerBuilder {
    this._playerConfig.sourceBufferMode = sourceBufferMode;

    return this;
  }

  // public withDrmConfig(drmConfig: DrmConfigType) {
  //   this._playerConfig.drmConfig = drmConfig;

  //   return this;
  // }

  public create(): MsePlayer {
    return new MsePlayer(this._playerConfig);
  }
}