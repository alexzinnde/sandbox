import './style.css'

import generateUI from './generateUI'
import MseDecoder from './MseDecoder'
import {fetchSegmentAt} from './SegmentLoader'

const {videoElement, startBtn, stopBtn}  = generateUI()
const videoData = await fetchSegmentAt('/video-1/hawtin-video.mp4')
const audioData = await fetchSegmentAt('/video-1/hawtin-audio.mp4')

const mseDecoder = new MseDecoder(videoElement)
const audioMimeCodecType = 'audio/mp4; codecs="mp4a.40.2"';
const audioTrackWriter = await mseDecoder.createTrackWriter(audioMimeCodecType);
const videoMimeCodecType = 'video/mp4; codecs="avc1.4d401f"';
const videoTrackWriter = await mseDecoder.createTrackWriter(videoMimeCodecType);

let audioInterval: number;
let videoInterval: number;


startBtn.onclick = async () => {

  console.log('audioData [%o]', audioData)
  console.log('audioWriter [%o]', audioTrackWriter)
  audioInterval = startAudioInterval()
  videoInterval = startVideoInterval()
  videoElement.play();
}

function startAudioInterval() {
  return setInterval(async() => {
    const audioSegment = audioData.shift();
    if (audioSegment) {
      const status = await audioTrackWriter(new Uint8Array(audioSegment));
      console.log('[audio] write status [%s]', status)
    }
  }, 400)
}

function startVideoInterval() {
  return setInterval(async() => {
    const videoSegment = videoData.shift();
    if (videoSegment) {
      const status = await videoTrackWriter(new Uint8Array(videoSegment));
      console.log('[video] write status [%s]', status)
    }
  }, 400)
}