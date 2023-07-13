import server from "./server.js";
import startWebSocketServer from "./WebSocket.js";
import createWebSocketClients from "./WebSocketClient.js";


const PORT = process.env.PORT || 5555;

server.listen(PORT, () => {
  console.log('[server] listening on port [%s]', PORT)
})

const wsServer = startWebSocketServer({ port: 5556 })
console.log('[index] Waiting [3] seconds before creating WebSocket Clients')
setTimeout(async () => {
  await createWebSocketClients()
}, 3000)