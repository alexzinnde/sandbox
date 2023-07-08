import './style.css';

import generateUI from './generateUI';
import MseDecoder, {MseDecoderStatisticsType} from './MseDecoder';
import configureForClearKey from './drm/drm';

const {videoElement, startBtn, statsTextArea} = generateUI();
configureForClearKey(videoElement);
const mseDecoder = new MseDecoder(videoElement);
const videoWriter = await mseDecoder.createTrackWriter('video/mp4; codecs="avc1.42C015"');
let feederInterval: number;

startBtn.onclick = async () => {
  const res = await fetch('/encrypted-clearkey/init.mp4');
  const initSegment = await res.arrayBuffer();
  videoWriter(initSegment);

  let segmentId = 1;
  feederInterval = setInterval(async () => {
    updateDecoderStats(mseDecoder.getStats());
    const res = await fetch(`/encrypted-clearkey/seg-${segmentId}.m4s`);
    const segment = await res.arrayBuffer();

    if (segment.byteLength > 0) {
      videoWriter(segment);
      segmentId += 1;
    } else {
      console.log('end of segments [%s]', segmentId);
      clearInterval(feederInterval);
    }
  }, 33);

  videoElement.play();
};

function updateDecoderStats(mseDecoderStats: MseDecoderStatisticsType) {
  let statLine = '';
  Object.entries(mseDecoderStats).forEach(([statKey, value]) => {
    if (statKey === 'timestamp') return;
    statLine += `| ${statKey} [${value}]`;
  });
  statsTextArea.value = `[${new Date(mseDecoderStats.timestamp).toISOString()}] ${statLine}\n` + statsTextArea.value;
}
