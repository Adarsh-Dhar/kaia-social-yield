// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/kaia-contracts/contracts/KIP/token/KIP7/KIP7.sol";
import "../lib/kaia-contracts/contracts/access/Ownable.sol";

// USDC-like stablecoin for local testing (6 decimals)
contract StablecoinToken is KIP7, Ownable {
    uint8 private constant _DECIMALS = 6;

    constructor() KIP7("Stablecoin USD", "USDC") {}

    function decimals() public view virtual override returns (uint8) {
        return _DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
