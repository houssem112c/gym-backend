const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    try {
        const count = await prisma.user.count({ where: { role: 'COACH' } });
        console.log('Coach count:', count);
        const coaches = await prisma.user.findMany({ where: { role: 'COACH' } });
        coaches.forEach(c => console.log('- ', c.email, c.name, c.role));

        const allRoles = await prisma.user.findMany({ select: { role: true } });
        const roleStats = allRoles.reduce((acc, curr) => {
            acc[curr.role] = (acc[curr.role] || 0) + 1;
            return acc;
        }, {});
        console.log('Role statistics:', roleStats);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
run();
