// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";
import {CampaignManager} from "../src/CampaignManager.sol";
import {CouponNFT} from "../src/CouponNFT.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract Deploy is Script {
    function run() external returns (CampaignManager, CouponNFT, MockUSDT) {
        // Use the test private key address as the operator
        // This is the address that corresponds to private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        address testOperator = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        
        vm.startBroadcast();
        
        // Deploy MockUSDT (USDT-like with 6 decimals)
        MockUSDT usdt = new MockUSDT();

        // Mint initial supply to deployer
        uint256 initialSupply = 1_000_000 * (10 ** usdt.decimals());
        usdt.mint(msg.sender, initialSupply);

        // Transfer 100 USDT to the test operator
        uint256 transferAmount = 100 * (10 ** usdt.decimals());
        require(usdt.transfer(testOperator, transferAmount), "Transfer failed");
        
        // Mint 100 USDT directly to the target wallet
        address targetWallet = 0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D;
        usdt.mint(targetWallet, transferAmount);

        // Deploy CampaignManager with test operator
        CampaignManager campaignManager = new CampaignManager(address(usdt), testOperator);
        
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