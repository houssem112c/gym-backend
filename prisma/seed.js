const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Create admin user
    const adminEmail = 'admin@gym.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
        },
      });

      console.log('Admin user created:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
    }

    // Create a regular user for testing
    const userEmail = 'user@gym.com';
    const userPassword = 'user123';
    
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!existingUser) {
      const hashedUserPassword = await bcrypt.hash(userPassword, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedUserPassword,
          name: 'Test User',
          role: 'USER',
        },
      });

      console.log('Test user created:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Create some test messages
      await prisma.contact.createMany({
        data: [
          {
            userId: user.id,
            name: user.name,
            email: user.email,
            subject: 'Membership Question',
            message: 'Hi, I would like to know more about your membership plans and pricing.',
            status: 'OPEN',
            priority: 'NORMAL',
          },
          {
            userId: user.id,
            name: user.name,
            email: user.email,
            subject: 'Class Schedule Query',
            message: 'Can you please provide information about yoga class schedules?',
            status: 'OPEN',
            priority: 'HIGH',
          },
        ],
      });

      console.log('Test messages created');
    } else {
      console.log('Test user already exists');
    }

    // Also create the houssem admin user
    const houssemEmail = 'houssem.benmabrouk12@gmail.com';
    const houssemPassword = 'admin123'; // Using same password as admin
    
    const existingHoussem = await prisma.user.findUnique({
      where: { email: houssemEmail },
    });

    if (!existingHoussem) {
      const hashedHoussemPassword = await bcrypt.hash(houssemPassword, 10);
      
      const houssem = await prisma.user.create({
        data: {
          email: houssemEmail,
          password: hashedHoussemPassword,
          name: 'Houssem',
          role: 'ADMIN',
        },
      });

      console.log('Houssem admin user created:', {
        id: houssem.id,
        email: houssem.email,
        name: houssem.name,
        role: houssem.role,
      });
    } else {
      console.log('Houssem admin user already exists');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });