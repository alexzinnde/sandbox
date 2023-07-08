function getRoot(id = 'app') {
  const root = document.querySelector<HTMLDivElement>(`#${id}`);
  if (!root) {
    throw new Error('No Root!');
  }

  return root;
}


export default function generateUI() {
  const root = getRoot()
  const videoElement = document.createElement('video');
  const br = document.createElement('br');
  const startBtn = document.createElement('button');
  const stopBtn = document.createElement('button');

  videoElement.style.width = '360px';
  videoElement.style.height = '240px';
  videoElement.style.backgroundColor = 'black';

  startBtn.innerText = 'Start';
  stopBtn.innerText = 'Stop';

  root.appendChild(videoElement);
  root.appendChild(br)
  root.appendChild(startBtn)
  root.appendChild(stopBtn)

  return {
    root,
    videoElement,
    startBtn,
    stopBtn
  }
}

