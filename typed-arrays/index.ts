let data = new Uint8Array([1, 2, 3, 4, 5])

let inputData = new Uint8Array(data.buffer)

setTimeout(() => {
  let view = inputData.subarray(0)
  console.log('should be [1, 2, 3, 4, 5] [%o]', view)
}, 2000)

data = new Uint8Array([0, 0, 2, 2, 2])
console.log('data is now [%o]', data)
data = new Uint8Array([9, 9, 9, 2, 2])
console.log('data is now [%o]', data)
