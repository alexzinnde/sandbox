import MsePlayer from "./MsePlayer.js";
import StreamReader from "./StreamReader.js";


export type PlayerConfigType = {
  streamUrl: string
  mediaElement?: HTMLMediaElement
}

export default class Player {
  private _streamUrl: string
  private _streamReader: StreamReader
  private _mediaElement: HTMLMediaElement
  private _player: MsePlayer

  constructor({ streamUrl, mediaElement }: PlayerConfigType) {
    this._streamUrl = streamUrl;
    this._mediaElement = mediaElement;
  }

  public log() {
    this._player.log()
  }

  public play() {
    this._initialize()
  }

  public stop() {
    this._player.stop()
    delete this._player
  }

  private _initialize() {
    this._streamReader = new StreamReader(this._streamUrl)
    this._player = new MsePlayer({
      mimeCodecType: this._streamReader.mimeCodecType,
      sourceBufferMode: 'sequence',
      mediaElement: this._mediaElement
    })
    this._streamReader.readStream(this._player.pushChunk.bind(this._player))
    this._player.startPlayback(this._mediaElement)
  }
}