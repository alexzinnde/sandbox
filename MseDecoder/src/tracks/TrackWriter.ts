import {Subject, ReadOnlySubject} from '../rx'
import TrackWriterStatisticsType from './TrackWriterStatistcsType'

export type TrackWriterStateType = 'initializing' | 'ready' | 'increasing' | 'notincreasing' | 'pli' | 'failed'
export type WriteStatus = 'ok' | 'error'
export type SegmentWithStatusPromise = {
  segment: ArrayBuffer
  resolve: (writeStatus: WriteStatus) => void
}

export default class TrackWriter {
  private readonly _sourceBuffer: SourceBuffer
  private readonly _state: Subject<TrackWriterStateType>
  private readonly _statistics: Subject<TrackWriterStatisticsType>
  private readonly _bufferedLength: Subject<number>
  private readonly _bufferedStart: Subject<number>
  private readonly _bufferedEnd: Subject<number>
  private readonly _bufferedTime: Subject<number>

  private _segmentsWithStatusPromise: SegmentWithStatusPromise[]

  private readonly _readOnlyState: ReadOnlySubject<TrackWriterStateType>
  private readonly _readOnlyStatistics: ReadOnlySubject<TrackWriterStatisticsType>
  private readonly _readOnlyBufferedLength: ReadOnlySubject<number>
  private readonly _readOnlyBufferedStart: ReadOnlySubject<number>
  private readonly _readOnlyBufferedEnd: ReadOnlySubject<number>
  private readonly _readOnlyBufferedTime: ReadOnlySubject<number>

  constructor(sourceBuffer: SourceBuffer) {
    this._sourceBuffer = sourceBuffer
    this._state = new Subject<TrackWriterStateType>('initializing')
    this._statistics = new Subject({
      bytesReceived: 0,
      bytesWritten: 0,
      segmentsReceived: 0,
      segmentsWritten: 0
    })
    this._bufferedLength = new Subject(0)
    this._bufferedStart = new Subject(0)
    this._bufferedEnd = new Subject(0)
    this._bufferedTime = new Subject(0)

    this._segmentsWithStatusPromise = []

    this._readOnlyState = new ReadOnlySubject<TrackWriterStateType>(this._state)
    this._readOnlyStatistics = new ReadOnlySubject<TrackWriterStatisticsType>(this._statistics)
    this._readOnlyBufferedLength = new ReadOnlySubject(this._bufferedLength)
    this._readOnlyBufferedStart = new ReadOnlySubject(this._bufferedStart)
    this._readOnlyBufferedEnd = new ReadOnlySubject(this._bufferedEnd)
    this._readOnlyBufferedTime = new ReadOnlySubject(this._bufferedTime)

    this.initialize()
  }

  get state(): ReadOnlySubject<TrackWriterStateType> {
    return this._readOnlyState
  }

  get statistics(): ReadOnlySubject<TrackWriterStatisticsType> {
    return this._readOnlyStatistics
  }

  get bufferedLength(): ReadOnlySubject<number> {
    return this._readOnlyBufferedLength
  }

  get bufferedStart(): ReadOnlySubject<number> {
    return this._readOnlyBufferedStart
  }

  get bufferedEnd(): ReadOnlySubject<number> {
    return this._readOnlyBufferedEnd
  }

  get bufferedTime(): ReadOnlySubject<number> {
    return this._readOnlyBufferedTime
  }

  public async write(segment: ArrayBuffer): Promise<WriteStatus> {
    return new Promise(resolve => {
      this._segmentsWithStatusPromise.push({
        segment,
        resolve
      })
    })
  }

  public dispose(): void {
    this._segmentsWithStatusPromise = []
  }

  private initialize() {
    this._sourceBuffer.mode = 'segments'
    this._sourceBuffer.onerror = () => {
      this.setState('failed')
    }
    this._sourceBuffer.onupdatestart = () => {
      this.updateReceivedStatistics(this._segmentsWithStatusPromise[0].segment.byteLength)
    }

    this._sourceBuffer.onupdateend = this.onInitalizeAppendUpateEnd.bind(this)
    this.feedSourceBuffer()
  }

  private setState(state: TrackWriterStateType) {
    if (this._state.value !== 'failed') {
      this._state.value = state

      switch (this._state.value) {
        case 'increasing':
          this._sourceBuffer.onupdateend = this.onAppendUpdateEndBufferedEndIncrease.bind(this)

          break

        case 'notincreasing':
          this._sourceBuffer.onupdateend = this.onAppendUpdateEndBufferedEndNotIncreasing.bind(this)

          break

        case 'pli':
          this._sourceBuffer.onupdateend = this.onAppendUpateEndPLI.bind(this)
      }
    }
  }

  private calculateStateOnAppendUpdateEnd() {
    if (this._state.value === 'initializing') {
      return
    }
    try {
      const sourceBufferBufferedEnd = this._sourceBuffer.buffered.end(this._sourceBuffer.buffered.length - 1)
      const prevBufferdEnd = this._bufferedEnd.value

      if (sourceBufferBufferedEnd > prevBufferdEnd) {
        return this.setState('increasing')
      }

      if (sourceBufferBufferedEnd === prevBufferdEnd) {
        if (this._state.value === 'notincreasing') {
          return this.setState('pli')
        }

        return this.setState('notincreasing')
      }
    } catch (e) {
      console.warn('[TrackWriter] Caught error [%o]', e)
      this.setState('notincreasing')
      this.feedSourceBuffer()
    }
  }

  private onInitalizeAppendUpateEnd() {
    this.resolvePendingWriteStatus('ok')
    this.updateWrittenStatistics()
    this.setState('increasing')
  }

  private onAppendUpdateEndBufferedEndIncrease() {
    this.resolvePendingWriteStatus('ok')
    this.calculateStateOnAppendUpdateEnd()
    this.updateBufferedSubjects()
    this.updateWrittenStatistics()
  }

  private onAppendUpdateEndBufferedEndNotIncreasing() {
    this.resolvePendingWriteStatus('ok')
    this.calculateStateOnAppendUpdateEnd()
    this.updateWrittenStatistics()
  }

  private onAppendUpateEndPLI() {
    this.resolvePendingWriteStatus('error')
    this.calculateStateOnAppendUpdateEnd()
    this.updateBufferedSubjects()
    this.updateWrittenStatistics()
  }

  private resolvePendingWriteStatus(writeStatus: WriteStatus) {
    const segmentWithPendingWriteStatus = this._segmentsWithStatusPromise[0]
    segmentWithPendingWriteStatus?.resolve(writeStatus)
  }

  private updateBufferedSubjects() {
    const bufferedLength = this._sourceBuffer.buffered.length

    if (bufferedLength > 0) {
      this._bufferedLength.value = bufferedLength
      this._bufferedStart.value = this._sourceBuffer.buffered.start(bufferedLength - 1)
      this._bufferedEnd.value = this._sourceBuffer.buffered.end(bufferedLength - 1)
      this._bufferedTime.value = this._sourceBuffer.buffered.end(bufferedLength - 1) - this._sourceBuffer.buffered.start(0)
    }
  }

  private updateReceivedStatistics(receivedByteLength: number) {
    this._statistics.value = {
      ...this._statistics.value,
      bytesReceived: this._statistics.value.bytesReceived + receivedByteLength,
      segmentsReceived: this._statistics.value.segmentsReceived + 1
    }
  }

  private updateWrittenStatistics() {
    const {segment} = this._segmentsWithStatusPromise.shift()

    this._statistics.value.bytesWritten += segment.byteLength
    this._statistics.value.segmentsWritten += 1
  }

  private async feedSourceBuffer(): Promise<void> {
    if (!this._sourceBuffer.updating && this._segmentsWithStatusPromise.length) {
      this._sourceBuffer.appendBuffer(this._segmentsWithStatusPromise[0].segment)
    }

    const wait = async (ms: number): Promise<void> => {
      return new Promise(resolve => {
        setTimeout(resolve, ms)
      })
    }
    await wait(20)
    return this.feedSourceBuffer()
  }
}
