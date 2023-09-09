import {ReadableStream} from 'stream/web';
import {setInterval} from 'timers/promises';
import {performance} from 'perf_hooks';

export default async function() {

  
  const SECONDS = 1000;
  
  const stream = new ReadableStream({
    async start(controller) { 
      for await (const _ of setInterval(SECONDS)) {
        controller.enqueue(performance.now())
      }
    }
  })
  
  for await (const value of stream) {
    console.log(value)
  }
}

