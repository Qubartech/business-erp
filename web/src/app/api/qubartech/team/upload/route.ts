import { getSupabase } from "@/lib/container";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/response";
import { requireAuth } from "@/lib/auth-middleware";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const formData = await req.formData();
    const fileEntry = formData.get("file") as File | null;
    const oldUrl = formData.get("oldUrl") as string | null;

    if (!fileEntry || !(fileEntry instanceof File)) {
      return fail(400, "Missing file upload");
    }

    const supabaseClient = getSupabase();

    // 1. Delete the old image if it is hosted on Supabase to keep storage footprint very low
    if (oldUrl) {
      const bucketPrefix = `/storage/v1/object/public/${env.supabaseBucket}/`;
      if (oldUrl.includes(bucketPrefix)) {
        const oldPath = oldUrl.slice(oldUrl.indexOf(bucketPrefix) + bucketPrefix.length);
        try {
          await supabaseClient.storage.from(env.supabaseBucket).remove([oldPath]);
        } catch (err) {
          console.error("Failed to delete old Supabase image:", err);
        }
      }
    }

    // 2. Upload the new image
    const ext = fileEntry.name.includes(".") ? fileEntry.name.slice(fileEntry.name.lastIndexOf(".")) : ".jpg";
    const path = `team-members/${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    const { error } = await supabaseClient.storage.from(env.supabaseBucket).upload(path, buffer, {
      contentType: fileEntry.type,
      upsert: true,
    });

    if (error) {
      return fail(400, `Storage upload failed: ${error.message}`);
    }

    // 3. Get the public URL
    const { data } = supabaseClient.storage.from(env.supabaseBucket).getPublicUrl(path);

    return ok({ url: data.publicUrl }, "Image uploaded successfully", 201);
  } catch (e: any) {
    console.error("Team image upload failed:", e);
    return fail(500, e.message || "Upload failed");
  }
}
