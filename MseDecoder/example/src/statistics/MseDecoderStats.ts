import MseDecoder from '../../../src'

const mseDecoderStatusDisplay = document.getElementById('mse-decoder-status') as HTMLInputElement;

export function subscribeToMseDecoder(mseDecoder: MseDecoder) {
  mseDecoder.status.subscribe((status) => {
    mseDecoderStatusDisplay!.value = status
  })

  mseDecoder.statistics.subscribe(statistics => {
    console.log('[MseDecoder] statistics [%o]', statistics)
  })
}