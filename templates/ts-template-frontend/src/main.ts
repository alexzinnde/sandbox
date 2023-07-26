import './style.css'

const root = document.querySelector('#app');
const div = document.createElement('div')
div.innerHTML = `<h1>Hello World</h1>`;

root?.appendChild(div)