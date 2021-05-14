import { Trade } from '@archerswap/sdk'

export interface  SwapMinerTipProps{
  trade: Trade | undefined,
  allowedSlippage: number,
  recipient: string | null
};
 
export interface SwapInfo {
  from: string | null,
  to: string | null,
  value: string | null
};
