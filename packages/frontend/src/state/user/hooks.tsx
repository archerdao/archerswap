import { ChainId, Token } from '@archerswap/sdk'
import { Pair } from '@archerswap/sdk'
import flatMap from 'lodash.flatmap'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS, UNDERLYING_EXCHANGES } from '../../constants'

import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import {
  addSerializedPair,
  addSerializedToken,
  removeSerializedToken,
  SerializedPair,
  SerializedToken,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserSlippageTolerance,
  toggleURLWarning,
  updateUserSingleHopOnly,
  updateUserUnderlyingExchange,
  updateUserUseRelay,
  updateUserGasPrice,
  updateUserETHTip,
  updateUserGasEstimate,
  updateUserTipManualOverride
} from './actions'

function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

export function useIsDarkMode(): boolean {
  const { userDarkMode, matchesDarkMode } = useSelector<
    AppState,
    { userDarkMode: boolean | null; matchesDarkMode: boolean }
  >(
    ({ user: { matchesDarkMode, userDarkMode } }) => ({
      userDarkMode,
      matchesDarkMode
    }),
    shallowEqual
  )

  return userDarkMode === null ? matchesDarkMode : userDarkMode
}

export function useDarkModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const darkMode = useIsDarkMode()

  const toggleSetDarkMode = useCallback(() => {
    dispatch(updateUserDarkMode({ userDarkMode: !darkMode }))
  }, [darkMode, dispatch])

  return [darkMode, toggleSetDarkMode]
}

export function useIsExpertMode(): boolean {
  return useSelector<AppState, AppState['user']['userExpertMode']>(state => state.user.userExpertMode)
}

export function useExpertModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const expertMode = useIsExpertMode()

  const toggleSetExpertMode = useCallback(() => {
    dispatch(updateUserExpertMode({ userExpertMode: !expertMode }))
  }, [expertMode, dispatch])

  return [expertMode, toggleSetExpertMode]
}

export function useUserSingleHopOnly(): [boolean, (newSingleHopOnly: boolean) => void] {
  const dispatch = useDispatch<AppDispatch>()

  const singleHopOnly = useSelector<AppState, AppState['user']['userSingleHopOnly']>(
    state => state.user.userSingleHopOnly
  )

  const setSingleHopOnly = useCallback(
    (newSingleHopOnly: boolean) => {
      dispatch(updateUserSingleHopOnly({ userSingleHopOnly: newSingleHopOnly }))
    },
    [dispatch]
  )

  return [singleHopOnly, setSingleHopOnly]
}

export function useUserSlippageTolerance(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userSlippageTolerance = useSelector<AppState, AppState['user']['userSlippageTolerance']>(state => {
    return state.user.userSlippageTolerance
  })

  const setUserSlippageTolerance = useCallback(
    (userSlippageTolerance: number) => {
      dispatch(updateUserSlippageTolerance({ userSlippageTolerance }))
    },
    [dispatch]
  )

  return [userSlippageTolerance, setUserSlippageTolerance]
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userDeadline = useSelector<AppState, AppState['user']['userDeadline']>(state => {
    return state.user.userDeadline
  })

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch]
  )

  return [userDeadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch]
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch]
  )
}

export function useUserAddedTokens(): Token[] {
  const { chainId } = useActiveWeb3React()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap?.[chainId as ChainId] ?? {}).map(deserializeToken)
  }, [serializedTokensMap, chainId])
}

function serializePair(pair: Pair): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1)
  }
}

export function usePairAdder(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: Pair) => {
      dispatch(addSerializedPair({ serializedPair: serializePair(pair) }))
    },
    [dispatch]
  )
}

export function useURLWarningVisible(): boolean {
  return useSelector((state: AppState) => state.user.URLWarningVisible)
}

export function useURLWarningToggle(): () => void {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleURLWarning()), [dispatch])
}

/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toV2LiquidityToken(factoryAddress: string, initCodeHash: string, [tokenA, tokenB]: [Token, Token]): Token {
  return new Token(tokenA.chainId, Pair.getAddress(factoryAddress, initCodeHash, tokenA, tokenB), 18, 'UNI-V2', 'Uniswap V2')
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), tokenAddress => {
            const token = tokens[tokenAddress]
            // for each token on the current chain,
            return (
              // loop though all bases on the current chain
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
                // to construct pairs of the given token with each base
                .map(base => {
                  if (base.address === token.address) {
                    return null
                  } else {
                    return [base, token]
                  }
                })
                .filter((p): p is [Token, Token] => p !== null)
            )
          })
        : [],
    [tokens, chainId]
  )

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(pairId => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(() => userPairs.concat(generatedPairs).concat(pinnedPairs), [
    generatedPairs,
    pinnedPairs,
    userPairs
  ])

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map(key => keyed[key])
  }, [combinedList])
}

export function useUserUnderlyingExchange(): [string, (address: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userUnderlyingExchange = useSelector<AppState, AppState['user']['userUnderlyingExchange']>(state => {
    return state.user.userUnderlyingExchange
  })

  const setUserUnderlyingExchange = useCallback(
    (userUnderlyingExchange: string) => {
      dispatch(updateUserUnderlyingExchange({ userUnderlyingExchange }))
    },
    [dispatch]
  )

  return [userUnderlyingExchange, setUserUnderlyingExchange]
}

export function useUserUnderlyingExchangeAddresses() {
  const { chainId } = useActiveWeb3React()
  const [userUnderlyingExchange] = useUserUnderlyingExchange();
  return useMemo(() => {
    if (chainId)
      return UNDERLYING_EXCHANGES[chainId]?.find(x => x.name === userUnderlyingExchange);
    return undefined;
  }, [chainId, userUnderlyingExchange]);
}

export function useUserUseRelay(): [boolean, (newUseRelay: boolean) => void] {
  const dispatch = useDispatch<AppDispatch>()

  const useRelay = useSelector<AppState, AppState['user']['userUseRelay']>(
    state => state.user.userUseRelay
  )

  const setUseRelay = useCallback(
    (newUseRelay: boolean) => {
      dispatch(updateUserUseRelay({ userUseRelay: newUseRelay }))
    },
    [dispatch]
  )

  return [useRelay, setUseRelay]
}

export function useUserGasPrice(): [string, (newGasPrice: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userGasPrice = useSelector<AppState, AppState['user']['userGasPrice']>(state => {
    return state.user.userGasPrice
  })

  const setUserGasPrice = useCallback(
    (newGasPrice: string) => {
      dispatch(updateUserGasPrice({ userGasPrice: newGasPrice }))
    },
    [dispatch]
  )

  return [userGasPrice, setUserGasPrice]
}

export function useUserETHTip(): [string, (newETHTip: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userETHTip = useSelector<AppState, AppState['user']['userETHTip']>(state => {
    return state.user.userETHTip
  })

  const setUserETHTip = useCallback(
    (newETHTip: string) => {
      dispatch(updateUserETHTip({ userETHTip: newETHTip }))
    },
    [dispatch]
  )

  return [userETHTip, setUserETHTip]
}

export function useUserGasEstimate(): [string, (newGasEstimate: string) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userGasEstimate = useSelector<AppState, AppState['user']['userGasEstimate']>(state => {
    return state.user.userGasEstimate
  })

  const setUserGasEstimate = useCallback(
    (newGasEstimate: string) => {
      dispatch(updateUserGasEstimate({ userGasEstimate: newGasEstimate }))
    },
    [dispatch]
  )

  return [userGasEstimate, setUserGasEstimate]
}

export function useUserTipManualOverride(): [boolean, (newManualOverride: boolean) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userTipManualOverride = useSelector<AppState, AppState['user']['userTipManualOverride']>(state => {
    return state.user.userTipManualOverride
  })

  const setUserTipManualOverride = useCallback(
    (newManualOverride: boolean) => {
      dispatch(updateUserTipManualOverride({ userTipManualOverride: newManualOverride }))
    },
    [dispatch]
  )

  return [userTipManualOverride, setUserTipManualOverride]
}