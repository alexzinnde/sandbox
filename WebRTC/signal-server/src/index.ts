import server from "./server.js";
import startWebSocketServer from "./WebSocket.js";


const PORT = process.env.PORT || 5555;

server.listen(PORT, () => {
  console.log('[server] listening on port [%s]', PORT)
})

const wsServer = startWebSocketServer({ port: 5556 })