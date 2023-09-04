import ISubject from './ISubject'

export default class Subject<T> implements ISubject<T> {
  private _value: T
  private _subscribers: Set<(value: T) => void>

  constructor(value: T) {
    this._value = value
    this._subscribers = new Set()
  }

  get value(): T {
    return this._value
  }

  set value(value: T) {
    if (value !== this._value) {
      this._value = value
    }
    this.notifySubscribers()
  }

  public subscribe(listener: (value: T) => void) {
    this._subscribers.add(listener)
    listener(this._value)

    return this.unsubscribe.bind(this, listener)
  }

  public unsubscribe(listener: (value: T) => void) {
    this._subscribers.delete(listener)
  }

  private notifySubscribers() {
    this._subscribers.forEach(subscriber => subscriber(this._value))
  }
}
