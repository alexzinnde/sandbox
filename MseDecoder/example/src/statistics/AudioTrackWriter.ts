import TrackWriter from '../../../src/tracks/TrackWriter'

const audioTrackWriterStateDisplay = document.getElementById('audio-trackwriter-state') as HTMLInputElement
const audioTrackWriterBufferedLengthDisplay = document.getElementById('audio-trackwriter-buffered-length') as HTMLInputElement
const audioTrackWriterBufferedStartDisplay = document.getElementById('audio-trackwriter-buffered-start') as HTMLInputElement
const audioTrackWriterBufferedEndDisplay = document.getElementById('audio-trackwriter-buffered-end') as HTMLInputElement
const audioTrackWriterBufferedTimeDisplay = document.getElementById('audio-trackwriter-buffered-time') as HTMLInputElement

export function subscribeToAudioTrackWriter(trackWriter: TrackWriter) {
  trackWriter.state.subscribe(state => {
    audioTrackWriterStateDisplay.value = state
  })
  trackWriter.bufferedLength.subscribe(bufferedLength => {
    audioTrackWriterBufferedLengthDisplay.value = bufferedLength.toString()
  })
  trackWriter.bufferedStart.subscribe(bufferedStart => {
    audioTrackWriterBufferedStartDisplay.value = bufferedStart.toString()
  })
  trackWriter.bufferedEnd.subscribe(bufferedEnd => {
    audioTrackWriterBufferedEndDisplay.value = bufferedEnd.toString()
  })
  trackWriter.bufferedTime.subscribe(bufferedTime => {
    audioTrackWriterBufferedTimeDisplay.value = bufferedTime.toString()
  })
}
