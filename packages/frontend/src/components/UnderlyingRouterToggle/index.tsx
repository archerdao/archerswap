import React from 'react'
import { UNDERLYING_ROUTER_ADDRESS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCallback } from 'react'
import { useUserUnderlyingRouter } from 'state/user/hooks'
import { StyledToggle, ToggleElement } from '../Toggle'
import UniswapIcon from '../../assets/images/uniswap-icon.png'
import SushiswapIcon from '../../assets/images/sushiswap-icon.png'
import Icon from '../Icon'

export interface UnderlyingRouterToggleProps {
  id?: string
}

export default function UnderlyingRouterToggle({ id }: UnderlyingRouterToggleProps) {
    const { chainId } = useActiveWeb3React()
    const [userUnderlyingRouter, setUserUnderlyingRouter] = useUserUnderlyingRouter()
    const isUniswap = chainId ? userUnderlyingRouter === UNDERLYING_ROUTER_ADDRESS[chainId]?.find(x => x.name === 'Uniswap')?.address : true
    const toggle = useCallback(() => {
      if (!chainId)
        return
      const set = UNDERLYING_ROUTER_ADDRESS[chainId]?.find(x => x.name === (isUniswap ? 'Sushiswap' : 'Uniswap'))
      if (set)
        setUserUnderlyingRouter(set.address)
    }, [chainId, isUniswap, setUserUnderlyingRouter])

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