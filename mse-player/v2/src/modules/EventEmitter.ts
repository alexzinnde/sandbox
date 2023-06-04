
export type MsePlayerEventDetailsType = MseEventDetailsType;

export type MseEventDetailsType = {
  readyState?: string
  sourceBuffers?: SourceBufferList
  activeSourceBuffers?: SourceBufferList
  isoBmffSegments?: number
  sourceBufferError?: unknown
  videoElementErrorEvent?: Event | string,
  mediaSourceReadyState?: string
}


export default class EventEmitter {
  private _target: EventTarget;

  constructor() {
    this._target = new EventTarget();
  }

  addEventListener(eventName: string, listener: EventListener) {
    return this._target.addEventListener(eventName, listener)
  }

  once(eventName: string, listener: EventListener) {
    return this._target.addEventListener(eventName, listener, {once: true})
  }

  removeEventListener(eventName: string, listener: EventListener) {
    return this._target.removeEventListener(eventName, listener);
  }

  emit(eventName: string, detail?: MsePlayerEventDetailsType) {
    return this._target.dispatchEvent(new CustomEvent<MsePlayerEventDetailsType>(eventName, { detail, cancelable: true }));
  }
}