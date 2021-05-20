import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { CheckCircle, Triangle } from 'react-feather'

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

const IconWrapper = styled.div<{ pending: boolean; success?: boolean }>`
  color: ${({ pending, success, theme }) => (pending ? theme.primary1 : success ? theme.green1 : theme.red1)};
`

const TransactionExpiredBadge = styled.span`
  color:  ${({ theme }) => theme.red1}; 
`

const TransactionRemainingTimeBadge = styled.span`
  color:  ${({ theme }) => theme.primary1}; 
`

const caculateRemaingTimeByMinutes = (tx: TransactionDetails): number => {
  if(tx?.relay?.deadline && tx?.addedTime) {
    const  remaingTimeMilliSeconds = tx.relay.deadline * 1000 - (Date.now() - tx.addedTime)
    return remaingTimeMilliSeconds < 0 ? -1 : Math.ceil(remaingTimeMilliSeconds / 60000 )
  }
  return -1
}

export default function Transaction({ hash }: { hash: string }) {
  const { chainId } = useActiveWeb3React()
  const allTransactions = useAllTransactions()
  const dispatch = useDispatch<AppDispatch>()

  const tx = allTransactions?.[hash]
  const summary = tx?.summary
  const pending = !tx?.receipt
  const success = !pending && tx && (tx.receipt?.status === 1 || typeof tx.receipt?.status === 'undefined')
  const relay = tx?.relay
  const remaingTime = useMemo(() => caculateRemaingTimeByMinutes(tx), [tx])

  const cancelPending = useCallback(() => {
    if (!chainId) return

    const relayURI = ARCHER_RELAY_URI[chainId]
    if (!relayURI) return

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
    })
    .catch(err => console.error(err))
  }, [dispatch, chainId, relay, hash])

  if (!chainId) return null

  return (
    <TransactionWrapper>
      <TransactionState href={getEtherscanLink(chainId, hash, 'transaction')} pending={pending} success={success}>
        <RowFixed>
          <TransactionStatusText>{summary ?? hash} ↗</TransactionStatusText>
        </RowFixed>
        <IconWrapper pending={pending} success={success}>
          {pending ? <Loader /> : success ? <CheckCircle size="16" /> : <Triangle size="16" />}
        </IconWrapper>
      </TransactionState>
      {relay && (
        <TransactionStateNoLink>
          {`...#${relay.nonce} - Tip ${CurrencyAmount.ether(relay.ethTip).toSignificant(6)} ETH`}
          {pending && (
            <>
              {remaingTime === -1 ? (
                <TransactionExpiredBadge>Expired</TransactionExpiredBadge>
              ) : (
                <TransactionRemainingTimeBadge>&#128337; {`${remaingTime} minus`} </TransactionRemainingTimeBadge>
              )}
              <TransactionCancel onClick={cancelPending}>Cancel</TransactionCancel>
            </>
          )}
        </TransactionStateNoLink>
      )}
    </TransactionWrapper>
  )
}
