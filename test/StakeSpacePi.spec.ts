import {expect} from 'chai'
import {StakeSpacePi, TestERC20} from "../typechain-types";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {time} from "@nomicfoundation/hardhat-network-helpers";


describe('StakeSpacePi', function () {
  let contract: StakeSpacePi
  let token: TestERC20
  let defaultCode: string
  let deployerAccount: SignerWithAddress
  let firstAccount: SignerWithAddress
  let secondAccount: SignerWithAddress
  let thirdAccount: SignerWithAddress
  let fourthAccount: SignerWithAddress
  let depositAmount = ethers.utils.parseEther('1')


  beforeEach(async () => {
    [deployerAccount, firstAccount, secondAccount, thirdAccount, fourthAccount] = await ethers.getSigners()
    const tokenFactory = await ethers.getContractFactory('TestERC20', deployerAccount)
    token = await tokenFactory.connect(deployerAccount).deploy('Token', 'TKN', depositAmount) as TestERC20

    const contractFactory = await ethers.getContractFactory('StakeSpacePi', deployerAccount)
    const start = await time.latest()
    const end = start + 365 * 86400
    contract = await contractFactory.deploy(token.address, end) as StakeSpacePi
    await token.setBalance(contract.address, depositAmount.mul(1e8))
    await token.setBalance(firstAccount.address, depositAmount)
    await token.setBalance(secondAccount.address, depositAmount)
    await token.setBalance(thirdAccount.address, depositAmount)
    await token.setBalance(fourthAccount.address, depositAmount)
    defaultCode = await contract.defaultCode()
    await contract.connect(firstAccount).binding(defaultCode)
    await contract.connect(deployerAccount).addPool(7, 30*86400)
  })
  it("should can't deposit before binding", async () => {
    await token.connect(secondAccount).approve(contract.address, depositAmount)
    expect(contract.connect(secondAccount).deposit(0, depositAmount)).to.be
      .revertedWith('onlyInvited:only invited')
  })
  it('should deposit', async () => {
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    await contract.connect(firstAccount).deposit(0, depositAmount)
    expect((await contract.userInfo(firstAccount.address, 0)).amount).to.eq(depositAmount)
  })
  it('shout deposit multiple', async () => {
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    expect(await contract.connect(firstAccount).deposit(0, depositAmount.div(4))).to.be.emit(contract, 'Deposit')
    expect(await contract.connect(firstAccount).deposit(0, depositAmount.div(4))).to.be.emit(contract, 'Deposit')
    expect(await contract.connect(firstAccount).deposit(0, depositAmount.div(4))).to.be.emit(contract, 'Deposit')
    expect(await contract.connect(firstAccount).deposit(0, depositAmount.div(4))).to.be.emit(contract, 'Deposit')
    expect((await contract.userInfo(firstAccount.address, 0)).amount).to.eq(depositAmount)
  })
  it('should can\'t claim', async () => {
    await expect(contract.connect(firstAccount).claim(0)).to.revertedWith('claim: interest is zero')
  })
  it('should claim', async () => {
    await token.connect(firstAccount).approve(contract.address, depositAmount)

    await contract.connect(firstAccount).deposit(0, depositAmount)
    // after 1 days claim
    await time.increase(86400)

    expect(contract.connect(firstAccount).claim(0)).to.be.emit(contract, 'Reward')
  })
  it('should withdraw', async function () {
    // approve
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    // deposit
    await contract.connect(firstAccount).deposit(0, depositAmount)
    // increase to end time(30 days)
    await time.increase(30 * 86400)
    // withdraw emit Withdraw event with args
    expect(await contract.connect(firstAccount).withdraw(0)).to.be
      .emit(contract, 'Withdraw')
      .withArgs(firstAccount.address, 0, depositAmount)
    expect((await contract.userInfo(firstAccount.address, 0)).amount).to.eq(0)
    expect(await token.balanceOf(firstAccount.address)).to.gte(depositAmount)
  });
  // any suit
  it('should can\'t deposit after end', async () => {
    await time.increase(366 * 86400)
    await expect(contract.connect(firstAccount).deposit(0, 100)).to.revertedWith('not in time')
  })
  it('should claim correct', async () => {
    const pool1 = await contract.pools(0)
    await token.connect(firstAccount).approve(contract.address, depositAmount)

    await contract.connect(firstAccount).deposit(0, depositAmount)
    await time.increase(30 * 86400)

    const tx = await contract.connect(firstAccount).claim(0)
    await tx.wait()
    const afterClaim = await token.balanceOf(firstAccount.address)
    const reward = depositAmount
      .mul(pool1.apr)
      .mul(30 * 86400)
      .mul(9)
      .div(10)
      .div(365 * 86400)
      .div(100)
    console.log('reward', reward)
    console.log('afterClaim', afterClaim)
    // calc approximately equal to
    expect(Math.floor(reward.div(100).toNumber())).to.eq(Math.floor(afterClaim.div(100).toNumber()))
  })
  it("10% referral test", async function () {
// await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.connect(secondAccount).approve(contract.address, depositAmount);
    // Use default code to invite himselfs
// Get initial account code
    const firstCode = await contract.connect(firstAccount).getInviteCode();
// Uses for inviting his alternate account
    await contract.connect(secondAccount).binding(firstCode);
// alternate parent is equal to initial account
// Whenever alternate claim rewards, 10% will go to initial account
    await contract.connect(secondAccount).deposit(0, depositAmount);
// According to the logic of the contract if every block genarating in 3 seconds
// In total (30 * 86400) / 3 = 864000 block will be created
// We are manipulating the block.number variable and simulating the 30 days later
    await time.increase(30 * 86400)
// Check Balances Before Claim
    const BeforeFirstBalance = await token.connect(firstAccount).balanceOf(firstAccount.address);
    const BeforeSecondBalance = await token.connect(secondAccount).balanceOf(secondAccount.address);
    const pending = await contract.pending(0, secondAccount.address);
    console.log(`Pending Balance: ${pending}`);
// Calculation is not preciese enough pending returned 8219178082080000
// Returned value Should be 8219178082191780
// Calculation is not preciese because solidity can't see the floating numbers.
// For the preciese calculation we can add 1e18 to the left side of the perBlock calculation
// Then before we return the pending
// value we can divide to 1e18 and we can reach the preciese value 8219178082191780
    await contract.connect(secondAccount).claim(0);
//Calculate Balances
    const InviteRewardRate = await contract.inviteRewardRate();
    const AfterInitialShouldBe = ((pending.mul(InviteRewardRate)).div(100)).add(BeforeFirstBalance);
    const AfterAlternateShouldBe =
      (pending.sub(pending.mul(InviteRewardRate).div(100))).add(BeforeSecondBalance);
    //Check Balances After Claim
    const AfterInitialBalance = await token.connect(firstAccount).balanceOf(firstAccount.address);
    const AfteralternateBalance = await token.connect(secondAccount).balanceOf(secondAccount.address);
    console.log(`Initial After should be : ${AfterInitialShouldBe}`);
    console.log(`Alternate After should be : ${AfterAlternateShouldBe}`);
    console.log(`Initial Account Balance Before Claim: ${BeforeFirstBalance}`);
    console.log(`Initial Account Balance After  Claim: ${AfterInitialBalance}`);
    console.log(`Alternate Account Balance Before Claim: ${BeforeSecondBalance}`);  // 0
    console.log(`Alternate Account Balance After  Claim: ${AfteralternateBalance}`); // 171232876710
    expect(AfterInitialBalance).to.eq(AfterInitialShouldBe);
    expect(AfteralternateBalance).to.eq(AfterAlternateShouldBe);
  });
  it("Multi user deposit test", async function () {
// await token.connect(wallets[0]).approve(contract.address, 10000000000000)
    await token.setBalance(firstAccount.address, depositAmount.mul(2));
    await token.connect(firstAccount).approve(contract.address, depositAmount.mul(2));
    await token.connect(secondAccount).approve(contract.address, depositAmount);
    await token.connect(thirdAccount).approve(contract.address, depositAmount);
    // make all account binding default code
    await contract.connect(secondAccount).binding(defaultCode);
    await contract.connect(thirdAccount).binding(defaultCode);

    const initialsecondBalance = await token.balanceOf(secondAccount.address);
    const initialfirstBalance = await token.balanceOf(firstAccount.address);
    const initialThirdBalance = await token.balanceOf(thirdAccount.address);
    await contract.connect(firstAccount).deposit(0, depositAmount);
    await contract.connect(secondAccount).deposit(0, depositAmount);

// Simulating the 1 day later
    await time.increase( 86400)

    await contract.connect(firstAccount).deposit(0, depositAmount);
    await contract.connect(thirdAccount).deposit(0, depositAmount);
    // Simulating the 30 days later
    await time.increase(30 * 86400);

    const pending = await contract.pending(0, firstAccount.address);
    console.log(`Pending Balance: ${pending}`);
    // Withdraw all the deposits of three accounts
    await contract.connect(firstAccount).withdraw(0);
    await contract.connect(secondAccount).withdraw(0);
    await contract.connect(thirdAccount).withdraw(0);
    //Check Balances After Claim & Deposit
    const afterfirstBalance = await token.balanceOf(firstAccount.address);
    const aftersecondBalance = await token.balanceOf(secondAccount.address);
    const afterThirdBalance = await token.balanceOf(thirdAccount.address);
    console.log('initialfirstBalance;', initialfirstBalance, 'initialsecondBalance:', initialsecondBalance,
      'initialThirdBalance;', initialThirdBalance)
    console.log('..........................')
    console.log('afterfirstBalance;', afterfirstBalance, 'aftersecondBalance:', aftersecondBalance,
      'afterThirdBalance;', afterThirdBalance)
    // Since first account deposited 2 times of depositAmount and the other two account deposited
// 1 depositAmount seperataly, we expect first account's profit to be equal to the sum of the
// other two accounts' profits (second and third account)
//     const profitFirst= Number(afterfirstBalance)- Number(initialfirstBalance)
    const profitFirst = afterfirstBalance.sub(initialfirstBalance)
    console.log(profitFirst)
    // const profitsecondAndThird = Number(aftersecondBalance)- Number(BeforesecondBalance) +
    //   Number(afterThirdBalance)- Number(initialThirdBalance)
    const second = aftersecondBalance.sub(initialsecondBalance)
    const third = afterThirdBalance.sub(initialThirdBalance)
    const profitsecondAndThird = second.add(third)
    expect(profitFirst).to.be.lte(profitsecondAndThird)
  })
  it('should not deposit zero', async function (){
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    expect(contract.deposit(0,0)).to.be.revertedWith('deposit: amount must > 0')
  })
  it('Should not be unlimited', async function (){
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    await contract.connect(firstAccount).deposit(0, depositAmount)
    await time.increase(30*86400)
    await contract.connect(firstAccount).claim(0)
    expect(contract.connect(firstAccount).claim(0)).to.be.revertedWith('claim: interest is zero')
  })
  it('It should not be possible to deposit when it is not within the project time', async function (){
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    const end = await contract.endsTime()
    await time.increaseTo(end.add(60))

    expect(contract.deposit(0,depositAmount)).to.be.revertedWith('not in time')
  })

  it('should not withdraw amount is zero', async function () {
    await token.connect(firstAccount).approve(contract.address, depositAmount.mul(2))

    await contract.connect(firstAccount).deposit(0, depositAmount)
    await time.increase(30*86400)
    await contract.connect(firstAccount).withdraw(0)
    expect(await contract.connect(firstAccount).withdraw(0)).to.be.revertedWith('withdraw: Principal is zero')
  })
  it('Event emit correct test', async function () {
    await token.connect(firstAccount).approve(contract.address, depositAmount)
    expect(contract.connect(firstAccount).deposit(0,depositAmount)).to.be.emit(contract,'Deposit')
    await time.increase(30*86400)
    expect(contract.connect(firstAccount).claim(0)).to.be.emit(contract,'Reward').emit(contract,'InviterReward')
    expect(contract.connect(firstAccount).withdraw(0)).to.be.emit(contract,'Withdraw')

    expect(contract.connect(deployerAccount).setPool(0, 50,1)).to.be.emit(contract,'SetPool')
    expect(contract.connect(deployerAccount).addPool(60, 1000)).to.be.emit(contract,'AddPool')
  })
})
