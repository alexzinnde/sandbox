import Subject from './Subject';

export default class ReadOnlySubject<T> {
  private _subject: Subject<T>;

  constructor(subject: Subject<T>) {
    this._subject = subject;
  }

  get value() {
    return this._subject.value;
  }

  subscribe(listener: (T: T) => void) {
    this._subject.subscribe(listener);
  }

  unsubscribe(listener: (T: T) => void) {
    this._subject.unsubscribe(listener);
  }
}
