const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');

    const user = await prisma.user.upsert({
      where: { lineUserId: 'test-line-user-123' },
      update: {},
      create: {
        lineUserId: 'test-line-user-123',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg'
      }
    });

    console.log('Created test user:', user.id);
    console.log('Wallet address:', user.walletAddress);
    
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
