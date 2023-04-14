import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function ({deployments:{deploy}, getNamedAccounts, run}: HardhatRuntimeEnvironment) {
  // code here
  const {deployer} = await getNamedAccounts();
  const start = Math.floor(new Date().getTime()/1000)
  const end = start + 365 *86400 // 365 days default
  const args: any[] = [
    end,
    '', // nft token address
    10000 // presale total
  ]
  const presale = await deploy('ERC721Distributor', {
    from: deployer,
    args
  })
  console.log('ERC721Distributor deploy address:', presale.address)
  await run('verify:verify', {
    address: presale.address,
    constructorArguments: args,
    contract: 'contracts/ERC721Distributor.sol:ERC721Distributor'
  })
};
export default func;
func.tags = ['ERC721Distributor']
