import React from 'react';

export default function useFetchEstimateGas(swapInfo: any): [string] {
  const [estimatedGas, setEstimatedGas] = React.useState("0");
  
  // --- will update it with swap info --- 
  React.useEffect(() => {
    if (swapInfo.value) {
      const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "archer_estimateTip",
        params: [
          { from: "0x62E0D8E38297E4A50D5abBb822CA7548b7d2F9ca", to: "0x38d7CBD2Cd72bc9f5d83d693fE0ecB4440f5B7Fd", value: '0x100000000' },
        ],
      };
      fetch("https://api.archerdao.io/v1/gas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referrer-Policy": "no-referrer",
          "X-Flashbots-Signature": "0x123...:0xabc...",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((response) => {
          setEstimatedGas(response.result.estimatedGas);
        })
        .catch((error) => console.error("Failed to fetch estimate gas", error));
    }
  }, [swapInfo]);

  return [estimatedGas];
}
