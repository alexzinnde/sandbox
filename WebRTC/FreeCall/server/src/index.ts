import {ServerWebSocket} from 'bun';

let sockets: ServerWebSocket<unknown>[] = [];
let offers: RTCSessionDescriptionInit[] = [];
let answers: RTCSessionDescriptionInit[] = [];

Bun.serve({
  port: 8888,
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response('Upgrade failed :(', {status: 500, headers: {'Access-Control-Allow-Origin': '*'}});
  },
  websocket: {
    message(ws, message) {
      console.log('[message] [%o]', message);
      console.log('[offers] [%o]', offers);
      console.log('[answers] [%o]', answers);
      sockets.forEach(socket => {
        if (ws !== socket) {
          socket.send(message);
        }
      });

      const messageJson = JSON.parse(message.toString());
      const payload = messageJson.data;
      if (payload) {
        switch (payload.type) {
          case 'offer':
            offers.push(payload);

            break;

          case 'answer':
            answers.push(payload);
            break;

          default:
            console.warn('Invalid message [%o]', message);
        }
      }
    }, // a message is received
    open(ws) {
      console.log('[WebSocket] Open [%o]', ws);
      sockets.push(ws);

      if (offers.length) {
        offers.forEach(offer => ws.send(JSON.stringify(offer)));
      }
    }, // a socket is opened
    close(ws, code, message) {
      console.log('[WebSocket] close before [%s]', sockets.length);
      sockets = sockets.filter(socket => socket !== ws);
      console.log('[WebSocket] close after [%s]', sockets.length);
    }, // a socket is closed
    drain(ws) {} // the socket is ready to receive more data
  } // handlers
});

console.log('[WebSocket] server up');
