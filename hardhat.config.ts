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
    sepolia: {
      url: 'https://rpc.sepolia.org',
      chainId:11155111,
      tags:['test'],
      accounts: [deployer]
    },
    bsc: {
      url: 'https://rpc.ankr.com/bsc',
      chainId: 56,
      accounts: [deployer]
    },
    bsctest: {
      url: 'https://bsc-testnet.publicnode.com',
      accounts: [deployer],
      tags: ['test']
    },
  },
  namedAccounts:{
    deployer: 0
  },
  etherscan:{
    apiKey: {
      bsc: process.env.BNBNET_API!,
      mainnet: process.env.MAINNET_API!,
      bsctest: process.env.BNBNET_API!,
      sepolia: 'Y3BFMKAY6K8CZGYC7Z7QSE2MBMSD7FIM5A'
    },
    customChains:[
      {
        network: 'bsc',
        chainId: 56,
        urls: {
          apiURL: 'https://api.bscscan.com/api',
          browserURL: 'https://bscscan.com'
        }
      },
      {
        network: 'bsctest',
        chainId: 97,
        urls: {
          apiURL: 'https://api-testnet.bscscan.com/api',
          browserURL: 'https://testnet.bscscan.com'
        }
      },
      {
        network: 'sepolia',
        chainId: 11155111,
        urls: {
          apiURL: 'https://api-sepolia.etherscan.io/api',
          browserURL: 'https://sepolia.etherscan.io'
        }
      }
    ]
  }
};

export default config;
