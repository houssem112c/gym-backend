import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = 'admin@gym.com';
  const adminPassword = 'admin123';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    // return; // Removed to allow subsequent seeding
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
  }

  // Create Coach users
  const coaches = [
    { email: 'coach1@gym.com', name: 'Coach Sarah', role: 'COACH' as any },
    { email: 'coach2@gym.com', name: 'Coach Mike', role: 'COACH' as any },
  ];

  const coachPassword = 'coach123';
  const hashedCoachPassword = await bcrypt.hash(coachPassword, 10);

  for (const coachData of coaches) {
    const existingCoach = await prisma.user.findUnique({
      where: { email: coachData.email },
    });

    if (!existingCoach) {
      const coach = await prisma.user.create({
        data: {
          ...coachData,
          password: hashedCoachPassword,
        },
      });
      console.log('Coach created:', { id: coach.id, email: coach.email, name: coach.name });
    }
  }

  // Assign test user to Coach Sarah
  const targetUser = await prisma.user.findUnique({ where: { email: userEmail } }) as any;
  const coachSarah = await prisma.user.findUnique({ where: { email: 'coach1@gym.com' } });

  if (targetUser && coachSarah && !targetUser.coachId) {
    await (prisma.user as any).update({
      where: { id: targetUser.id },
      data: { coachId: coachSarah.id }
    });
    console.log('Assigned Test User to Coach Sarah');
  }

  // Seed Products
  const productsCount = await prisma.product.count();
  if (productsCount === 0) {
    const products = [
      {
        name: 'Premium Whey Protein',
        description: 'High-quality whey protein isolate for muscle recovery.',
        price: 59.99,
        stock: 100,
        category: 'Supplements',
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=2070&auto=format&fit=crop',
      },
      {
        name: 'Gym Signature Hoodie',
        description: 'Comfortable and stylish hoodie for your workouts.',
        price: 45.00,
        stock: 50,
        category: 'Apparel',
        imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961d28c?q=80&w=2070&auto=format&fit=crop',
      },
      {
        name: 'Resistance Bands Set',
        description: 'Set of 5 resistance bands for home workouts.',
        price: 25.50,
        stock: 200,
        category: 'Equipment',
        imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?q=80&w=2074&auto=format&fit=crop',
      },
      {
        name: 'Pre-Workout Energy',
        description: 'Boost your energy and focus before training.',
        price: 35.99,
        stock: 80,
        category: 'Supplements',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop',
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat for stability and comfort.',
        price: 29.99,
        stock: 120,
        category: 'Equipment',
        imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=2080&auto=format&fit=crop',
      },
      {
        name: 'Shaker Bottle',
        description: 'Leak-proof shaker bottle for your supplements.',
        price: 12.99,
        stock: 300,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1574852859542-1b41217a7815?q=80&w=1980&auto=format&fit=crop',
      }
    ];

    await prisma.product.createMany({
      data: products,
    });

    console.log('Products seeded successfully');
  } else {
    console.log('Products already exist, skipping seed');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });