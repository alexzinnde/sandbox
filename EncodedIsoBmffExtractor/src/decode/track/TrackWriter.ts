import { ReadOnlySubject, Subject } from '@zinntechniker/subjectify'

type TrackWriterStatus = 'initializing' | 'ready' | 'updating' | 'error'
type TrackWriterWriteStatus = 'ok' | 'error'
type SegmentWithStatusPromise = {
  segment: ArrayBuffer
  resolveWriteStatusPromise: (status: TrackWriterWriteStatus) => void
}

export default class TrackWriter {
  private readonly _sourceBuffer: SourceBuffer
  private readonly _status: Subject<TrackWriterStatus> = new Subject('initializing')
  private readonly _segmentsWithStatusPromise: SegmentWithStatusPromise[] = []
  private readonly _bufferedStart: Subject<number> = new Subject(0)
  private readonly _bufferedEnd: Subject<number> = new Subject(0)
  private readonly _readOnlyStatus: ReadOnlySubject<TrackWriterStatus> = new ReadOnlySubject(this._status)
  private readonly _readOnlyBufferedStart: ReadOnlySubject<number> = new ReadOnlySubject(this._bufferedStart)
  private readonly _readOnlyBufferedEnd: ReadOnlySubject<number> = new ReadOnlySubject(this._bufferedEnd)
  private _isSourceBufferUpdating: boolean = false

  constructor(mimeType: string, sourceBuffer: SourceBuffer) {
    this._sourceBuffer = sourceBuffer
    this._sourceBuffer.mode = 'segments'
    this._sourceBuffer.onerror = () => {
      console.warn('TrackWriter [%o] Error', mimeType)
      debugger
    }
  }

  get status(): ReadOnlySubject<TrackWriterStatus> {
    return this._readOnlyStatus
  }

  get bufferedStart(): ReadOnlySubject<number> {
    return this._readOnlyBufferedStart
  }

  get bufferedEnd(): ReadOnlySubject<number> {
    return this._readOnlyBufferedEnd
  }

  public write(segment: ArrayBuffer) {
    const writePromise = new Promise<TrackWriterWriteStatus>(resolveWriteStatusPromise => {
      this._segmentsWithStatusPromise.push({
        segment,
        resolveWriteStatusPromise
      })
    })

    this.processQueue()

    return writePromise
  }

  private async processQueue() {
    if (this._isSourceBufferUpdating) {
      return
    }

    this._isSourceBufferUpdating = true

    const writeSegmentToSourceBuffer = (segment: ArrayBuffer) => {
      return new Promise<TrackWriterWriteStatus>(resolveAppendStatusPromise => {
        this._sourceBuffer.onupdateend = () => {
          this.updateBufferedTimeRanges()
          resolveAppendStatusPromise('ok')
          this._sourceBuffer.onupdateend = null
        }

        this._sourceBuffer.appendBuffer(segment)
      })
    }

    while (this._segmentsWithStatusPromise.length) {
      const { segment, resolveWriteStatusPromise } = this._segmentsWithStatusPromise.shift()
      const appendStatus = await writeSegmentToSourceBuffer(segment)

      resolveWriteStatusPromise(appendStatus)
    }

    this._isSourceBufferUpdating = false
  }

  private updateBufferedTimeRanges() {
    if (this._sourceBuffer.buffered.length > 0) {
      const bufferedEndIndex = this._sourceBuffer.buffered.length - 1
      this._bufferedStart.value = this._sourceBuffer.buffered.start(bufferedEndIndex)
      this._bufferedEnd.value = this._sourceBuffer.buffered.end(bufferedEndIndex)
    }
  }
}
