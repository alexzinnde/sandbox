import './style.css';

import generateUI from './generateUI';
import MseDecoder from './MseDecoder';

const {videoElement, startBtn, stopBtn, logStatsBtn, statsTextArea} = generateUI();
const videoData = await fetchSegmentAt('/video-1/hawtin-video.mp4');
const audioData = await fetchSegmentAt('/video-1/hawtin-audio.mp4');
const mseDecoder = new MseDecoder(videoElement);
const audioMimeCodecType = 'audio/mp4; codecs="mp4a.40.2"';
const audioTrackWriter = await mseDecoder.createTrackWriter(audioMimeCodecType);
const videoMimeCodecType = 'video/mp4; codecs="avc1.4d401f"';
const videoTrackWriter = await mseDecoder.createTrackWriter(videoMimeCodecType);

let audioInterval: number;
let videoInterval: number;
let logStatsInterval: number;

startBtn.onclick = async () => {
  logStatsInterval = startLogStatsInterval();
  audioInterval = startAudioInterval();
  videoInterval = startVideoInterval();
  videoElement.play();
};

stopBtn.onclick = () => {
  videoElement.pause();
  clearInterval(audioInterval);
  clearInterval(videoInterval);
};

logStatsBtn.onclick = () => {
  if (logStatsInterval) {
    clearInterval(logStatsInterval);
    logStatsInterval = 0;
  } else {
    logStatsInterval = startLogStatsInterval();
  }
};

function startLogStatsInterval() {
  console.error('should START appending');
  return setInterval(() => {
    let statLine = ''
    const  mseDecoderStats = mseDecoder.getStats();
    Object.keys(mseDecoderStats).forEach((statKey) => {
      if (statKey === 'timestamp') return;
      statLine += `| ${statKey} [${mseDecoderStats[statKey]}]`
    })
    statsTextArea.value = `[${new Date(mseDecoderStats.timestamp).toISOString()}] ${statLine}\n` + statsTextArea.value;
  }, 33);
}

function startAudioInterval() {
  return setInterval(async () => {
    const audioSegment = audioData.shift();
    if (audioSegment) {
      const status = await audioTrackWriter(new Uint8Array(audioSegment));
      console.log('[audio] write status [%s]', status);
    }
  }, 400);
}

function startVideoInterval() {
  return setInterval(async () => {
    const videoSegment = videoData.shift();
    if (videoSegment) {
      const status = await videoTrackWriter(new Uint8Array(videoSegment));
      console.log('[video] write status [%s]', status);
    }
  }, 400);
}


async function fetchSegmentAt(url: string) {
  const data: Uint8Array[] = []
  const res = await fetch(url, { method: "GET" });
  const reader = res.body?.getReader();

  function onRead(reader: ReadableStreamBYOBReader, {done, value}) {
    if (done) {
      console.log('done [%s] data.length [%o]', data.length)
  
      return data.slice();
    }
  
    data.push(value);
  
    return reader.read().then(onRead.bind(null, reader))
    
  }

  return reader?.read().then(onRead.bind(null, reader));
}