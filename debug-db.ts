import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Recent Avatar Saves ---');
  const avatars = await prisma.userAvatar.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });

  avatars.forEach(av => {
    console.log(`User: ${av.user.email} (${av.user.name})`);
    console.log(`Body: ${av.bodyShape}`);
    console.log(`Outfit: ${av.outfit}`);
    console.log(`Updated: ${av.updatedAt}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
