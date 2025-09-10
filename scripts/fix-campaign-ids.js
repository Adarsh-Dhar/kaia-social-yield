const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCampaignIds() {
  try {
    console.log('Fixing campaign contract IDs...');

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    for (const campaign of campaigns) {
      // Generate a proper 64-character hex string
      const contractCampaignId = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { contractCampaignId }
      });

      console.log(`Updated campaign ${campaign.id} with contract ID: ${contractCampaignId}`);
    }

    console.log('Campaign IDs fixed successfully!');
  } catch (error) {
    console.error('Error fixing campaign IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCampaignIds();
