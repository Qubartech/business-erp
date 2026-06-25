import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
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
  hasProjectManagement: z.boolean().optional(),
  hasPrivacy: z.boolean().optional(),
});

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    const { id } = params;
    const exists = await prisma.qubartechProduct.findUnique({
      where: { id },
    });
    if (!exists) throw NotFound("Product not found");

    if (body.slug) {
      body.slug = body.slug.toLowerCase().trim();
    }

    return prisma.qubartechProduct.update({
      where: { id },
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
    const exists = await prisma.qubartechProduct.findUnique({
      where: { id },
    });
    if (!exists) throw NotFound("Product not found");

    await prisma.qubartechProduct.delete({
      where: { id },
    });
    return { id };
  },
  {
    roles: ["admin", "manager"],
  }
);
