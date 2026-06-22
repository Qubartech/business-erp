import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createNotesService } from "@/lib/services/notes.service";
import { createNoteSchema, listNotesQuerySchema } from "@/lib/services/notes.schemas";

const service = createNotesService(container);

export const GET = apiHandler(
  async (req, { user, query }) => {
    return service.list(user.sub, query);
  },
  {
    querySchema: listNotesQuerySchema,
  }
);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.create(user.sub, body);
  },
  {
    schema: createNoteSchema,
    status: 201,
  }
);
