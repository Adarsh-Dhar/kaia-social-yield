// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";
import {CampaignManager} from "../src/CampaignManager.sol";
import {CouponNFT} from "../src/CouponNFT.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract Deploy is Script {
    function run() external returns (CampaignManager, CouponNFT, MockUSDT) {
        // Use the target wallet as the operator
        address targetOperator = 0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D;
        
        vm.startBroadcast();
        
        // Deploy MockUSDT (USDT-like with 6 decimals)
        MockUSDT usdt = new MockUSDT();

        // Mint initial supply to deployer
        uint256 initialSupply = 1_000_000 * (10 ** usdt.decimals());
        usdt.mint(msg.sender, initialSupply);

        // Transfer 100 USDT to the target operator
        uint256 transferAmount = 100 * (10 ** usdt.decimals());
        require(usdt.transfer(targetOperator, transferAmount), "Transfer failed");
        
        // Mint additional 100 USDT directly to the target wallet
        usdt.mint(targetOperator, transferAmount);

        // Deploy CampaignManager with target wallet as operator
        CampaignManager campaignManager = new CampaignManager(address(usdt), targetOperator);
        
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