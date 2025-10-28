const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('Current users in database:');
    console.table(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();