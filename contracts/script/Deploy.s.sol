// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";
import {CampaignEscrow} from "../src/CampaignEscrow.sol";
import {SocialYieldProtocol} from "../src/SocialYieldProtocol.sol";

contract DeployContracts is Script {
    function run() external returns (CampaignEscrow, SocialYieldProtocol) {
        vm.startBroadcast();
        
        // Deploy CampaignEscrow
        CampaignEscrow escrow = new CampaignEscrow();
        
        // Deploy SocialYieldProtocol
        // Note: This contract requires initialization parameters
        // For testing, we'll use a placeholder address - replace with actual USDT token address
        address usdtTokenAddress = address(0xd077A400968890Eacc75cdc901F0356c943e4fDb); // Placeholder USDT address
        address initialOwner = msg.sender; // Use the deployer as owner
        address initialOperator = msg.sender; // Placeholder operator address
        
        SocialYieldProtocol protocol = new SocialYieldProtocol();
        protocol.initialize(usdtTokenAddress, initialOwner, initialOperator);
        
        vm.stopBroadcast();
        
        return (escrow, protocol);
    }
}
