import React from 'react';

type T = Record<string, string>;

export default function useFetchMinerTips(isManualMode: boolean): [T] {
  const [data, setData] = React.useState<T>({});

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
        setData(response.data as T);
      })
      .catch(error => console.error('Failed to fetch miner tips', error));
  }, [isManualMode]);

  return [data];
}