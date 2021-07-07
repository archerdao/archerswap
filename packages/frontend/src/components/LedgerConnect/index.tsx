import React from 'react';
import Modal from '../Modal';
import ConnectionTip from './ConnectionTip';
import SelectDerivationPath from './SelectDerivationPath';
import ChooseAccount from './ChooseAccount';
import {
  Wrapper, 
  CloseIcon, 
  UpperSection, 
  HoverText, 
  HeaderRow, 
  CloseColor, 
  ContentWrapper
} from './styleds';

interface LedgerConnectProps {
  readonly open: boolean;
  readonly handleDismiss: () => void
}

enum WINDOWS {
  BEGIN = 0,
  CONNECTION_TIP = 1,
  SELECT_DERIVATION_PATH = 2,
  CHOOSE_ACCOUNT = 3,
  END = 4  
};

const LedgerConnect = ({ open, handleDismiss} : LedgerConnectProps ) => {
  const [step, setStep] = React.useState(() => WINDOWS.CONNECTION_TIP);
  const [derivationPath, setDerivationPath] = React.useState('');

  const handleBack = () => {
    const newStep = step - 1;
    if(newStep === WINDOWS.BEGIN) {
      handleDismiss();
    } else {
      setStep(newStep);
    }
  }

  const handleNext = React.useCallback(() => {
    const newStep = step + 1;
    setStep(newStep);
  
  }, [setStep, step, handleDismiss])

  const confirmDerivationPath = (newDerivationPath: string) => {
    setDerivationPath(newDerivationPath);
    const newStep = step + 1;
    setStep(newStep);
  }

  const confirmAccount = () => {
    handleDismiss();
  }

  React.useEffect(() => {
    setStep(WINDOWS.CONNECTION_TIP);
    setDerivationPath('');
  }, [open]);

  return (
    <Modal 
      isOpen={open} 
      onDismiss={handleDismiss} 
      minHeight={false} 
      maxHeight={90}
    >
      <Wrapper>
        <UpperSection>
          <CloseIcon onClick={handleDismiss}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow color="blue">
            <HoverText onClick={handleBack}>
              Back
            </HoverText>
          </HeaderRow>
          <ContentWrapper>
            {
              step == WINDOWS.CONNECTION_TIP && (
                <ConnectionTip 
                  handleNext={handleNext} 
                />
              ) 
            }
            {
              step == WINDOWS.SELECT_DERIVATION_PATH && (
                <SelectDerivationPath 
                  derivationPath={derivationPath} 
                  handleConfirm={confirmDerivationPath} 
                />
              )
            }
            {
              step == WINDOWS.CHOOSE_ACCOUNT && (
                <ChooseAccount 
                  derivationPath={derivationPath} 
                  handleConfirm={confirmAccount}
                />
              )
            }
          </ContentWrapper>
        </UpperSection>

      </Wrapper>
    </Modal>
  )
}

export default LedgerConnect;