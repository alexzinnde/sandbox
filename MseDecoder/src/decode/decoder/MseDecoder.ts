import {Subject, ReadOnlySubject} from '../../rx'
import TrackWriter from '../../tracks/TrackWriter'
import MseDecoderStatisticsType from './MseDecoderStatisticsType'

export type MseDecoderStatus = 'initialzing' | 'decoding' | 'error'

export default class MseDecoder {
  private readonly _mediaElement: HTMLMediaElement
  private readonly _mediaSource: MediaSource
  private readonly _status: Subject<MseDecoderStatus>

  private readonly _statistics: Subject<MseDecoderStatisticsType>

  private readonly _readOnlyStatus: ReadOnlySubject<MseDecoderStatus>
  private readonly _readOnlyStatistics: ReadOnlySubject<MseDecoderStatisticsType>

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

      const createTrackWriter = () => {
        const sourceBuffer = this._mediaSource.addSourceBuffer(mimeType)
        const trackWriter = new TrackWriter(sourceBuffer)

        console.log('[MseDecoder] createTrackWriter for mimeType [%s] [%o]', mimeType, trackWriter)

        resolve(trackWriter)
      }

      this._status.subscribe(status => {
        if (status === 'decoding') {
          createTrackWriter()
        }
      })
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
      URL.revokeObjectURL(this._mediaElement.src)
      this.setStatus('decoding')
    }

    this._mediaElement.src = URL.createObjectURL(this._mediaSource)
  }

  private setStatus(status: MseDecoderStatus) {
    this._status.value = status
  }
}
