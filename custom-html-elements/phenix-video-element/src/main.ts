import './style.css'
import PhenixVideoElement from './modules/videoElement/PhenixVideoElement';

const root = document.querySelector('#app');
const phenixVideoElement = new PhenixVideoElement();
root?.appendChild(phenixVideoElement)


console.log('element [%o]', PhenixVideoElement);