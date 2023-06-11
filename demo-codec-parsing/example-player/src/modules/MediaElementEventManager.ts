
export type MediaEventNameType = 'play' | 'abort' | 'cancel' | 'canplaythrough' | 'change' | 'close' | 'durationchange' | 'emptied' | 'encrypted' | 'ended' | 'error' | 'invalid' | 'pause' | 'playing' | 'progress' | 'ratechange' | 'reset' | 'stalled' | 'suspend' | 'timeupdate' | 'waiting'
export type MediaElement = HTMLMediaElement | HTMLAudioElement | HTMLVideoElement
export type MediaElementEventsType = {
  mediaElement?: MediaElement
  abortController: AbortController
  listeners: Record<MediaEventNameType, (event?: Event) => void>
}


export default class MediaElementEventManager {
  private _abortController: AbortController;
  private _mediaElement: MediaElement
  private _listeners: Record<MediaEventNameType, (event?: Event) => void>

  constructor({ mediaElement, listeners, abortController }: MediaElementEventsType) {
    this._listeners = listeners
    this._abortController = abortController;
    if (mediaElement) {
      this.attachMedia(mediaElement)
    }
  }

  public attachMedia(mediaElement: HTMLMediaElement) {
    this._mediaElement = mediaElement;
    console.log('[MediaElementEventManager] attachMedia this [%o]', this);
    Object.entries(this._listeners).forEach(([eventName, listener]) => {
      this._setEventListenerOnMediaElement(eventName, listener)
    })
  }

  // public setEventListenersOnMediaElement(mediaElement: HTMLMediaElement) {
  //   mediaElement.addEventListener('play', onMediaPlay.bind(this), { signal: abortSignal })
  //   mediaElement.addEventListener('abort', logEvent.bind(null, 'AudioElement', 'abort'), { signal: abortSignal })
  //   mediaElement.addEventListener('cancel', logEvent.bind(null, 'AudioElement', 'cancel'), { signal: abortSignal })
  //   mediaElement.addEventListener('canplaythrough', logEvent.bind(null, 'AudioElement', 'canplaythrough'), { signal: abortSignal })
  //   mediaElement.addEventListener('change', logEvent.bind(null, 'AudioElement', 'change'), { signal: abortSignal })
  //   mediaElement.addEventListener('close', logEvent.bind(null, 'AudioElement', 'close'), { signal: abortSignal })
  //   mediaElement.addEventListener('durationchange', logEvent.bind(null, 'AudioElement', 'durationchange'), { signal: abortSignal })
  //   mediaElement.addEventListener('emptied', logEvent.bind(null, 'AudioElement', 'emptied'), { signal: abortSignal })
  //   mediaElement.addEventListener('encrypted', logEvent.bind(null, 'AudioElement', 'encrypted'), { signal: abortSignal })
  //   mediaElement.addEventListener('ended', logEvent.bind(null, 'AudioElement', 'ended'), { signal: abortSignal })
  //   mediaElement.addEventListener('error', logEvent.bind(null, 'AudioElement', 'error', 'error'), { signal: abortSignal })
  //   mediaElement.addEventListener('invalid', logEvent.bind(null, 'AudioElement', 'invalid', 'error'), { signal: abortSignal })
  //   mediaElement.addEventListener('pause', logEvent.bind(null, 'AudioElement', 'pause'), { signal: abortSignal })
  //   mediaElement.addEventListener('playing', logEvent.bind(null, 'AudioElement', 'playing'), { signal: abortSignal })
  //   // mediaElement.addEventListener('progress', logEvent.bind(null, 'AudioElement', 'progress') ,{ signal: abortSignal})
  //   mediaElement.addEventListener('ratechange', logEvent.bind(null, 'AudioElement', 'ratechange'), { signal: abortSignal })
  //   mediaElement.addEventListener('reset', logEvent.bind(null, 'AudioElement', 'reset'), { signal: abortSignal })
  //   mediaElement.addEventListener('stalled', logEvent.bind(null, 'AudioElement', 'stalled', 'warn'), { signal: abortSignal })
  //   mediaElement.addEventListener('suspend', logEvent.bind(null, 'AudioElement', 'suspend'), { signal: abortSignal })
  //   mediaElement.addEventListener('timeupdate', onTimeupdate.bind(this), { signal: abortSignal })
  //   mediaElement.addEventListener('waiting', logEvent.bind(null, 'AudioElement', 'waiting'), { signal: abortSignal })
  // }

  private _setEventListenerOnMediaElement(eventName: string, listener: (event?: Event) => void) {
    console.log('[MediaElementEventManager] Setting [%s] listener', eventName);
    this._mediaElement.addEventListener(eventName, listener, { signal: this._abortController.signal })
  }
}