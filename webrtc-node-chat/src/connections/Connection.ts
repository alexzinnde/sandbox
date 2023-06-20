import EventEmitter from "events";

export default class Connection extends EventEmitter {
  public id: number;
  public state: 'open' | 'closed';

  constructor(id: number) {
    super();

    this.id = id;
    this.state = 'open';
  }

  close() {
    this.state = 'closed';
    this.emit('closed');
  }

  toJSON() {
    return {
      id: this.id,
      state: this.state
    }
  }
}