type WebSocketReadyStateMap = {[k: number]: string};

const websocketReadyState: WebSocketReadyStateMap = {
  0: 'CONNECTING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'CLOSED'
};

export default websocketReadyState;