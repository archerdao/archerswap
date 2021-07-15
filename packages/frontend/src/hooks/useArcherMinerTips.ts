import { useEffect, useState } from 'react';

const ARCHER_GAS_URL = "https://api.archerdao.io/v1/gas";
type T = Record<string, string>;

export default function useFetchArcherMinerTips(): { status: string, data: T } {
  const [status, setStatus] = useState<string>('idle');
  const [data, setData] = useState<T>({
    "immediate": "2000000000000",
    "rapid": "800000000000",
    "fast": "300000000000",
    "standard": "140000000000",
    "slow": "100000000000",
    "slower": "70000000000",
    "slowest": "60000000000"
  });

  useEffect(() => {
      const ac = new AbortController();
      const fetchData = async () => {   
        setStatus('fetching');
        try {
          const response = await fetch(ARCHER_GAS_URL, {
            signal: ac.signal,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Referrer-Policy': 'no-referrer'
            }
          });
          const json = await response.json();
          setData(json.data as T);
          setStatus('fetched');
        } catch (err) {
          console.log(err);
        }
      };
      fetchData();
      return () => ac.abort();
  }, []);

  return { status, data };
};
