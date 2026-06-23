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

  const websiteTeam = [
    {
      name: "Tahir Ahmad",
      position: "Co-Founder / Web Developer",
      image: "/image/our_teams/tahir.jpg",
      facebook: "https://www.facebook.com/TahirAhmad01/",
      linkedin: "https://www.linkedin.com/in/tahirahmad01/",
      github: "https://github.com/TahirAhmad01",
      portfolio: "https://tahirahmad.vercel.app/",
      x: "https://x.com/TahirAhmad01",
      order: 0,
    },
    {
      name: "Rafiul Islam",
      position: "Co-Founder / Android Developer",
      image: "/image/our_teams/rafiul.jpg",
      facebook: "https://www.facebook.com/rafi1357",
      linkedin: "https://www.linkedin.com/in/rafi1357/",
      github: "https://github.com/rafiul587",
      portfolio: "https://rafiul.vercel.app/",
      x: null,
      order: 1,
    },
    {
      name: "Rakibul Islam",
      position: "Co-Founder / Web Developer",
      image: "/image/our_teams/rakib.jpg",
      facebook: "https://www.facebook.com/rakib.dev.null",
      linkedin: "https://www.linkedin.com/in/rakibul-islam-b439a8226/",
      github: "https://github.com/rakib-587",
      portfolio: null,
      x: null,
      order: 2,
    },
    {
      name: "Tanvir Shaharia",
      position: "Android Developer",
      image: "/image/our_teams/tanvir.jpg",
      facebook: "https://www.facebook.com/tanvir.softwaredev",
      linkedin: "https://www.linkedin.com/in/tanvir-shaharia/",
      github: "https://github.com/tanvir-shaharia",
      portfolio: "https://tanvirshaharia.vercel.app/",
      x: null,
      order: 3,
    },
    {
      name: "Sajal Ali",
      position: "Web Developer",
      image: "/image/our_teams/sajal.jpg",
      facebook: null,
      linkedin: "https://www.linkedin.com/in/mdsajalali/",
      github: "https://github.com/mdsajalali",
      portfolio: "https://sajalali.vercel.app/",
      x: null,
      order: 4,
    },
  ];

  for (const member of websiteTeam) {
    const existing = await prisma.qubartechTeamMember.findFirst({
      where: { name: member.name },
    });
    if (!existing) {
      await prisma.qubartechTeamMember.create({
        data: {
          name: member.name,
          position: member.position,
          image: member.image,
          facebook: member.facebook,
          linkedin: member.linkedin,
          github: member.github,
          portfolio: member.portfolio,
          x: member.x,
          order: member.order,
          isActive: true,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`[seed] created qubartech team member: ${member.name}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[seed] qubartech team member already exists: ${member.name}`);
    }
  }
}

main().finally(() => prisma.$disconnect());

