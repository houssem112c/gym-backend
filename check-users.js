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
                createdAt: true,
            },
        });

        console.log('\n=== Users in Database ===\n');
        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log('');
            });
        }

        console.log('\n=== Login Credentials (from seed.js) ===\n');
        console.log('1. Admin User:');
        console.log('   Email: admin@gym.com');
        console.log('   Password: admin123\n');
        console.log('2. Test User:');
        console.log('   Email: user@gym.com');
        console.log('   Password: user123\n');
        console.log('3. Houssem Admin:');
        console.log('   Email: houssem.benmabrouk12@gmail.com');
        console.log('   Password: admin123\n');

    } catch (error) {
        console.error('Error fetching users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
