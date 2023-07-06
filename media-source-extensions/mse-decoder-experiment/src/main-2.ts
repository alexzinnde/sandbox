import "./style.css";
import SegmentLoader from "./SegmentLoader";
import MseDecoder from "./MseDecoder";

const videoElement = document.querySelector<HTMLVideoElement>("#video-1");

if (!videoElement) {
  throw new Error("No video Element");
}

const segmentLoader = new SegmentLoader();
const audioSegments = await segmentLoader.getSegmentsAt(
  "/sample/hawtin-audio.m4a"
);
// const videoSegments = await segmentLoader.getSegmentsAt(
//   "/sample/hawtin-video.mp4"
// );
const mseDecoder = new MseDecoder(videoElement);
const audioTrackWriter = await mseDecoder.createTrackWriter(
  'audio/mp4; codecs="mp4a.40.2"'
);
// const videoTrackWriter = await mseDecoder.createTrackWriter(
//   'video/mp4; codecs="avc1.4d401f"'
// );

console.log("[audioSegments] [%o]", audioSegments.length);
// console.log("[videoSegments] [%o]", videoSegments.length);

// audioTrackWriter(audioSegments[0]).then((status) => {
//   console.log("Video segmentId [%s] status [%s] ", 0, status);
// });

let currentAudioSegmentId = 1;
let audioInterval = setInterval(() => {
  console.log("writing segment [%s]", currentAudioSegmentId);
  if (audioSegments[currentAudioSegmentId]) {
    audioTrackWriter(audioSegments[currentAudioSegmentId]).then((status) => {
      console.log(
        "Video segmentId [%s] status [%s] ",
        currentAudioSegmentId,
        status
      );
    });
    currentAudioSegmentId += 1;
  } else {
    console.log(
      "[demo] currentAudioSegmentId [%s] videoSegments [%o] clearing interval",
      currentAudioSegmentId,
      videoSegments[currentAudioSegmentId]
    );
    clearInterval(audioInterval);
  }
}, 60 * 1000);
