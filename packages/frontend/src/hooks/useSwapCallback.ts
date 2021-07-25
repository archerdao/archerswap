import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JSBI, Router, ArcherRouter, Trade, CurrencyAmount, Percent, TradeType, ChainId, EIP_1559_ACTIVATION_BLOCK} from '@archerswap/sdk'
import { TransactionRequest } from '@ethersproject/abstract-provider'
import { useMemo } from 'react'
import { ARCHER_RELAY_URI, BIPS_BASE, INITIAL_ALLOWED_SLIPPAGE} from '../constants'
import { getTradeVersion } from '../data/V1'
import { useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getRouterContract, getUnderlyingExchangeRouterContract, isAddress, shortenAddress } from '../utils'
import { useArgentWalletContract } from './useArgentWalletContract'; 
import isZero from '../utils/isZero'
import { useActiveWeb3React } from './index'
import {  } from './useArgentWalletContract'
import useENS from './useENS'
import { Version } from './useToggledVersion'
import { useUserETHTip, useUserUnderlyingExchangeAddresses } from '../state/user/hooks'
import { ethers } from 'ethers'
import Common from '@ethereumjs/common'
import { useBlockNumber } from '../state/application/hooks'
import { TransactionFactory } from '@ethereumjs/tx'
import { approveAmountCalldata } from 'utils/approveAmountCalldata'; 
import useTransactionDeadline from './useTransactionDeadline'
import { SignatureData } from './useERC20Permit';

const CHAINID_HARMONY = 1666600000;

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID
}

interface SwapCall {
  address: string
  calldata: string
  value: string
}

interface SwapCallEstimate {
  call: SwapCall
}

export interface SuccessfulCall extends SwapCallEstimate {
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
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null | undefined,
  useRelay: boolean = false
  ): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()
  const exchange = useUserUnderlyingExchangeAddresses()
  const [ethTip] = useUserETHTip()
  const argentWalletContract = useArgentWalletContract()

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

    if (!useRelay) {
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
    else {
      swapMethods.push(
        ArcherRouter.swapCallParameters(underlyingRouter.address, trade, {
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          ttl: deadline.toNumber(),
          ethTip: CurrencyAmount.ether(ethTip) // i will take a look at this
        })
      )
    }

    return swapMethods.map(({ methodName, args, value }) => {
      if (argentWalletContract && trade.inputAmount.currency.symbol) { // i will take a look at this
        return {
          address: argentWalletContract.address,
          calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
            [
              approveAmountCalldata(trade.maximumAmountIn(new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE)), contract.address),
              {
                to: contract.address,
                value: value,
                data: contract.interface.encodeFunctionData(methodName, args),
              },
            ],
          ]),
          value: '0x0',
        }
      } else {
        return {
          address: contract.address,
          calldata: contract.interface.encodeFunctionData(methodName, args),
          value,
        }
      }
    })
  }, [account, argentWalletContract, allowedSlippage, chainId, deadline, library, recipient, trade, useRelay, exchange, ethTip])
}


/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
 export function swapErrorToUserReadableMessage(error: any): string {
  let reason: string | undefined

  while (Boolean(error)) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return `The transaction could not be sent because the deadline has passed. Please check that your transaction deadline is not too low.`
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return `This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.`
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return `The input token cannot be transferred. There may be an issue with the input token.`
    case 'UniswapV2: TRANSFER_FAILED':
      return `The output token cannot be transferred. There may be an issue with the output token.`
    case 'UniswapV2: K':
      return `The Uniswap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are swapping incorporates custom behavior on transfer.`
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return `This transaction will not succeed due to price movement. Try increasing your slippage tolerance.`
    case 'TF':
      return `The output token cannot be transferred. There may be an issue with the output token.`
    default:
      if (reason?.indexOf('undefined is not an object') !== -1) {
        console.error(error, reason)
        return `An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If that does not work, there may be an incompatibility with the token you are trading. Note fee on transfer and rebase tokens are incompatible with Uniswap V3.`
      }
      return `Unknown error${reason ? `: "${reason}"` : ''}. Try increasing your slippage tolerance.`
  }
}


// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender,
  signatureData: SignatureData | undefined | null,
  archerRelayDeadline?: number // deadline to use for archer relay -- set to undefined for no relay
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const useRelay = archerRelayDeadline !== undefined
  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName, signatureData, useRelay)

  const blockNumber = useBlockNumber()
  let eip1559 = false;
  if(blockNumber && chainId && EIP_1559_ACTIVATION_BLOCK[chainId] )
    eip1559 = blockNumber >= (EIP_1559_ACTIVATION_BLOCK[chainId] as number)
 
  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const [ethTip] = useUserETHTip()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return {
        state: SwapCallbackState.INVALID,
        callback: null,
        error: 'Missing dependencies',
      }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return {
          state: SwapCallbackState.INVALID,
          callback: null,
          error: 'Invalid recipient',
        }
      } else {
        return {
          state: SwapCallbackState.LOADING,
          callback: null,
          error: null,
        }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map(call => {
            const { address, calldata, value } = call

            const tx =
              !value || isZero(value)
                ? { from: account, to: address, data: calldata }
                : {
                    from: account,
                    to: address,
                    data: calldata,
                    value,
                  }
            
            // console.log('Estimate gas for valid swap')

            // library.getGasPrice().then((gasPrice) => console.log({ gasPrice }))

            return library
              .estimateGas(tx)
              .then((gasEstimate) => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError) => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)

                return library
                  .call(tx)
                  .then((result) => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return {
                      call,
                      error: new Error('Unexpected issue with estimating the gas. Please try again.'),
                    }
                  })
                  .catch((callError) => {
                    console.debug('Call threw error', call, callError)
                    return {
                      call,
                      error: new Error(swapErrorToUserReadableMessage(callError)),
                    }
                  })
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        let bestCallOption: SuccessfulCall | SwapCallEstimate | undefined = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )

       // check if any calls errored with a recognizable error
       if (!bestCallOption) {
        const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
        console.log("errorcalls", errorCalls);
        if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
        const firstNoErrorCall = estimatedCalls.find<SuccessfulCall>(
          (call): call is SuccessfulCall => !('error' in call)
        )
        if (!firstNoErrorCall) throw new Error('Unexpected error. Could not estimate gas for the swap.')
        bestCallOption = firstNoErrorCall
      }

      const {
        call: { address, calldata, value },
      } = bestCallOption

      if (!useRelay) {
        console.log('SWAP WITHOUT ARCHER')
        console.log(
          'gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(bestCallOption.gasEstimate) } : {}
        )
        
        return library
          .getSigner()
          .sendTransaction({
            from: account,
            to: address,
            data: calldata,
            // let the wallet try if we can't estimate the gas
            ...('gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(bestCallOption.gasEstimate) } : {}),
            gasPrice: !eip1559 && chainId === CHAINID_HARMONY ? BigNumber.from('2000000000') : undefined,
            ...(value && !isZero(value) ? { value } : {}),
          })
          .then((response) => {
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const inputAmount = trade.inputAmount.toSignificant(4)
            const outputAmount = trade.outputAmount.toSignificant(4)

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`

            addTransaction(response, {
              summary: withRecipient,
            })

            return response.hash
          })
          .catch((error) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, address, calldata, value)

              throw new Error(`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
            }
          })
      } else {
        const postToRelay = (rawTransaction: string, deadline: number) => {
          // as a wise man on the critically acclaimed hit TV series "MTV's Cribs" once said:
          // "this is where the magic happens"
          const relayURI = chainId ? ARCHER_RELAY_URI[chainId] : undefined
          if (!relayURI) throw new Error('Could not determine relay URI for this network')
          const body = JSON.stringify({
            method: 'archer_submitTx',
            tx: rawTransaction,
            deadline: deadline.toString(),
          })
          return fetch(relayURI, {
            method: 'POST',
            body,
            headers: {
              Authorization: process.env.NEXT_PUBLIC_ARCHER_API_KEY ?? '',
              'Content-Type': 'application/json',
            },
          }).then((res) => {
            if (res.status !== 200) throw Error(res.statusText)
          })
        }

        const isMetamask = library.provider.isMetaMask

        if (isMetamask) {
          // ethers will change eth_sign to personal_sign if it detects metamask
          // https://github.com/ethers-io/ethers.js/blob/2a7dbf05718e29e550f7a208d35a095547b9ccc2/packages/providers/src.ts/web3-provider.ts#L33

          library.provider.isMetaMask = false
        }

        
        const fullTxPromise = library.getBlockNumber().then((blockNumber) => {
          return library.getSigner().populateTransaction({
            from: account,
            to: address,
            data: calldata,
            // let the wallet try if we can't estimate the gas
            ...(bestCallOption && 'gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(bestCallOption.gasEstimate) } : {}),
            ...(value && !isZero(value) ? { value } : {}),
            ...(archerRelayDeadline && !eip1559 ? { gasPrice: 0 } : {}),
          })
        })


        let signedTxPromise: Promise<{ signedTx: string; fullTx: TransactionRequest }>
        if (isMetamask) {
          signedTxPromise = fullTxPromise.then((fullTx) => {
            // metamask doesn't support Signer.signTransaction, so we have to do all this manually
            const chainNames: {
              [chainId in ChainId]?: string
            } = {
              [ChainId.MAINNET]: 'mainnet',
            }
            const chain = chainNames[chainId]
            if (!chain) throw new Error(`Unknown chain ID ${chainId} when building transaction`)
            const common = new Common({
              chain,
              hardfork: 'berlin',
            })
            const txParams = {
              nonce:
                fullTx.nonce !== undefined
                  ? ethers.utils.hexlify(fullTx.nonce, {
                      hexPad: 'left',
                    })
                  : undefined,
              gasPrice:
                fullTx.gasPrice !== undefined ? ethers.utils.hexlify(fullTx.gasPrice, { hexPad: 'left' }) : undefined,
              gasLimit:
                fullTx.gasLimit !== undefined ? ethers.utils.hexlify(fullTx.gasLimit, { hexPad: 'left' }) : undefined,
              to: fullTx.to,
              value:
                fullTx.value !== undefined
                  ? ethers.utils.hexlify(fullTx.value, {
                      hexPad: 'left',
                    })
                  : undefined,
              data: fullTx.data?.toString(),
              chainId: fullTx.chainId !== undefined ? ethers.utils.hexlify(fullTx.chainId) : undefined,
              type: fullTx.type !== undefined ? ethers.utils.hexlify(fullTx.type) : undefined,
            }
            const tx: any = TransactionFactory.fromTxData(txParams, {
              common,
            })
            const unsignedTx = tx.getMessageToSign()
            // console.log('unsignedTx', unsignedTx)
            if(library.provider.request) {
              return library.provider.request({ method: 'eth_sign', params: [account, ethers.utils.hexlify(unsignedTx)] })
                .then((signature) => {
                  const signatureParts = ethers.utils.splitSignature(signature)
                  // really crossing the streams here
                  // eslint-disable-next-line
                  // @ts-ignore
                  const txWithSignature = tx._processSignature(
                    signatureParts.v,
                    ethers.utils.arrayify(signatureParts.r),
                    ethers.utils.arrayify(signatureParts.s)
                  )
                  return {
                    signedTx: ethers.utils.hexlify(txWithSignature.serialize()),
                    fullTx,
                  }
                })
            } else {
              return library
                .getSigner()
                .signTransaction(fullTx)
                .then((signedTx) => {
                  return { signedTx, fullTx }
                })
            }
          })
        } else {
          signedTxPromise = fullTxPromise.then((fullTx) => {
            return library
              .getSigner()
              .signTransaction(fullTx)
              .then((signedTx) => {
                return { signedTx, fullTx }
              })
          })
        }

        return signedTxPromise
          .then(({ signedTx, fullTx }) => {
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
                  }`) + (archerRelayDeadline ? ' 🏹' : '')
            const relay =
              useRelay && archerRelayDeadline
                ? {
                    rawTransaction: signedTx,
                    deadline: Math.floor(archerRelayDeadline + new Date().getTime() / 1000),
                    nonce: ethers.BigNumber.from(fullTx.nonce).toNumber(),
                    ethTip: ethTip,
                  }
                : undefined
            // console.log('archer', archer)
            addTransaction(
              { hash },
              {
                summary: withRecipient,
                relay,
              }
            )
            return relay ? postToRelay(relay.rawTransaction, relay.deadline).then(() => hash) : hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error)
              throw new Error(`Swap failed: ${error.message}`)
            }
          })
          .finally(() => {
            if (isMetamask) library.provider.isMetaMask = true
          })
        }
      },
      error: null
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, useRelay, addTransaction, ethTip, archerRelayDeadline, eip1559])
}
