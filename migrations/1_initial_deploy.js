const PoolRewards = artifacts.require("PoolRewards");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(PoolRewards);
  const poolRewards = await PoolRewards.deployed();
  console.log(poolRewards.address);
};
