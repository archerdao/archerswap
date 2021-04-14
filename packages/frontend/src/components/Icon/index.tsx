import React from 'react'
import styled from 'styled-components'

const IconWrapper = styled.div<{ size?: number, marginRight?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
    margin-right: ${({ marginRight }) => (marginRight ? marginRight + 'px' : '0px')};
  }
`;

export default function Icon(props: {src: string, size?: number, marginRight?: number}) {
  return (<IconWrapper size={props.size} marginRight={props.marginRight}>
      <img src={props.src} alt='' />
    </IconWrapper>
  );
}
