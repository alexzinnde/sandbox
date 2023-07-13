import type { Maybe } from './types';
import './style.css'

import generateUserInterface from './UserInterface';
import { getUserMediaStream } from './MediaStream';
import StreamVisualizer from './StreamVisualizer';


const { TimelineDataSeries, TimelineGraphView, videoElement, canvasElement, startBtn, graphCanvas} = generateUserInterface()

let userMediaStream: Maybe<MediaStream>;
let streamVisualizer: StreamVisualizer;
let timelineData
let timelineGraph

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

  timelineData = new TimelineDataSeries()
  timelineGraph = new TimelineGraphView('graph-container', 'graph-canvas')
}
function stop() {
  canvasElement.remove()
  userMediaStream?.getTracks().forEach(track => track.stop())
  userMediaStream = null;
}