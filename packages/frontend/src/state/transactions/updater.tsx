import { ARCHER_RELAY_URI } from '../../constants'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { checkedTransaction, finalizeTransaction } from './actions'
import { ethers } from 'ethers'

const EPHEMERAL_SIGNER = ethers.Wallet.createRandom()

export function shouldCheck(
  lastBlockNumber: number,
  tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number, relay?: { deadline: number } }
): boolean {
  if (tx.receipt) return false
  if (!tx.lastCheckedBlockNumber) return true
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) return false
  if (tx.relay)
    return true;
  const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60
  if (minutesPending > 60) {
    // every 10 blocks if pending for longer than an hour
    return blocksSinceCheck > 9
  } else if (minutesPending > 5) {
    // every 3 blocks if pending more than 5 minutes
    return blocksSinceCheck > 2
  } else {
    // otherwise every block
    return true
  }
}

function postBundle(rawTransaction: string, lastBlockNumber: number, relayURI: string) {
  // as a wise man on the critically acclaimed hit TV series "MTV's Cribs" once said:
  // "this is where the magic happens"

  const bundle = {
    jsonrpc: '2.0',
    id: 1,
    method: "eth_sendBundle",
    params: [rawTransaction, ethers.utils.hexlify(lastBlockNumber + 1)]
  }
  const body = JSON.stringify(bundle)

  EPHEMERAL_SIGNER.signMessage(ethers.utils.id(body))
    .then(signature => fetch(relayURI, {
      method: 'POST',
      body,
      headers: {
        'X-Flashbots-Signature': signature,
        'Content-Type': 'application/json',
      }
    }))
    .then(res => res.json())
    .then(json => console.log(json))
    .catch(err => console.error(err))
}

export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()

  const lastBlockNumber = useBlockNumber()

  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const transactions = chainId ? state[chainId] ?? {} : {}
  const relayURI = chainId ? ARCHER_RELAY_URI[chainId] : undefined

  // show popup on confirm
  const addPopup = useAddPopup()

  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return

    Object.keys(transactions)
      .filter(hash => shouldCheck(lastBlockNumber, transactions[hash]))
      .forEach(hash => {
        library
          .getTransactionReceipt(hash)
          .then(receipt => {
            if (receipt) {
              dispatch(
                finalizeTransaction({
                  chainId,
                  hash,
                  receipt: {
                    blockHash: receipt.blockHash,
                    blockNumber: receipt.blockNumber,
                    contractAddress: receipt.contractAddress,
                    from: receipt.from,
                    status: receipt.status,
                    to: receipt.to,
                    transactionHash: receipt.transactionHash,
                    transactionIndex: receipt.transactionIndex
                  }
                })
              )

              addPopup(
                {
                  txn: {
                    hash,
                    success: receipt.status === 1,
                    summary: transactions[hash]?.summary
                  }
                },
                hash
              )
            } else {
              const relay = transactions[hash].relay
              if (relayURI && relay)
                postBundle(relay.rawTransaction, lastBlockNumber, relayURI)
              dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
            }
          })
          .catch(error => {
            console.error(`failed to check transaction hash: ${hash}`, error)
          })
      })
  }, [chainId, library, transactions, lastBlockNumber, dispatch, addPopup, relayURI])

  return null
}
