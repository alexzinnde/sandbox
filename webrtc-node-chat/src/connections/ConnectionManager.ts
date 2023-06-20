import log from "../logger";
import { v4 as uuid } from 'uuid'
import DefaultConnection from "./Connection";


export type ConnectionManagerOptionsType = {
  Connection: DefaultConnection,
  generateId: typeof uuid
}
export default class ConnectionManager {
    constructor(options: ConnectionManagerOptionsType) {
      options = {
        Connection: DefaultConnection,
        generateId: uuid,
        ...options
      };
  
      const {
        Connection,
        generateId
      } = options;
  
      const connections = new Map();
      const closedListeners = new Map();
  
      function createId() {
        do {
          const id = generateId();
          if (!connections.has(id)) {
            return id;
          }
        // eslint-disable-next-line
        } while (true);
      }
  
      function deleteConnection(connection: DefaultConnection) {
        // 1. Remove "closed" listener.
        const closedListener = closedListeners.get(connection);
        closedListeners.delete(connection);
        connection.removeListener('closed', closedListener);
  
        // 2. Remove the Connection from the Map.
        connections.delete(connection.id);
      }
  
      this.createConnection = () => {
        const id = createId();
        const connection = new Connection(id);
  
        // 1. Add the "closed" listener.
        function closedListener() { deleteConnection(connection); }
        closedListeners.set(connection, closedListener);
        connection.once('closed', closedListener);
  
        // 2. Add the Connection to the Map.
        connections.set(connection.id, connection);
  
        return connection;
      };
  
      this.getConnection = id => {
        return connections.get(id) || null;
      };
  
      this.getConnections = () => {
        return [...connections.values()];
      };
    }
  
    toJSON() {
      return this.getConnections().map(connection => connection.toJSON());
    }
  }
  