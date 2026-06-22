import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createNotesService } from "@/lib/services/notes.service";
import { updateNoteSchema } from "@/lib/services/notes.schemas";

const service = createNotesService(container);

export const GET = apiHandler(async (req, { user, params }) => {
  return service.get(user.sub, params.id);
});

export const PATCH = apiHandler(
  async (req, { user, params, body }) => {
    return service.update(user.sub, params.id, body);
  },
  {
    schema: updateNoteSchema,
  }
);

export const DELETE = apiHandler(async (req, { user, params }) => {
  return service.remove(user.sub, params.id);
});
