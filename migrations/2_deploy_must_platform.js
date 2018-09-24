// const web3 = require("web3");
const TokenBucket = artifacts.require("TokenBucket.sol");
const RasmartToken = artifacts.require("RasmartToken.sol");

module.exports = async function(deployer, network, [owner, minter]) {
  await deployer.then(async () => {
    const rate = 3000000 * 10e18;
    const size = 3000000 * 10e18;
    await deployer.deploy(RasmartToken);
    await deployer.deploy(TokenBucket, RasmartToken.address, size, rate);

    const token = await RasmartToken.deployed();
    const bucket = await TokenBucket.deployed();

    token.addMinter(bucket.address);
    bucket.addMinter(minter);
  });
};
