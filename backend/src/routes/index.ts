import { Router } from "express";
import { authRouter } from "../auth/auth.routes.js";
import { usersRouter } from "../users/users.routes.js";
import { dashboardRouter } from "../dashboard/dashboard.routes.js";
import { projectsRouter } from "../projects/projects.routes.js";
import { tasksRouter } from "../tasks/tasks.routes.js";
import { notesRouter } from "../notes/notes.routes.js";
import { timeEntriesRouter } from "../time-entries/time-entries.routes.js";
import { documentsRouter } from "../documents/documents.routes.js";
import { settingsRouter } from "../settings/settings.routes.js";
import { githubWebhooksRouter } from "../webhooks/github.routes.js";
import { attendanceRouter } from "../attendance/attendance.routes.js";
import { leavesRouter } from "../leaves/leaves.routes.js";
import { holidaysRouter } from "../holidays/holidays.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/dashboard", dashboardRouter);
router.use("/projects", projectsRouter);
router.use("/tasks", tasksRouter);
router.use("/notes", notesRouter);
router.use("/time-entries", timeEntriesRouter);
router.use("/documents", documentsRouter);
router.use("/settings", settingsRouter);
router.use("/webhooks/github", githubWebhooksRouter);
router.use("/attendance", attendanceRouter);
router.use("/leaves", leavesRouter);
router.use("/holidays", holidaysRouter);

