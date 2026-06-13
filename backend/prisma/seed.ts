import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin1234", 10);
    await prisma.user.create({
      data: { name: "Administrator", email: adminEmail, passwordHash, role: "admin", isActive: true },
    });
    // eslint-disable-next-line no-console
    console.log(`[seed] created admin: ${adminEmail} / admin1234 (CHANGE IMMEDIATELY)`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin already exists: ${adminEmail}`);
  }

  const teamMembers = [
    { name: "Tahir Ahmad", email: "tahir@qubartech.com", role: "member" as const },
    { name: "Rafiul Islam", email: "rafi@qubartech.com", role: "member" as const },
    { name: "Rakibul Islam", email: "rakib@qubartech.com", role: "member" as const },
  ];

  for (const u of teamMembers) {
    const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existingUser) {
      const passwordHash = await bcrypt.hash("password1234", 10);
      await prisma.user.create({
        data: { name: u.name, email: u.email, passwordHash, role: u.role, isActive: true },
      });
      // eslint-disable-next-line no-console
      console.log(`[seed] created user: ${u.name} (${u.email}) / password1234`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[seed] user already exists: ${u.email}`);
    }
  }
}

main().finally(() => prisma.$disconnect());

