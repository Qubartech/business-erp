import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createDocumentsService } from "@/lib/services/documents.service";

const service = createDocumentsService(container);

export const DELETE = apiHandler(async (req, { params, user }) => {
  return service.remove(params.id, user.sub);
});
