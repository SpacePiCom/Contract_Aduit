import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-deploy';
import 'dotenv/config';
import '@nomicfoundation/hardhat-chai-matchers';
let deployer = process.env.PRIVATE_KEY || '' // private key
deployer = !deployer.startsWith('0x')? `0x${deployer}`: deployer

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  mocha: {
    timeout: 100000,
    require: ["ts-node/register"],
  },
  networks: {
    mainnet: {
      url: `https://rpc.ankr.com/eth`,
      chainId: 1,
      accounts: [deployer]
    },
    bsc: {
      url: 'https://rpc.ankr.com/bsc',
      chainId: 56,
      accounts: [deployer]
    }
  },
  namedAccounts:{
    deployer: 0
  },
  etherscan:{
    apiKey: {
      bsc: '',
      mainnet: ''
    },
    customChains:[
      {
        network: 'bsc',
        chainId: 56,
        urls: {
          apiURL: 'https://api.bscscan.com/api',
          browserURL: 'https://bscscan.com'
        }
      }
    ]
  }
};

export default config;
