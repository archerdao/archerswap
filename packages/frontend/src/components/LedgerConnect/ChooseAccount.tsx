import React from 'react';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { LedgerConnector } from '@web3-react/ledger-connector';
import { ledger } from '../../connectors'
import { ButtonLight, ButtonPrimary } from 'components/Button';
import {
  SectionTitle, 
  LoadingMessage,
  LoadingWrapper,
  ErrorGroup,
  ErrorButton,
  StyledLoader,
  AccountSelectBox,
  AddressItem
} from './styleds';

interface ChooseAccountProps  {
  readonly handleConfirm: () => void;
  readonly derivationPath: string;
}

const unique = (value: string, index:number, self: any) => {
  return self.indexOf(value) === index
}

const formatAddress = (address: string) => {
  return address.substring(0, 13) + "..." + address.substring(address.length-3, address.length);
}

const ChooseAccount = ({ handleConfirm, derivationPath }: ChooseAccountProps ) => {
  const { activate} = useWeb3React();
  const [isDuplicated, setDuplicated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setPendingError] = React.useState(false);
  const [accounts, setAccounts] = React.useState<string[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = React.useState(-1);
  const [fetchingAccounts, setFetchingAccounts] = React.useState(false);
  const [pageNumber, setPageNumber] = React.useState(1);
 
  const establishConnection = () => {
    setLoading(true);
    setAccounts([]);
    setDuplicated(false);
    setPageNumber(1);
    setSelectedAccountIndex(-1);
    ledger.activate(derivationPath).then(() => {
      setLoading(false);
    }).catch((error: any) => { 
      if(error instanceof UnsupportedChainIdError) {
        establishConnection();
      } else {
        setPendingError(true);
      }
    });
  }

  const fetchAccounts = () => {
    setFetchingAccounts(true);
    if(ledger) {
      (ledger as LedgerConnector).getAccounts(pageNumber).then(res => {
        const updatedRes = [...accounts, ...res];
        const uniqueRes = updatedRes.filter(unique);
        if(updatedRes.length !== uniqueRes.length) {
          setDuplicated(true);
        }
        setAccounts(uniqueRes);
        setFetchingAccounts(false);
      }).catch((error: any) => {
        setPendingError(true);
        setFetchingAccounts(false);
      })
    }
    
  }

  const handleLoadMore = () => {
    setPageNumber(pageNumber + 1);
    setTimeout(() => {
      fetchAccounts();
    }, 0);
  }

  const handleConfirmAccount = async () => {
    setLoading(true);
    try {
      await ledger.setAccountIndex(selectedAccountIndex);
      await activate(ledger, undefined, true);
      handleConfirm();
      setLoading(false);
    } catch(error) {
      setPendingError(true);
    }
  }

  React.useEffect(() => {
    establishConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  React.useEffect(() => {
    if(!loading) {
      fetchAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const handleChangeAccountIndex = async (index: number) => {
    setSelectedAccountIndex(index);
  }

  if(error || loading) {
    return (
      <LoadingMessage error={error}>
        <LoadingWrapper>
          {error ? (
            <ErrorGroup>
              <div>Error connecting.</div>
              <ErrorButton
                onClick={() => {
                  setPendingError(false)
                  establishConnection();
                }}
              >
                Try Again
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              Connecting...
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
    )
  }

  return (
    <div style={{textAlign: 'center'}}>
      <SectionTitle style={{marginBottom: '30px'}}>Available Ledger Accounts</SectionTitle>
      {accounts.length > 0 && (<AccountSelectBox>
        {accounts.map((account, index) => (
          <AddressItem 
            key={index}
            onClick={() => handleChangeAccountIndex(index)}  
            active={selectedAccountIndex === index} 
          >
            {formatAddress(account)}
          </AddressItem>
        ))}
      </AccountSelectBox>)}
      {fetchingAccounts ? (
        <>
          <StyledLoader />
          Loading Accounts...
        </> 
      ): !isDuplicated ? (
        <ButtonLight onClick={handleLoadMore} disabled={fetchingAccounts}>
          Load More...
        </ButtonLight>
      ): null }
      <ButtonPrimary onClick={handleConfirmAccount} style={{marginTop: '20px'}} disabled={selectedAccountIndex < 0}>
        Confirm
      </ButtonPrimary>
    </div>
  )
}

export default ChooseAccount;