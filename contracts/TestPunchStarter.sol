// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "./PunchStarter.sol";

contract TestPunchStarter is PunchStarter {
    uint256 time;

    constructor(
        string memory _name,
        uint256 _targetAmountEth,
        uint256 _minsToDeadline,
        address _beneficiary
    ) PunchStarter(_name, _targetAmountEth, _minsToDeadline, _beneficiary) {}

    function currentTime() internal view override returns (uint256) {
        return time;
    }

    function setTime(uint256 _time) public {
        time = _time;
    }
}
