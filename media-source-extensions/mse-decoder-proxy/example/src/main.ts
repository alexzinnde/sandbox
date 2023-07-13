import './style.css'
import { MseDecoder } from '../../src/index';
import { WriteStatus } from '../../src/MseDecoder';

const videoElement = document.querySelector<HTMLVideoElement>('video');
const toggleFeederBtn = document.querySelector<HTMLButtonElement>('#toggle-feeder-btn');
const feedInvalidBtn = document.querySelector<HTMLButtonElement>('#feed-invalid-data-btn');
const feedTruncatedBtn = document.querySelector<HTMLButtonElement>('#feed-truncated-data-btn');
const mseDecoder = new MseDecoder(videoElement!);
const videoTrackWriter = await mseDecoder.createTrackWriter('video/mp4; codecs="avc1.42E01E"');
const demoPath = '/Phenix-ISO-BMFF-20s-H264-unencrypted/test-mp4.%Number$'
const segmentDuration = 1000 / 30;
let feederInterval: NodeJS.Timer;
let dataId = 0;
let isTruncate = false;

mseDecoder.status.subscribe({
  notify(status: ReadyState) {
    console.log('[MseDecoder] Status [%s]', status)
  }
});
videoTrackWriter.updating.subscribe({
  notify(updating: boolean) {
    console.log('[MseDecoder] videoTrackWriter updating [%s]', updating)
  }
});

toggleFeederBtn!.onclick = async () => {
  console.log('CLICKED')
  if (feederInterval) {
    clearInterval(feederInterval);
    // @ts-ignore
    feederInterval = undefined;
    toggleFeederBtn!.innerText = 'Start';
  } else {
    console.log('[demo] starting feeder interval')
    feederInterval = setInterval(async () => {
      const segmentUrl = demoPath.replace('%Number$', dataId.toString());
      let data = await fetchSegmentAt(segmentUrl);
      
      if (isTruncate) {
        const randomEnd = Math.floor(Math.random() * (data.byteLength - 10 + 1) + 10)
        console.log('[demo] truncating data at [%s]', randomEnd);
        data = data.slice(0, randomEnd);
        isTruncate = false;
      }

      const writeStatus = await videoTrackWriter.write(data);

      console.log('Status [video] [%s]', writeStatus);

      if (writeStatus === 'ERROR') {
        dataId = 0;
      } else {
        dataId += 1;
        if (dataId > 600) {
          dataId = 0;
        }
      }

    }, segmentDuration);

    toggleFeederBtn!.innerText = 'Stop';
  }
};

feedInvalidBtn!.onclick = async () => {
  console.log('Click Invalid')
  const invalidData = new Uint8Array([0xFF, 0xFF, 0xFF]);
  await videoTrackWriter.write(invalidData)
}
feedTruncatedBtn!.onclick = () => {
  console.log('Feed Truncated');
  isTruncate = true;
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
