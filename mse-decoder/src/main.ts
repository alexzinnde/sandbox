import './style.css';
import Segments from './modules/Segments';
import MseDecoder from './modules/decoder/MseDecoder';

const videoElement = document.getElementById('video-1') as HTMLMediaElement;
if (!videoElement) {
  throw new Error('No Video Element');
}
const toggleFeederBtn = document.getElementById('toggle-feeder-btn');

const audioSegments = new Segments({
  baseUrl: '/avsync/audio',
  initSegmentUrl: 'init.mp4',
  segmentStartId: 1,
  segmentEndId: 1016,
  templateUri: 'seg$Number%.m4s'
});
const videoSegments = new Segments({
  baseUrl: '/avsync/video',
  initSegmentUrl: 'init.mp4',
  segmentStartId: 1,
  segmentEndId: 991,
  templateUri: 'seg$Number%.m4s'
});

audioSegments.isLoaded.subscribe(() => console.log('[audio] segments loaded'));
videoSegments.isLoaded.subscribe(() => console.log('[video] segments loaded'));

let interval: number;

toggleFeederBtn!.onclick = () => {
  if (toggleFeederBtn?.innerText === 'Start') {
    interval = startInterval();

    toggleFeederBtn.innerText = 'Stop';

    return;
  }

  clearInterval(interval);

  toggleFeederBtn!.innerText = 'Start';
};

const mseDecoder = new MseDecoder(videoElement);
mseDecoder.status.subscribe(status => {
  console.log('[MseDecoder] status [%s]', status);
});

const audioTrack = await mseDecoder.createTrackWriter('audio/mp4; codecs=opus');
const audioTrack2 = await mseDecoder.createTrackWriter('audio/mp4; codecs=opus');
console.log('audioTrack [%o]', audioTrack);
console.log('audioTrack2 [%o]', audioTrack2);

const videoTrack = await mseDecoder.createTrackWriter('video/mp4; codecs=avc1.42c01e');
const videoTrack2 = await mseDecoder.createTrackWriter('video/mp4; codecs=avc1.42c01e');
console.log('videoTrack [%o]', videoTrack);
console.log('videoTrack2 [%o]', videoTrack2);

function startInterval() {
  return setInterval(async () => {
    const audioSegment = audioSegments.getNextSegment();
    const videoSegment = videoSegments.getNextSegment();
    console.log('audio write', await audioTrack.write(audioSegment));
    console.log('audio2 write', await audioTrack2.write(audioSegment));
    console.log('video write', await videoTrack.write(videoSegment));
    console.log('video2 write', await videoTrack2.write(videoSegment));
  }, 1000 / 30);
}
