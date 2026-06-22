import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createDocumentsService } from "@/lib/services/documents.service";
import { listDocumentsQuerySchema, documentMetadataSchema } from "@/lib/services/documents.schemas";
import { fail, ok } from "@/lib/response";
import { requireAuth } from "@/lib/auth-middleware";

const service = createDocumentsService(container);

export const GET = apiHandler(
  async (req, { query }) => {
    return service.list(query as any);
  },
  {
    querySchema: listDocumentsQuerySchema,
  }
);

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const formData = await req.formData();
    
    const fileEntry = formData.get("file") as File | null;
    let file = undefined;
    if (fileEntry && fileEntry instanceof File) {
      const buffer = Buffer.from(await fileEntry.arrayBuffer());
      file = {
        buffer,
        originalname: fileEntry.name,
        mimetype: fileEntry.type,
        size: fileEntry.size,
      };
    }
    
    // Parse metadata fields
    const metadata = {
      projectId: formData.get("projectId") || undefined,
      taskId: formData.get("taskId") || undefined,
      category: formData.get("category") || undefined,
    };
    
    // Validate metadata using schemas
    const parsedMetadata = documentMetadataSchema.parse(metadata);
    
    const doc = await service.upload(user.sub, file, parsedMetadata);
    return ok(doc, "Document uploaded", 201);
  } catch (e: any) {
    console.error("Document upload failed:", e);
    return fail(500, e.message || "Upload failed");
  }
}
