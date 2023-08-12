export default class Subject<T> {
  private _value: T;
  private _listeners: Set<(T: T) => void>;

  constructor(value: T) {
    this._value = value;
    this._listeners = new Set();
  }

  get value() {
    return this._value;
  }

  set value(value: T) {
    if (value !== this._value) {
      this._listeners.forEach(listener => listener(value));

      this._value = value;
    }
  }

  subscribe(listener: (T: T) => void) {
    this._listeners.add(listener);
  }

  unsubscribe(listener: (T: T) => void) {
    this._listeners.delete(listener);
  }
}
