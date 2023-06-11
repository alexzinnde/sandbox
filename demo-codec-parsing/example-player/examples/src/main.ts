import './style.css'
import Player from '../../src/modules/Player';

const audioElement = document.querySelector('audio');
const startStreamButton = document.querySelector<HTMLButtonElement>('#start-stream')
const stopStreamButton = document.querySelector<HTMLButtonElement>('#stop-stream')
const logButton = document.querySelector<HTMLButtonElement>('#log')

if (!audioElement) {
  throw new Error('Audio Element missing...')
}

audioElement.defaultMuted = true
audioElement.autoplay = true


const streamUrl = 'https://icecast.techniker.me/main-opus.ogg';
const player = new Player({
  streamUrl,
  mediaElement: audioElement
})


startStreamButton!.onclick = () => { 
  player.play()
}
stopStreamButton!.onclick = () => { 
  player.stop()
  // stream.stopStream()
}
logButton!.onclick = () => {
  player.log()
  
}