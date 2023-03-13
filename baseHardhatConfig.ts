import path from 'path'
import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'solidity-coverage'
import "hardhat-deploy"

dotenv.config({
  path: path.join(__dirname, '.env'),
})

const accounts = ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 500000,
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 500000,
          },
        },
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 500000,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "repeat repeat repeat repeat repeat repeat repeat repeat repeat repeat repeat repeat repeat repeat repeat", 
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    }
  },
  // etherscan: {
  //   apiKey: {
  //     //mainnet: process.env.ETHERSCAN_API_KEY || '',
  //     // arbitrum: process.env.ARBITRUM_API_KEY || '',
  //     // gnosis: process.env.GNOSIS_API_KEY || '',
  //     //goerli: process.env.ETHERSCAN_API_KEY || '',
  //     //optimisticGoerli: process.env.OPTIMISM_API_KEY || '',
  //   },
  // },
}

export default config
