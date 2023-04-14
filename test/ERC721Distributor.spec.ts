import chai, {expect} from 'chai'
import {MockProvider, solidity} from 'ethereum-waffle'
import {ERC721Distributor, TestERC20, TestERC721} from "../typechain-types";

import {ethers} from "hardhat";

const contractName = 'ERC721Distributor'
chai.use(solidity)

describe(contractName, function () {
    let distributorContract: ERC721Distributor;
    let nftContract: TestERC721;
    let coin: TestERC20;
    let defaultCode: string;
    const provider = new MockProvider({
      ganacheOptions: {
        wallet: {
          totalAccounts: 4,
        },
      }
    })
    const accounts = provider.getWallets()
    beforeEach(async () => {
      const start = Math.floor(new Date().getTime() / 1000)
      const end = start + 365 * 86400 // 365 days by default
      const coinFactory = await ethers.getContractFactory('TestERC20')
      coin = await coinFactory.connect(accounts[0]).deploy('TestERC20', 'TEST', 1000)
      const nftFactory = await ethers.getContractFactory('TestERC721')
      nftContract = await nftFactory.connect(accounts[0]).deploy('TestERC721', 'TEST', 'ipfs://example')
      const distributor = await ethers.getContractFactory('ERC721Distributor')
      distributorContract = await distributor.connect(accounts[0]).deploy(end, nftContract.address, '1000')
      // setup cashier
      await distributorContract.connect(accounts[0]).setCashier(accounts[0].address)
      // setup support coin
      await distributorContract.connect(accounts[0]).setPrice(coin.address, 1000)
      // nft add minter role
      await nftContract.connect(accounts[0]).addMiner(distributorContract.address)
      defaultCode = await distributorContract.defaultCode()

    })

  describe('claim 1 with isBlack === false', function () {
    const isBlack = false;
    const quantity = 1;
    beforeEach(async function () {
      await coin.connect(accounts[1]).setBalance(accounts[1].address, 1000)
      await coin.connect(accounts[1]).approve(distributorContract.address, 1000)
      await distributorContract.connect(accounts[1]).binding(defaultCode)
      await distributorContract.connect(accounts[1]).claim(coin.address, quantity, isBlack)
    })
    it('not inviter', async function () {
      expect(distributorContract.connect(accounts[2]).claim(coin.address, quantity, isBlack)).to.be.revertedWith('not invited')
    })
    it('with invite', async function () {
      const balance = await nftContract.balanceOf(accounts[1].address)
      expect(balance).to.equal(1)
    })
    it('cashier balance right', async function () {
      const balance = await coin.balanceOf(accounts[0].address)
      expect(balance.toNumber()).to.equal(2000)
    })
  })
  const quantities = [1, 3, 15, 20, 25]
  for (const quantity of quantities) {
    describe(`claim ${quantity} with isBlack === true`, function () {
      const isBlack = true;
      beforeEach(async function () {
        await coin.connect(accounts[1]).setBalance(accounts[1].address, quantity*1000)
        await coin.connect(accounts[1]).approve(distributorContract.address, quantity*1000)
        await distributorContract.connect(accounts[1]).binding(defaultCode)
        await distributorContract.connect(accounts[1]).claim(coin.address, quantity, isBlack)
      })
      it('not inviter', async function () {
        expect(distributorContract.connect(accounts[2]).claim(coin.address, quantity, isBlack)).to.be.revertedWith('not invited')
      })
      it('with invite', async function () {
        const balance = await nftContract.balanceOf(accounts[1].address)
        expect(balance).to.equal(quantity)
      })
      it('cashier balance right', async function () {
        const balance = await coin.balanceOf(accounts[0].address)
        expect(balance.toNumber()).to.equal(1000+(quantity*1000)*0.1)
      })
    })
    describe(`claim ${quantity} with isBlack === false`, function () {
      const isBlack = false;
      beforeEach(async function () {
        await coin.connect(accounts[1]).setBalance(accounts[1].address, quantity*1000)
        await coin.connect(accounts[1]).approve(distributorContract.address, quantity*3000)
        await distributorContract.connect(accounts[1]).binding(defaultCode)
        await distributorContract.connect(accounts[1]).claim(coin.address, quantity, isBlack)
      })
      it('not inviter', async function () {
        expect(distributorContract.connect(accounts[2]).claim(coin.address, quantity, isBlack)).to.be.revertedWith('not invited')
      })
      it('with invite', async function () {
        const balance = await nftContract.balanceOf(accounts[1].address)
        expect(balance).to.equal(quantity)
      })
      it('cashier balance right', async function () {
        const balance = await coin.balanceOf(accounts[0].address)
        expect(balance.toNumber()).to.equal(1000+quantity*1000)
      })
    })
  }
  }
)
