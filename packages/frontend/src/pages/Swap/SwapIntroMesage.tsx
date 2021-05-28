import React, { useCallback } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'
import { RowBetween } from '../../components/Row'
import { darken } from 'polished'
import { ReactComponent as Close } from 'assets/images/x.svg'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import useLocalStorage  from 'hooks/useLocalStorage'

const PageWrapper = styled(AutoColumn)`
  margin-top: -65px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 0px;
  `};
  margin-bottom: 1rem;  
`

const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const StyledButton = styled.button`
  align-items: center;
  height: 2.2rem;
  font-size: 20px;
  font-weight: 500;
  background-color: ${({theme}) =>theme.primary1};
  color: ${({ theme }) => theme.white};
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0.5rem;

  :focus,
  :hover {
    background-color: ${({ theme }) => darken(0.05, theme.primary1)};
  }
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
 `
const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const StyledCardBGImage = styled(CardBGImage)`
  opacity: 0.15;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(75% 75% at 1.84% 0%,#40444f 0%,#212429 100%);
  overflow: hidden;
`

const LOCAL_STORAGE_KEY_SWAP_INTRO_MESSAGE = 'swap_intro_message_first_visit'

export default function SwapIntroMesage() {

  const [isFirstVist, setIsFirstVist] = useLocalStorage(LOCAL_STORAGE_KEY_SWAP_INTRO_MESSAGE, true)

  const wrappedOnDismiss = useCallback(() => {
    setIsFirstVist(false);
  }, [setIsFirstVist]);

  if(!isFirstVist) return null;

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <VoteCard>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Archer Swap Gives You Super Powers</TYPE.white>
                <CloseIcon onClick={wrappedOnDismiss}> <CloseColor /> </CloseIcon>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Use Archer Swap for zero-slippage trades with zero failure cost. Only pay for trades that are successfully excuted.
                </TYPE.white>
              </RowBetween>
              <ExternalLink
                href="https://medium.com/archer-dao/introducing-archer-swap-e13fe521d5d0"
                target="_blank"
              >
                <StyledButton>
                  <TYPE.white fontSize={14}>Learn more about Archer Swap</TYPE.white>
                </StyledButton>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <StyledCardBGImage />
          <CardNoise />
        </VoteCard>
      </TopSection>
    </PageWrapper>
  )
}
