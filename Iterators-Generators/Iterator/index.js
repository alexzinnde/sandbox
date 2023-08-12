function makeRangeIterator(start = 0, end = Infinity, step = 1) {
  let nextIndex = start;
  let iterationCount = 0;

  const rangeIterator = {
    next() {
      let result;
      if (nextIndex < end) {
        result = {value: nextIndex, done: false};
        nextIndex += step;
        iterationCount += 1;
        return result;
      }
      return {value: iterationCount, done: true}
    }
  }

  return rangeIterator;
}

const rangeIterator = makeRangeIterator(0, 10, 1);

let result = rangeIterator.next();
while (!result.done) {
  console.log('result [%o]', result)
  result = rangeIterator.next()
}