const mediaSource = new MediaSource();
const mseHandle = mediaSource.handle;
const segments = [];

let sourceBuffer;
// Transfer the handle to the context that created the worker
postMessage({ arg: mseHandle }, [mseHandle]);

let mimeCodecType;

mediaSource.addEventListener("sourceopen", () => {
  // Await sourceopen on MediaSource before creating SourceBuffers
  // and populating them with fetched media — MediaSource won't
  // accept creation of SourceBuffers until it is attached to the
  // HTMLMediaElement and its readyState is "open"
  console.log('[worker] [mediasource] [sourceopen] event')
  createSourceBuffer()

});

self.onmessage = function({data}) {
  console.log('[worker] message from main thread received [%o]', data);
  if (data.mimeCodecType) {
    console.log('[worker] mimeCodecType received', data.mimeCodecType);
    mimeCodecType = data.mimeCodecType;
  } 

  if (data.segment) {
    console.log('[worker] message.data [%o]', data);
    const mediaSegment = data.segment;
    if (sourceBuffer.updating) {
      console.warn('[worker] sourceBuffder updating')
      segments.push(mediaSegment);
    } else { 
      sourceBuffer.appendBuffer(mediaSegment)
    }
    
    console.log('[worker] sourceBuffer length [%s]', sourceBuffer.buffered.length)
  }
}

function  createSourceBuffer() {
  console.log('[worker] createSourceBuffer');
  sourceBuffer = mediaSource.addSourceBuffer(mimeCodecType);
  sourceBuffer.mode = 'sequence'

  const onSourceBufferError = () => {
    console.error('[worker] source buffer [error] event');
  };

  const onSourceBufferUpdateEnd = () => {
    if (!sourceBuffer) {
      console.error('[worker] [onUpdateEnd] No sourceBuffer');
    }

    if (segments.length) {
      console.log('[worker] [onUpdateEnd] appending from segments');
      const segment = segments.shift()
      sourceBuffer.appendBuffer(segment);
    }
  };

  console.log('[worker] Setting event listeners on _sourceBuffer');
  sourceBuffer.addEventListener('error', onSourceBufferError);
  sourceBuffer.addEventListener('updateend', onSourceBufferUpdateEnd);
}