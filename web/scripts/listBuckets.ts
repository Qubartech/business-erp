import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "qubartech";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log(`Listing files in bucket "${supabaseBucket}", folder "team-members"...`);
  const { data, error } = await supabase.storage
    .from(supabaseBucket)
    .list("team-members");

  if (error) {
    console.error("Failed to list files:", error);
  } else {
    console.log("Files found:", JSON.stringify(data, null, 2));
  }
}

main();
