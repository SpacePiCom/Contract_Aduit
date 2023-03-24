import chai, { expect } from 'chai'
import { keccak256,defaultAbiCoder } from 'ethers/lib/utils'
import { MockProvider, solidity } from 'ethereum-waffle'
import {Relationship} from "../typechain-types";
import {ethers} from "hardhat";

import {ContractReceipt} from "@ethersproject/contracts";
const contractName = 'Relationship'
chai.use(solidity)
describe(contractName, function () {
  const provider = new MockProvider({
    ganacheOptions: {
      wallet: {
        totalAccounts: 200,
      },
    }
  })

  const accounts = provider.getWallets()
  let contract: Relationship
  let defaultCode: string

  beforeEach(async () => {
    const start = Math.floor(new Date().getTime() / 1000)
    const end = Math.floor((new Date().getTime() / 1000) + 86400)
    const RelationFactory = await ethers.getContractFactory(contractName)
    contract = await RelationFactory.connect(accounts[0]).deploy(start, end) as Relationship
  })

  describe('flow', function () {
    let tx: ContractReceipt
    let inviteCode: string
    it('defaultCode', async function () {
      defaultCode = await contract.defaultCode()
    })
    it('binding', async function () {
      const bindingTx = await contract.connect(accounts[1]).binding(defaultCode)
      tx = await bindingTx.wait()
      it('verify invite code', async function () {
        inviteCode = await contract.getInviteCode(accounts[0].address)
        const code = keccak256(
          defaultAbiCoder.encode(['address', 'uint256'], [accounts[0].address, tx.blockNumber])
        )
        expect(inviteCode).to.equal(code.slice(0, 14))
      })
      it('isInvited', async function () {
        const isInvited = await contract.isInvited(accounts[0].address)
        expect(isInvited).to.be.true
      })
      it('getParent', async function () {
        const parent = await contract.getParent(accounts[0].address)
        expect(parent).to.equal(accounts[1].address)
      })
      it('getInviteeList', async function () {
        const list = await contract.getInviteeList(accounts[1].address)
        expect(list[0].invitee).to.equal(accounts[0].address)
      })
    })
  })

  describe('verify', function () {
    let defaultCode: string
    it('defaultCode', async function () {
      defaultCode = await contract.defaultCode()
    })
    it('binding with self', async function () {
      await expect( contract.connect(accounts[0]).binding(defaultCode)).to.be.reverted
    })

    it('invitee limit', async function () {
      for (let i = 1; i < accounts.length; i++) {
        const bindingTx = await contract.connect(accounts[i]).binding(defaultCode)
        await bindingTx.wait()
      }
      const list = await contract.getInviteeList(accounts[0].address)
      expect(list.length).to.equal(accounts.length - 1)
    })
  })
})
