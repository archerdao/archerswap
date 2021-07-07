import { ReactComponent as Close } from '../../assets/images/x.svg'
import styled from 'styled-components'
import Loader from '../Loader'
import { darken } from 'polished'


export const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

export const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

export const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

export const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

export const ContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg2};
  padding: 2rem;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

export const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`
export const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`

export const SectionTitle = styled.h6`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
`

export const StyledList = styled.ol`
  li {
    font-size: 14px;
    font-weight: 100;
    line-height: 22px;
    padding-top: 18px;
    padding-left: 10px;
  }
`

export const DerivationSelection = styled.div`
  margin-top: 40px;
`

export const DerivationItem = styled.div<{ active: boolean }>`
  text-align: center;
  padding: 8px 10px;
  border: 1px solid gray;
  border-radius: 4px;
  font-family: monospace;
  color: ${props => (props.active ? 'white' : 'gray')};
  border-color: ${props => (props.active ? 'white' : 'gray')};
  letter-spacing: 1px;
  margin-bottom: 1px;
  &:active {
    border-color: white;
    color: white;
  }
  &:hover {
    border-color: white;
    color: white;
  }
`

export const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`

export const LoadingMessage = styled.div<{ error?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  border-radius: 12px;
  margin-bottom: 20px;
  color: ${({ theme, error }) => (error ? theme.red1 : 'inherit')};
  border: 1px solid ${({ theme, error }) => (error ? theme.red1 : theme.text4)};

  & > * {
    padding: 1rem;
  }
`

export const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
`

export const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg4};
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.1, theme.text4)};
  }
`

export const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
`