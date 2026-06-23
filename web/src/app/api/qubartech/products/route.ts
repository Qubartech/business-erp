import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  status: z.string().optional(),
  privacyPolicy: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const GET = apiHandler(
  async () => {
    return prisma.qubartechProduct.findMany({
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
        category: body.category ?? null,
        description: body.description ?? null,
        features: body.features ?? null,
        icon: body.icon ?? null,
        color: body.color ?? null,
        tags: body.tags ?? null,
        image: body.image ?? null,
        link: body.link ?? null,
        status: body.status ?? "live",
        privacyPolicy: body.privacyPolicy ?? null,
        isActive: body.isActive ?? true,
      },
    });
  },
  {
    roles: ["admin", "manager"],
    schema: createProductSchema,
    status: 201,
  }
);
