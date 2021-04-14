module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, tipJar } = await getNamedAccounts();

  log(`1) ArcherSwapRouter`)
  
  const deployResult = await deploy("ArcherSwapRouter", {
    from: deployer,
    contract: "ArcherSwapRouter",
    gas: 4000000,
    skipIfAlreadyDeployed: true,
    args: [tipJar]
  });

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ["1", "ArcherSwapRouter"]