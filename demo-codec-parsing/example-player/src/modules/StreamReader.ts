import MSEAudioWrapper from 'mse-audio-wrapper';

export type StreamChunkHandler = (chunk: ArrayBuffer) => void

export default class StreamReader {
  private _streamUrl: string
  private _isStreamOn: boolean
  private _reader: ReadableStreamDefaultReader<Uint8Array>
  private _mimeCodecType: string
  private _streamChunkConsumer: (chunk: ArrayBuffer) => void

  constructor(streamUrl: string) {
    this._streamUrl = streamUrl;
    this._isStreamOn = false;
    this._mimeCodecType = 'audio/webm;codecs="opus"';  // TODO: get from streamURL header, timing issue
    this._getStreamMimeCodecType()
      .then((mimeCodecType) => {
        console.log('[StreamReader] Received mimeCodecType [%s]', mimeCodecType)
        switch(mimeCodecType) {
          case 'audio/ogg':
            console.log('[StreamReader] Setting mimeCodecType to ', 'audio/webm;codecs="opus"')
            this._mimeCodecType = 'audio/webm;codecs="opus"';
            break;

          case 'audio/mp3':
            this._mimeCodecType = 'audio/mpeg';
            break;
          
          default:
            throw new Error(`Unsupported mimeCodecType [${mimeCodecType}]`);
              
        }
      })
      .catch((error) => console.error('[StreamReader] Error fetching stream [%o]', error))
  }

  get mimeCodecType() {
    return this._mimeCodecType;
  }

  public async readStream(onStreamChunk: StreamChunkHandler) {
    this._streamChunkConsumer = onStreamChunk
    this._isStreamOn = true
    await this._readStream()
  }

  public async startStream(onStreamChunk?: StreamChunkHandler) {
    this._isStreamOn = true
    if (onStreamChunk) {
      this._streamChunkConsumer = onStreamChunk;
    }

    await this._readStream()
  }

  public stopStream() {
    this._isStreamOn = false
  }

  private async _getStreamReader() {
    const { headers, body } = await fetch(this._streamUrl);
    const reader = body.getReader();

    this._reader = reader;
  }

  private async _getStreamMimeCodecType() {
    const { headers, body } = await fetch(this._streamUrl);
    const mimeCodecType = headers.get('Content-Type');

    return mimeCodecType
  }

  private async _readStream() {
    await this._getStreamReader();
    console.log('[StreamReader] readStream')

    const audioWrapper = new MSEAudioWrapper('audio/ogg', {
      enableLogging: true,
    });

    while (this._isStreamOn) {
      const { value, done } = await this._reader.read();
      if (done) {
        console.error('Stream reader [done]')
        break;
      }

      for (const wrappedAudio of audioWrapper.iterator(value)) {
        this._streamChunkConsumer(wrappedAudio);
      }
    }

    console.log('[StreamReader] Stream reading stopped')
  }
}

function logHeaders(headers: Headers) {
  for (const item of headers) {
    console.log(item)
  }
}