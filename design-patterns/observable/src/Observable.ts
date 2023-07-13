export type ObserverListener<T> = (data: T) => void;

export class Observable<T> {
  protected _observers: Set<ObserverListener<T>> = new Set();
  private _value: T;

  public get value(): T {
    return this._value;
  }

  public set value(newValue: T) {
    this._value = newValue;
    this._notify();
  }

  public subscribe(listener: ObserverListener<T>): void {
    this._observers.add(listener);
  }

  public unsubscribe(listener: ObserverListener<T>): void {
    this._observers.delete(listener);
  }

  private _notify(): void {
    this._observers.forEach(observer => observer(this._value))
  }
}