import { WebSocket } from "ws";


export default async function createWebSocketClients() {

  const clients = [
    new WebSocket('ws://localhost:5556'),
    new WebSocket('ws://localhost:5556')
  ]
  
  clients.map(client => {
    client.on('message', msg => console.log(msg.toString()));
  });
  
  // Wait for the client to connect using async/await
  await new Promise(resolve => clients[0].once('open', resolve));
  
  // Prints "Hello!" twice, once for each client.
  clients[0].send('Hello from client 0');
}