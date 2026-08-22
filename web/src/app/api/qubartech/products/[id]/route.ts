import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
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
  async (req, { params }) => {
    const { id } = params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const product = await prisma.qubartechProduct.findFirst({
      where: isUuid
        ? { OR: [{ id }, { slug: id.toLowerCase().trim() }] }
        : { slug: id.toLowerCase().trim() },
    });

    if (!product) {
      throw NotFound("Product not found");
    }

    return product;
  },
  {
    requireAuth: false,
  }
);

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    const { id } = params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const exists = await prisma.qubartechProduct.findFirst({
      where: isUuid
        ? { OR: [{ id }, { slug: id.toLowerCase().trim() }] }
        : { slug: id.toLowerCase().trim() },
    });
    if (!exists) throw NotFound("Product not found");

    if (body.slug) {
      body.slug = body.slug.toLowerCase().trim();
    }

    return prisma.qubartechProduct.update({
      where: { id: exists.id },
      data: body,
    });
  },
  {
    roles: ["admin", "manager"],
    schema: updateProductSchema,
  }
);

export const DELETE = apiHandler(
  async (req, { params }) => {
    const { id } = params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const exists = await prisma.qubartechProduct.findFirst({
      where: isUuid
        ? { OR: [{ id }, { slug: id.toLowerCase().trim() }] }
        : { slug: id.toLowerCase().trim() },
    });
    if (!exists) throw NotFound("Product not found");

    await prisma.qubartechProduct.delete({
      where: { id: exists.id },
    });
    return { id: exists.id };
  },
  {
    roles: ["admin", "manager"],
  }
);
