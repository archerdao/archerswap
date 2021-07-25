import { CurrencyAmount, JSBI } from '@archerswap/sdk'
import { currencyId } from './currencyId';
import { Interface } from '@ethersproject/abi'
import { getAddress } from '@ethersproject/address'

export function toHex(bigintIsh: JSBI) {
  const bigInt = JSBI.BigInt(bigintIsh)
  let hex = bigInt.toString(16)
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`
  }
  return `0x${hex}`
}

const ERC20_INTERFACE = new Interface([
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
])

export function approveAmountCalldata(
  amount: CurrencyAmount,
  spender: string
): { to: string; data: string; value: '0x0' } {
  if (!amount.currency.symbol) throw new Error('Must call with an amount of token')
  const approveData = ERC20_INTERFACE.encodeFunctionData('approve', [spender, toHex(amount.quotient)])
  console.log("new router address", getAddress(currencyId(amount.currency)) )
  return {
    to: getAddress(currencyId(amount.currency)),
    data: approveData,
    value: '0x0',
  }
}
