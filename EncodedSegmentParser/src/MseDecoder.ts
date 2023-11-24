import { ReadOnlySubject, Subject } from '@zinntechniker/subjectify'
import TrackWriter from './TrackWriter'

type MseDecoderStatus = 'initializing' | 'decoding' | 'error'

export default class MseDecoder {
  private readonly _mediaElement: HTMLMediaElement
  private readonly _mediaSource: MediaSource = new MediaSource()
  private readonly _status: Subject<MseDecoderStatus> = new Subject<MseDecoderStatus>('initializing')
  private readonly _readOnlyStatus: ReadOnlySubject<MseDecoderStatus> = new ReadOnlySubject(this._status)

  constructor(mediaElement: HTMLMediaElement) {
    this._mediaElement = mediaElement
    this.initialize()
  }

  get status(): ReadOnlySubject<MseDecoderStatus> {
    return this._readOnlyStatus
  }

  public createTrackWriter(mimeType: string) {
    return new Promise<TrackWriter>(resolveTrackWriterPromise => {
      const createSourceBufferAndTrackWriter = () => {
        const sourceBuffer = this._mediaSource.addSourceBuffer(mimeType)
        const trackWriter = new TrackWriter(mimeType, sourceBuffer)

        resolveTrackWriterPromise(trackWriter)
      }
      if (this._status.value === 'decoding') {
        createSourceBufferAndTrackWriter()

        return
      }

      this._status.subscribe(mseDecoderStatus => {
        if (mseDecoderStatus === 'decoding') {
          createSourceBufferAndTrackWriter()
        }
      })
    })
  }

  private initialize() {
    this._mediaSource.onsourceended = () => {
      this._status.value = 'error'
    }
    this._mediaSource.onsourceclose = () => {
      this._status.value = 'initializing'
    }
    this._mediaSource.onsourceopen = () => {
      URL.revokeObjectURL(this._mediaElement.src)
      this._mediaSource.duration = Infinity;
      this._status.value = 'decoding'
    }

    this._mediaElement.src = URL.createObjectURL(this._mediaSource)
  }
}
