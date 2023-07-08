export default function generateUI() {
  const root = document.querySelector('#app');
  if (!root) throw new Error('No Root!');

  const br = document.createElement('br');

  const videoElement = document.createElement('video');
  videoElement.id = 'video-1';
  videoElement.style.width = '720px';
  videoElement.style.height = '480px';
  videoElement.style.backgroundColor = 'black';
  videoElement.controls = true;

  const startBtn = document.createElement('button');
  startBtn.innerText = 'Start';

  const stopBtn = document.createElement('button');
  stopBtn.innerText = 'Stop';

  const logStatsBtn = document.createElement('button');
  logStatsBtn.innerText = 'Toggle Stats Log'

  const statsTextArea = document.createElement('textarea');
  statsTextArea.style.width = "100%";
  statsTextArea.style.height = "90%";
  statsTextArea.style.display = 'block'
  statsTextArea.style.margin = '10px auto';
  statsTextArea.style.resize = 'none';
  

  statsTextArea.style.whiteSpace = 'nowrap;'

  statsTextArea.readOnly = true;

  statsTextArea.style.backgroundColor = '#33333'
  statsTextArea.cols = 200;
  statsTextArea.rows = 20;



  root.appendChild(videoElement);
  root.appendChild(br);
  root.appendChild(startBtn);
  root.appendChild(stopBtn);
  root.appendChild(logStatsBtn);
  root.appendChild(statsTextArea);


  return {
    root,
    videoElement,
    startBtn,
    stopBtn,
    logStatsBtn,
    statsTextArea
  };
}
