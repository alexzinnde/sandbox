import './style.css';
import generateUserInterface from './modules/UserInterface';
import MseDecoder, {TrackWriter} from './modules/MseDecoder';
import {fetchSegmentAt} from './utils';

const {videoElement, toggleFeederBtn, feedInvalidBtn, feedTruncatedBtn, decoderStateDisplay} = generateUserInterface();
type DemoState = {
  trackWriter?: TrackWriter;
  segmentId: number;
  feederInterval: number;
  isFeederActive: boolean;
  feedTruncated: boolean;
};
const demoState: DemoState = {
  trackWriter: undefined,
  segmentId: 0,
  feederInterval: 0,
  isFeederActive: false,
  feedTruncated: false
};

const mseDecoder = new MseDecoder(videoElement);
mseDecoder.status.subscribe(async state => {
  if (state === 'open') {
    const codecType = 'video/mp4; codecs="avc1.4d401f"';
    console.log('[Consumer] createTrackWriter [%s]', codecType);

    demoState.trackWriter = mseDecoder.createTrackWriter(codecType);
    console.log('[Consumer] received trackWriter [%o]', demoState.trackWriter);
  }

  decoderStateDisplay.value = state
});
setInterval(feedTrackWriter, 1000/30);

toggleFeederBtn.onclick = async () => {
  if (!demoState.isFeederActive) {
    toggleFeederBtn.innerText = 'Stop';
    toggleFeederBtn.style.backgroundColor = 'red';
    demoState.isFeederActive = true;
  } else {
    toggleFeederBtn.innerText = 'Start';
    toggleFeederBtn.style.backgroundColor = 'green';
    demoState.isFeederActive = false;
  }
  videoElement.play();
};

feedInvalidBtn.onclick = async () => {
  const invalidData = new Uint8Array([0xff, 0xff, 0xff]);
  const invalidWriteResult = await demoState.trackWriter?.write(invalidData);

  console.warn('[Consumer] Write Result [%o]', invalidWriteResult);
};

feedTruncatedBtn.onclick = () => {
  demoState.feedTruncated = true;
};

let segmentId = 0;

async function feedTrackWriter() {
  if (!demoState.isFeederActive) {
    return;
  }

  const baseUrl = '/Phenix-ISO-BMFF-20s-H264-unencrypted';
  const segmentTemplate = `${baseUrl}/test-mp4.%Number$`;
  const segmentUrl = segmentTemplate.replace('%Number$', segmentId.toString());

  // console.log('[Consumer] Fetching segment at [%o]', segmentUrl);

  let data = await fetchSegmentAt(segmentUrl);
  // console.log('[Consumer] Received segment [%o]', data);

  if (demoState.feedTruncated) {
    const randomEnd = Math.floor(Math.random() * (data.byteLength - 10));
    // console.warn('Truncating segment from [%s] to [%s]', data.byteLength, randomEnd)
    data = data.slice(0, randomEnd);
    demoState.feedTruncated = false;
  }
  const writeResult = await demoState.trackWriter?.write(data);

  segmentId += 1;

  if (segmentId > 600) {
    segmentId = 0;
  }

  if (writeResult === 'ERROR') {
    setTimeout(() => (segmentId = 0), 500);
  }
}
