import type Listener from "./ListenerType";

interface ISubject<T> {
  value: T;
  subscribe: (listener: Listener<T>) => void;
  unsubscribe: (listener: Listener<T>) => void;
}

export default ISubject;
