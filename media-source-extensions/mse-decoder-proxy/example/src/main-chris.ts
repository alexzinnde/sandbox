import './style.css'
import { MseDecoder } from '../../src/index';

const videoElement = document.querySelector<HTMLVideoElement>('video');
const toggleFeederBtn = document.querySelector<HTMLButtonElement>('#toggle-feeder-btn');
const mseDecoder = new MseDecoder(videoElement!);
const audioTrackWriter = await mseDecoder.createTrackWriter('audio/webm; codecs="opus"');
const videoTrackWriter = await mseDecoder.createTrackWriter('video/mp4; codecs="avc1.4d002a"');
const demoPathRoot = '/hawtin';

console.log('audioTrackWriter [%o]', audioTrackWriter)
console.log('videoTrackWriter [%o]', videoTrackWriter)

let audioSegmentFeeder: NodeJS.Timer;
let audioSegmentId = 0;
let videoSegmentFeeder: NodeJS.Timer;
let videoSegmentId = 0;
mseDecoder.status.subscribe({
  notify(status: ReadyState) {
    console.log('[MseDecoder] Status [%s]', status)
  }
});
audioTrackWriter.updating.subscribe({
  notify(updating: boolean) {
    console.log('[MseDecoder] videoTrackWriter updating [%s]', updating)
    console.log('[MseDecoder] [%o]', mseDecoder)
  }
});
videoTrackWriter.updating.subscribe({
  notify(updating: boolean) {
    console.log('[MseDecoder] videoTrackWriter updating [%s]', updating)
        console.log('[MseDecoder] [%o]', mseDecoder)
  }
});

toggleFeederBtn!.onclick = async () => {
  console.log('CLICKED')

  const audioStatus = await fetchAndWriteAudioSegment()
  const videoStatus = await fetchAndWriteVideoSegment()
  // audioSegmentFeeder = setInterval(fetchAndWriteAudioSegment, 0)
  // videoSegmentFeeder = setInterval(fetchAndWriteVideoSegment, 95000)

  console.log('audioStatus [%o]', audioStatus);
  console.log('videoStatus [%o]', videoStatus);
  toggleFeederBtn!.innerText = 'Stop';
};

async function fetchAndWriteAudioSegment() {

  const data = await fetchSegmentAt(`${demoPathRoot}/audio/hawtin-audio.webm`)
  // const data = await fetchSegmentAt(`${demoPathRoot}/audio/${'output_%Number$.mp4'.replace('%Number$', audioSegmentId.toString())}`)
  console.log('[audio] writing data at segmentId [%s] data [%o]', audioSegmentId, data)
  const writeStatus = await audioTrackWriter.write(data);
  audioSegmentId += 1;
  if (audioSegmentId > 12) {
    audioSegmentId = 0;
  }
  return writeStatus
}
async function fetchAndWriteVideoSegment() {
  // const data = await fetchSegmentAt(`${demoPathRoot}/video/${'output_%Number$.mp4'.replace('%Number$', videoSegmentId.toString())}`)
  const data = await fetchSegmentAt(`${demoPathRoot}/video/hawtin-video.mp4`);
  console.log('[video] writing data atsegmentId [%s] data [%o]', audioSegmentId, data)
  const writeStatus = await videoTrackWriter.write(data);
  videoSegmentId += 1;

  if (videoSegmentId > 13) {
    videoSegmentId = 0;
  }

  return writeStatus
}

async function fetchSegmentAt(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

export function padStringWithZeros(str: string, targetLength = 5) {
  const strArr = str.split('');

  while (strArr.length < targetLength) {
    strArr.unshift('0');
  }

  return strArr.join('');
}
