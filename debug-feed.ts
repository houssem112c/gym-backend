import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const adminEmail = 'admin@gym.com';
        const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!admin) {
            console.log('Admin not found!');
            return;
        }

        console.log('Admin User:', JSON.stringify(admin, null, 2));

        const posts = await prisma.feedPost.findMany({
            include: {
                user: { select: { name: true, role: true } }
            }
        });
        console.log(`\nTotal posts in database: ${posts.length}`);
        posts.forEach(p => {
            console.log(`- Post ID: ${p.id}, Author: ${p.user.name}, Role: ${p.user.role}`);
        });

        const friendships = await prisma.friendship.findMany();
        console.log(`\nTotal friendships: ${friendships.length}`);
        friendships.forEach(f => {
            console.log(`- From: ${f.requesterId}, To: ${f.addresseeId}, Status: ${f.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
