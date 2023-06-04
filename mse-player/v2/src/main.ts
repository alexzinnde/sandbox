import './style.css'
import {fetchChunkWithRetry} from './modules/segmentLoading';
import MsePlayerBuilder from './modules/MsePlayerBuilder';
import { MsePlayerEvents } from './modules/MsePlayer';

// Media Segments ===========================================================
const mimeCodecType = 'video/mp4; codecs="avc1.42E01E"';
const baseUri = '/iso-bmff-unencrypted';
const demoChunkTemplateUri = `test-mp4.$Number%`;
const maxSegmentId = 1005;

let feederInterval: number;
let currentSegmentId = 0;
let feeding: boolean;

async function getSegmentAtId(segmentId: number): Promise<ArrayBuffer> {
  return fetchChunkWithRetry(baseUri, demoChunkTemplateUri, segmentId, 0);
}

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
  }, 33);
}

function stopFeeder() {
  console.log('[demo] stop feeder')
  clearInterval(feederInterval);
}

// Video Elements ===========================================================
const video1Element = document.querySelector<HTMLVideoElement>('#video-1');
const video2Element = document.querySelector<HTMLVideoElement>('#video-2');
const video3Element = document.querySelector<HTMLVideoElement>('#video-3');
const video4Element = document.querySelector<HTMLVideoElement>('#video-4');

const msePlayer = new MsePlayerBuilder()
  .withMimeCodecType(mimeCodecType)
  .withSourceBufferMode('sequence')
  .create()

  startFeeder()

  video1Element!.onclick = () => {
    console.log('[demo] **** video-1 clicked ****')
    msePlayer.setVideoElement(video1Element!);
  }
  video2Element!.onclick = () => {
    console.log('[demo] **** video-2 clicked ****')
    msePlayer.setVideoElement(video2Element!);
  }
  video3Element!.onclick = () => {
    console.log('[demo] **** video-3 clicked ****')
    msePlayer.setVideoElement(video3Element!);
  }
  video4Element!.onclick = () => {
    console.log('[demo] **** video-4 clicked ****')
    msePlayer.setVideoElement(video4Element!);
  }

// Controls ==================================================================
const startButton = document.querySelector<HTMLButtonElement>('#start-button');
const stopFeederButton = document.querySelector<HTMLButtonElement>('#stop-feeder-button');
const logButton = document.querySelector<HTMLButtonElement>('#log-button');

startButton!.onclick = function() {
  
}

stopFeederButton!.onclick = function() {

}

logButton!.onclick = function() {
  console.log(msePlayer)
}

// Event Listeners  ==================================================================
video1Element?.addEventListener('error', () => console.log('[video-1] Error [%o]', video1Element.error))
video2Element?.addEventListener('error', () => console.log('[video-2] Error [%o]', video2Element.error))
video3Element?.addEventListener('error', () => console.log('[video-3] Error [%o]', video3Element.error))
video4Element?.addEventListener('error', () => console.log('[video-4] Error [%o]', video4Element.error))

msePlayer.addEventListener(MsePlayerEvents.RequestPLI, () => currentSegmentId = 0)