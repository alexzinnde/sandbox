
export async function getUserMediaStream(constraints?: MediaStreamConstraints) {
  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

  return mediaStream;
}