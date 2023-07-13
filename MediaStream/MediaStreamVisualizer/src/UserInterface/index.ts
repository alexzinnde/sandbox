import { TimelineDataSeries, TimelineGraphView } from '../Graph/index.js';

export function createContainer({ classList, width, height, margin }: { classList: string[], width: string, height: string, margin: string }) {
  const container = document.createElement('div');
  classList.forEach(className => container.classList.add(className));
  container.style.width = width
  container.style.height = height
  container.style.margin = margin

  return container;
}
export function createButton({ innerText, backgroundColor }: { innerText: string, backgroundColor: string }) {
  const btn = document.createElement('button');
  btn.innerText = innerText
  btn.style.backgroundColor = backgroundColor;

  return btn;
}


export default function generateUserInterface() {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('No Root!')
  }

  const videoContainer = createContainer({ classList: ['flex-container'], width: '360px', height: '240px', margin: 'auto' })
  const videoElement = document.createElement('video');
  const canvasContainer = createContainer({ classList: ['flex-container'], width: '360px', height: '240px', margin: 'auto' });
  const canvasElement = document.createElement('canvas');
  const rowContainer = createContainer({ classList: ['flex-container'], width: '360px', height: '240px', margin: 'auto' })
  const startBtn = createButton({ innerText: 'Start', backgroundColor: 'green' });

  const graphContainer = createContainer({ classList: ['flex-container'], width: '720px', height: '480px', margin: 'auto' })
  const graphCanvas = document.createElement('canvas');
  graphContainer.id = 'graph-container';
  graphContainer.style.backgroundColor = 'red'
  graphCanvas.id = 'graph-canvas'

  videoContainer.appendChild(videoElement);
  canvasContainer.appendChild(canvasElement);
  rowContainer.appendChild(startBtn)
  root.appendChild(videoContainer)
  root.appendChild(canvasContainer)
  root.appendChild(rowContainer)

  graphContainer.appendChild(graphCanvas)
  document.body.appendChild(graphContainer)
 
  return {
    TimelineDataSeries,
    TimelineGraphView,
    videoContainer,
    videoElement,
    canvasContainer,
    canvasElement,
    startBtn,
    graphContainer,
    graphCanvas
  }
}