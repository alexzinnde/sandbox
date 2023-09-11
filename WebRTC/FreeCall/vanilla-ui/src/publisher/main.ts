import '../style.css';
import webSocketReadyStateMap from '../webSocketReadyStateMap';
import iceServers from '../iceServers';

const localVideo = document.getElementById('local-video') as HTMLVideoElement;
const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;

const websocketStateDisplay = document.getElementById('web-socket-state') as HTMLInputElement;
const iceGatheringStateDisplay = document.getElementById('ice-gathering-state') as HTMLInputElement;
const iceConnectionStateDisplay = document.getElementById('ice-connection-state') as HTMLInputElement;
const connectionStateDisplay = document.getElementById('connection-state') as HTMLInputElement;
const signalingStateDisplay = document.getElementById('signaling-state') as HTMLInputElement;

const peerConnection = new RTCPeerConnection();
iceGatheringStateDisplay.value = peerConnection.iceGatheringState;
iceConnectionStateDisplay.value = peerConnection.iceConnectionState;
connectionStateDisplay.value = peerConnection.connectionState;
signalingStateDisplay.value = peerConnection.signalingState;

window['pc'] = peerConnection;

peerConnection.oniceconnectionstatechange = () => {
  iceConnectionStateDisplay.value = peerConnection.connectionState;
};
peerConnection.onconnectionstatechange = () => {
  connectionStateDisplay.value = peerConnection.connectionState;
};
peerConnection.onicegatheringstatechange = () => {
  iceGatheringStateDisplay.value = peerConnection.iceGatheringState;
};
peerConnection.onsignalingstatechange = () => {
  signalingStateDisplay.value = peerConnection.signalingState;
};
peerConnection.onnegotiationneeded = e => {
  console.log('[Publisher] Negotiation Needed [%o]', e);
};
peerConnection.onicecandidateerror = e => {
  console.error('[Subscriber] Ice Candidate Error [%o]', e);
};
peerConnection.ontrack = e => {
  console.log('[PeerConnection] video [%o] track event [%o]', remoteVideo, e);
  if (!remoteVideo.srcObject) {
    console.log('[Subscriber] setting video srcObject [%o]', e.streams[0]);
    remoteVideo.srcObject = e.streams[0];
  }
};

const ws = new WebSocket('ws://10.31.30.136:8888');
websocketStateDisplay.value = 'initializing';
ws.onerror = () => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];
};
ws.onopen = () => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];
};
ws.onclose = () => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];
};
ws.onmessage = message => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];

  const payload = JSON.parse(message.data);

  switch (payload.type) {
    case 'answer':
      return onReceiveAnswer(payload);

    case 'offer':
      return onReceiveOffer(payload);

    case 'icecandidate':
      console.log('Received Candidate [%o]', payload);
      return onReceiveIceCandidate(payload.candidate);

    default:
      console.warn('[Publisher] message unknown type [%o]', message);
  }
};

let mediaStream: MediaStream;

startBtn.onclick = async () => {
  console.log('[PeerConnection] signaling state [%s]', peerConnection.signalingState);

  mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
  mediaStream.getTracks().forEach(track => peerConnection.addTrack(track, mediaStream));

  const offer = await createOffer();
  ws.send(JSON.stringify(offer));

  localVideo.srcObject = mediaStream;
};

async function onReceiveOffer(offer: RTCSessionDescriptionInit) {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  console.log('[PeerConnection] signaling state [%s]', peerConnection.signalingState);

  ws.send(JSON.stringify(answer));
}

async function createOffer() {
  const offer = await peerConnection.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true});
  await peerConnection.setLocalDescription(offer);

  return offer;
}

async function onReceiveAnswer(answer: RTCSessionDescriptionInit) {
  peerConnection.onicecandidate = async e => {
    if (e.candidate) {
      console.log('[Publisher] ice candidate [%o]', e.candidate);
      ws.send(
        JSON.stringify({
          type: 'icecandidate',
          candidate: e.candidate
        })
      );
    }
  };
  await peerConnection.setRemoteDescription(answer);
}

async function onReceiveIceCandidate(candidate: RTCIceCandidate) {
  console.log('setting received candidate on peer connection [%o]', candidate);
  await peerConnection.addIceCandidate(candidate);
}
