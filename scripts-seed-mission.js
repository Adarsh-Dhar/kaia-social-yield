const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const count = await prisma.mission.count();
    if (count === 0) {
      await prisma.mission.create({
        data: {
          title: 'Follow OA',
          description: 'Follow our LINE OA',
          type: 'FOLLOW_OA',
          boostMultiplier: 1.5,
          boostDuration: 24,
          isRepeatable: false,
        },
      });
      console.log('Seeded 1 mission');
    } else {
      console.log('Missions already exist:', count);
    }
  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
