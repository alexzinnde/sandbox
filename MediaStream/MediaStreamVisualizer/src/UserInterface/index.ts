
export default function generateUserInterface() {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('No Root!')
  }
  const videoContainer = document.createElement('div');
  videoContainer.classList.add('flex-container');
  videoContainer.style.width = '360px'
  videoContainer.style.height = '240px'
  videoContainer.style.margin = 'auto'

  const videoElement = document.createElement('video');

  videoContainer.appendChild(videoElement);

  const canvasContainer = document.createElement('div');
  canvasContainer.classList.add('flex-container');
  canvasContainer.style.width = '360px'
  canvasContainer.style.height = '240px'
  canvasContainer.style.margin = 'auto'
  const canvasElement = document.createElement('canvas');

  canvasContainer.appendChild(canvasElement);

  const startBtn = document.createElement('button');
  startBtn.innerText = 'Start';
  startBtn.style.backgroundColor = 'green'


  const rowContainer = document.createElement('div');

  rowContainer.appendChild(videoContainer)
  rowContainer.appendChild(canvasContainer)
  rowContainer.appendChild(startBtn)
  root.appendChild(rowContainer)

  return {
    videoContainer,
    videoElement,
    canvasContainer,
    canvasElement,
    startBtn
  }
}