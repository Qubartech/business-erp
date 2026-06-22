import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { BadRequest } from "@/lib/errors";

export const POST = apiHandler(
  async (req) => {
    const event = req.headers.get("x-github-event");
    if (event === "ping") {
      return null;
    }

    if (event && event !== "push") {
      return { message: `Event "${event}" received` };
    }

    const payload = await req.json();
    if (!payload || !payload.repository || !payload.commits) {
      throw BadRequest("Invalid webhook payload");
    }

    const repoName = payload.repository.full_name;
    if (!repoName) {
      throw BadRequest("Missing repository full name");
    }

    // Find projects matching this repository
    let projects = await prisma.project.findMany({
      where: {
        githubRepo: {
          equals: repoName,
          mode: "insensitive",
        },
      },
    });

    if (projects.length === 0) {
      // Find or create a default "General" project to associate this commit with
      let generalProject = await prisma.project.findFirst({
        where: {
          name: {
            equals: "General",
            mode: "insensitive",
          },
        },
      });

      if (!generalProject) {
        // Find an admin user to own this project
        const adminUser = await prisma.user.findFirst({
          where: { role: "admin" },
        });
        if (!adminUser) {
          throw BadRequest("No admin user found to own the General fallback project");
        }
        
        generalProject = await prisma.project.create({
          data: {
            name: "General",
            description: "Fallback project for unmatched GitHub repository commits",
            status: "active",
            category: "non_client",
            createdBy: adminUser.id,
          },
        });
      }

      projects = [generalProject];
    }

    const commitsData = payload.commits;
    let createdCount = 0;

    for (const project of projects) {
      for (const commit of commitsData) {
        // Idempotent upsert by project_id and sha
        await prisma.commit.upsert({
          where: {
            projectId_sha: {
              projectId: project.id,
              sha: commit.id,
            },
          },
          update: {}, // Keep existing data if it's already there
          create: {
            projectId: project.id,
            sha: commit.id,
            message: commit.message || "No message",
            authorName: commit.author?.name || "Unknown",
            authorEmail: commit.author?.email || "unknown@github.com",
            url: commit.url || "",
            committedAt: commit.timestamp ? new Date(commit.timestamp) : new Date(),
          },
        });
        createdCount++;
      }
    }

    return { processedCommits: commitsData.length, matchingProjects: projects.length };
  },
  {
    requireAuth: false,
  }
);
