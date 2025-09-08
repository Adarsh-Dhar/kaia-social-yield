// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";
import {CampaignEscrow} from "../src/CampaignEscrow.sol";

contract DeployCampaignEscrow is Script {
    function run() external returns (CampaignEscrow) {
        vm.startBroadcast();
        CampaignEscrow escrow = new CampaignEscrow();
        vm.stopBroadcast();
        return escrow;
    }
}
