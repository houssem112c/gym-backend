import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const avatars = await prisma.userAvatar.findMany({
    include: { user: true }
  });
  console.table(avatars.map(a => ({
    user: a.user.email,
    shape: a.bodyShape,
    outfit: a.outfit
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
