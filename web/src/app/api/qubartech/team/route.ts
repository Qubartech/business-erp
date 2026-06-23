import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  image: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  portfolio: z.string().nullable().optional(),
  x: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const GET = apiHandler(
  async () => {
    return prisma.qubartechTeamMember.findMany({
      orderBy: { order: "asc" },
    });
  },
  {
    requireAuth: false,
  }
);

export const POST = apiHandler(
  async (req, { body }) => {
    return prisma.qubartechTeamMember.create({
      data: {
        name: body.name,
        position: body.position,
        image: body.image ?? null,
        facebook: body.facebook ?? null,
        linkedin: body.linkedin ?? null,
        github: body.github ?? null,
        portfolio: body.portfolio ?? null,
        x: body.x ?? null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    });
  },
  {
    roles: ["admin", "manager"],
    schema: createTeamMemberSchema,
    status: 201,
  }
);
