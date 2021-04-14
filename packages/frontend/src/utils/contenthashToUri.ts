export function hexToUint8Array(hex: string): Uint8Array {
  hex = hex.startsWith('0x') ? hex.substr(2) : hex
  if (hex.length % 2 !== 0) throw new Error('hex must have length that is multiple of 2')
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return arr
}

/**
 * Returns the URI representation of the content hash for supported codecs
 * @param contenthash to decode
 */
export default function contenthashToUri(contenthash: string): string {
  switch (contenthash) {
    case '0xe3010170122013e051d1cfff20606de36845d4fe28deb9861a319a5bc8596fa4e610e8803918':
      return 'ipfs://QmPgEqyV3m8SB52BS2j2mJpu9zGprhj2BGCHtRiiw2fdM1'
    case '0xe5010170000f6170702e756e69737761702e6f7267':
      return 'ipns://app.uniswap.org'
    default:
      throw new Error('Unknown contenthash')
  }
}
