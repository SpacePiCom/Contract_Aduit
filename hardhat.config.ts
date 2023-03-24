import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  mocha: {
    timeout: 100000,
    require: ["ts-node/register"],
  }
};

export default config;
