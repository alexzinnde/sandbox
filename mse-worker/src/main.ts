import './style.css'
import {fetchChunkWithRetry} from './loaders';

const startButton = document.querySelector('#start-button');
const playButton = document.querySelector('#play-button');
const pauseButton = document.querySelector('#pause-button');

const videoElement = document.querySelector('video');

if (!videoElement) {
  throw new Error('There must be a video element.');
}

const mimeCodecType = 'video/mp4; codecs="avc1.42E01E"';
const idPadding = 5;
const baseUri = '/dash-local-unencrypted';
const demoInitChunkUrl = `${baseUri}/720init.mp4`;
const demoChunkTemplateUri = `720-$Number%.m4s`;
const demoMaxChunkId = 14


// let demoInitChunkUrl;
// const idPadding = 0;
// const mimeCodecType = 'video/mp4; codecs="avc1.42E01E"';
// const baseUri = '/dash-iso-bmff-unencrypted';
// const demoChunkTemplateUri = `test-mp4.$Number%`;
// const demoMaxChunkId = 1005;

let currentSegmentId = 0;
let chunkFeederInterval;
let mediaSegments: ArrayBuffer[]
const mseWorker = new Worker('src/worker.js');

mseWorker.postMessage({mimeCodecType})

mseWorker.onmessage = function(msg) {
  console.log('[main] Message from worker recieved [%o]', msg)
  const mediaSourceHandle = msg.data.arg
  videoElement.srcObject = mediaSourceHandle;
  videoElement.play();
}

window.onload = async() => {
  mediaSegments = await getAllMediaSegments()
  console.log('[worker] All mediaSegments fetched [%o]', mediaSegments);
}

startButton?.addEventListener('click', onStartButtonClick);
playButton?.addEventListener('click', onPlayButtonClick);
pauseButton?.addEventListener('click', onPauseButtonClick);

function onStartButtonClick() {

  chunkFeederInterval = startFeeder();
  startButton?.setAttribute('disabled', 'true');
  pauseButton?.removeAttribute('disabled');
}

function onPlayButtonClick() {
  if (videoElement?.paused) {
    videoElement?.play();
  }
}

function onPauseButtonClick() {
  videoElement?.pause();
  playButton?.removeAttribute('disabled');
}

async function getChunkWithId(chunkId: number): Promise<ArrayBuffer> {
  if (demoInitChunkUrl && chunkId === 0) {
    return fetchChunkWithRetry(demoInitChunkUrl);
  }

  return fetchChunkWithRetry(baseUri, demoChunkTemplateUri, chunkId, idPadding);
}

async function getAllMediaSegments(): Promise<ArrayBuffer[]> {
  const chunks = await Promise.all([...Array(demoMaxChunkId + 1).keys()].map(chunkId => getChunkWithId(chunkId)));

  return chunks.filter(Boolean);
}

function pushMediaSegment() {
  const segment = mediaSegments?.shift();
  
  if (segment) { 
    console.log('[main] [pushMediaSegment] postMessage segment [%s]', currentSegmentId)
    currentSegmentId++;
    mseWorker.postMessage({segment}, [segment])

    if (currentSegmentId > demoMaxChunkId) {
      stopFeeder()
    }
  }
}

function startFeeder() {
  return setInterval(pushMediaSegment, 33);
}

function stopFeeder() {
  clearInterval(chunkFeederInterval);
}