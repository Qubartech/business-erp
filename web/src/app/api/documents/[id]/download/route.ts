import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createDocumentsService } from "@/lib/services/documents.service";

const service = createDocumentsService(container);

export const GET = apiHandler(async (req, { params }) => {
  return service.getDownloadUrl(params.id);
});
