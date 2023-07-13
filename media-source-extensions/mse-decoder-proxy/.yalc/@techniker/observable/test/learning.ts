import { Observer, Subject } from "../src/index.js";

const SUBJECT = new Subject()
const OBSERVER_1 = new Observer(SUBJECT, 1)
const OBSERVER_2 = new Observer(SUBJECT, 2)

SUBJECT.notify('First Notification', [1, 2, 3])

// Unsubscribe OBSERVER_2
SUBJECT.unsubscribe(OBSERVER_2)

SUBJECT.notify('Second Notification', { A: 1, B: 2, C: 3 })