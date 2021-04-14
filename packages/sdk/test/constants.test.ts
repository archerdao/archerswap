import { bytecode } from '@uniswap/v2-core/build/UniswapV2Pair.json'
import { keccak256 } from '@ethersproject/solidity'

export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
export const INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'


// this _could_ go in constants, except that it would cost every consumer of the sdk the CPU to compute the hash
// and load the JSON.
const COMPUTED_INIT_CODE_HASH = keccak256(['bytes'], [`0x${bytecode}`])

describe('constants', () => {
  describe('INIT_CODE_HASH', () => {
    it('matches computed bytecode hash', () => {
      expect(COMPUTED_INIT_CODE_HASH).toEqual(INIT_CODE_HASH)
    })
  })
})
