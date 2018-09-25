// const web3 = require("web3");
const ICOBucket = artifacts.require("ICOBucket.sol");
const RasmartToken = artifacts.require("RasmartToken.sol");

module.exports = async function(deployer, network, [owner, minter]) {
  await deployer.then(async () => {
    const ICOrate = 500 * 10e6 * 10e18;
    const ICOsize = 500 * 10e6 * 10e18;
    const ICOcost = 0.001 * 10e18;
    const ICOwallet = "0xd8c72e912f2efaf09e4b3f8567f6e00e0859143c";
    const ICOinitialBonusPercent = 30;
    const ICOminimum = 1 * 10e3 * 10e18;

    await deployer.deploy(RasmartToken);
    await deployer.deploy(ICOBucket, RasmartToken.address, ICOsize, ICOrate, ICOcost, ICOwallet, ICOinitialBonusPercent, ICOminimum);

    const token = await RasmartToken.deployed();
    const bucket = await ICOBucket.deployed();

    token.addMinter(bucket.address);
    bucket.addMinter(minter);
  });
};
