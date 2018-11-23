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

    const ICOBucketSize = 225 * (10**6) * (10**18);
    const ICOBucketRate = 225 * (10**6) * (10**18);
    const ICOBucketCost = 0.002 * (10**18);
    const ICOBucketWallet = "0xa49eaefb5515137db51c8894f64d4c3e17f9e68d";
    const ICOBucketInitialBonusPercent = 30;
    const ICOBucketMinimumTokensForPurchase = 41666666666666666666666;
    await deployer.deploy(ICOBucket, RasmartToken.address, ICOBucketSize, ICOBucketRate, ICOBucketCost, ICOBucketWallet, ICOBucketInitialBonusPercent, ICOBucketMinimumTokensForPurchase);
    const ICOBucketDeployed = await ICOBucket.deployed();
    RasmartTokenDeployed.addMinter(ICOBucketDeployed.address);
    ICOBucketDeployed.addMinter(minter);

    const AdvisorsBucketSize = 67 * (10**6) * (10**18);
    const AdvisorsBucketRate = 67 * (10**6) * (10**18);
    await deployer.deploy(AdvisorsBucket, RasmartToken.address, AdvisorsBucketSize, AdvisorsBucketRate);
    const AdvisorsBucketDeployed = await AdvisorsBucket.deployed();
    RasmartTokenDeployed.addMinter(AdvisorsBucketDeployed.address);
    AdvisorsBucketDeployed.addMinter(minter);

    const PlatformBucketSize = 90 * (10**6) * (10**18);
    const PlatformBucketRate = 90 * (10**6) * (10**18);
    await deployer.deploy(PlatformBucket, RasmartToken.address, PlatformBucketSize, PlatformBucketRate);
    const PlatformBucketDeployed = await PlatformBucket.deployed();
    RasmartTokenDeployed.addMinter(PlatformBucketDeployed.address);
    PlatformBucketDeployed.addMinter(minter);

    const TeamBucketSize = 59 * (10**6) * (10**18);
    const TeamBucketRate = 59 * (10**6) * (10**18);
    await deployer.deploy(TeamBucket, RasmartToken.address, TeamBucketSize, TeamBucketRate);
    const TeamBucketDeployed = await TeamBucket.deployed();
    RasmartTokenDeployed.addMinter(TeamBucketDeployed.address);
    TeamBucketDeployed.addMinter(minter);
  });
};
