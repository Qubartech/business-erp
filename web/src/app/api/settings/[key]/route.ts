import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const DELETE = apiHandler(
  async (req, { params }) => {
    await prisma.setting.deleteMany({ where: { key: params.key } });
    return { key: params.key };
  },
  {
    roles: ["admin"],
  }
);
