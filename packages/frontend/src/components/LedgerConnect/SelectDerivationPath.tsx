import React from 'react';
import { ButtonPrimary } from 'components/Button';
import {
  SectionTitle,  
  DerivationSelection,
  DerivationItem,
  Input
} from './styleds';

interface SelectDerivationPathProps  {
  readonly handleConfirm: (newDerivationPath: string) => void;
  readonly derivationPath: string;
}

const SelectDerivationPath = ({ handleConfirm, derivationPath }: SelectDerivationPathProps ) => {
  const [path, setPath] = React.useState('');
  const [pathText, setPathText] = React.useState('');
  const handleConfirmDerivationPath = () => {
    handleConfirm(path);
  }

  React.useEffect(() => {
    setPath(derivationPath);
  }, [derivationPath])

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPathText(e.target.value);
    setPath(e.target.value);
  }

  return (
    <>
      <SectionTitle>Select a derivation path</SectionTitle>
      <DerivationSelection>
        <DerivationItem 
          active={path===`44'/60'/0'/0/0`} 
          onClick={() => setPath(`44'/60'/0'/0/0`)}
        >
          44'/60'/0'/0/0
        </DerivationItem>
        <DerivationItem 
          active={path===`44'/60'/x'/0/0`} 
          onClick={() => setPath(`44'/60'/x'/0/0`)}
        >
          44'/60'/x'/0/0
        </DerivationItem>
        <div style={{textAlign: "center"}}>
          <Input 
            type="text"
            value={pathText}
            onChange={handleChangeInput}
            placeholder="Custom Path"
          />
        </div>
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