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

  const websiteProducts = [
    {
      name: "PlayQue - Track Playlists",
      slug: "playque",
      category: "productivity",
      description: "A productivity app to track your long list of favorite playlists. Get motivated to watch/complete educational and tech playlists while tracking your progress.",
      features: "Add playlists via URL or search, Track completed videos, Daily and custom reminders, Progress monitoring, Multi-platform support",
      icon: "📺",
      color: "from-purple-500 to-pink-500",
      tags: "Productivity, Playlist, Tracker, Motivation",
      image: "https://i.ibb.co/30n0hm9/playque-productivity-app-image.png",
      link: "#",
      status: "live",
      privacyPolicy: `# Privacy Policy for PlayQue
Last updated: June 2026.

## 1. Information Collection
We do not collect personal information unless you explicitly provide it. Playlists tracked are stored locally or via your account sync.

## 2. Contact Us
For any questions regarding this policy, contact us.`,
      isActive: true,
      hasProjectManagement: true,
      hasPrivacy: true,
    },
    {
      name: "DIU Results",
      slug: "diu-results",
      category: "education",
      description: "A comprehensive result tracking system for DIU students. Easily access and monitor academic performance.",
      features: "Real-time result tracking, GPA calculation, Course analytics, Performance insights, Grade history",
      icon: "🎓",
      color: "from-blue-500 to-cyan-500",
      tags: "Education, Results, Academic, Tracking",
      image: "https://i.ibb.co.com/N2fhkTgj/diu-results-feature.png",
      link: "#",
      status: "live",
      privacyPolicy: `# Privacy Policy for DIU Results
Last updated: June 2026.

## 1. Information Collection
DIU Results reads and presents academic results. All calculations are performed on the device.

## 2. Contact Us
For support or inquiries, contact us.`,
      isActive: true,
      hasProjectManagement: true,
      hasPrivacy: true,
    },
    {
      name: "CV/Resume Version Manager",
      slug: "cv-version-manager",
      category: "productivity",
      description: "A powerful Google Docs add-on to manage different versions of your CV or Resume tailored for various jobs. Save named snapshots, organize them by category, export to PDF or DOC, and checkout any version directly from history.",
      features: "Categorized snapshots for specific jobs, Instant checkout to revert to any historical version, Automatic PDF and DOC export generation, Fully stored inside your personal Google Drive, Version index persistently saved in Google Spreadsheets",
      icon: "📄",
      color: "from-emerald-500 to-teal-500",
      tags: "Google Docs, Resume, CV, Version Control, Productivity",
      image: "https://i.ibb.co/ycFdFH1f/Screenshot-2026-05-31-at-1-07-34-PM.png",
      link: "/cv-version-manager",
      status: "live",
      privacyPolicy: `# Privacy Policy for CV/Resume Version Manager
Last updated: June 2026.

## 1. Information Collection
This Google Docs add-on stores snapshots in your personal Google Drive and indexes them in Google Spreadsheets. We do not access, transmit, or share your resume files with third parties.

## 2. Google OAuth Scope Usage
We request access to read/write specific Google Sheets/Docs to manage snapshots.

## 3. Contact Us
If you have questions about the add-on's data practices, please contact Tahir Ahmad.`,
      isActive: true,
      hasProjectManagement: true,
      hasPrivacy: true,
    }
  ];

  for (const product of websiteProducts) {
    const existing = await prisma.qubartechProduct.findUnique({
      where: { slug: product.slug },
    });
    if (!existing) {
      await prisma.qubartechProduct.create({
        data: product,
      });
      // eslint-disable-next-line no-console
      console.log(`[seed] created qubartech product: ${product.name}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[seed] qubartech product already exists: ${product.name}`);
    }
  }
}

main().finally(() => prisma.$disconnect());

