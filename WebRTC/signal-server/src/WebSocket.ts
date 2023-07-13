import type { WebSocket } from "ws"
import {WebSocketServer} from "ws"



export default function startWebSocketServer({port}: {port: number}) {

  const wsServer = new WebSocketServer({port})
  console.log('[WebSocketServer] Active on port [%s]', port)

  let sockets: WebSocket[] = []

  wsServer.on('connection', function (socket: WebSocket) {
    sockets.push(socket);

    socket.on('message', function (msg: ArrayBufferLike) {
      console.log('[WebSocketServer] received message [%o]', msg)
      sockets.forEach(s => s.send(msg));
    })

    socket.on('close', function () {
      sockets = sockets.filter(s => s !== socket);
    });
  })

  return wsServer;
}