import { useEffect, useState } from 'react';

const ARCHER_GAS_URL = "https://api.archerdao.io/v1/gas";
type T = Record<string, string>;

export default function useFetchArcherMinerTips(): { status: string, data: T } {
  const [status, setStatus] = useState<string>('idle');
  const [data, setData] = useState<T>({});

  useEffect(() => {
      const fetchData = async () => {
          setStatus('fetching');
          const response = await fetch(ARCHER_GAS_URL, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Referrer-Policy': 'no-referrer'
            }
          });
          const responseData = await response.json();
          setData(responseData.data as T);
          setStatus('fetched');
      };
      fetchData();
  }, []);

  return { status, data };
};
