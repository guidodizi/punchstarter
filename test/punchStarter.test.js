const PunchStarter = artifacts.require("TestPunchStarter");

contract("PunchStarter", (accounts) => {
  const ERROR_MSG = "VM Exception while processing transaction: revert";
  const ONE_ETH = 1000000000000000000;

  const STATE_ONGOING = 0;
  const STATE_FAILED = 1;
  const STATE_SUCCEEDED = 2;
  const STATE_PAIDOUT = 3;

  const _NAME = "Amazing idea";
  const _TARGET_AMOUNT_ETH = 1;
  const _MINS_TO_DEADLINE = 10;
  const _BENEFICIARY = accounts[1];
  const _CREATOR = accounts[0];

  let contract;

  beforeEach(async () => {
    contract = await PunchStarter.new(
      _NAME,
      _TARGET_AMOUNT_ETH,
      _MINS_TO_DEADLINE,
      _BENEFICIARY,
      {
        from: _CREATOR,
        gas: 2000000,
      }
    );
  });

  it("contract is initialized", async () => {
    const [name, targetAmount, fundingDeadline, beneficiary, state] =
      await Promise.all([
        contract.name.call(),
        contract.targetAmount.call(),
        contract.fundingDeadline.call(),
        contract.beneficiary.call(),
        contract.state.call(),
      ]);

    expect(name).to.equal(_NAME);
    expect(Number(targetAmount)).to.equal(_TARGET_AMOUNT_ETH * ONE_ETH);
    expect(Number(fundingDeadline)).to.equal(600); // Default time is 0, thus funding deadline is plainly 10 mins
    expect(beneficiary).to.equal(_BENEFICIARY);
    expect(Number(state)).to.equal(STATE_ONGOING);
  });

  it("funds can be contributed", async () => {
    await contract.contribute({ value: ONE_ETH, from: _CREATOR });

    const [contributed, amountCollected] = await Promise.all([
      contract.contributions.call(_CREATOR),
      contract.amountCollected.call(),
    ]);

    expect(Number(contributed)).to.equal(ONE_ETH);
    expect(Number(amountCollected)).to.equal(ONE_ETH);
  });

  it("cannot contribute funds after deadline", async () => {
    await contract.setTime(601);

    try {
      await contract.contribute({ value: ONE_ETH, from: _CREATOR });
      expect.fail();
    } catch (err) {
      expect(err.message).to.contain(ERROR_MSG);
    }
  });

  it("campaign succeded", async () => {
    await contract.contribute({ value: ONE_ETH, from: _CREATOR });
    await contract.setTime(601);
    await contract.endCampaign();

    const state = await contract.state.call();
    expect(Number(state)).to.equal(STATE_SUCCEEDED);
  });

  it("campaign failed", async () => {
    await contract.setTime(601);
    await contract.endCampaign();

    const state = await contract.state.call();
    expect(Number(state)).to.equal(STATE_FAILED);
  });

  it("collect funds", async () => {
    await contract.contribute({ value: ONE_ETH, from: _CREATOR });
    await contract.setTime(601);
    await contract.endCampaign();

    const initalFunds = await web3.eth.getBalance(_BENEFICIARY);
    await contract.collect();

    const newFunds = await web3.eth.getBalance(_BENEFICIARY);
    expect(newFunds - initalFunds).to.equal(ONE_ETH);

    const state = await contract.state.call();
    expect(Number(state)).to.equal(STATE_PAIDOUT);
  });

  it("withdraw funds", async () => {
    const contribution = ONE_ETH - 100;

    await contract.contribute({ value: contribution, from: _CREATOR });
    await contract.setTime(601);
    await contract.endCampaign();
    const state = await contract.state.call();
    expect(Number(state)).to.equal(STATE_FAILED);

    const initalFunds = await web3.eth.getBalance(_CREATOR);
    await contract.withdraw({ from: _CREATOR });

    const newFunds = await web3.eth.getBalance(_CREATOR);
    expect(Number(newFunds)).to.be.greaterThan(Number(initalFunds));

    const withdrawedAmount = await contract.contributions.call(_CREATOR);
    expect(Number(withdrawedAmount)).to.equal(0);
  });

  it("campaign failed", async () => {
    await contract.setTime(601);
    await contract.endCampaign();

    const [event] = await contract.getPastEvents("CampaignFinished");

    expect(Number(event.returnValues.amountCollected)).to.equal(0);
    expect(event.returnValues.succeeded).to.equal(false);
  });
});
