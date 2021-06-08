import React, { useRef } from 'react'
import { Info, BookOpen, Code, MessageCircle, Twitter, Navigation } from 'react-feather'
import styled from 'styled-components'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'

import { ExternalLink } from '../../theme'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 8.125rem;
  background-color: ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3.2rem;
  right: 0rem;
  z-index: 100;
  
  ${({ theme }) => theme.mediaWidth.upToMedium`
    top: 2.8rem;
  `};
`

const MenuItem = styled(ExternalLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const ABOUT_LINK = 'https://medium.com/archer-dao/introducing-archer-swap-e13fe521d5d0'
const CODE_LINK = 'https://github.com/archerdao/archerswap'
const DOCS_LINK = 'https://docs.archerdao.io/'
const DISCORD_LINK = 'https://discord.com/invite/98GV73f'
const TWITTER_LINK = 'https://twitter.com/archer_dao'
const TELEGRAM_LINK = 'https://t.me/archerdao'

export default function Menu() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout>
          <MenuItem id="ABOUT_LINK" href={ABOUT_LINK}>
            <Info size={14} />
            About
          </MenuItem>
          <MenuItem id="DOCS_LINK" href={DOCS_LINK}>
            <BookOpen size={14} />
            Docs
          </MenuItem>
          <MenuItem id="CODE_LINK" href={CODE_LINK}>
            <Code size={14} />
            Code
          </MenuItem>
          <MenuItem id="TWITTER_LINK" href={TWITTER_LINK}>
            <Twitter size={14} />
            Twitter
          </MenuItem>
          <MenuItem id="DISCORD_LINK" href={DISCORD_LINK}>
            <MessageCircle size={14} />
            Discord
          </MenuItem>
          <MenuItem id="TELEGRAM_LINK" href={TELEGRAM_LINK}>
            <Navigation size={14} />
            Telegram
          </MenuItem>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
