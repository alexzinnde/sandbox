function createSubscribable<T>() {
  const subscribers: Set<(msg: T) => void> = new Set();

  return {
    subscribe(cb: (msg: T) => void): () => void {
      subscribers.add(cb);

      return () => {
        subscribers.delete(cb)
      }
    },
    publish(msg: T): void {
      subscribers.forEach((cb => cb(msg)))
    }
  }
}


type ObservableMessage<T> = {
  target: T;
  prop: string;
};
type Observable<T> = T & {
  subscribe: (callback: (data: ObservableMessage<T>) => void) => void;
}

function createObservables<T>(data: T): Observable<T> {
  const subscribers = createSubscribable<ObservableMessage<T>>();

  return new Proxy({
    ...data,
    subscribers: subscribers.subscribe
  }, {
    set: function (target: object, prop: string, value: any) {
      Reflect.set(target, prop, value);
      subscribers.publish({
        target,
        prop
      } as unknown as ObservableMessage<T>);
      return true;
    }
  }) as Observable<T>;
}

interface Message {
  message1: string;
  message2: string;
}

const target: Message = {
  message1: "hello",
  message2: "world"
}

const proxy = createObservables(target);
proxy.subscribe(console.log);
proxy.message1 = "foo"
proxy.message2 = "bar"