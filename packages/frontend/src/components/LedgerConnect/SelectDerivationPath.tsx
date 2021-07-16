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

const DEFAULT_PATH = `44'/60'/0'/0/0`;
const LEGACY_PATH = `44'/60'/x'/0/0`;

const SelectDerivationPath = ({ handleConfirm, derivationPath }: SelectDerivationPathProps ) => {
  const [path, setPath] = React.useState('');
  const [pathText, setPathText] = React.useState('');
  const handleConfirmDerivationPath = () => {
    handleConfirm(path);
  }

  React.useEffect(() => {
    setPath(derivationPath || DEFAULT_PATH);
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
          active={path===DEFAULT_PATH} 
          onClick={() => setPath(DEFAULT_PATH)}
        >
          44'/60'/0'/0/0 (Default)
        </DerivationItem>
        <DerivationItem 
          active={path===LEGACY_PATH}
          onClick={() => setPath(LEGACY_PATH)}
        >
          44'/60'/x'/0/0 (Legacy)
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