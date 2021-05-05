import { CurrencyAmount, ETHER } from '@archerswap/sdk'
import { JSBI } from '@archerswap/sdk'
import { DEFAULT_ETH_TIP } from '../constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount, userETHTip?: string): CurrencyAmount | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency === ETHER) {
    let ethTip = DEFAULT_ETH_TIP
    if (userETHTip) {
      ethTip = JSBI.BigInt(userETHTip)
    }
    const ethTipWithBuffer = JSBI.divide(JSBI.multiply(ethTip, JSBI.BigInt(120)), JSBI.BigInt(100))
    if (JSBI.greaterThan(currencyAmount.raw, ethTipWithBuffer)) {
      return CurrencyAmount.ether(JSBI.subtract(currencyAmount.raw, ethTipWithBuffer))
    } else {
      return CurrencyAmount.ether(JSBI.BigInt(0))
    }
  }
  return currencyAmount
}
