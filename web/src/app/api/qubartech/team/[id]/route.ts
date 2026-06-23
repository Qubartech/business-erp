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

    // Delete image from Supabase if it was hosted there
    if (exists.image) {
      const { getSupabase } = await import("@/lib/container");
      const { env } = await import("@/lib/env");
      const bucketPrefix = `/storage/v1/object/public/${env.supabaseBucket}/`;
      if (exists.image.includes(bucketPrefix)) {
        const path = exists.image.slice(exists.image.indexOf(bucketPrefix) + bucketPrefix.length);
        try {
          await getSupabase().storage.from(env.supabaseBucket).remove([path]);
        } catch (err) {
          console.error("Failed to delete member image on deletion:", err);
        }
      }
    }

    await prisma.qubartechTeamMember.delete({
      where: { id },
    });
    return { id };
  },
  {
    roles: ["admin", "manager"],
  }
);
