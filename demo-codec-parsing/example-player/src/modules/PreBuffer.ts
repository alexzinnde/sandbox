export type PreBufferConfigType = {
  onPush?: () => void;
  onShift?: () => void;
}

export default class PreBuffer {
  private _buffer: ArrayBuffer[];
  private _onPush?: () => void;
  private _onShift?: () => void;

  private _allowIncoming: boolean


  constructor({onPush, onShift}: PreBufferConfigType) {
    this._buffer = [];

    this._onPush = onPush;
    this._onShift = onShift;
    this._allowIncoming = false;
  }

  get length() {
    return this._buffer.length;
  }

  public push(chunk: ArrayBuffer) {
    if (this._allowIncoming) {
      this._buffer.push(chunk);

      if (this._onPush) {
        this._onPush()
      }
    }
  }

  public shift() {
    const chunk = this._buffer.length ? this._buffer.shift(): new ArrayBuffer(0);
    
    if (this._onShift) {
      this._onShift()
    }

    return chunk;
  }

  public allowIncoming() {
    this._allowIncoming = true;
  }

  public stopIncoming() {
    this._allowIncoming = false
  }
}