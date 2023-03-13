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

  // const hubChainId = await deployer.getChainId()

  const spokeMessageBridge = await deploy('SpokeMessageBridge', {
		from: deployer,
    args: [31337,     
    [{
        chainId: 31337,
        messageFee: deployConfig.messageFee,
        maxBundleMessages: deployConfig.maxBundleMessages,
      }]
    ],
		log: true,
		autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
	});

    console.log('Deploying connectors...')

    const l2Connector = await deploy('L2OptimismConnector', {
      from: deployer,
      args: [spokeMessageBridge.address, externalContracts.optimism.l2CrossDomainMessenger],
      log: true,
      gasLimit: 5000000,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    console.log(process.env.ETHEREUM_URL)
    const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_URL);
    console.log(ethereumProvider)
    // const ethereumSigner = ethereumProvider.getSigner()
    // l1Connector = await ethers.getContractAt("L1OptimismConnector", ContractAddress);


    const l2ConnectorContract = await ethers.getContractFactory("L2OptimismConnector");
    const l2ConnectordeployedContract = l2ConnectorContract.attach(l2Connector.address);
    await l2ConnectordeployedContract.setCounterpart(l1Connector.address, { gasLimit: 5000000 })

    const spokeMessageBridgeContract = await ethers.getContractFactory("SpokeMessageBridge");
    const spokeMessageBridgedeployedContract = spokeMessageBridgeContract.attach(spokeMessageBridge.address);
    await spokeMessageBridgedeployedContract.setHubBridge(
      l2Connector.address,
      feeDistributor.address,
      { gasLimit: 5000000 }
    )
}

module.exports.default = func;