
import express from 'express';
import morgan from 'morgan';
import log from './logger';
import WebRtcConnectionManager from 'wrtc';

import ConnectionManager from './connections/ConnectionManager';

const server = express();
server.use(morgan('dev'))

server.get('/', (req, res) => {
  res.send('hello world');
})

export default server;