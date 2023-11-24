import { Subject } from "@zinntechniker/tools"

const subject = new Subject<string>('123')

console.log(subject.value)
