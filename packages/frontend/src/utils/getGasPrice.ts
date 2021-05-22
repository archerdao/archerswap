import { BigNumber } from '@ethersproject/bignumber'
import { DEFAULT_GAS_PRICES } from '../constants'

const ARCHER_GAS_URL = process.env.REACT_APP_ARCHER_GAS_URL
const GAS_NOW_URL = process.env.REACT_APP_GAS_NOW_URL

/**
 * Fetches current competitive gas price estimate
 * @param quantile quantile to use in order to estimate gas price (min, q10, q25, median, q75, q90, or max)
 */
export default async function getGasPrice(
  quantile: string = 'median'
): Promise<BigNumber> {
    let gasPrice = DEFAULT_GAS_PRICES[4]
    let json
    try {
      const response = await fetch(ARCHER_GAS_URL as string)
      json = await response.json()
      gasPrice = BigNumber.from(json.effectiveGasPrice[quantile])
      console.debug(`Using Archer gas price ${quantile}: ${gasPrice.toString()}`)
    } catch (error) {
      console.debug('Failed to fetch gas price', ARCHER_GAS_URL, error)
      try {
        const response = await fetch(GAS_NOW_URL as string)
        json = await response.json()
        gasPrice = BigNumber.from(json.data.rapid).mul(2)
        console.debug(`Using GasNow gas price rapid x2: ${gasPrice.toString()}`)
      } catch (error) {
        console.debug('Failed to fetch gas price', GAS_NOW_URL, error)
      }
    }
    return gasPrice
}
