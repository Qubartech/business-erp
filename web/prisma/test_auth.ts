import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking all users in database...");
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    console.log(`\nUser: ${u.email} (Name: ${u.name}, Role: ${u.role}, Active: ${u.isActive})`);
    const testAdmin = await bcrypt.compare("admin1234", u.passwordHash);
    const testPassword = await bcrypt.compare("password1234", u.passwordHash);
    console.log(`  Password 'admin1234' matches: ${testAdmin}`);
    console.log(`  Password 'password1234' matches: ${testPassword}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
