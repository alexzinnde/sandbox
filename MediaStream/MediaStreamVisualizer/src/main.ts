import type { Maybe } from './types';
import './style.css'

import generateUserInterface from './UserInterface';
import { getUserMediaStream } from './MediaStream';
import StreamVisualizer from './StreamVisualizer';
import {TimelineDataSeries, TimelineGraphView} from './Graph/index.js';

const { videoElement, canvasElement, startBtn } = generateUserInterface()

let userMediaStream: Maybe<MediaStream>;
let streamVisualizer: StreamVisualizer;

startBtn.onclick = async () => {
  console.log('[startBtn] [click] userMediaStream [%o]', userMediaStream)
  
  if (userMediaStream) {
    stop()
    startBtn.innerText = 'Start'
    startBtn.style.backgroundColor = 'green'
    return;
  }

  await main();
  startBtn.innerText = 'Stop'
  startBtn.style.backgroundColor = 'red'
}

async function main() {
  if (!userMediaStream) {
    userMediaStream = await getUserMediaStream({ audio: true, video: true })
  } 

  videoElement.srcObject = userMediaStream;
  videoElement.play();

  streamVisualizer = new StreamVisualizer(userMediaStream, canvasElement, { frequencyDomainVisualizer: true, timeDomainVisualizer: false })
  streamVisualizer.start();
}
function stop() {
  canvasElement.remove()
  userMediaStream?.getTracks().forEach(track => track.stop())
  userMediaStream = null;
}