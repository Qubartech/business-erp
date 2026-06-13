-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "github_repo" TEXT;

-- CreateTable
CREATE TABLE "commits" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "committed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commits_project_id_idx" ON "commits"("project_id");

-- CreateIndex
CREATE INDEX "commits_committed_at_idx" ON "commits"("committed_at");

-- CreateIndex
CREATE UNIQUE INDEX "commits_project_id_sha_key" ON "commits"("project_id", "sha");

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "commits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
