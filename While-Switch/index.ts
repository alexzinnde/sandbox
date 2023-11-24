function main() {
  let time = new Date().getTime()
  let count = 0

  while (count < 100000) {
    console.log('time [%o]', time)
    time = new Date().getTime()
    switch (time % 2) {
      case 0:
      case 1:
        console.log('0')
        count++
        break

      case 2:
        console.log('not zero')
        count++
        break

      default:
        console.log('default')
        count++
    }
  }
}

main()
