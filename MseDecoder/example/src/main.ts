import './style.css'
import Segments from './Segments'
import MseDecoder from '../../src/index'
import TrackWriter from '../../src/tracks/TrackWriter'

const videoElement = document.getElementById('video-1') as HTMLMediaElement

const videoTrackWriterStateDisplay = document.getElementById('video-track-writer-state') as HTMLInputElement

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
  window['mseDecoder'] = mseDecoder
  subscribeToMseDecoder(mseDecoder)

  const audioTrackWriter = await setupAudioTrackWriter(mseDecoder)
  const videoTrackWriter = await setupVideoTrackWriter(mseDecoder)

  setInterval(async () => {
    audioTrackWriter.write(audioSegments.getNextSegment())
    videoTrackWriter.write(videoSegments.getNextSegment())

    // console.log('writeStatus [%s] [%s]', segments.currentSegmentId, await writeStatus)
  }, 1000 / 30)
}

async function setupAudioTrackWriter(mseDecoder: MseDecoder) {
  const audioTrackWriter = await mseDecoder.createTrackWriter(audioMimeType)
  window['audioTrackWriter'] = audioTrackWriter

  subscribeToAudioTrackWriter(audioTrackWriter)

  return audioTrackWriter
}

async function setupVideoTrackWriter(mseDecoder: MseDecoder) {
  const videoTrackWriter = await mseDecoder.createTrackWriter(videoMimeType)
  window['videoTrackWriter'] = videoTrackWriter

  subscribeToVideoTrackWriter(videoTrackWriter)

  return videoTrackWriter
}

function subscribeToAudioTrackWriter(trackWriter: TrackWriter) {
  trackWriter.state.subscribe(state => {
    console.log('[audioTrackWriter] State [%s]', state)
    videoTrackWriterStateDisplay.value = state
  })
}

function subscribeToMseDecoder(mseDecoder: MseDecoder) {
  mseDecoder.status.subscribe(status => {
    console.log('[MseDecoder] status [%s]', status)
  })

  mseDecoder.statistics.subscribe(statistics => {
    console.log('[MseDecoder] statistics [%s]', statistics)
  })
}

function subscribeToVideoTrackWriter(trackWriter: TrackWriter) {
  console.log('in subsribe [%o]', trackWriter)
  trackWriter.state.subscribe(state => {
    console.log('[videoTrackWriter] State [%s]', state)
    videoTrackWriterStateDisplay.value = state
  })
}
