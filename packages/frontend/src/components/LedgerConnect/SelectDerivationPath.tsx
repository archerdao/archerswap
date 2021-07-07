import React from 'react';
import { ButtonPrimary } from 'components/Button';
import {
  SectionTitle,  
  DerivationSelection,
  DerivationItem,
} from './styleds';

interface SelectDerivationPathProps  {
  readonly handleConfirm: (newDerivationPath: string) => void;
  readonly derivationPath: string;
}

const SelectDerivationPath = ({ handleConfirm, derivationPath }: SelectDerivationPathProps ) => {
  const [path, setPath] = React.useState('');

  const handleConfirmDerivationPath = () => {
    handleConfirm(path);
  }

  React.useEffect(() => {
    setPath(derivationPath);
  }, [derivationPath])

  return (
    <>
      <SectionTitle>Select a derivation path</SectionTitle>
      <DerivationSelection>
        <DerivationItem 
          active={path===`44'/60'/x'/0/0`} 
          onClick={() => setPath(`44'/60'/x'/0/0`)}
        >
          44'/60'/x'/0/0
        </DerivationItem>
        <DerivationItem 
          active={path===`44'/60'/0'/x`} 
          onClick={() => setPath(`44'/60'/0'/x`)}
        >
          44'/60'/0'/x
        </DerivationItem>
      </DerivationSelection>
      <ButtonPrimary 
        onClick={handleConfirmDerivationPath} 
        style={{marginTop: '50px'}} 
        disabled={!path || !path.length}
      >
        Confirm
      </ButtonPrimary>
    </>
  )
}


export default SelectDerivationPath;