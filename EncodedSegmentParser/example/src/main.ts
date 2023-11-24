import { Channels } from '@phenixrts/sdk'
import { MseDecoder, EncodedSegmentExtractor } from '../../src/index'
import IDisposable from '../../src/IDisposable'
import EncodedMediaPlaybackManager from './EncodedMediaPlaybackManager'

const token =
  'DIGEST:eyJhcHBsaWNhdGlvbklkIjoicGhlbml4cnRzLmNvbS1hbGV4Lnppbm4iLCJkaWdlc3QiOiJwdHFETldDLzFqaXRRaVlRUEdhNE9jMnhCQ2FZMlN0citsOUhUUUxmbCtGbGFnOGdGaGVhL3Q5YUo2RWwwMDFjd3RpNVkyZTlIdjJDTGkvMjRwU0ZBZz09IiwidG9rZW4iOiJ7XCJleHBpcmVzXCI6MjAxMzIyMzYwNTIxNyxcInVyaVwiOlwiaHR0cHM6Ly9wY2FzdC1zdGcucGhlbml4cnRzLmNvbVwiLFwiY2FwYWJpbGl0aWVzXCI6W1wiZW5jb2RlZC1pbnNlcnRhYmxlLXN0cmVhbXNcIl0sXCJyZXF1aXJlZFRhZ1wiOlwiY2hhbm5lbElkOnVzLWNlbnRyYWwjcGhlbml4cnRzLmNvbS1hbGV4Lnppbm4jdGVzdENoYW5uZWwuM2pjZFlmSk9IdDBGXCJ9In0='

const videoElement = document.getElementById('video-1') as HTMLVideoElement
const currentTimeDisplay = document.getElementById('current-time') as HTMLInputElement
const lagDisplay = document.getElementById('lag') as HTMLInputElement
const bufferedStartDisplay = document.getElementById('buffered-start') as HTMLInputElement
const bufferedEndDisplay = document.getElementById('buffered-end') as HTMLInputElement

if (!videoElement) {
  throw new Error('No Video Element found')
}

let audioMediaSegmentSubcription: IDisposable | undefined = undefined
let videoMediaSegmentSubcription: IDisposable | undefined = undefined
let writeStatus = false

async function main() {
  const playbackManager = new EncodedMediaPlaybackManager(videoElement)
  const mseDecoder = new MseDecoder(videoElement)
  const audioTrackWriter = await mseDecoder.createTrackWriter('audio/mp4; codecs="opus"')
  const videoTrackWriter = await mseDecoder.createTrackWriter('video/mp4; codecs="avc1.42c015"')
  const extractor = new EncodedSegmentExtractor()

  videoTrackWriter.bufferedStart.subscribe(bufferedStart => {
    bufferedStartDisplay.value = bufferedStart.toFixed(3)
  })
  videoTrackWriter.bufferedEnd.subscribe(playbackManager.onBufferedEndChange)
  videoTrackWriter.bufferedEnd.subscribe(bufferedEnd => {
    bufferedEndDisplay.value = bufferedEnd.toFixed(3)

    if (bufferedEnd - videoElement.currentTime > 1) {
      videoElement.currentTime = bufferedEnd - 0.3
    }

    currentTimeDisplay.value = videoElement.currentTime.toFixed(3)
    lagDisplay.value = (bufferedEnd - videoElement.currentTime).toFixed(3)
  })

  extractor.subscribeToPhenixEmedded('1', async (initializationSegment: ArrayBuffer) => {
    const initializatonSegmentWriteStatus = await audioTrackWriter.write(initializationSegment)

    if (!audioMediaSegmentSubcription) {
      audioMediaSegmentSubcription = extractor.subscribeToPhenixEmedded('2', async (mediaSegment: ArrayBuffer) => {
        const mediaSegmentWriteStatus = await audioTrackWriter.write(mediaSegment)

        writeStatus = mediaSegmentWriteStatus === 'ok'
      })
    }
  })

  extractor.subscribeToPhenixEmedded('511e22bd34c04ceeb6c33c4d407622c7', async (initializationSegment: ArrayBuffer) => {
    const initializatonSegmentWriteStatus = await videoTrackWriter.write(initializationSegment)

    if (!videoMediaSegmentSubcription) {
      videoMediaSegmentSubcription = extractor.subscribeToPhenixEmedded('0', async (mediaSegment: ArrayBuffer) => {
        const mediaSegmentWriteStatus = await videoTrackWriter.write(mediaSegment)

        writeStatus = mediaSegmentWriteStatus === 'ok'
      })
    }
  })

  const channelOptions = {
    token,
    videoElement,
    encodedAudioStreamSink: (track: MediaStreamTrack, chunk: RTCEncodedAudioFrame) => {
      extractor.extractAudio(chunk.data)
      return true
    },
    encodedVideoStreamSink: (track: MediaStreamTrack, chunk: RTCEncodedVideoFrame) => {
      extractor.extractVideo(chunk.data)
      return writeStatus
    }
  }

  let channel = Channels.createChannel(channelOptions)
}

main()
