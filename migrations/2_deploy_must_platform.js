// const web3 = require("web3");
const ICOBucket = artifacts.require("ICOBucket.sol");
const RasmartToken = artifacts.require("RasmartToken.sol");

module.exports = async function(deployer, network, [owner, minter]) {
  await deployer.then(async () => {
    const rate = 500 * 10e6 * 10e18;
    const size = 500 * 10e6 * 10e18;
    await deployer.deploy(RasmartToken);
    await deployer.deploy(ICOBucket, RasmartToken.address, size, rate);

    const token = await RasmartToken.deployed();
    const bucket = await ICOBucket.deployed();

    token.addMinter(bucket.address);
    bucket.addMinter(minter);
  });
};
