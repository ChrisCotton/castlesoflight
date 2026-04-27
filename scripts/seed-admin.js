import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { users } from '../drizzle/schema.js';

dotenv.config();

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  const email = 'chriscotton@castlesoflight.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Ensuring local admin account for ${email}...`);

  try {
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name: 'Christopher Cotton (Local Admin)',
      role: 'admin',
      loginMethod: 'password',
      openId: 'local-dev-owner', // Added dummy openId for schema compliance
    }).onDuplicateKeyUpdate({
      set: {
        password: hashedPassword,
        role: 'admin',
      }
    });
    console.log('✅ Admin account ready. You can now log in with password: password123');
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
  } finally {
    await connection.end();
  }
}

seed();
