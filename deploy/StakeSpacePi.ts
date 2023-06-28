import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";


const func: DeployFunction = async function ({deployments:{deploy}, getNamedAccounts, run, network, ethers}: HardhatRuntimeEnvironment) {
  const {deployer} = await getNamedAccounts();
  const start = Math.floor(new Date().getTime()/ 1000)
  const end = start + 365 *86400 // 365 days by default

  const args: any[] = [
    '0x69b14e8D3CEBfDD8196Bfe530954A0C226E5008E', // token address must provide
    end
  ]
  if (network.tags.test) {
    const tokenArgs = ['TestERC20', 'TEST', ethers.utils.parseEther('10000000000000000')]
    const token = await deploy('TestERC20', {
      from: deployer,
      args: tokenArgs
    })

    console.log('TestERC20 deploy address:', token.address)
    await run('verify:verify', {
      address: token.address,
      constructorArguments: tokenArgs,
      contract: 'contracts/test/TestERC20.sol:TestERC20'
    })
    args[0] = token.address
  }
  const stake = await deploy('StakeSpacePi', {
    from: deployer,
    args
  })
  console.log('StakeSpacePi deploy address:', stake.address)
  const stakeContract = await ethers.getContractAt('StakeSpacePi', stake.address)
  if (network.tags.test) {
    await stakeContract.connect(await ethers.getSigner(deployer)).addPool('7', '600')
    await stakeContract.connect(await ethers.getSigner(deployer)).addPool('14', '86400')
  }
  await stakeContract.connect(await ethers.getSigner(deployer)).addPool('7', (30*86400).toString())
  await stakeContract.connect(await ethers.getSigner(deployer)).addPool('12', (90*86400).toString())
  await stakeContract.connect(await ethers.getSigner(deployer)).addPool('15', (180*86400).toString())
  await run('verify:verify', {
    address: stake.address,
    constructorArguments: args,
    contract: 'contracts/StakeSpacePi.sol:StakeSpacePi'
  })
}

export default func;
func.tags = ['StakeSpacePi']
