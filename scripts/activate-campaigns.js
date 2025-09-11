const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateCampaigns() {
  try {
    console.log('Activating all campaigns...');

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'DRAFT'
      }
    });

    console.log(`Found ${campaigns.length} campaigns in DRAFT status`);

    for (const campaign of campaigns) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { 
          status: 'ACTIVE',
          contractCampaignId: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` // Generate proper contract ID
        }
      });

      console.log(`Activated campaign: ${campaign.name} (${campaign.id})`);
    }

    console.log('All campaigns activated successfully!');
  } catch (error) {
    console.error('Error activating campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateCampaigns();
