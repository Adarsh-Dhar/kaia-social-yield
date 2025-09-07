const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const m = await prisma.mission.findFirst({ orderBy: { createdAt: 'asc' } }).catch(async () => {
      // fallback if createdAt doesn't exist in schema
      return prisma.mission.findFirst();
    });
    if (!m) process.exit(1);
    process.stdout.write(m.id);
  } catch (e) {
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
