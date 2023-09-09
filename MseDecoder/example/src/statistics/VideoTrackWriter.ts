import TrackWriter from '../../../src/tracks/TrackWriter'

const videoTrackWriterStateDisplay = document.getElementById('video-trackwriter-state') as HTMLInputElement
const videoTrackWriterBufferedLengthDisplay = document.getElementById('video-trackwriter-buffered-length') as HTMLInputElement
const videoTrackWriterBufferedStartDisplay = document.getElementById('video-trackwriter-buffered-start') as HTMLInputElement
const videoTrackWriterBufferedEndDisplay = document.getElementById('video-trackwriter-buffered-end') as HTMLInputElement
const videoTrackWriterBufferedTimeDisplay = document.getElementById('video-trackwriter-buffered-time') as HTMLInputElement

export function subscribeToVideoTrackWriter(trackWriter: TrackWriter) {
  trackWriter.state.subscribe(state => {
    videoTrackWriterStateDisplay.value = state
  })
  trackWriter.bufferedLength.subscribe(bufferedLength => {
    videoTrackWriterBufferedLengthDisplay.value = bufferedLength.toString()
  })
  trackWriter.bufferedStart.subscribe(bufferedStart => {
    videoTrackWriterBufferedStartDisplay.value = bufferedStart.toString()
  })
  trackWriter.bufferedEnd.subscribe(bufferedEnd => {
    videoTrackWriterBufferedEndDisplay.value = bufferedEnd.toString()
  })
  trackWriter.bufferedTime.subscribe(bufferedTime => {
    videoTrackWriterBufferedTimeDisplay.value = bufferedTime.toString()
  })
}
