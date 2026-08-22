import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  shortName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  isNonProfit: z.boolean().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  coverGradient: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  techStack: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  stats: z.string().nullable().optional(),
  detailsContent: z.string().nullable().optional(),
  status: z.string().optional(),
  privacyPolicy: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  hasProjectManagement: z.boolean().optional(),
  hasDetails: z.boolean().optional(),
  hasPrivacy: z.boolean().optional(),
});

export const GET = apiHandler(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    return prisma.qubartechProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  },
  {
    requireAuth: false,
  }
);

export const POST = apiHandler(
  async (req, { body }) => {
    return prisma.qubartechProduct.create({
      data: {
        name: body.name,
        slug: body.slug.toLowerCase().trim(),
        shortName: body.shortName ?? null,
        tagline: body.tagline ?? null,
        badge: body.badge ?? null,
        isNonProfit: body.isNonProfit ?? false,
        category: body.category ?? null,
        description: body.description ?? null,
        features: body.features ?? null,
        icon: body.icon ?? null,
        color: body.color ?? null,
        coverGradient: body.coverGradient ?? null,
        tags: body.tags ?? null,
        image: body.image ?? null,
        link: body.link ?? null,
        githubUrl: body.githubUrl ?? null,
        techStack: body.techStack ?? null,
        mission: body.mission ?? null,
        stats: body.stats ?? null,
        detailsContent: body.detailsContent ?? null,
        status: body.status ?? "live",
        privacyPolicy: body.privacyPolicy ?? null,
        isActive: body.isActive ?? true,
        hasProjectManagement: body.hasProjectManagement ?? true,
        hasDetails: body.hasDetails ?? true,
        hasPrivacy: body.hasPrivacy ?? true,
      },
    });
  },
  {
    roles: ["admin", "manager"],
    schema: createProductSchema,
    status: 201,
  }
);
