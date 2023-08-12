
function* generateRangeInterator(start = 0, end = Infinity, step = 1) {
  let iterationCount = 0;

  for (let i = 0; i < end; i+= step) {
    iterationCount += 1;

    yield i;
  }

  return iterationCount;
}

const rangeIterator = generateRangeInterator();

console.log('rangeIterator [%o]', rangeIterator);

let isDone = rangeIterator.next().done
while (!isDone) {
  const {value, done} = rangeIterator.next();
  console.log('value [%o] done [%o]', value, done)
  isDone = done
}