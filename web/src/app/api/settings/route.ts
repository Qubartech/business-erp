import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { upsertSettingSchema } from "@/lib/services/settings.schemas";

export const GET = apiHandler(async () => {
  const items = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  return { items };
});

export const PUT = apiHandler(
  async (req, { body }) => {
    const { key, value } = body;
    return prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  },
  {
    roles: ["admin"],
    schema: upsertSettingSchema,
  }
);
