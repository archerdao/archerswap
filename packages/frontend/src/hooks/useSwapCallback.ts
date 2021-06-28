import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { JSBI, Router, ArcherRouter, SwapParameters, Trade, CurrencyAmount, Percent, TradeType, ChainId } from '@archerswap/sdk'
import { useMemo } from 'react'
import { ARCHER_RELAY_URI, BIPS_BASE, INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { getTradeVersion } from '../data/V1'
import { useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getRouterContract, getUnderlyingExchangeRouterContract, isAddress, shortenAddress } from '../utils'
import isZero from '../utils/isZero'
import { useActiveWeb3React } from './index'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './useENS'
import { Version } from './useToggledVersion'
import { useUserETHTip, useUserUnderlyingExchangeAddresses, useUserUseRelay, useUserUseGaslessTransaction, useUserTokenTip} from '../state/user/hooks'
import { ethers } from 'ethers'
import Common from '@ethereumjs/common'
import { TransactionFactory } from '@ethereumjs/tx'

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID
}

interface SwapCall {
  contract: Contract
  parameters: SwapParameters
}

export interface SuccessfulCall {
  call: SwapCall
  gasEstimate: BigNumber
}

export interface FailedCall {
  call: SwapCall
  error: Error
}

export type EstimatedSwapCall = SuccessfulCall | FailedCall

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
export function useSwapCallArguments(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()
  const exchange = useUserUnderlyingExchangeAddresses()
  const [useRelay] = useUserUseRelay()
  const [useGaslessTransaction] = useUserUseGaslessTransaction();
  const [ethTip] = useUserETHTip()
  const [userTokenTip] = useUserTokenTip();

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()

  return useMemo(() => {
    const tradeVersion = getTradeVersion(trade)
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId || !deadline || tradeVersion !== Version.v2 || !exchange?.router) return []

    const underlyingRouter = getUnderlyingExchangeRouterContract(exchange.router, chainId, library, account);

    const contract: Contract | null =
       useRelay ? getRouterContract(chainId, library, account) : underlyingRouter
    if (!contract) {
      return []
    }

    const swapMethods = []

    if (!useRelay && !useGaslessTransaction) {
      swapMethods.push(
        Router.swapCallParameters(trade, {
          feeOnTransfer: false,
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          deadline: deadline.toNumber()
        })
      )

      if (trade.tradeType === TradeType.EXACT_INPUT) {
        swapMethods.push(
          Router.swapCallParameters(trade, {
            feeOnTransfer: true,
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )
      }
    }
    else if(!useGaslessTransaction) {
      swapMethods.push(
        ArcherRouter.swapCallParameters(underlyingRouter.address, trade, {
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          deadline: deadline.toNumber(),
          ethTip: CurrencyAmount.ether(ethTip)
        })
      )
    } else {
      swapMethods.push(
        ArcherRouter.swapCallParameters(underlyingRouter.address, trade, {
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          deadline: deadline.toNumber(),
          ethTip: CurrencyAmount.ether(ethTip),
        }, {tipPct: userTokenTip, pathToEth: "0x7889123", minEth: 0}),
      );
    }

    return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade, useRelay, exchange, ethTip, useGaslessTransaction, useUserTokenTip, userTokenTip])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender,
  relayDeadline?: number, // deadline to use for relay -- set to undefined for no relay
  signOnly: boolean = true, // don't broadcast, just sign (for private relay)
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName)

  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const [ethTip] = useUserETHTip()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    const tradeVersion = getTradeVersion(trade)

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map(call => {
            const {
              parameters: { methodName, args, value },
              contract
            } = call
            const options = !value || isZero(value) ? {} : { value }

            return contract.estimateGas[methodName](...args, options)
              .then(gasEstimate => {
                return {
                  call,
                  gasEstimate
                }
              })
              .catch(gasError => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)

                return contract.callStatic[methodName](...args, options)
                  .then(result => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch(callError => {
                    console.debug('Call threw error', call, callError)
                    let errorMessage: string
                    switch (callError.reason) {
                      case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
                      case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
                        errorMessage =
                          'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
                        break
                      default:
                        errorMessage = `The transaction cannot succeed due to error: ${callError.reason}. This is probably an issue with one of the tokens you are swapping.`
                    }
                    return { call, error: new Error(errorMessage) }
                  })
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        const successfulEstimation = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )

        if (!successfulEstimation) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          throw new Error('Unexpected error. Please contact support: none of the calls threw an error')
        }

        const {
          call: {
            contract,
            parameters: { methodName, args, value }
          },
          gasEstimate
        } = successfulEstimation


        const postToRelay = (rawTransaction: string, deadline: number) => {
          // as a wise man on the critically acclaimed hit TV series "MTV's Cribs" once said:
          // "this is where the magic happens"

          const relayURI = chainId ? ARCHER_RELAY_URI[chainId] : undefined
          if (!relayURI)
            throw new Error('Could not determine relay URI for this network')

          const body = JSON.stringify({
            method: 'archer_submitTx',
            tx: rawTransaction,
            deadline: deadline.toString()
          })

          fetch(relayURI, {
              method: 'POST',
              body,
              headers: {
                'Authorization': process.env.REACT_APP_ARCHER_API_KEY ?? '',
                'Content-Type': 'application/json',
              }
            })
            //.then(res => res.json())
            //.then(json => console.log(json))
            .catch(err => console.error(err))
        }

        if (!signOnly) {
          return contract[methodName](...args, {
            from: account,
            gasLimit: calculateGasMargin(gasEstimate),
            ...(relayDeadline ? { gasPrice: ethers.utils.parseUnits("1", "gwei") } : {}),
            ...(value && !isZero(value) ? { value } : {})
          })
            .then((response: any) => {
              const inputSymbol = trade.inputAmount.currency.symbol
              const outputSymbol = trade.outputAmount.currency.symbol
              const inputAmount = trade.inputAmount.toSignificant(3)
              const outputAmount = trade.outputAmount.toSignificant(3)

              const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
              const withRecipient =
                recipient === account
                  ? base
                  : `${base} to ${
                      recipientAddressOrName && isAddress(recipientAddressOrName)
                        ? shortenAddress(recipientAddressOrName)
                        : recipientAddressOrName
                    }`

              const withVersion =
                tradeVersion === Version.v2 ? withRecipient : `${withRecipient} on ${(tradeVersion as any).toUpperCase()}` +
                (relayDeadline ? ' 🏹' : '') 

              console.log('response', response)
              const relay = relayDeadline ? { 
                rawTransaction: response.raw,
                deadline: Math.floor(relayDeadline + (new Date().getTime() / 1000)),
                nonce: response.nonce,
                ethTip
              } : undefined

              addTransaction(response, {
                summary: withVersion,
                relay
              })

              if (relay)
                postToRelay(relay.rawTransaction, relay.deadline)

              return response.hash
            })
            .catch((error: any) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                throw new Error('Transaction rejected.')
              } else {
                // otherwise, the error was unexpected and we need to convey that
                console.error(`Swap failed`, error, methodName, args, value)
                throw new Error(`Swap failed: ${error.message}`)
              }
            })
        }
        else {
          const partialTx = {
            to: contract.address,
            from: account,
            gasLimit: calculateGasMargin(gasEstimate),
            data: contract.interface.encodeFunctionData(methodName, args),
            ...(relayDeadline ? { gasPrice: 0 } : {}),
            ...(value && !isZero(value) ? { value } : {})
          }
          return contract.signer.populateTransaction(partialTx)
            .then(fullTx => {
              // metamask doesn't support Signer.signTransaction, so we have to do all this manually
              //return contract.signer.signTransaction(fullTx)

              const chainNames: {[chainId in ChainId]?: string} = {
                [ChainId.MAINNET]: 'mainnet',
                [ChainId.RINKEBY]: 'rinkeby'
              }
              const chain = chainNames[chainId]
              if (!chain)
                throw new Error(`Unknown chain ID ${chainId} when building transaction`)

              const common = new Common({ chain, hardfork: 'berlin' })
              const txParams = {
                nonce: fullTx.nonce !== undefined ? ethers.utils.hexlify(fullTx.nonce, { hexPad: "left" }) : undefined,
                gasPrice: fullTx.gasPrice !== undefined ? ethers.utils.hexlify(fullTx.gasPrice, { hexPad: "left" }) : undefined,
                gasLimit: fullTx.gasLimit !== undefined ? ethers.utils.hexlify(fullTx.gasLimit, { hexPad: "left" }) : undefined,
                to: fullTx.to,
                value: fullTx.value !== undefined ? ethers.utils.hexlify(fullTx.value, { hexPad: "left" }) : undefined,
                data: fullTx.data?.toString(),
                chainId: fullTx.chainId !== undefined ? ethers.utils.hexlify(fullTx.chainId) : undefined,
                type: fullTx.type !== undefined ? ethers.utils.hexlify(fullTx.type) : undefined
              }
              const tx = TransactionFactory.fromTxData(txParams, { common })
              const unsignedTx = tx.getMessageToSign()

              if (!(contract.signer instanceof JsonRpcSigner)) {
                throw new Error(`Cannot sign transactions with this wallet type`)
              }
              const signer = contract.signer as JsonRpcSigner

              // ethers will change eth_sign to personal_sign if it detects metamask
              // https://github.com/ethers-io/ethers.js/blob/2a7dbf05718e29e550f7a208d35a095547b9ccc2/packages/providers/src.ts/web3-provider.ts#L33

              let isMetamask: boolean | undefined
              let web3Provider: Web3Provider | undefined
              if (signer.provider instanceof Web3Provider) {
                web3Provider = signer.provider as Web3Provider
                isMetamask = web3Provider.provider.isMetaMask
                web3Provider.provider.isMetaMask = false
              }
              
              return signer.provider.send("eth_sign", [account, ethers.utils.hexlify(unsignedTx)])
                .then(signature => {
                  const signatureParts = ethers.utils.splitSignature(signature)

                  // really crossing the streams here
                  // @ts-ignore
                  const txWithSignature = tx._processSignature(signatureParts.v, ethers.utils.arrayify(signatureParts.r), ethers.utils.arrayify(signatureParts.s))

                  return {signedTx: ethers.utils.hexlify(txWithSignature.serialize()), fullTx} 
                })
                .finally(() => {
                  if (web3Provider) {
                    web3Provider.provider.isMetaMask = isMetamask
                  }
                })

            })
            .then(({signedTx, fullTx}) => {
              const hash = ethers.utils.keccak256(signedTx)

              const inputSymbol = trade.inputAmount.currency.symbol
              const outputSymbol = trade.outputAmount.currency.symbol
              const inputAmount = trade.inputAmount.toSignificant(3)
              const outputAmount = trade.outputAmount.toSignificant(3)

              const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
              const withRecipient =
                (recipient === account
                  ? base
                  : `${base} to ${
                      recipientAddressOrName && isAddress(recipientAddressOrName)
                        ? shortenAddress(recipientAddressOrName)
                        : recipientAddressOrName
                    }`)
                + (relayDeadline ? ' 🏹' : '')

              const relay = relayDeadline ? { 
                rawTransaction: signedTx,
                deadline: Math.floor(relayDeadline + (new Date().getTime() / 1000)),
                nonce: ethers.BigNumber.from(fullTx.nonce).toNumber(),
                ethTip
              } : undefined

              addTransaction({ hash }, {
                summary: withRecipient,
                relay
              })

              if (relay)
                postToRelay(relay.rawTransaction, relay.deadline)

              return hash
            })
            .catch((error: any) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                throw new Error('Transaction rejected.')
              } else {
                // otherwise, the error was unexpected and we need to convey that
                console.error(`Swap failed`, error, methodName, args, value)
                throw new Error(`Swap failed: ${error.message}`)
              }
            })
        }
      },
      error: null
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransaction, signOnly, relayDeadline, ethTip])
}
