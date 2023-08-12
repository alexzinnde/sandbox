type videoElementAttributes =
  | ['controls', true | false]
  | ['autoplay', true | false]
  | ['muted', true | false]
  | ['playsinline', true | false];

type ButtonControl = {
  label: string;
  disabled?: boolean;
  onClickHandler: () => void;
};

interface IVideoElement {
  root?: HTMLDivElement | null;
  videoContainer: {
    id?: string;
    classlist?: string[];
    heading?: string;
  };
  video: {
    id?: string;
    classlist?: string[];
    attributes?: videoElementAttributes[];
  };
  controls: {
    buttons?: ButtonControl[];
  };
  
}
export function createVideoElement({videoContainer, video, controls, root}: IVideoElement) {
  const videoContainerDiv = document.createElement('div');
  videoContainerDiv.id = videoContainer.id ?? '';
  videoContainer.classlist?.forEach(className => videoContainerDiv.classList.add(className));

  if (videoContainer.heading) {
    const p = document.createElement('p');
    p.classList.add('container-heading');
    p.innerText = videoContainer.heading;
    videoContainerDiv.appendChild(p);
  }

  const videoElement = document.createElement('video');
  videoElement.id = video.id ?? '';
  video.attributes?.forEach(([attributeName, value]) => videoElement.setAttribute(attributeName, value.toString()));

  videoContainerDiv.appendChild(videoElement);

  const buttonsContainerDiv = document.createElement('div');
  const buttons = controls.buttons?.map<HTMLButtonElement>(controlButton => {
    const btn = document.createElement('button');
    btn.innerText = controlButton.label;
    btn.onclick = controlButton.onClickHandler;

    if (controlButton.disabled) {
      btn.setAttribute('disabled', 'true');
    }

    buttonsContainerDiv.appendChild(btn);

    return btn
  });

  videoContainerDiv.appendChild(buttonsContainerDiv);

  if (root) {
    root.appendChild(videoContainerDiv);
  }

  return {
    root: videoContainerDiv,
    videoContainerDiv,
    videoElement,
    buttonsContainerDiv,
    buttons
  };
}
