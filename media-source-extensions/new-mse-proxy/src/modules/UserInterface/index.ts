export function createContainer({classList, margin}: {classList: string[]; margin: string}) {
  const container = document.createElement('div');
  classList.forEach(className => container.classList.add(className));
  container.style.margin = margin;

  return container;
}
export function createButton({innerText, backgroundColor}: {innerText: string; backgroundColor: string}) {
  const btn = document.createElement('button');
  btn.innerText = innerText;
  btn.style.backgroundColor = backgroundColor;

  return btn;
}

export default function generateUserInterface() {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('No Root!');
  }

  const videoContainer = createContainer({classList: ['flex-container'], margin: 'auto'});
  const videoElement = document.createElement('video');
  const decoderStateContainer = createContainer({classList: ['flex-container'], margin: 'auto'});
  const decoderStateDisplay = document.createElement('input');
  const buttonsContainer = createContainer({classList: ['flex-container'], margin: 'auto'});
  const toggleFeederBtn = createButton({innerText: 'Start', backgroundColor: 'green'});
  const feedInvalidBtn = createButton({innerText: 'Feed Invalid', backgroundColor: 'red'});
  const feedTruncatedBtn = createButton({innerText: 'Feed Truncated', backgroundColor: 'red'});

  videoElement.controls = true;
  videoContainer.appendChild(videoElement);
  root.appendChild(videoContainer);

  decoderStateDisplay.disabled = true;
  decoderStateDisplay.classList.add('state-display');
  decoderStateDisplay.value = 'initialize'

  decoderStateContainer.appendChild(decoderStateDisplay);
  root.appendChild(decoderStateContainer);

  buttonsContainer.appendChild(toggleFeederBtn);
  buttonsContainer.appendChild(feedInvalidBtn);
  buttonsContainer.appendChild(feedTruncatedBtn);
  root.appendChild(buttonsContainer);

  return {
    videoContainer,
    videoElement,
    toggleFeederBtn,
    feedInvalidBtn,
    feedTruncatedBtn,
    decoderStateDisplay
  };
}
