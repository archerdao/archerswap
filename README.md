
# Archerswap
[Archerswap](https://swap.archerdao.io/#/swap) is a proof-of concept DEX extension that allows users to execute Uniswap and Sushiswap trades without having to worry about:
- Slippage
- Frontrunning/Sandwich Attacks
- Failed Transaction Cost
- Transaction Cancellation Cost

## How It Works
Instead of paying gas, users pay miners directly via a "Miner Tip".  Trades are then routed through the Archer Relay network.  Archer Relayers will attempt to execute the trade each block until the trade expires (as determined by the trade deadline specified when submitting the trade) or the user manually cancels the transaction.  

Users pay nothing if the trade expires or is cancelled. The user can simply resubmit the trade if they choose to try again (possibly with higher slippage,lower target price, and/or a larger miner tip to increase their chances).


## Link
Archer is currently in Alpha.  Executing trades through Archer is generally safe, but the biggest risk is a phishing attack.

Users should be careful and only submit trades directly on:
https://swap.archerdao.io

We recommend bookmarking this URL to ensure safety.