import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";


const func: DeployFunction = async function ({deployments:{deploy}, getNamedAccounts, run}: HardhatRuntimeEnvironment) {
  const {deployer} = await getNamedAccounts();
  const start = Math.floor(new Date().getTime()/ 1000)
  const end = start + 365 *86400 // 365 days by default

  const args: any[] = [
    '0x69b14e8D3CEBfDD8196Bfe530954A0C226E5008E', // token address must provide
    start,
    end
  ]
  const stake = await deploy('StakeSpacePi', {
    from: deployer,
    args
  })
  console.log('StakeSpacePi deploy address:', stake.address)
  await run('verify:verify', {
    address: stake.address,
    constructorArguments: args,
    contract: 'contracts/StakeSpacePi.sol:StakeSpacePi'
  })
}

export default func;
func.tags = ['StakeSpacePi']
