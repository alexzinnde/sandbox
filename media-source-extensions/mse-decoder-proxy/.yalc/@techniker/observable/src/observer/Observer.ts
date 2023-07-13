import { IObservable } from "./Subject.js";

export interface IObserver {
  notify(...args: unknown[]): void
}


export default class Observer<T> implements IObserver {
  constructor(observable: IObservable, observer: (arg: T) => void) { 
    observable.subscribe(this);
  }

  notify(...args: unknown[]): void {

  }
}

