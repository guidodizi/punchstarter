// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

library Utils {
    function etherToWei(uint256 eth) public pure returns (uint256) {
        return eth * 1 ether;
    }

    function minutesToSeconds(uint256 mins) public pure returns (uint256) {
        return mins * 1 minutes;
    }
}
