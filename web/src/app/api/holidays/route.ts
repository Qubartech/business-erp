import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createHolidaysService } from "@/lib/services/holidays.service";
import { createHolidaySchema } from "@/lib/services/holidays.schemas";
import { z } from "zod";

const service = createHolidaysService(container);

const listHolidaysQuerySchema = z.object({
  year: z.number().optional(),
});

export const GET = apiHandler(
  async (req, { query }) => {
    return service.list(query.year);
  },
  {
    querySchema: listHolidaysQuerySchema,
  }
);

export const POST = apiHandler(
  async (req, { body }) => {
    return service.create(body);
  },
  {
    roles: ["admin", "manager"],
    schema: createHolidaySchema,
    status: 201,
  }
);
