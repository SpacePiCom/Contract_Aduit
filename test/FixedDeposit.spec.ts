import chai, {expect} from 'chai'
import {MockProvider, solidity} from 'ethereum-waffle'
import {Wallet, BigNumber} from "ethers";
import {FixedDeposit, TestERC20} from "../typechain-types";
import {ethers} from "hardhat";

chai.use(solidity)

describe('FixedDeposit', function () {
  let wallets: Wallet[]
  let contract: FixedDeposit
  let token: TestERC20
  const provider = new MockProvider({
    ganacheOptions: {
      wallet: {
        totalAccounts: 200,
      },
    }
  })
  beforeEach(async () => {
    wallets = provider.getWallets()
    const tokenFactory = await ethers.getContractFactory('TestERC20', wallets[0])
    token = await tokenFactory.connect(wallets[0]).deploy('Token', 'TKN', 10000000000000) as TestERC20

    const contractFactory = await ethers.getContractFactory('FixedDeposit', wallets[0])
    const start = Math.floor(Date.now() / 1000)
    const end = start + 86400
    contract = await contractFactory.deploy(token.address,start, end)
    await token.connect(wallets[0]).setBalance(contract.address, 1000000000000)

  })
  it('should deposit', async () => {
    await token.connect(wallets[0]).approve(contract.address, 100)
    await contract.connect(wallets[0]).deposit(0,100)
    expect((await contract.userInfo(wallets[0].address,0)).amount).to.eq(100)
  })
  it('shout deposit multiple', async () => {
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    expect((await contract.userInfo(wallets[0].address,0)).amount).to.eq(10000000000000)
  })
  it('should can\'t claim', async () => {
    await expect(contract.connect(wallets[0]).claim(0)).to.reverted
  })
  it('should claim', async () =>{
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    await contract.connect(wallets[0]).deposit(0,2500000000000)
    const tx = await contract.connect(wallets[0]).claim(0)
    await tx.wait()
    expect(await token.balanceOf(wallets[0].address)).to.gt(0)
  })
  it('should withdraw', async function () {
    await contract.connect(wallets[0]).addPool(100, 3)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await contract.connect(wallets[0]).deposit(3,10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await contract.connect(wallets[0]).withdraw(3)
    expect((await contract.userInfo(wallets[0].address,3)).amount).to.eq(0)
    expect(await token.balanceOf(wallets[0].address)).to.eq(10000000000000)
  });
  // any suit
  it('should can\'t deposit after end', async () => {
    const start = Math.floor(Date.now() / 1000) - 86400
    const end = start
    const contractFactory = await ethers.getContractFactory('FixedDeposit', wallets[0])
    contract = await contractFactory.deploy(token.address,start, end)
    await token.connect(wallets[0]).setBalance(contract.address, 1000000000000)
    await token.connect(wallets[0]).approve(contract.address, 100)
    await expect(contract.connect(wallets[0]).deposit(0,100)).to.reverted
  })
  it('should claim correct', async () =>{
    await contract.connect(wallets[0]).addPool(100, 3)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await contract.connect(wallets[0]).deposit(3,10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.connect(wallets[0]).approve(contract.address, 10000000000000)

    const tx = await contract.connect(wallets[0]).claim(3)
    await tx.wait()

    const reward = BigNumber.from(10000000000000)
      .mul(100)
      .div(BigNumber.from(365*86400))
      .mul(3)
      .div(100)
    // calc approximately equal to
    expect(Math.floor(BigNumber.from(await token.balanceOf(wallets[0].address)).div(100).toNumber())).to.eq(Math.floor(reward.div(100).toNumber()))
  })
})
