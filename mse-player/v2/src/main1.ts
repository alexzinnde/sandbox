import './style.css'
import MsePlayerBuilder from './modules/MsePlayerBuilder';
import {MsePlayerEvents} from './modules/MsePlayer';
import {fetchChunkWithRetry} from './modules/segmentLoading';


// Media Segments ===========================================================
const mimeCodecType = 'video/mp4; codecs="avc1.42E01E"';
const baseUri = '/iso-bmff-unencrypted';
const demoChunkTemplateUri = `test-mp4.$Number%`;
const maxSegmentId = 100;
let feederInterval: number;
let currentSegmentId = 0;


async function getSegmentAtId(segmentId: number): Promise<ArrayBuffer> {
  return fetchChunkWithRetry(baseUri, demoChunkTemplateUri, segmentId, 0);
}

let feeding: boolean;

async function feedSourceBuffer() {
  feeding = true;

  if (currentSegmentId > maxSegmentId) {
    currentSegmentId = 0;
  }

  const segment = await getSegmentAtId(currentSegmentId)
  msePlayer.pushSegment(segment)
  currentSegmentId += 1;
  feeding = false;
}

function startFeeder() {
  console.log('[demo] Starting feeder')
  feederInterval = setInterval(() => {
    if (!feeding) {
      feedSourceBuffer()
    } else {
      console.log('[feeder] still feeding skipping')
    }
  }, 20);
}

function setVideoElement(videoElement: HTMLVideoElement) {
  if (videoElement) {
    msePlayer.videoElement = videoElement;
  }
}

function stopFeeder() {
  console.log('[demo] stop feeder')
  clearInterval(feederInterval);
}

// HTML Elements ===========================================================+
const video1Element = document.querySelector<HTMLVideoElement>('#video1');
const video2Element = document.querySelector<HTMLVideoElement>('#video2');
const startButton = document.querySelector<HTMLButtonElement>('#start-button');
const stopFeederButton = document.querySelector<HTMLButtonElement>('#stop-feeder-button');
const logButton = document.querySelector<HTMLButtonElement>('#log-button');
const mseReadyStateSpan = document.querySelector<HTMLSpanElement>('#mse-readystate');
const msePlayerIsoBmffSegmentsLengthSpan = document.querySelector<HTMLSpanElement>('#mseplayer-isobmffsegments');
const msePlayerSegmentsPushedSpan = document.querySelector<HTMLSpanElement>('#mseplayer-segmentspushed');
const msePlayerSegmentsAppendedSpan = document.querySelector<HTMLSpanElement>('#mseplayer-segmentsappended');
const msePlayerISReceivedSpan = document.querySelector<HTMLSpanElement>('#mseplayer-isreceived');


startFeeder();

startButton!.onclick = startFeeder;
stopFeederButton!.onclick = stopFeeder;
video1Element!.onclick = function() {
  console.log('[demo] video element 1 clicked')
  setVideoElement(video1Element!)
}
video2Element!.onclick = function() {
  console.log('[demo] video element 2 clicked')
  setVideoElement(video2Element!)
}
logButton!.onclick = () => {
  console.log(msePlayer);
  console.log('[VideoElement] Error? [%o]', videoElement?.error)
};

const msePlayer = new MsePlayerBuilder()
  // .forVideoElement(videoElement!)
  .withMimeCodecType(mimeCodecType)
  .withSourceBufferMode('sequence')
  .create()

  
let isoBmffSegments = 0;
let segmentsPushed = 0;
let segmentsAppendedToSourceBuffer = 0;
let isReceived = 0;

msePlayer.addEventListener(MsePlayerEvents.MediaSource, ({detail}) => {
  console.log('[demo] MsePlayerEvents.MediaSource')
  mseReadyStateSpan!.innerText = detail.mediaSourceReadyState
})

msePlayer.addEventListener(MsePlayerEvents.SegmentPush, ({detail}) => {
  segmentsPushed += 1;
  msePlayerSegmentsPushedSpan!.innerText = segmentsPushed.toString()
  msePlayerIsoBmffSegmentsLengthSpan!.innerText = detail.isoBmffSegments.toString()
})

msePlayer.addEventListener(MsePlayerEvents.SourceBufferError, ({detail}) => {
  console.error('SourceBuffer Error Detected! [%o]', detail.sourceBufferError)
})
msePlayer.addEventListener(MsePlayerEvents.AppendToSourceBuffer, () => {
  segmentsAppendedToSourceBuffer += 1;
  msePlayerSegmentsAppendedSpan!.innerText = segmentsAppendedToSourceBuffer.toString();
})
msePlayer.addEventListener(MsePlayerEvents.VideoElementError, ({detail}) => {
  const {videoElementErrorEvent} = detail;
  console.log('videoElementError [%o]', videoElementErrorEvent)
})
msePlayer.addEventListener(MsePlayerEvents.ISReceived, () => {
  isReceived += 1;
  msePlayerISReceivedSpan!.innerText = isReceived.toString()
})