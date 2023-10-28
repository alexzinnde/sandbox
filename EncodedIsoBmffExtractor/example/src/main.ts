import { Channels } from '@phenixrts/sdk'
import { MseDecoder } from '../../src/index'
import IDisposable from '../../src/lang/disposable/IDisposable'
import EncodedMediaPlaybackManager from './EncodedMediaPlaybackManager'
import EncodedIsoBmffExtractor from '../../src/decode/extract/EncodedIsoBmffExtractor'

const token =
  'DIGEST:eyJhcHBsaWNhdGlvbklkIjoicGhlbml4cnRzLmNvbS1hbGV4Lnppbm4iLCJkaWdlc3QiOiIrSHhkL3hQdTBLdTVRWnZLT1NQUjVHSFhvVzhUK3UrWE5FWjJ2VWtBZUorUXl3VjFjQzJJSjVGUHEyNVlkUkRWTSsvT1BCQWQ4UzZsMkRaeUhwMXdpdz09IiwidG9rZW4iOiJ7XCJleHBpcmVzXCI6MTcyOTk5NDY3MTY2OCxcInVyaVwiOlwiaHR0cHM6Ly9wY2FzdC1zdGcucGhlbml4cnRzLmNvbVwiLFwiY2FwYWJpbGl0aWVzXCI6W1wiZW5jb2RlZC1pbnNlcnRhYmxlLXN0cmVhbXNcIl0sXCJyZXF1aXJlZFRhZ1wiOlwiY2hhbm5lbElkOnVzLWNlbnRyYWwjcGhlbml4cnRzLmNvbS1hbGV4Lnppbm4jdGVzdENoYW5uZWwuZ2NGQU1FRHpvS2ZQXCJ9In0='
const phenixInitializationSegmentUuidString = '511e22bd-34c0-4cee-b6c3-3c4d407622c7'
const phenixMediaSegmentUuidString = '00000000-0000-0000-0000-000000000000'

const videoElement = document.getElementById('video-1') as HTMLVideoElement
const currentTimeDisplay = document.getElementById('current-time') as HTMLInputElement
const lagDisplay = document.getElementById('lag') as HTMLInputElement
const bufferedStartDisplay = document.getElementById('buffered-start') as HTMLInputElement
const bufferedEndDisplay = document.getElementById('buffered-end') as HTMLInputElement

if (!videoElement) {
  throw new Error('No Video Element found')
}

let audioMediaSegmentSubcription: IDisposable | undefined = undefined
let videoInitializationSegmentSubcription: IDisposable | undefined = undefined
let videoMediaSegmentSubcription: IDisposable | undefined = undefined
let videoWriteStatus = false

async function main() {
  const playbackManager = new EncodedMediaPlaybackManager(videoElement)
  const mseDecoder = new MseDecoder(videoElement)
  const extractor = new EncodedIsoBmffExtractor()

  videoInitializationSegmentSubcription = extractor.subscribeToPayload(phenixInitializationSegmentUuidString, async phenixInitializationSegment => {
    console.log('phenixInitializationSegment [%o]', phenixInitializationSegment.slice())

    if (!videoMediaSegmentSubcription) {
      videoInitializationSegmentSubcription?.dispose()
      videoMediaSegmentSubcription = subscribeToMediaSegments()
    }
    await videoTrackWriter.write(phenixInitializationSegment)
  })

  function subscribeToMediaSegments() {
    return extractor.subscribeToPayload(phenixMediaSegmentUuidString, async phenixMediaSegment => {
      // console.log('phenixMediaSegment [%o]', phenixMediaSegment.slice())

      await videoTrackWriter.write(phenixMediaSegment)
    })
  }

  // const audioTrackWriter = await mseDecoder.createTrackWriter('audio/mp4; codecs="opus"')
  const videoTrackWriter = await mseDecoder.createTrackWriter('video/mp4; codecs="avc1.42c015"')

  videoTrackWriter.bufferedStart.subscribe(bufferedStart => {
    bufferedStartDisplay.value = bufferedStart.toFixed(3)
  })
  videoTrackWriter.bufferedEnd.subscribe(playbackManager.onBufferedEndChange)
  videoTrackWriter.bufferedEnd.subscribe(bufferedEnd => {
    if (bufferedEnd - videoElement.currentTime > 1) {
      videoElement.currentTime = bufferedEnd
    }
    bufferedEndDisplay.value = bufferedEnd.toFixed(3)
    lagDisplay.value = (bufferedEnd - videoElement.currentTime).toFixed(3)
  })

  const channelOptions = {
    token,
    videoElement,
    encodedAudioStreamSink: (track: MediaStreamTrack, chunk: RTCEncodedAudioFrame) => {
      return true
    },
    encodedVideoStreamSink: (track: MediaStreamTrack, chunk: RTCEncodedVideoFrame) => {
      // console.log('+++++ chunk [%o] ++++ ', chunk.data.byteLength)
      extractor.extract(chunk.data)
      currentTimeDisplay.value = videoElement.currentTime.toString()

      // console.log('\n')

      return videoWriteStatus
    }
  }

  let channel = Channels.createChannel(channelOptions)
}

main()
