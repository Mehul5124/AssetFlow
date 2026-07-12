import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {}, // Do nothing if it already exists
    create: {
      name: 'System Admin',
      email: 'admin@assetflow.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Default Admin created: ${admin.email} (Password: admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
