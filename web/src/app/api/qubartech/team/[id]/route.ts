import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import { z } from "zod";

const updateTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  position: z.string().min(1, "Position is required").optional(),
  image: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  portfolio: z.string().nullable().optional(),
  x: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    const { id } = params;
    const exists = await prisma.qubartechTeamMember.findUnique({
      where: { id },
    });
    if (!exists) throw NotFound("Team member not found");

    return prisma.qubartechTeamMember.update({
      where: { id },
      data: body,
    });
  },
  {
    roles: ["admin", "manager"],
    schema: updateTeamMemberSchema,
  }
);

export const DELETE = apiHandler(
  async (req, { params }) => {
    const { id } = params;
    const exists = await prisma.qubartechTeamMember.findUnique({
      where: { id },
    });
    if (!exists) throw NotFound("Team member not found");

    await prisma.qubartechTeamMember.delete({
      where: { id },
    });
    return { id };
  },
  {
    roles: ["admin", "manager"],
  }
);
