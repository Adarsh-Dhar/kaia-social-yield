const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestMissions() {
  try {
    console.log('Seeding test missions...');

    // Find or create a test advertiser
    let advertiser = await prisma.advertiser.findFirst({
      where: { contactEmail: 'test@advertiser.com' }
    });

    if (!advertiser) {
      advertiser = await prisma.advertiser.create({
        data: {
          companyName: 'Test Advertiser',
          contactEmail: 'test@advertiser.com',
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          passwordHash: 'hashed_password'
        }
      });
    }

    console.log('Created advertiser:', advertiser.id);

    // Create test missions
    const missions = [
      {
        title: 'Follow our Twitter',
        description: 'Follow our official Twitter account to stay updated',
        type: 'FOLLOW',
        boostMultiplier: 1.5,
        boostDuration: 24,
        isRepeatable: false
      },
      {
        title: 'Invite 3 Friends',
        description: 'Invite 3 friends to join the platform',
        type: 'INVITE',
        boostMultiplier: 2.0,
        boostDuration: 48,
        isRepeatable: true
      },
      {
        title: '7-Day Streak',
        description: 'Complete daily tasks for 7 consecutive days',
        type: 'STREAK',
        boostMultiplier: 3.0,
        boostDuration: 72,
        isRepeatable: false
      }
    ];

    for (const missionData of missions) {
      // Create mission
      const mission = await prisma.mission.create({
        data: missionData
      });

      console.log('Created mission:', mission.id, mission.title);

      // Create campaign for this mission
      const campaign = await prisma.campaign.create({
        data: {
          name: `${missionData.title} Campaign`,
          description: `Campaign for ${missionData.title}`,
          status: 'ACTIVE',
          budget: 1000.0,
          remainingBudget: 1000.0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          contractCampaignId: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`, // 64-character hex string
          maxParticipants: 100,
          minReward: 1.0,
          maxReward: 50.0,
          nftTokenURI: 'https://example.com/nft-metadata.json',
          advertiserId: advertiser.id,
          missionId: mission.id
        }
      });

      console.log('Created campaign:', campaign.id, 'for mission:', mission.title);
    }

    console.log('Test missions seeded successfully!');
  } catch (error) {
    console.error('Error seeding test missions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestMissions();
