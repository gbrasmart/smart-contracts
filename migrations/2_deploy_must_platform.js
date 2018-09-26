// const web3 = require("web3");
const RasmartToken = artifacts.require("RasmartToken.sol");
const ICOBucket = artifacts.require("ICOBucket.sol");
const AdvisorsBucket = artifacts.require("AdvisorsBucket.sol");
const PlatformBucket = artifacts.require("PlatformBucket.sol");
const TeamBucket = artifacts.require("TeamBucket.sol");

module.exports = async function(deployer, network, [owner, minter]) {
  await deployer.then(async () => {
    await deployer.deploy(RasmartToken);
    const RasmartTokenDeployed = await RasmartToken.deployed();

    const ICOBucketSize = 325 * (10**6) * (10**18);
    const ICOBucketRate = 325 * (10**6) * (10**18);
    const ICOBucketCost = 0.001 * (10**18);
    const ICOBucketWallet = "0xd8c72e912f2efaf09e4b3f8567f6e00e0859143c";
    const ICOBucketInitialBonusPercent = 30;
    const ICOBucketMinimumTokensForPurchase = 1000 * (10**18);
    await deployer.deploy(ICOBucket, RasmartToken.address, ICOBucketSize, ICOBucketRate, ICOBucketCost, ICOBucketWallet, ICOBucketInitialBonusPercent, ICOBucketMinimumTokensForPurchase);
    const ICOBucketDeployed = await ICOBucket.deployed();
    RasmartTokenDeployed.addMinter(ICOBucketDeployed.address);
    ICOBucketDeployed.addMinter(minter);

    const AdvisorsBucketSize = 35 * (10**6) * (10**18);
    const AdvisorsBucketRate = 35 * (10**6) * (10**18);
    await deployer.deploy(AdvisorsBucket, RasmartToken.address, AdvisorsBucketSize, AdvisorsBucketRate);
    const AdvisorsBucketDeployed = await AdvisorsBucket.deployed();
    RasmartTokenDeployed.addMinter(AdvisorsBucketDeployed.address);
    AdvisorsBucketDeployed.addMinter(minter);

    const PlatformBucketSize = 65 * (10**6) * (10**18);
    const PlatformBucketRate = 65 * (10**6) * (10**18);
    await deployer.deploy(PlatformBucket, RasmartToken.address, PlatformBucketSize, PlatformBucketRate);
    const PlatformBucketDeployed = await PlatformBucket.deployed();
    RasmartTokenDeployed.addMinter(PlatformBucketDeployed.address);
    PlatformBucketDeployed.addMinter(minter);

    const TeamBucketSize = 75 * (10**6) * (10**18);
    const TeamBucketRate = 75 * (10**6) * (10**18);
    await deployer.deploy(TeamBucket, RasmartToken.address, TeamBucketSize, TeamBucketRate);
    const TeamBucketDeployed = await TeamBucket.deployed();
    RasmartTokenDeployed.addMinter(TeamBucketDeployed.address);
    TeamBucketDeployed.addMinter(minter);
  });
};
