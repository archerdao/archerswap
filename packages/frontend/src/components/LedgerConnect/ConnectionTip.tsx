import React from 'react';
import { ButtonPrimary } from 'components/Button';
import {
  SectionTitle, 
  StyledList, 
} from './styleds';

interface ConnectionTipProps {
  readonly handleNext: () => void;
}

const ConnectionTip = ({ handleNext }: ConnectionTipProps ) => {
  return (
    <>
      <SectionTitle>Before proceeding make sure</SectionTitle>
      <StyledList>
        <li>
          "contract data" is enabled on the device
        </li>
        <li>
          Ledger Live app is closed
        </li>
        <li>
          the device is plugged in via USB NOT bluetooth
        </li>
        <li>
          the device is unlocked and in the Ethereum app
        </li>
      </StyledList>
      <ButtonPrimary onClick={handleNext} style={{marginTop: '50px'}}>
        Continue
      </ButtonPrimary>
    </>
  )
}

export default ConnectionTip