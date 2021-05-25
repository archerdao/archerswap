import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { CheckCircle, Triangle, X } from 'react-feather'

import { useActiveWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'
import { ExternalLink } from '../../theme'
import { useAllTransactions } from '../../state/transactions/hooks'
import { RowFixed } from '../Row'
import Loader from '../Loader'
import { CurrencyAmount } from '@archerswap/sdk'
import { ARCHER_RELAY_URI } from '../../constants'
import { finalizeTransaction } from '../../state/transactions/actions'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../state'
import { TransactionDetails } from 'state/transactions/reducer'
import {
  useSwapState
} from 'state/swap/hooks'
import { SwapState, LOCAL_STORAGE_KEY_SWAP_STATE } from 'state/swap/reducer'
import useLocalStorage from 'hooks/useLocalStorage'
import { resetSwapState } from 'state/swap/actions'

const TransactionWrapper = styled.div``

const TransactionStatusText = styled.div`
  margin-right: 0.5rem
  display: flex;
  align-items: center;
  :hover {
    text-decoration: underline;
  }
`

const TransactionState = styled(ExternalLink)<{ pending: boolean; success?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none !important;
  border-radius: 0.5rem;
  padding: 0.25rem 0rem;
  font-weight: 500;
  font-size: 0.825rem;
  color: ${({ theme }) => theme.primary1};
`

const TransactionStateNoLink = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none !important;
  padding-bottom: 0.25rem;
  font-weight: 500;
  font-size: 0.825rem;
  color: ${({ theme }) => theme.primary1};
`

const TransactionCancel = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  :hover {
    text-decoration: underline;
  }
`

const IconWrapper = styled.div<{ pending: boolean; success?: boolean; cancelled?: boolean }>`
  color: ${({ pending, success, cancelled, theme }) => (pending ? theme.primary1 : success ? theme.green1 : cancelled ? theme.red3 : theme.red1)};
`

const TransactionExpiredBadge = styled.span`
  color:  ${({ theme }) => theme.red1}; 
`

const TransactionCancelledBadge = styled.span`
  color:  ${({ theme }) => theme.red3}; 
`

const TransactionRemainingTimeBadge = styled.span`
  color:  ${({ theme }) => theme.primary1}; 
`

const calculateSecondsUntilDeadline = (tx: TransactionDetails): number => {
  if(tx?.relay?.deadline && tx?.addedTime) {
    const  millisecondsUntilUntilDeadline = (tx.relay.deadline * 1000) - Date.now()
    return millisecondsUntilUntilDeadline < 0 ? -1 : Math.ceil(millisecondsUntilUntilDeadline / 1000 )
  }
  return -1
}

export default function Transaction({ hash }: { hash: string }) {
  const { chainId } = useActiveWeb3React()
  const allTransactions = useAllTransactions()
  const dispatch = useDispatch<AppDispatch>()

  const tx = allTransactions?.[hash]
  const summary = tx?.summary
  const relay = tx?.relay
  const secondsUntilDeadline = useMemo(() => calculateSecondsUntilDeadline(tx), [tx])
  const mined = tx?.receipt && tx.receipt.status !== 1337
  const cancelled = tx?.receipt && tx.receipt.status === 1337
  const expired = secondsUntilDeadline === -1
  const pending = !mined && !cancelled && !expired
  const success = !pending && tx && tx.receipt?.status === 1
  const swapState = useSwapState();
  const [lastTxSwapState] = useLocalStorage<SwapState>(LOCAL_STORAGE_KEY_SWAP_STATE, swapState)

  const cancelPending = useCallback(() => {
    if (!chainId) {
      dispatch(resetSwapState(lastTxSwapState))
      return
    }

    const relayURI = ARCHER_RELAY_URI[chainId]
    if (!relayURI) {
      dispatch(resetSwapState(lastTxSwapState))
      return
    }

    const body = JSON.stringify({
      method: 'archer_cancelTx',
      tx: relay?.rawTransaction
    })
    fetch(relayURI, {
      method: 'POST',
      body,
      headers: {
        'Authorization': process.env.REACT_APP_ARCHER_API_KEY ?? '',
        'Content-Type': 'application/json',
      }
    })
    .then(() => {
      dispatch(
        finalizeTransaction({
          chainId,
          hash,
          receipt: {
            blockHash: '',
            blockNumber: 0,
            contractAddress: '',
            from: '',
            status: 1337,
            to: '',
            transactionHash: '',
            transactionIndex: 0
          }
        })
      )
      dispatch(resetSwapState(lastTxSwapState))
    })
    .catch(err => console.error(err))
  }, [dispatch, chainId, relay, hash, lastTxSwapState])

  if (!chainId) return null

  return (
    <TransactionWrapper>
      <TransactionState href={getEtherscanLink(chainId, hash, 'transaction')} pending={pending} success={success}>
        <RowFixed>
          <TransactionStatusText>{summary ?? hash} ↗</TransactionStatusText>
        </RowFixed>
        <IconWrapper pending={pending} success={success} cancelled={cancelled}>
          {pending ? <Loader /> : success ? <CheckCircle size="16" /> : cancelled ? <X size="16" /> : <Triangle size="16" />}
        </IconWrapper>
      </TransactionState>
      {relay && (
        <TransactionStateNoLink>
          {`...#${relay.nonce} - Tip ${CurrencyAmount.ether(relay.ethTip).toSignificant(6)} ETH`}
          {pending ? (
            <>
              {secondsUntilDeadline >= 60 ? (
                <TransactionRemainingTimeBadge>&#128337; {`${Math.ceil(secondsUntilDeadline / 60)} mins`} </TransactionRemainingTimeBadge>
              ) : (
                <TransactionRemainingTimeBadge>&#128337; {`<1 min`} </TransactionRemainingTimeBadge>
              )}
              <TransactionCancel onClick={cancelPending}>Cancel</TransactionCancel>
            </>
          ) : (cancelled ? (
            <TransactionCancelledBadge>Cancelled</TransactionCancelledBadge>
          ) : (!mined && expired && (
            <TransactionExpiredBadge>Expired</TransactionExpiredBadge>
          )))}
        </TransactionStateNoLink>
      )}
    </TransactionWrapper>
  )
}
