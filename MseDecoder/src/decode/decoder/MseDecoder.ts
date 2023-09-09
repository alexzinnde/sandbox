import {Subject, ReadOnlySubject} from '../../rx'
import Disposable from '../../disposable/Disposable'
import DisposableList from '../../disposable/DisposableList'
import TrackWriter from '../../tracks/TrackWriter'
import MseDecoderStatisticsType from './MseDecoderStatisticsType'

export type MseDecoderStatus = 'initialzing' | 'decoding' | 'error'

export default class MseDecoder {
  private readonly _mediaElement: HTMLMediaElement
  private readonly _mediaSource: MediaSource
  private readonly _status: Subject<MseDecoderStatus>
  private readonly _statistics: Subject<MseDecoderStatisticsType>
  private _resolveResetPromise: undefined | (() => void)

  private readonly _readOnlyStatus: ReadOnlySubject<MseDecoderStatus>
  private readonly _readOnlyStatistics: ReadOnlySubject<MseDecoderStatisticsType>

  private readonly _disposables: DisposableList

  constructor(mediaElement: HTMLMediaElement) {
    this._mediaElement = mediaElement
    this._mediaSource = new MediaSource()
    this._status = new Subject<MseDecoderStatus>('initialzing')
    this._statistics = new Subject({
      allTracks: {
        bytesReceived: 0,
        bytesWritten: 0,
        segmentsReceived: 0,
        segmentsWritten: 0
      },
      perTrack: {}
    })
    this._readOnlyStatus = new ReadOnlySubject(this._status)
    this._readOnlyStatistics = new ReadOnlySubject(this._statistics)
    this._disposables = new DisposableList()

    this.initialize()
  }

  get status(): ReadOnlySubject<MseDecoderStatus> {
    return this._readOnlyStatus
  }

  get statistics(): ReadOnlySubject<MseDecoderStatisticsType> {
    return this._readOnlyStatistics
  }

  public async createTrackWriter(mimeType: string): Promise<TrackWriter> {
    return new Promise((resolve, reject) => {
      if (this._statistics.value.perTrack[mimeType]) {
        return reject(`TrackWriter with mimeType [${mimeType}] already exists`)
      }

      const createTrackWriterAndSubscribeTrackWriter = () => {
        const sourceBuffer = this._mediaSource.addSourceBuffer(mimeType)
        const trackWriter = new TrackWriter(sourceBuffer)

        trackWriter.statistics.subscribe(trackWriterStatistics => {
          this._statistics.value.perTrack[mimeType] = trackWriterStatistics
        })

        resolve(trackWriter)
      }

      const disposeOfStatusSubscription = this._status.subscribe(status => {
        if (status === 'decoding') {
          createTrackWriterAndSubscribeTrackWriter()
          disposeOfStatusSubscription()
        }
      })
    })
  }

  public reset(): Promise<void> {
    return new Promise(resolve => {
      this._resolveResetPromise = resolve
      this._statistics.value = {
        allTracks: {
          bytesReceived: 0,
          bytesWritten: 0,
          segmentsReceived: 0,
          segmentsWritten: 0
        },
        perTrack: {}
      }
      this._mediaElement.load()
    })
  }

  private initialize() {
    this._mediaSource.onsourceended = () => {
      this.setStatus('error')
    }
    this._mediaSource.onsourceclose = () => {
      this.setStatus('initialzing')
    }
    this._mediaSource.onsourceopen = () => {
      if (this._resolveResetPromise) {
        this._resolveResetPromise()
        this._resolveResetPromise = undefined
      }
      URL.revokeObjectURL(this._mediaElement.src)
      this.setStatus('decoding')
    }

    this._mediaElement.src = URL.createObjectURL(this._mediaSource)
  }

  private setStatus(status: MseDecoderStatus) {
    this._status.value = status
  }
}
