// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./Utils.sol";

contract PunchStarter {
    using Utils for *;

    enum State {
        OnGoing,
        Failed,
        Succeeded,
        PaidOut
    }

    event CampaignFinished(
        address addr,
        uint256 amountCollected,
        bool succeeded
    );

    string public name;
    uint256 public targetAmount;
    uint256 public fundingDeadline;
    address payable public beneficiary;
    State public state;

    mapping(address => uint256) public contributions;
    bool public achieved;
    uint256 public amountCollected;

    modifier inState(State expectedState) {
        require(state == expectedState, "Invalid state");
        _;
    }

    constructor(
        string memory _name,
        uint256 _targetAmountEth,
        uint256 _minsToDeadline,
        address _beneficiary
    ) {
        name = _name;
        targetAmount = Utils.etherToWei(_targetAmountEth);
        beneficiary = payable(_beneficiary);
        fundingDeadline =
            currentTime() +
            Utils.minutesToSeconds(_minsToDeadline);
        state = State.OnGoing;
    }

    function contribute() public payable inState(State.OnGoing) {
        require(beforeDeadline(), "Crowdfunding campaign has finished");

        contributions[msg.sender] += msg.value;
        amountCollected += msg.value;

        if (amountCollected >= targetAmount) {
            achieved = true;
        }
    }

    function endCampaign() public inState(State.OnGoing) {
        require(!beforeDeadline(), "Cannot end campaign before deadline");

        if (!achieved) {
            state = State.Failed;
        } else {
            state = State.Succeeded;
        }

        emit CampaignFinished(address(this), amountCollected, achieved);
    }

    function collect() public inState(State.Succeeded) {
        if (beneficiary.send(amountCollected)) {
            state = State.PaidOut;
        } else {
            state = State.Failed;
        }
    }

    function withdraw() public inState(State.Failed) {
        require(
            contributions[msg.sender] > 0,
            "User didn't participate on campaign"
        );

        uint256 contributed = contributions[msg.sender];
        contributions[msg.sender] = 0;

        if (!payable(msg.sender).send(contributed)) {
            contributions[msg.sender] = contributed;
        }
    }

    function beforeDeadline() public view returns (bool) {
        return currentTime() < fundingDeadline;
    }

    function currentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
