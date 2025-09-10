// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";
import {CampaignManager} from "../src/CampaignManager.sol";
import {CouponNFT} from "../src/CouponNFT.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract DeployContracts is Script {
    function run() external returns (CampaignManager, CouponNFT, MockUSDT) {
        vm.startBroadcast();
        
        // Deploy MockUSDT (USDT-like with 6 decimals)
        MockUSDT usdt = new MockUSDT();

        // Mint initial supply to deployer
        // Example: 1,000,000 USDT (6 decimals)
        uint256 initialSupply = 1_000_000 * (10 ** usdt.decimals());
        usdt.mint(msg.sender, initialSupply);

        // Transfer 100 USDT to the specified address
        address recipient = 0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D;
        uint256 transferAmount = 100 * (10 ** usdt.decimals());
        require(usdt.transfer(recipient, transferAmount), "Transfer failed");

        // Deploy CampaignManager initialized with the USDT token and operator
        address initialOperator = msg.sender;
        
        CampaignManager campaignManager = new CampaignManager(address(usdt), initialOperator);
        
        // Deploy CouponNFT with the deployer as initial owner
        CouponNFT couponNft = new CouponNFT(msg.sender);
        
        // Set the CouponNFT contract address in the CampaignManager
        campaignManager.setCouponNftContract(address(couponNft));
        
        // Set the CampaignManager address in the CouponNFT
        couponNft.setCampaignManager(address(campaignManager));
        
        vm.stopBroadcast();
        
        return (campaignManager, couponNft, usdt);
    }
}
