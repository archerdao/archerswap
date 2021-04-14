import React from 'react'
import { useActiveWeb3React } from '../../hooks'
import { useCallback } from 'react'
import { useUserUnderlyingExchange } from 'state/user/hooks'
import { StyledToggle, ToggleElement } from '../Toggle'
import UniswapIcon from '../../assets/images/uniswap-icon.png'
import SushiswapIcon from '../../assets/images/sushiswap-icon.png'
import Icon from '../Icon'

export interface UnderlyingExchangeToggleProps {
  id?: string
}

export default function UnderlyingExchangeToggle({ id }: UnderlyingExchangeToggleProps) {
    const { chainId } = useActiveWeb3React()
    const [userUnderlyingExchange, setUserUnderlyingExchange] = useUserUnderlyingExchange()
    const isUniswap = chainId ? userUnderlyingExchange === 'Uniswap' : true
    const toggle = useCallback(() => {
      if (!chainId)
        return
      setUserUnderlyingExchange(isUniswap ? 'Sushiswap' : 'Uniswap')
    }, [chainId, isUniswap, setUserUnderlyingExchange])

    return (
      <StyledToggle id={id} isActive={isUniswap} onClick={toggle}>
        <ToggleElement isActive={isUniswap} isOnSwitch={true}>
         <Icon src={UniswapIcon} /> Uniswap
        </ToggleElement>
        <ToggleElement isActive={!isUniswap} isOnSwitch={true}>
          <Icon src={SushiswapIcon} /> Sushiswap
        </ToggleElement>
      </StyledToggle>
    )
  }