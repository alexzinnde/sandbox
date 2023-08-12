import './style.css';
import {createVideoElement} from './Elements';
import {attachMediaStreamToVideo, getUserMedia, setupReceiverTransform, setupSenderTransform} from './WebRTC';
import VideoPipe from './VideoPipe';

let localMediaStream: MediaStream;
let remoteStream: MediaStream;
let startToMiddle: VideoPipe;
let startToEnd: VideoPipe;

const localVideo = createVideoElement({
  root: document.querySelector<HTMLDivElement>('#app'),
  videoContainer: {
    classlist: ['video-container'],
    heading: 'Local'
  },
  video: {
    attributes: [
      ['muted', true],
      ['autoplay', true],
      ['controls', true]
    ],
    id: 'video-local'
  },
  controls: {
    buttons: [
      {
        label: 'GUM',
        disabled: false,
        onClickHandler: start
      },
      {
        label: 'Call',
        disabled: true,
        onClickHandler: call
      }
    ]
  }
});

const middlePipeVideo = createVideoElement({
  root: document.querySelector<HTMLDivElement>('#app'),
  videoContainer: {
    classlist: ['video-container'],
    heading: 'Pipe'
  },
  video: {
    attributes: [
      ['muted', true],
      ['autoplay', true],
      ['controls', true]
    ],
    id: 'vide-pipe'
  },
  controls: {}
});

const remoteVideo = createVideoElement({
  root: document.querySelector<HTMLDivElement>('#app'),
  videoContainer: {
    classlist: ['video-container'],
    heading: 'Remote'
  },
  video: {
    attributes: [
      ['muted', true],
      ['autoplay', true],
      ['controls', true]
    ],
    id: 'video-remote'
  },
  controls: {}
});

async function start() {
  localMediaStream = await getUserMedia({audio: true, video: true});

  if (localMediaStream) {
    attachMediaStreamToVideo(localVideo.videoElement, localMediaStream);
    const gumButton = localVideo.buttons?.find(button => button.innerText === 'GUM');

    if (gumButton) {
      gumButton.innerText = 'Stop';
      gumButton.classList.add('danger');
      gumButton.onclick = stop;
    }

    const callButton = localVideo.buttons?.find(button => button.innerText === 'Call');
    if (callButton) {
      callButton.disabled = false;
    }
  }
}

function stop(this: HTMLButtonElement) {
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(track => track.stop());
    this.innerText = 'GUM';
    this.classList.remove('danger');
    this.onclick = start;
  }
}

function call() {
  console.log('Initiating Call');

  console.log('Creating [startToMiddle] VideoPipe');
  startToMiddle = new VideoPipe('startToMiddle', localMediaStream, true, true, e => {
    console.log('[startToMiddle] pipe event [%o]', e);
    e.streams[0].getTracks().forEach(track => console.log('[startToMiddle] [track] [%o]', track));
    middlePipeVideo.videoElement.srcObject = e.streams[0];
  });

  console.log('[startToMiddle] [%o]', startToMiddle);
  const startToMiddleSenders = startToMiddle.pc1.getSenders();
  console.log('[startToMiddleSenders] [%o]', startToMiddleSenders);

  startToMiddleSenders.forEach(setupSenderTransform);
  console.log('[startToMiddle] negotiate');
  startToMiddle.negotiate();

  console.log('Creating [startToEnd] VideoPipe');

  startToEnd = new VideoPipe('startToEnd', localMediaStream, true, true, e => {
    setupReceiverTransform(e.receiver);
    gotRemoteStream(e.streams[0], 'startToEnd');
  });
  startToEnd.pc1.getSenders().forEach(setupSenderTransform);
  startToEnd.negotiate();
}

function gotRemoteStream(stream: MediaStream, id: string) {
  console.log('[%o] Received remote stream', id);
  remoteStream = stream;
  remoteVideo.videoElement.srcObject = stream;
}
