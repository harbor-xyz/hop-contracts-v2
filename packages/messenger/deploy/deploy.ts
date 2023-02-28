import { Contract, Signer} from 'ethers'
import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import logContractDeployed from '../logContractDeployed'
import getSigners from '../getSigners'
const { parseUnits } = ethers.utils
import { Wallet } from "ethers";
import { contracts, deployConfig } from '../config'
import { ONE_WEEK } from '../constants'
const { externalContracts } = contracts.testnet

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  console.log('Deploying contracts...')
  console.log(deployments)
  let _deployer: any;
  ({ deployer: _deployer } = await hre.ethers.getNamedSigners());
  const deployer = _deployer as Wallet;
  const deplyerName = (await deployer.provider.getNetwork()).name
  console.log("deployer: ", deplyerName);
  const HubMessageBridge = await ethers.getContractFactory('HubMessageBridge')
  const SpokeMessageBridge = await ethers.getContractFactory(
    'SpokeMessageBridge'
  )

  const hubSigner = deployer;
  const spokeSigners = [deployer];
  
  // const hubName = (await hubSigner.provider.getNetwork()).name
  // console.log("hubSigner name: ", hubName);

  const hubMessageBridge = await HubMessageBridge.connect(hubSigner).deploy()

  await logContractDeployed('HubMessageBridge', hubMessageBridge)
  // await tenderly.persistArtifacts({
  //   name: 'HubMessageBridge',
  //   address: hubMessageBridge.address,
  //   network: hubName,
  // })

  const spokeMessageBridges = []
  for (let i = 0; i < spokeSigners.length; i++) {
    const spokeSigner = spokeSigners[i]
    const spokeName = (await spokeSigner.provider.getNetwork()).name
    const hubChainId = await hubSigner.getChainId()
    const spokeChainId = await spokeSigner.getChainId()
    const spokeMessageBridge = await SpokeMessageBridge.connect(
      spokeSigner
    ).deploy(hubChainId, [
      {
        chainId: hubChainId,
        messageFee: deployConfig.messageFee,
        maxBundleMessages: deployConfig.maxBundleMessages,
      },
    ])

    await logContractDeployed('SpokeMessageBridge', spokeMessageBridge)

    const FeeDistributor = await ethers.getContractFactory('ETHFeeDistributor')

    const feeDistributor = await FeeDistributor.connect(hubSigner).deploy(
      hubMessageBridge.address,
      deployConfig.treasury,
      deployConfig.publicGoods,
      deployConfig.minPublicGoodsBps,
      deployConfig.fullPoolSize,
      deployConfig.maxBundleFee,
      deployConfig.maxBundleFeeBps
    )

    await logContractDeployed('FeeDistributor', feeDistributor)

    spokeMessageBridges.push(spokeMessageBridge)

    const { l1Connector, l2Connector } = await deployConnectors(
      hubMessageBridge.address,
      spokeMessageBridge.address,
      hubSigner,
      spokeSigner
    )

    console.log('Connecting bridges...')
    await hubMessageBridge.setSpokeBridge(
      spokeChainId,
      l1Connector.address,
      ONE_WEEK,
      feeDistributor.address
    )

    await spokeMessageBridge.setHubBridge(
      l2Connector.address,
      feeDistributor.address,
      { gasLimit: 5000000 }
    )
    console.log('Hub and Spoke bridge connected')
  }
}

async function deployConnectors(
  l1Target: string,
  l2Target: string,
  l1Signer: Signer,
  l2Signer: Signer
) {
  console.log('Deploying connectors...')
  const L1OptimismConnector = await ethers.getContractFactory(
    'L1OptimismConnector'
  )
  const L2OptimismConnector = await ethers.getContractFactory(
    'L2OptimismConnector'
  )

  const l1Connector = await L1OptimismConnector.connect(l1Signer).deploy(
    l1Target,
    externalContracts.optimism.l1CrossDomainMessenger,
    { gasLimit: 5000000 }
  )

  await logContractDeployed('L1Connector', l1Connector)

  const l2Connector = await L2OptimismConnector.connect(l2Signer).deploy(
    l2Target,
    externalContracts.optimism.l2CrossDomainMessenger,
    { gasLimit: 5000000 }
  )

  await logContractDeployed('L2Connector', l2Connector)

  console.log('Connecting L1Connector and L2Connector...')
  await l1Connector
    .connect(l1Signer)
    .setCounterpart(l2Connector.address, { gasLimit: 5000000 })
  await l2Connector
    .connect(l2Signer)
    .setCounterpart(l1Connector.address, { gasLimit: 5000000 })

  console.log('L1Connector and L2Connector connected')

  return {
    l1Connector,
    l2Connector,
  }
}

module.exports.default = func;