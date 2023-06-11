import MsePlayer from "./MsePlayer.js";
import StreamReader from "./StreamReader.js";


export type PlayerConfigType = {
  streamUrl: string
  mediaElement?: HTMLMediaElement
}

export default class Player {
  private _streamReader: StreamReader
  private _mediaElement: HTMLMediaElement
  private _decoder: MsePlayer

  constructor({streamUrl, mediaElement}: PlayerConfigType) {
    this._streamReader = new StreamReader(streamUrl)
    this._mediaElement = mediaElement;
    this._initialize()
  }

  public play() {
    this._decoder.startPlayback(this._mediaElement)
    this._streamReader.readStream(this._decoder.pushChunk.bind(this._decoder))
  }

  public stop() {
    this._decoder.stop()
  }

  private _initialize() {
    this._decoder = new MsePlayer({
      mimeCodecType: this._streamReader.mimeCodecType,
      sourceBufferMode: 'sequence',
      mediaElement: this._mediaElement
    })
    
  }
}