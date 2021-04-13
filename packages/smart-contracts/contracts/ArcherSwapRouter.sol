//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
  Copyright 2021 Archer DAO: Chris Piatt (chris@archerdao.io).
*/

import "./interfaces/IUniRouter.sol";
import "./interfaces/ITipJar.sol";
import "./interfaces/IERC20Extended.sol";
import "./lib/SafeERC20.sol";

/**
 * @title ArcherSwapRouter
 * @dev Allows Uniswap V2 Router-compliant trades to be paid via % tips instead of gas
 */
contract ArcherSwapRouter {
    using SafeERC20 for IERC20Extended;

    /// @notice TipJar proxy
    ITipJar public constant tipJar = ITipJar(0x5312B0d160E16feeeec13437a0053009e7564287);

    /// @notice Trade details
    struct Trade {
        uint amountIn;
        uint amountOutMin;
        address[] path;
        address payable to;
        uint256 deadline;
    }

    /**
     * @notice Swap tokens for ETH and pay amount of ETH as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     */
    function swapTokensForETHAndTipAmount(
        IUniRouter router,
        Trade calldata trade
    ) external payable {
        require(msg.value > 0, "tip amount must be > 0");
        _swapTokensForETH(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _tipAmountETH(msg.value);
        _transferContractETHBalance(trade.to);
    }

    /**
     * @notice Swap tokens for ETH and pay amount of ETH as tip, using permit for approval
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function swapTokensForETHWithPermitAndTipAmount(
        IUniRouter router,
        Trade calldata trade,
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external payable {
        require(msg.value > 0, "tip amount must be > 0");
        _permit(IERC20Extended(trade.path[0]), trade.amountIn, trade.deadline, v, r, s);
        _swapTokensForETH(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _tipAmountETH(msg.value);
        _transferContractETHBalance(trade.to);
    }

    /**
     * @notice Swap tokens for ETH and pay % of ETH as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param tipPct % of resulting ETH to pay as tip
     */
    function swapTokensForETHAndTipPct(
        IUniRouter router,
        Trade calldata trade,
        uint32 tipPct
    ) external payable {
        require(tipPct > 0, "tipPct must be > 0");
        _swapTokensForETH(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _tipPctETH(tipPct);
        _transferContractETHBalance(trade.to);
    }

    /**
     * @notice Swap tokens for ETH and pay % of ETH as tip, using permit for approval
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param tipPct % of resulting ETH to pay as tip
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function swapTokensForETHWithPermitAndTipPct(
        IUniRouter router,
        Trade calldata trade,
        uint32 tipPct,
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external payable {
        require(tipPct > 0, "tipPct must be > 0");
        _permit(IERC20Extended(trade.path[0]), trade.amountIn, trade.deadline, v, r, s);
        _swapTokensForETH(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _tipPctETH(tipPct);
        _transferContractETHBalance(trade.to);
    }

    /**
     * @notice Swap ETH for tokens and pay % of ETH input as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param tipAmount amount of ETH to pay as tip
     */
    function swapETHForTokensWithTipAmount(
        IUniRouter router,
        Trade calldata trade,
        uint256 tipAmount
    ) external payable {
        require(tipAmount > 0, "tip amount must be > 0");
        require(msg.value >= tipAmount, "must send ETH to cover tip");
        _tipAmountETH(tipAmount);
        _swapETHForTokens(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _transferContractETHBalance(trade.to);
    }

    /**
     * @notice Swap ETH for tokens and pay % of ETH input as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param tipPct % of ETH to pay as tip
     */
    function swapETHForTokensWithTipPct(
        IUniRouter router,
        Trade calldata trade,
        uint32 tipPct
    ) external payable {
        require(tipPct > 0, "tipPct must be > 0");
        require(msg.value > 0, "must send ETH to cover tip");
        uint256 tipAmount = (msg.value * tipPct) / 1000000;
        _tipAmountETH(tipAmount);
        _swapETHForTokens(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _transferContractETHBalance(trade.to);
    }

    /**
     * @notice Swap tokens for tokens and pay ETH amount as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     */
    function swapTokensForTokensWithTipAmount(
        IUniRouter router,
        Trade calldata trade
    ) external payable {
        require(msg.value > 0, "tip amount must be > 0");
        _tipAmountETH(msg.value);
        _swapTokensForTokens(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _transferContractTokenBalance(IERC20Extended(trade.path[trade.path.length]), trade.to);
    }

    /**
     * @notice Swap tokens for tokens and pay ETH amount as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function swapTokensForTokensWithPermitAndTipAmount(
        IUniRouter router,
        Trade calldata trade,
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external payable {
        require(msg.value > 0, "tip amount must be > 0");
        _tipAmountETH(msg.value);
        _permit(IERC20Extended(trade.path[0]), trade.amountIn, trade.deadline, v, r, s);
        _swapTokensForTokens(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        _transferContractTokenBalance(IERC20Extended(trade.path[trade.path.length]), trade.to);
    }

    /**
     * @notice Swap tokens for tokens and pay % of tokens as tip
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param pathToEth Path to ETH for tip
     * @param minEth ETH minimum for tip conversion
     * @param tipPct % of resulting tokens to pay as tip
     */
    function swapTokensForTokensWithTipPct(
        IUniRouter router,
        Trade calldata trade,
        address[] calldata pathToEth,
        uint256 minEth,
        uint32 tipPct
    ) external payable {
        require(tipPct > 0, "tipPct must be > 0");
        _swapTokensForTokens(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        IERC20Extended toToken = IERC20Extended(pathToEth[0]);
        uint256 contractTokenBalance = toToken.balanceOf(address(this));
        uint256 tipAmount = (contractTokenBalance * tipPct) / 1000000;
        _tipWithTokens(router, tipAmount, pathToEth, trade.deadline, minEth);
        _transferContractTokenBalance(toToken, trade.to);
    }

    /**
     * @notice Swap tokens for tokens and pay % of tokens as tip, using permit for approval
     * @param router Uniswap V2-compliant Router contract
     * @param trade Trade details
     * @param pathToEth Path to ETH for tip
     * @param minEth ETH minimum for tip conversion
     * @param tipPct % of resulting tokens to pay as tip
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function swapTokensForTokensWithPermitAndTipPct(
        IUniRouter router,
        Trade calldata trade,
        address[] calldata pathToEth,
        uint256 minEth,
        uint32 tipPct,
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external payable {
        require(tipPct > 0, "tipPct must be > 0");
        _permit(IERC20Extended(trade.path[0]), trade.amountIn, trade.deadline, v, r, s);
        _swapTokensForTokens(router, trade.amountIn, trade.amountOutMin, trade.path, trade.deadline);
        IERC20Extended toToken = IERC20Extended(pathToEth[0]);
        uint256 contractTokenBalance = toToken.balanceOf(address(this));
        uint256 tipAmount = (contractTokenBalance * tipPct) / 1000000;
        _tipWithTokens(router, tipAmount, pathToEth, trade.deadline, minEth);
        _transferContractTokenBalance(toToken, trade.to);
    }

    /**
     * @notice Internal implementation of swap ETH for tokens
     * @param amountIn Amount to swap
     * @param amountOutMin Minimum amount out
     * @param path Path for swap
     * @param deadline Block timestamp deadline for trade
     */
    function _swapETHForTokens(
        IUniRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        uint256 deadline
    ) internal {
        router.swapExactETHForTokensSupportingFeeOnTransferTokens{value: amountIn}(amountOutMin, path, address(this), deadline);
    }

    /**
     * @notice Internal implementation of swap tokens for ETH
     * @param amountIn Amount to swap
     * @param amountOutMin Minimum amount out
     * @param path Path for swap
     * @param deadline Block timestamp deadline for trade
     */
    function _swapTokensForETH(
        IUniRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        uint256 deadline
    ) internal {
        IERC20Extended fromToken = IERC20Extended(path[0]);
        fromToken.safeTransferFrom(msg.sender, address(this), amountIn);
        fromToken.safeIncreaseAllowance(address(router), amountIn);
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn, amountOutMin, path, address(this), deadline);
    }

    /**
     * @notice Internal implementation of swap tokens for tokens
     * @param amountIn Amount to swap
     * @param amountOutMin Minimum amount out
     * @param path Path for swap
     * @param deadline Block timestamp deadline for trade
     */
    function _swapTokensForTokens(
        IUniRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        uint deadline
    ) internal {
        IERC20Extended fromToken = IERC20Extended(path[0]);
        fromToken.safeTransferFrom(msg.sender, address(this), amountIn);
        fromToken.safeIncreaseAllowance(address(router), amountIn);
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn, amountOutMin, path, address(this), deadline);
    }

    /**
     * @notice Tip % of ETH contract balance
     * @param tipPct % to tip
     */
    function _tipPctETH(uint32 tipPct) internal {
        uint256 contractBalance = address(this).balance;
        uint256 tipAmount = (contractBalance * tipPct) / 1000000;
        tipJar.tip{value: tipAmount}();
    }

    /**
     * @notice Tip specific amount of ETH
     * @param tipAmount Amount to tip
     */
    function _tipAmountETH(uint256 tipAmount) internal {
        tipJar.tip{value: tipAmount}();
    }

    /**
     * @notice Transfer contract ETH balance to specified user
     * @param to User to receive transfer
     */
    function _transferContractETHBalance(address payable to) internal {
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success);
    }

    /**
     * @notice Transfer contract token balance to specified user
     * @param token Token to transfer
     * @param to User to receive transfer
     */
    function _transferContractTokenBalance(IERC20Extended token, address payable to) internal {
        token.safeTransfer(to, token.balanceOf(address(this)));
    }

    /**
     * @notice Convert a token balance into ETH and then tip
     * @param amountIn Amount to swap
     * @param path Path for swap
     * @param deadline Block timestamp deadline for trade
     */
    function _tipWithTokens(
        IUniRouter router,
        uint amountIn,
        address[] memory path,
        uint256 deadline,
        uint256 minEth
    ) internal {
        IERC20Extended(path[0]).safeIncreaseAllowance(address(router), amountIn);
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn, minEth, path, address(this), deadline);
        tipJar.tip{value: address(this).balance}();
    }

    /**
     * @notice Permit contract to spend user's balance
     * @param token Token to permit
     * @param amount Amount to permit
     * @param deadline Block timestamp deadline for permit
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function _permit(
        IERC20Extended token, 
        uint amount,
        uint deadline,
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) internal {
        token.permit(msg.sender, address(this), amount, deadline, v, r, s);
    }
}