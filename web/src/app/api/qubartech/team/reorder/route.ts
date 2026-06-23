import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    })
  ),
});

export const POST = apiHandler(
  async (req, { body }) => {
    const { orders } = body;

    await prisma.$transaction(
      orders.map((o) =>
        prisma.qubartechTeamMember.update({
          where: { id: o.id },
          data: { order: o.order },
        })
      )
    );

    return { success: true };
  },
  {
    roles: ["admin", "manager"],
    schema: reorderSchema,
  }
);
