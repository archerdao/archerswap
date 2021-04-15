const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { ecsign } = require("ethereumjs-util")

const { read } = deployments;

const UNI_ROUTER_ADDRESS = process.env.UNI_ROUTER_ADDRESS
const WETH_ADDRESS = process.env.WETH_ADDRESS
const ERC20EXTENDED_ABI = require("../abis/IERC20Extended.json")
const SWAPPER_ADDRESS = process.env.SWAPPER_ADDRESS
const SWAPPER_PRIVATE_KEY = process.env.SWAPPER_PRIVATE_KEY
const TOKEN_ADDRESS = '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea'
const SWAP_AMOUNT = '5000000000000'

const DOMAIN_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
)

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

async function swapTokensForETHAndTipAmount(swapperAddress, router, amountIn, amountOutMin, token, to, deadline, tipAmount) {
    const swapper = await ethers.provider.getSigner(swapperAddress)
    const path = [token, WETH_ADDRESS]
    const trade = [amountIn, amountOutMin, path, to, deadline]
    const archerSwapRouterDeployment = await deployments.get("ArcherSwapRouter");
    const archerSwapRouter = new ethers.Contract(archerSwapRouterDeployment.address, archerSwapRouterDeployment.abi, swapper)
    const tokenContract = new ethers.Contract(token, ERC20EXTENDED_ABI, swapper)
    await tokenContract.approve(archerSwapRouter.address, amountIn)
    const result = await archerSwapRouter.swapTokensForETHAndTipAmount(router, trade, { value: tipAmount, gasLimit: 1000000 });
    const receipt = await ethers.provider.waitForTransaction(result.hash)
    if(receipt.status) {
        console.log(`Successfully swapped tokens`);
        if (network.name == 'mainnet') {
            console.log(`https://etherscan.io/tx/${receipt.transactionHash}`)
        } else {
            console.log(`https://${network.name}.etherscan.io/tx/${receipt.transactionHash}`)
        }
    } else {
        console.log(`Error swapping tokens. Tx:`)
        if (network.name == 'mainnet') {
            console.log(`https://etherscan.io/tx/${receipt.transactionHash}`)
        } else {
            console.log(`https://${network.name}.etherscan.io/tx/${receipt.transactionHash}`)
        }
    }
}

async function swapTokensForETHWithPermitAndTipAmount(swapperAddress, router, amountIn, amountOutMin, token, to, deadline, tipAmount) {
    const swapper = await ethers.provider.getSigner(swapperAddress)
    const tokenContract = new ethers.Contract(token, ERC20EXTENDED_ABI, swapper)
    const tokenName = await tokenContract.name()
    const path = [token, WETH_ADDRESS]
    const trade = [amountIn, amountOutMin, path, to, deadline]
    const archerSwapRouterDeployment = await deployments.get("ArcherSwapRouter");
    const archerSwapRouter = new ethers.Contract(archerSwapRouterDeployment.address, archerSwapRouterDeployment.abi, swapper)

    const domainSeparator = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, token]
        )
      )

    const nonce = await tokenContract.nonces(swapperAddress)

    const digest = ethers.utils.keccak256(
        ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
            '0x19',
            '0x01',
            domainSeparator,
            ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                [PERMIT_TYPEHASH, swapperAddress, archerSwapRouter.address, amountIn, nonce, deadline]
                )
            ),
            ]
        )
    )

    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(SWAPPER_PRIVATE_KEY, 'hex'))
    const permit = [token, amountIn, deadline, v, r, s]
    const result = await archerSwapRouter.swapTokensForETHWithPermitAndTipAmount(router, trade, permit, { value: tipAmount, gasLimit: 1000000 });
    const receipt = await ethers.provider.waitForTransaction(result.hash)
    if(receipt.status) {
        console.log(`Successfully swapped tokens`);
        if (network.name == 'mainnet') {
            console.log(`https://etherscan.io/tx/${receipt.transactionHash}`)
        } else {
            console.log(`https://${network.name}.etherscan.io/tx/${receipt.transactionHash}`)
        }
    } else {
        console.log(`Error swapping tokens. Tx:`)
        if (network.name == 'mainnet') {
            console.log(`https://etherscan.io/tx/${receipt.transactionHash}`)
        } else {
            console.log(`https://${network.name}.etherscan.io/tx/${receipt.transactionHash}`)
        }
    }
}

if (require.main === module) {
    // Deadline for swapping tokens = now + 20 minutes
    const deadline = parseInt(Date.now() / 1000) + 1200
    swapTokensForETHAndTipAmount(SWAPPER_ADDRESS, UNI_ROUTER_ADDRESS, SWAP_AMOUNT, 1, TOKEN_ADDRESS, SWAPPER_ADDRESS, deadline, 100)
}

module.exports.swapTokensForETHWithPermitAndTipAmount = swapTokensForETHWithPermitAndTipAmount
module.exports.swapTokensForETHAndTipAmount = swapTokensForETHAndTipAmount
