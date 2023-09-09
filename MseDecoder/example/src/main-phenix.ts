import './style.css'
import MseDecoder from '../../src/index'
import {subscribeToMseDecoder} from './statistics/MseDecoderStats'
// import {subscribeToAudioTrackWriter} from './statistics/AudioTrackWriter'
import {subscribeToVideoTrackWriter} from './statistics/VideoTrackWriter'
import {Channels} from '@phenixrts/sdk'
import TrackWriter from '../../src/tracks/TrackWriter'

const videoElement = document.getElementById('video-1')
const mseDecoder = new MseDecoder(videoElement)

const audioMimeType = 'audio/mp4; codecs="opus"'
const videoMimeType = 'video/mp4; codecs="avc1.640028"'

async function main() {
  if (!videoElement) {
    throw new Error('No Video Element!')
  }

  const videoTrackWriter = await mseDecoder.createTrackWriter(videoMimeType)
  const videoTrack = new EncodedStreamTrack(videoTrackWriter)

  Channels.createChannel({
    token:
      'DIGEST:eyJhcHBsaWNhdGlvbklkIjoicGhlbml4cnRzLmNvbS1hbGV4Lnppbm4iLCJkaWdlc3QiOiJEYm5NVXFEMGFZZExOc3VnT1RNczFsendJYzlDbUZyM2NzSmQ3ZndRRE1rcWdISTJVd1BUL1RhT3cvZHl5VDZDWXZ3UlNuc05KN1BDN2VpT1Fpa0t2dz09IiwidG9rZW4iOiJ7XCJleHBpcmVzXCI6MTY5Mzg0NDcyOTkwMSxcInVyaVwiOlwiaHR0cHM6Ly9wY2FzdC1zdGcucGhlbml4cnRzLmNvbVwiLFwiY2FwYWJpbGl0aWVzXCI6W1widmlkZW8tb25seVwiLFwiZW5jb2RlZC1pbnNlcnRhYmxlLXN0cmVhbXNcIl0sXCJyZXF1aXJlZFRhZ1wiOlwiY2hhbm5lbElkOnVzLWNlbnRyYWwjcGhlbml4cnRzLmNvbS1hbGV4Lnppbm4jbXlDaGFubmVsQWxpYXMuZXVqY0hPb0VPNmJVXCJ9In0=',
    videoElement: videoElement as HTMLVideoElement,
    encodedVideoStreamSink: videoTrack.sink
  })
}

main()

class EncodedStreamTrack {
  private readonly _trackWriter: TrackWriter
  private _isInitialied: boolean

  constructor(trackWriter: TrackWriter) {
    this._trackWriter = trackWriter
    this._isInitialied = false
    this.sink = this.sink.bind(this)
  }

  public sink(track: MediaStreamTrack, chunk: RTCEncodedVideoFrame) {
    switch (this._isInitialied) {
      case false:
        if (chunk.type === 'key') {
          console.log('[sink] key!')
          this._isInitialied = true
          this._trackWriter.write(chunk.data)
        }
        break

      default:
        this._trackWriter.write(chunk.data)
    }
  }
}
