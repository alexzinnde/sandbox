import ISubject from './ISubject';
import Listener from './ListenerType';

export default class ReadOnlySubject<T> implements ISubject<T> {
  private _subject: ISubject<T>;
  private _subscribers: Set<Listener<T>>;

  constructor(subject: ISubject<T>) {
    this._subject = subject;
    this._subscribers = new Set();
  }

  get value() {
    return this._subject.value;
  }

  public subscribe(listener: (value: T) => void) {
    this._subscribers.add(listener);
    this._subject.subscribe(listener);
    

    return this.unsubscribe.bind(this, listener);
  }

  public unsubscribe(listener: (value: T) => void) {
    this._subscribers.delete(listener);
    this._subject.unsubscribe(listener);
  }
}
