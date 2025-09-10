// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";
import {CampaignEscrow} from "../src/CampaignEscrow.sol";
import {SocialYieldProtocol} from "../src/SocialYieldProtocol.sol";
import {StablecoinToken} from "../src/StablecoinToken.sol";

contract DeployContracts is Script {
    function run() external returns (CampaignEscrow, SocialYieldProtocol, StablecoinToken) {
        vm.startBroadcast();
        
        // Deploy CampaignEscrow
        CampaignEscrow escrow = new CampaignEscrow();
        
        // Deploy StablecoinToken (USDC-like with 6 decimals)
        StablecoinToken usdc = new StablecoinToken();

        // Mint initial supply to deployer
        // Example: 1,000,000 USDC (6 decimals)
        uint256 initialSupply = 1_000_000 * (10 ** usdc.decimals());
        usdc.mint(msg.sender, initialSupply);

        // Transfer 100 USDC to the specified address
        address recipient = 0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D;
        uint256 transferAmount = 100 * (10 ** usdc.decimals());
        usdc.transfer(recipient, transferAmount);

        // Deploy SocialYieldProtocol initialized with the USDC token
        address initialOwner = msg.sender;
        address initialOperator = msg.sender;
        
        SocialYieldProtocol protocol = new SocialYieldProtocol();
        protocol.initialize(address(usdc), initialOwner, initialOperator);
        
        vm.stopBroadcast();
        
        return (escrow, protocol, usdc);
    }
}
