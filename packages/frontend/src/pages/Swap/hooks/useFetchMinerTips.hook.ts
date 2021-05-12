import React from 'react';

export default function useFetchMinerTips<D>(isManualMode: boolean) {
  const [data, setData] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isManualMode) return;

    fetch('https://api.archerdao.io/v1/gas', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'no-referrer'
      }
    })
      .then(response => response.json())
      .then(response => {
        setData(response.data);
      })
      .catch(error => console.error('Failed to fetch miner tips', error));
  }, [isManualMode]);

  return [data];
}