#!/bin/bash

# Deploy Social Yield Protocol to Kairos Network
echo "🚀 Deploying Social Yield Protocol to Kairos..."

# Navigate to contracts directory
cd contracts

# Deploy the contract
echo "📦 Deploying contract..."
forge script script/Deploy.s.sol --rpc-url https://public-en-kairos.node.kaia.io --broadcast

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the deployed contract address from the output above"
    echo "2. Update lib/social/address.ts with the new address"
    echo "3. Restart your application"
    echo ""
    echo "🔗 Kairos Explorer: https://explorer.kairos.kaia.io"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
