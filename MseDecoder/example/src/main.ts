import './style.css'
import Segments from './Segments'
import MseDecoder from '../../src/index'
import {subscribeToMseDecoder} from './statistics/MseDecoderStats'
import {subscribeToVideoTrackWriter} from './statistics/VideoTrackWriter'
import TrackWriter, {TrackWriterStateType} from '../../src/tracks/TrackWriter'
import DisposableList from '../../src/disposable/DisposableList'
import Disposable from '../../src/disposable/Disposable'

const resetMseDecoderBtn = document.getElementById('reset-mse-decoder') as HTMLButtonElement
const videoElement = document.getElementById('video-1') as HTMLMediaElement
const videoSegments = new Segments({
  baseUrl: '/avsync/video',
  initSegmentUrl: 'init.mp4',
  segmentStartId: 1,
  segmentEndId: 991,
  templateUri: 'seg$Number%.m4s'
})
const audioSegments = new Segments({
  baseUrl: '/avsync/audio',
  initSegmentUrl: 'init.mp4',
  segmentStartId: 1,
  segmentEndId: 1016,
  templateUri: 'seg$Number%.m4s'
})

videoSegments.isLoaded.subscribe(() => {
  console.log('Segment Loading complete')
  if (audioSegments.isLoaded.value) {
    main()
  }
})

audioSegments.isLoaded.subscribe(() => {
  console.log('Segment Loading complete')
  if (videoSegments.isLoaded.value) {
    main()
  }
})

const audioMimeType = 'audio/mp4; codecs="opus"'
const videoMimeType = 'video/mp4; codecs="avc1.640028"'

async function main() {
  if (!videoElement) {
    throw new Error('No Video Element!')
  }

  // MseDecoder
  const mseDecoder = new MseDecoder(videoElement)
  // const audioTrackWriter = await setupAudioTrackWriter(mseDecoder)
  const videoTrackWriter = await mseDecoder.createTrackWriter(videoMimeType)
  let videoTrack = new EncodedMediaTrack(videoMimeType, videoTrackWriter, videoSegments)
  subscribeToMseDecoder(mseDecoder)
  subscribeToVideoTrackWriter(videoTrackWriter)

  mseDecoder.status.subscribe(async state => {
    switch (state) {
      case 'initialzing':
      case 'error':
        videoTrack.dispose()
        videoTrack = new EncodedMediaTrack(videoMimeType, await mseDecoder.createTrackWriter(videoMimeType), videoSegments)
        videoTrack.enable()

        break
      case 'decoding':

      default:
    }
  })

  window['mseDecoder'] = mseDecoder

  resetMseDecoderBtn.onclick = () => {
    mseDecoder.reset()
  }
}

class EncodedMediaTrack {
  private readonly _mimeType: string
  private readonly _trackWriter: TrackWriter
  private _isTrackWriterInitialized: boolean
  private _feederInterval: NodeJS.Timeout | undefined
  private readonly _segments: Segments
  private readonly _disposables: DisposableList

  constructor(mimeType: string, trackWriter: TrackWriter, segments: Segments) {
    this._mimeType = mimeType
    this._trackWriter = trackWriter
    this._segments = segments
    this._isTrackWriterInitialized = false
    this._disposables = new DisposableList()

    this.initialize()
  }

  public enable(): void {
    console.log('[EncodedMediaTrack] enable')
    this.setFeederInterval()
  }

  public reset(): void {
    console.log('[EncodedMediaTrack] reset')
    this.initialize()
    this.setFeederInterval()
  }

  public dispose(): void {
    this._trackWriter.dispose()
    this._disposables.dispose()
  }

  private initialize() {
    this._segments.isLoaded.subscribe(this.setFeederInterval.bind(this))
    this._disposables.add(new Disposable({dispose: this.clearFeederInterval.bind(this)}))
    this._disposables.add(new Disposable({dispose: () => this._segments.setCurrentSegmentId(0)}))
    const trackWriterStateHandler = function (this: EncodedMediaTrack, state: TrackWriterStateType) {
      switch (state) {
        case 'failed':
          this.dispose()
          break

        default:
      }
    }
    const unsubscribeTrackWriterState = this._trackWriter.state.subscribe(trackWriterStateHandler.bind(this))
    this._disposables.add(new Disposable({dispose: unsubscribeTrackWriterState}))
  }

  private setFeederInterval() {
    console.log('[%s] starting interval', this._mimeType)
    this._feederInterval = setInterval(this.feedTrack.bind(this), 1000 / 30)
  }

  private clearFeederInterval() {
    console.log('[EncodedMeidaTrack] clearing interval')
    clearInterval(this._feederInterval)
    this._feederInterval = undefined
  }

  private async feedTrack() {
    await this._trackWriter.write(this._segments.getNextSegment())
  }
}