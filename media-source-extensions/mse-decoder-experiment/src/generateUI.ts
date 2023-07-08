export default function generateUI() {
  const root = document.querySelector('#app');
  if (!root) throw new Error('No Root!');

  const br = document.createElement('br');

  const videoElement = document.createElement('video');
  videoElement.id = 'video-1';
  videoElement.style.width = '360px';
  videoElement.style.height = '240px';
  videoElement.style.backgroundColor = 'black';
  videoElement.controls = true;

  const startBtn = document.createElement('button');
  startBtn.innerText = 'Start';

  const stopBtn = document.createElement('button');
  stopBtn.innerText = 'Stop';

  root.appendChild(videoElement);
  root.appendChild(br);
  root.appendChild(startBtn);
  root.appendChild(stopBtn);

  return {
    root,
    videoElement,
    startBtn,
    stopBtn
  };
}
