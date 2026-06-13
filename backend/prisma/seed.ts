import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin already exists: ${email}`);
    return;
  }
  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.create({
    data: { name: "Administrator", email, passwordHash, role: "admin", isActive: true },
  });
  // eslint-disable-next-line no-console
  console.log(`[seed] created admin: ${email} / admin1234 (CHANGE IMMEDIATELY)`);
}

main().finally(() => prisma.$disconnect());
