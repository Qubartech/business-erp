import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";
import { BadRequest } from "../lib/errors.js";

export const githubWebhooksRouter = Router();

githubWebhooksRouter.post("/", async (req, res, next) => {
  try {
    const event = req.headers["x-github-event"];
    if (event === "ping") {
      return ok(res, null, "Zen");
    }

    if (event && event !== "push") {
      return ok(res, null, `Event "${event}" received`);
    }

    const payload = req.body;
    if (!payload || !payload.repository || !payload.commits) {
      throw BadRequest("Invalid webhook payload");
    }

    const repoName = payload.repository.full_name;
    if (!repoName) {
      throw BadRequest("Missing repository full name");
    }

    // Find projects matching this repository
    const projects = await prisma.project.findMany({
      where: {
        githubRepo: {
          equals: repoName,
          mode: "insensitive",
        },
      },
    });

    if (projects.length === 0) {
      return ok(res, null, `No matching projects for repository ${repoName}`);
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

    ok(res, { processedCommits: commitsData.length, matchingProjects: projects.length }, `Processed ${createdCount} commits`);
  } catch (e) {
    next(e);
  }
});
