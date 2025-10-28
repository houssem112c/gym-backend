const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.production' });

// Get DATABASE_URL from environment or use the direct URL
const DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || 'postgresql://gym_user:sbQzwwHHWckHsQ7VTQAy2MsGzVelp9Ok@dpg-d3l71a33fgac73abpcs0-a.oregon-postgres.render.com/gym_db_rrxc';

async function createUser() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Render PostgreSQL
    }
  });

  try {
    await client.connect();
    console.log('Connected to production database');

    // User credentials to create
    const email = 'admins@gym.com';
    const password = 'admin123';
    const name = 'Admin User';
    const role = 'ADMIN';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const checkUserQuery = 'SELECT id FROM "User" WHERE email = $1';
    const existingUser = await client.query(checkUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      console.log('User already exists:', email);
      
      // Update the password instead
      const updateQuery = 'UPDATE "User" SET password = $1 WHERE email = $2';
      await client.query(updateQuery, [hashedPassword, email]);
      console.log('Password updated for existing user');
    } else {
      // Create new user
      const insertQuery = `
        INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, name, role
      `;
      
      const result = await client.query(insertQuery, [email, hashedPassword, name, role]);
      console.log('User created successfully:', result.rows[0]);
    }

    // Also create houssem admin user
    const houssemEmail = 'houssem.benmabrouk12@gmail.com';
    const houssemPassword = 'admin123';
    const houssemName = 'Houssem';
    const houssemHashedPassword = await bcrypt.hash(houssemPassword, 10);

    const checkHoussemQuery = 'SELECT id FROM "User" WHERE email = $1';
    const existingHoussem = await client.query(checkHoussemQuery, [houssemEmail]);

    if (existingHoussem.rows.length > 0) {
      console.log('Houssem user already exists:', houssemEmail);
      
      // Update the password
      const updateHoussemQuery = 'UPDATE "User" SET password = $1 WHERE email = $2';
      await client.query(updateHoussemQuery, [houssemHashedPassword, houssemEmail]);
      console.log('Password updated for Houssem user');
    } else {
      // Create houssem user
      const insertHoussemQuery = `
        INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, name, role
      `;
      
      const houssemResult = await client.query(insertHoussemQuery, [houssemEmail, houssemHashedPassword, houssemName, role]);
      console.log('Houssem user created successfully:', houssemResult.rows[0]);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createUser();