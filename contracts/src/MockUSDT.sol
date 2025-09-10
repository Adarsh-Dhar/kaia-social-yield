// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StablecoinToken
 * @author Your Name
 * @notice A simple ERC20 token to simulate USDC on a local testnet.
 * The owner can mint tokens to any address.
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private _decimals;

    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {
        _decimals = 6; // USDT has 6 decimals
    }

    /**
     * @notice Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Creates `amount` tokens and assigns them to `account`.
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}
