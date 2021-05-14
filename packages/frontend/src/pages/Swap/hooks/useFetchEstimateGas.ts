import React from 'react';

type D = Record<string, string>;

export default function useFetchEstimateGas(isManualMode: boolean): [D] {
  const [data, setData] = React.useState<D>({});

  React.useEffect(() => {
    if (isManualMode) return;

    const data = {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "archer_estimateTip",
      "params": [{"from": "0x62E0D8E38297E4A50D5abBb822CA7548b7d2F9ca", "to": "0x38d7CBD2Cd72bc9f5d83d693fE0ecB4440f5B7Fd", "value": "0x100000000"}]
    };

    fetch('https://api.archerdao.io/v1/gas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'no-referrer',
        'X-Flashbots-Signature': '0x123...:0xabc...'
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(response => {
        setData(response.result);
      })
      .catch(error => console.error('Failed to fetch estimate gas', error));
  }, [isManualMode]);

  return [data];
}