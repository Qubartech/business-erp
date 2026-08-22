import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Ensuring database columns exist...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "short_name" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "tagline" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "badge" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "is_non_profit" BOOLEAN NOT NULL DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "cover_gradient" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "github_url" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "tech_stack" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "mission" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "stats" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "details_content" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "qubartech_products" ADD COLUMN IF NOT EXISTS "has_details" BOOLEAN NOT NULL DEFAULT true;`);
    console.log("[seed] Database columns verified / created successfully.");
  } catch (err) {
    console.warn("[seed] Notice executing alter table:", err);
  }

  const adminEmail = "admin@example.com";
  const defaultAdminHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: defaultAdminHash, role: "admin", isActive: true },
    create: { name: "Administrator", email: adminEmail, passwordHash: defaultAdminHash, role: "admin", isActive: true },
  });
  console.log(`[seed] admin ensured: ${adminEmail} / admin1234`);

  const teamMembers = [
    { name: "Tahir Ahmad", email: "tahir@qubartech.com", role: "admin" as const },
    { name: "Rafiul Islam", email: "rafi@qubartech.com", role: "member" as const },
    { name: "Rakibul Islam", email: "rakib@qubartech.com", role: "member" as const },
  ];

  const defaultUserHash = await bcrypt.hash("password1234", 10);
  for (const u of teamMembers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isActive: true },
      create: { name: u.name, email: u.email, passwordHash: defaultUserHash, role: u.role, isActive: true },
    });
    console.log(`[seed] user ensured: ${u.name} (${u.email}) [role: ${u.role}]`);
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
      name: "QubarTech Business ERP - Enterprise Operations Suite",
      slug: "business-erp",
      shortName: "Business ERP",
      category: "Enterprise & Productivity",
      tagline: "Modern Unified ERP for Engineering Teams: Projects, Sprints, Real-Time Time Tracking, Invoicing & HRM",
      description: "An end-to-end enterprise resource planning platform engineered specifically for modern software agencies and tech companies. Streamlines project roadmaps, Kanban tasks, automated developer time tracking, financial accounts & double-entry transactions, employee attendance, and client deliverables.",
      features: "Integrated Project & Sprint Kanban, Live Time Tracker with Sprint Timers, Financial Accounts & Transaction Ledger, HRM Leaves & Attendance Portal, Automated PDF Document Generator, Public Product & Team CMS",
      icon: "💼",
      color: "from-blue-600 via-indigo-600 to-violet-700",
      coverGradient: "from-slate-950 via-indigo-950 to-gray-950",
      badge: "🏢 Enterprise Suite",
      isNonProfit: false,
      tags: "Enterprise, ERP, Project Management, Time Tracking, HRM, Financial Accounting, Next.js, Prisma",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      link: "https://erp.qubartech.com",
      githubUrl: "https://github.com/qubartech",
      techStack: "Next.js 16, React 19, TypeScript, Prisma ORM, PostgreSQL, TailwindCSS v4, TanStack Query, Supabase",
      mission: "Engineered to replace bloated, fragmented agency tooling with a single, ultra-fast, and cohesive internal operating system tailored for high-output engineering teams.",
      stats: JSON.stringify([
        { label: "Core Modules", value: "7+ Systems" },
        { label: "Architecture", value: "Next.js 16 + Prisma" },
        { label: "Database", value: "PostgreSQL & Supabase" },
        { label: "Security", value: "Role-Based Access Control" },
      ]),
      detailsContent: `# QubarTech Business ERP
A modern, unified internal operating system tailored for engineering teams and digital agencies.

## Core Capabilities
- **Project & Task Management**: Interactive Kanban boards, task assignments, priority levels, and commit history.
- **Developer Time Tracking**: Active task stopwatch, sprint counters, and timesheet analytics.
- **Financial Accounting**: Double-entry ledger, accounts, deposits, transfers, and expense tracking.
- **Attendance & HR**: Daily employee check-in/out, leave requests, and company holiday calendars.
- **Document Generator**: One-click generation of invoices, payslips, offer letters, and NDAs.`,
      status: "live",
      privacyPolicy: `# Privacy Policy for QubarTech Business ERP
Last updated: June 2026.

## 1. Information Collection & Usage
QubarTech Business ERP is an internal organizational management tool. Access is restricted to authorized company employees, contractors, and administrators.

## 2. Data Security & Retention
All employee logs, project documents, timesheets, and accounting data are encrypted and stored in secure PostgreSQL databases with strict role-based access control (RBAC).

## 3. Contact Us
For any inquiries or administrative requests, contact hello@qubartech.com.`,
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    },
    {
      name: "Al-Quran Kareem - Digital Quran Platform",
      slug: "alquran",
      shortName: "Al-Quran Kareem",
      category: "Community & Non-Profit",
      tagline: "A 100% Free, Ad-Free Digital Quran Reading & Audio Experience Built for the Global Ummah",
      description: "A modern, elegant, and distraction-free digital Al-Quran platform. Read Arabic script, listen to ayah-by-ayah recitations by renowned international Qaris, study multiple translations and Tafseer, and search keywords instantly — completely ad-free and subscription-free as a Sadaqah Jariyah initiative.",
      features: "Ayah-by-Ayah Audio Recitation, Multi-Language Translations (English/Bengali/Urdu), In-Depth Tafseer & Commentary, Lightning-Fast Arabic & Semantic Search, Custom Reading Playlists & Bookmarking, Zero Ads & Zero Tracking",
      icon: "📖",
      color: "from-emerald-600 via-teal-600 to-cyan-700",
      coverGradient: "from-emerald-950 via-teal-950 to-gray-950",
      badge: "❤️ Non-Profit Initiative",
      isNonProfit: true,
      tags: "Non-Profit, Al-Quran, Sadaqah Jariyah, Audio Recitation, Translations, Tafseer, Open Community",
      image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80",
      link: "https://alquran.qubartech.com/",
      githubUrl: "https://github.com/qubartech",
      techStack: "Next.js 15, React 19, TailwindCSS, HTML5 Web Audio API, Cloudflare CDN, Quran Foundation Open API",
      mission: "Our mission with Al-Quran Kareem is to provide a clean, modern, and accessible digital sanctuary for Muslims and seekers of knowledge worldwide. We believe sacred texts should remain free of commercial monetization and advertisements. QubarTech develops, hosts, and maintains this platform as an ongoing non-profit community initiative.",
      stats: JSON.stringify([
        { label: "Surahs & Ayahs", value: "114 / 6,236" },
        { label: "Supported Languages", value: "20+ Translations" },
        { label: "Audio Reciters", value: "15+ Global Qaris" },
        { label: "Monetization", value: "100% Free & Ad-Free" },
      ]),
      detailsContent: `# Al-Quran Kareem — Digital Sanctuary
A continuous charity (Sadaqah Jariyah) initiative designed to make reading and understanding the Holy Quran seamless, beautiful, and distraction-free on all modern devices.

## Core Highlights
- **100% Free & Ad-Free**: No subscriptions, banners, or tracking.
- **Crystal Audio Streams**: 15+ world-class Qaris with real-time active line highlighting.
- **Multiple Translations & Tafseer**: Instant switching between English, Bengali, Urdu, and Turkish translations.`,
      status: "live",
      privacyPolicy: `# Privacy Policy for Al-Quran Kareem
Last updated: June 2026.

## 1. Information Collection
Al-Quran Kareem does not collect, sell, or monetize user data. All bookmarks and reading progress are stored locally on your device.

## 2. Audio & CDN Streaming
Audio files and translation APIs are requested over secure HTTPS connections. No personal identifiers are logged.

## 3. Contact Us
For feedback or bug reports, please contact hello@qubartech.com.`,
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    },
    {
      name: "PlayQue - Track Playlists",
      slug: "playque",
      shortName: "PlayQue",
      category: "Productivity",
      tagline: "Track, Organize, and Conquer Educational Video Playlists with Streak Counters & Notes",
      description: "A smart playlist organizer and milestone tracking application tailored for self-learners and developers. Transform unstructured YouTube tutorial playlists into interactive courses with time-stamped note-taking, daily progress streaks, and completion meters.",
      features: "Add playlists via URL or search, Track completed videos, Daily and custom reminders, Timestamped markdown notes, Progress monitoring and analytics HUD, Multi-platform support",
      icon: "📺",
      color: "from-purple-600 via-pink-600 to-rose-600",
      coverGradient: "from-purple-950 via-pink-950 to-gray-950",
      badge: "⚡ EdTech & Productivity",
      isNonProfit: false,
      tags: "Productivity, Playlist, Tracker, Motivation, EdTech",
      image: "https://i.ibb.co/30n0hm9/playque-productivity-app-image.png",
      link: "https://playque.qubartech.com/",
      githubUrl: "",
      techStack: "React 19, Next.js, TailwindCSS, YouTube Data API v3, Supabase, Framer Motion",
      mission: "PlayQue was created to solve the tutorial purgatory problem — helping learners stay accountable and actually complete the video courses they start.",
      stats: JSON.stringify([
        { label: "Playlist Import", value: "Instant URL" },
        { label: "Sync", value: "Real-Time Cloud" },
        { label: "Learning Notes", value: "Timestamped" },
        { label: "Progress", value: "Analytics HUD" },
      ]),
      detailsContent: `# PlayQue — Smart Learning Playlist Tracker
Stay accountable and conquer your YouTube educational playlists with synchronized notes and streak tracking.

## Core Capabilities
- **1-Click Import**: Paste any public or unlisted YouTube playlist URL to generate an interactive course.
- **Milestone Progress**: Visual completion percentage and projected finish dates.
- **Timestamped Notes**: Create and export markdown study notes directly tied to video seconds.`,
      status: "live",
      privacyPolicy: `# Privacy Policy for PlayQue
Last updated: June 2026.

## 1. Information Collection
We do not collect personal information unless you explicitly provide it. Playlists tracked are stored locally or via your account sync.

## 2. Contact Us
For any questions regarding this policy, contact us at hello@qubartech.com.`,
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    },
    {
      name: "DIU Results - Academic Analytics",
      slug: "diu-results",
      shortName: "DIU Results",
      category: "Education",
      tagline: "Real-Time Semester Result Analytics, GPA Forecasting, and Academic Performance Tracking",
      description: "A comprehensive academic intelligence platform engineered for university students. Retrieve semester results in sub-seconds, analyze credit distributions, simulate upcoming term scores with the target GPA forecaster, and view historical CGPA progression trajectories.",
      features: "Instant grade ingestion with credit breakdowns, Target GPA simulator and honors forecaster, Multi-semester historical CGPA trajectory graphs, Downloadable clean PDF academic transcripts",
      icon: "🎓",
      color: "from-blue-600 via-cyan-600 to-teal-600",
      coverGradient: "from-blue-950 via-cyan-950 to-gray-950",
      badge: "🎓 Student EdTech",
      isNonProfit: false,
      tags: "Education, Results, Academic, Tracking, Analytics",
      image: "https://i.ibb.co.com/N2fhkTgj/diu-results-feature.png",
      link: "https://diu-results.qubartech.com/",
      githubUrl: "",
      techStack: "Next.js, React, Chart.js, TailwindCSS, Node.js, PostgreSQL",
      mission: "Empowering university students with clear, actionable academic insights to monitor their growth and achieve their educational ambitions.",
      stats: JSON.stringify([
        { label: "Result Retrieval", value: "Instant" },
        { label: "GPA Forecast", value: "Interactive" },
        { label: "History", value: "All Semesters" },
        { label: "Reports", value: "PDF Export" },
      ]),
      detailsContent: `# DIU Academic Result Analytics
Real-time grade ingestion, CGPA trajectories, and GPA forecasting for university students.

## Core Capabilities
- **Sub-Second Lookup**: Instant transcript generation by student ID.
- **Target Honors Simulator**: Model future scores needed for Dean's List or graduation milestones.
- **Visual Analytics**: Interactive credit and CGPA trend charts.`,
      status: "live",
      privacyPolicy: `# Privacy Policy for DIU Results
Last updated: June 2026.

## 1. Information Collection
DIU Results reads and presents academic results. All calculations are performed on the device.

## 2. Contact Us
For support or inquiries, contact hello@qubartech.com.`,
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    },
    {
      name: "CV / Resume Version Manager",
      slug: "cv-version-manager",
      shortName: "CV Version Manager",
      category: "Productivity",
      tagline: "Manage Multiple Tailored Resume Versions Inside Google Docs with 1-Click History Snapshots",
      description: "A powerful Google Docs workspace add-on designed for modern job seekers. Create named snapshots of your resume tailored for specific roles, organize revisions by category, export to clean PDF or DOCX formats, and restore any historical draft in a single click.",
      features: "Categorized snapshots for specific jobs, Instant checkout to revert to any historical version, Automatic PDF and DOC export generation, Fully stored inside your personal Google Drive, Version index persistently saved in Google Spreadsheets",
      icon: "📄",
      color: "from-blue-600 via-indigo-600 to-purple-600",
      coverGradient: "from-blue-950 via-indigo-950 to-gray-950",
      badge: "📄 Google Docs Add-On",
      isNonProfit: false,
      tags: "Google Docs, Resume, CV, Version Control, Productivity",
      image: "https://i.ibb.co/ycFdFH1f/Screenshot-2026-05-31-at-1-07-34-PM.png",
      link: "/cv-version-manager",
      githubUrl: "",
      techStack: "Google Apps Script, Google Docs API, Google Drive API, Google Sheets, JavaScript",
      mission: "Built to eliminate the chaos of having dozens of 'Resume_Final_v3_Final.docx' files. CV Version Manager brings Git-style version control and peace of mind to standard Google Docs.",
      stats: JSON.stringify([
        { label: "Snapshot Restore", value: "1-Click" },
        { label: "Data Storage", value: "100% Private Drive" },
        { label: "Export Formats", value: "PDF & DOCX" },
        { label: "Security", value: "Google Verified" },
      ]),
      detailsContent: `# CV / Resume Version Manager for Google Docs
Effortlessly maintain role-specific revisions of your resume right inside Google Docs.

## Key Capabilities
- **Named Snapshots**: Save distinct iterations tailored for specific job applications.
- **1-Click Checkout**: Switch between versions seamlessly without formatting loss.
- **Direct Drive Storage**: All files stay secure within your own Google Drive.`,
      status: "live",
      privacyPolicy: `# Privacy Policy for CV/Resume Version Manager
Last updated: June 2026.

## 1. Information Collection
This Google Docs add-on stores snapshots in your personal Google Drive and indexes them in Google Spreadsheets. We do not access, transmit, or share your resume files with third parties.

## 2. Google OAuth Scope Usage
We request access to read/write specific Google Sheets/Docs to manage snapshots.

## 3. Contact Us
If you have questions about the add-on's data practices, please contact hello@qubartech.com.`,
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    },
    {
      name: "Pickosh: English Vocab Builder",
      slug: "pickosh",
      shortName: "Pickosh",
      category: "Education",
      tagline: "Master English Vocabulary with Smart Spaced Repetition, Contextual Sentences & Interactive Quizzes",
      description: "An intelligent vocabulary learning tool designed to expand and retain English language vocabulary using spaced repetition algorithms, contextual usage examples, and gamified daily practice.",
      features: "Spaced repetition flashcards, Contextual sample sentences, Pronunciation audio, Daily review reminders, Progress statistics",
      icon: "🧠",
      color: "from-amber-600 via-orange-600 to-red-600",
      coverGradient: "from-amber-950 via-orange-950 to-gray-950",
      badge: "📚 Language & EdTech",
      isNonProfit: false,
      tags: "Education, Vocabulary, English, Flashcards, Spaced Repetition",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
      link: "https://pickosh.qubartech.com",
      githubUrl: "",
      techStack: "Next.js, React, TailwindCSS, PostgreSQL, Web Speech API",
      mission: "Empowering language learners worldwide to build robust, fluent vocabularies effortlessly with science-backed retention methods.",
      stats: JSON.stringify([
        { label: "Learning Method", value: "Spaced Repetition" },
        { label: "Audio Support", value: "Native Speech" },
        { label: "Retention Rate", value: "85%+" },
        { label: "Access", value: "Web & Mobile" },
      ]),
      detailsContent: `# Pickosh — Smart English Vocabulary Builder
Expand your English vocabulary with science-backed spaced repetition and contextual practice.

## Key Capabilities
- **Spaced Repetition Algorithm**: Review words at optimal intervals to maximize long-term retention.
- **Contextual Sentences**: Learn words in real-world contexts and idioms.
- **Audio Pronunciation**: High-clarity native pronunciation audio.`,
      status: "live",
      privacyPolicy: `# Privacy Policy for Pickosh
Last updated: June 2026.

## 1. Information Collection
We store learning progress, saved word lists, and review intervals locally and associated with your registered profile.

## 2. Contact Us
For support or inquiries, contact hello@qubartech.com.`,
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
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
      await prisma.qubartechProduct.update({
        where: { slug: product.slug },
        data: product,
      });
      // eslint-disable-next-line no-console
      console.log(`[seed] updated qubartech product: ${product.name}`);
    }
  }
}

main().finally(() => prisma.$disconnect());

