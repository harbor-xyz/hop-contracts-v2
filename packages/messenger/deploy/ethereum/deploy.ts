import { Contract, Signer} from 'ethers'
import { ethers, run, network } from "hardhat"
import { DeployFunction, DeployResult } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
// import logContractDeployed from '../logContractDeployed'
// import getSigners from '../getSigners'
// const { parseUnits } = ethers.utils
// import { Wallet } from "ethers";
import { contracts, deployConfig } from '../config'
// import { ONE_WEEK } from '../constants'
const { externalContracts } = contracts.testnet

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();

	const hubMessageBridge = await deploy('HubMessageBridge', {
		from: deployer,
    args: [],
		log: true,
		autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
	});

    const feeDistributor = await deploy('ETHFeeDistributor', {
      from: deployer,
      args: [      
        hubMessageBridge.address,
        deployConfig.treasury,
        deployConfig.publicGoods,
        deployConfig.minPublicGoodsBps,
        deployConfig.fullPoolSize,
        deployConfig.maxBundleFee,
        deployConfig.maxBundleFeeBps],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    console.log('Deploying L1OptimismConnector...')
    const l1OptimismConnector = await deploy('L1OptimismConnector', {
      from: deployer,
      args: [hubMessageBridge.address, externalContracts.optimism.l1CrossDomainMessenger],
      log: true,
      gasLimit: 5000000,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
}

module.exports.default = func;