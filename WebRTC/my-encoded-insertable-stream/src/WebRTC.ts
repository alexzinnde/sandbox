const worker = new Worker('./worker.js', {name: 'E2EE worker'});

export async function getUserMedia(contraints: MediaStreamConstraints) {
  return await navigator.mediaDevices.getUserMedia(contraints ?? {}).catch(error => console.error('Unable get get user media [%o]', error));
}

export async function attachMediaStreamToVideo(videoElement: HTMLVideoElement, mediaStream: MediaStream) {
  videoElement.srcObject = mediaStream;
}


export function setupReceiverTransform(receiver: RTCRtpReceiver) {
  if (window.RTCRtpScriptTransform) {
    console.log('[setupReceiverTransform] [RTCRtpScriptTransform]!!!')
    receiver.transform = new RTCRtpScriptTransform(worker, {operation: 'decode'});
    return;
  }

  const receiverStreams = receiver.createEncodedStreams();
  const {readable, writable} = receiverStreams;

  console.log('[setupReceiverTransform] receiverStreams [%o]', receiverStreams);
  worker.postMessage({
    operation: 'decode',
    readable,
    writable,
  }, [readable, writable]);
}

export function setupSenderTransform(sender: RTCRtpSender) {
  if (window.RTCRtpScriptTransform) {
    debugger;
    sender.transform = new RTCRtpScriptTransform(worker, {operation: 'encode'});
    return;
  }

  const senderStreams = sender.createEncodedStreams();
  // Instead of creating the transform stream here, we do a postMessage to the worker. The first
  // argument is an object defined by us, the second is a list of variables that will be transferred to
  // the worker. See
  //   https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
  // If you want to do the operations on the main thread instead, comment out the code below.
  
  // const transformStream = new TransformStream({
  //   transform: encodeFunction,
  // });
  // senderStreams.readable
  //     .pipeThrough(transformStream)
  //     .pipeTo(senderStreams.writable);
  
  const {readable, writable} = senderStreams;
  console.log('[setupSenderTransform] senderStreams [%o]', senderStreams);
  worker.postMessage({
    operation: 'encode',
    readable,
    writable,
  }, [readable, writable]);
}