import { IObserver } from "./Observer.js";

export interface IObservable {
  subscribe(observer: IObserver): void
  unsubscribe(observer: IObserver): void
  notify(...args: unknown[]): void
}

export default class Subject<T> implements IObservable {
  private _subject: T
  private _observers: IObserver[]

  constructor(subject: T) {
    this._subject = subject;
    this._observers = [];

  }

  subscribe(observer: IObserver): void {
    this._observers.push(observer);
  }

  unsubscribe(observer: IObserver): void {
    const targetObserverIndex = this._observers.findIndex(targetObserver => targetObserver === observer);
    if (targetObserverIndex > 0) {
      this._observers.splice(targetObserverIndex, 1);
    }
  }

  notify(...args: unknown[]): void {
    this._observers.forEach(observer => observer.notify(...args));
  }
}