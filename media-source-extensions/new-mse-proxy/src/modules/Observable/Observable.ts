import Observer from './Observer';

export default class Observable<T> {
  private _value: T;
  private _observers: Set<Observer<T>>;

  constructor(value: T) {
    this._value = value;
    this._observers = new Set<Observer<T>>();
  }

  get value() {
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    this._notify(newValue);
  }

  public subscribe(observer: Observer<T>): void {
    this._observers.add(observer);
  }

  public unsubscribe(observer: Observer<T>): void {
    this._observers.delete(observer);
  }

  private _notify(value: T): void {
    this._observers.forEach(observer => observer(value));
  }
}
