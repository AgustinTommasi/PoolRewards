const PoolRewards = artifacts.require("PoolRewards");
const { assert } = require("chai");

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  poolRewards = await PoolRewards.deployed();
});

contract("PoolRewards", async (accounts) => {
  it("Deploy contract", async () => {
    assert.ok(true);
  });

  // A deposits 100, and B deposits 300 for a total of 400 in the pool.
  // Now A has 25% of the pool and B has 75%. When T deposits 200 rewards,
  // A should be able to withdraw 150 and B 450.

  it("A Investment", async () => {
    const initialBalance = await web3.eth.getBalance(accounts[1]);

    // 1 Deposit of 100 ether (total 1 - 100 ether)
    _amountA = web3.utils.toWei("100", "ether");
    await poolRewards.invest({
      from: accounts[1],
      value: _amountA,
    });
    let investment = await poolRewards.investments(0);

    assert.equal(investment.owner, accounts[1], "Correct Account");
    assert.equal(investment.amount, _amountA, "Correct Amount");

    const finalBalance = await web3.eth.getBalance(accounts[1]);

    assert.isAbove(
      parseInt(initialBalance),
      parseInt(finalBalance) + parseInt(_amountA),
      "Correctly Discounted from Wallet"
    );
  });

  it("B Investment", async () => {
    // 5 Deposits of 300 ether (total 6 - 400 gwei)
    _amountB = web3.utils.toWei("300", "ether");
    _value = _amountB / 5;
    for (let index = 0; index < 5; index++) {
      await poolRewards.invest({
        from: accounts[2],
        value: _value,
      });
    }
  });

  it("Round 0: Supply & Rewards", async () => {
    let round = await poolRewards.rounds(0);

    assert.equal(round.rewards, 0, "Correct Initial Rewards");
    assert.equal(
      round.totalSupply,
      parseInt(_amountA) + parseInt(_amountB),
      "Correct Amount"
    );
  });

  it("Can't Send Rewards", async () => {
    try {
      await poolRewards.depositRewards({
        from: accounts[1],
        value: 1,
      });
      assert.fail("The transaction should have thrown an error");
    } catch (err) {
      assert.include(
        err.message,
        "revert",
        "The error message should contain 'revert'"
      );
    }
  });

  it("Send 2 Rewards", async () => {
    _amountT = web3.utils.toWei("200", "ether");
    _value = _amountT / 2;
    for (let index = 0; index < 2; index++) {
      await poolRewards.depositRewards({
        from: accounts[0],
        value: _value,
      });
      let round = await poolRewards.rounds(index);

      assert.equal(round.rewards, _value, "Correct Rewards");
    }
  });

  it("Round 2: Supply & Rewards", async () => {
    let round = await poolRewards.rounds(2);

    assert.equal(round.rewards, 0, "Correct Initial Rewards");
    assert.equal(
      round.totalSupply,
      parseInt(_amountA) + parseInt(_amountB) + parseInt(_amountT),
      "Correct Amount"
    );
  });

  it("A Withdraw", async () => {
    const initialBalance = await web3.eth.getBalance(accounts[1]);

    let round = await poolRewards.rounds(0);
    await poolRewards.withdraw({ from: accounts[1] });

    const finalBalance = await web3.eth.getBalance(accounts[1]);

    assert.isAbove(
      parseInt(initialBalance) +
        parseInt(_amountA) +
        (parseInt(_amountT) * parseInt(_amountA)) / parseInt(round.totalSupply),
      parseInt(finalBalance),
      "Correctly Reward Recived from Wallet"
    );
  });

  it("B Withdraw", async () => {
    const initialBalance = await web3.eth.getBalance(accounts[2]);

    let round = await poolRewards.rounds(0);
    await poolRewards.withdraw({ from: accounts[2] });

    const finalBalance = await web3.eth.getBalance(accounts[2]);

    assert.isAbove(
      parseInt(initialBalance) +
        parseInt(_amountB) +
        (parseInt(_amountT) * parseInt(_amountB)) / parseInt(round.totalSupply),
      parseInt(finalBalance),
      "Correctly Reward Recived from Wallet"
    );
  });

  // What if the following happens? A deposits then T deposits then B deposits then A withdraws and finally B withdraws.
  // A should get their deposit + all the rewards.
  // B should only get their deposit because rewards were sent to the pool before they participated.

  it("B send after Round", async () => {
    const initialBalance = await web3.eth.getBalance(accounts[2]);

    _amountT = web3.utils.toWei("200", "ether");
    await poolRewards.depositRewards({
      from: accounts[0],
      value: _amountT,
    });

    _amountB = web3.utils.toWei("300", "ether");
    await poolRewards.invest({
      from: accounts[2],
      value: _amountB,
    });

    await poolRewards.withdraw({ from: accounts[2] });

    const finalBalance = await web3.eth.getBalance(accounts[2]);

    assert.isAbove(
      parseInt(initialBalance),
      parseInt(finalBalance),
      "Correctly Reward Recived from Wallet"
    );
  });
});
