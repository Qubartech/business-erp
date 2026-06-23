import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "qubartech";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("Starting image migration to Supabase Storage...");
  
  const members = await prisma.qubartechTeamMember.findMany();
  console.log(`Found ${members.length} team members in database.`);

  const localImagesDir = "/Users/tahirahmad/Projects/qubartech/qubartech-v2/public/image/our_teams";

  for (const member of members) {
    if (!member.image) {
      console.log(`- Skipping ${member.name}: no image path`);
      continue;
    }

    // Check if it's a local path
    if (member.image.startsWith("/image/our_teams/")) {
      const filename = path.basename(member.image);
      const localFilePath = path.join(localImagesDir, filename);

      if (!fs.existsSync(localFilePath)) {
        console.warn(`- Warning: Local file not found for ${member.name} at ${localFilePath}`);
        continue;
      }

      console.log(`- Migrating image for ${member.name}: ${filename}`);
      try {
        const buffer = fs.readFileSync(localFilePath);
        
        // Generate a unique path in Supabase
        const ext = path.extname(filename) || ".jpg";
        const storagePath = `team-members/${crypto.randomUUID()}${ext}`;
        
        // Detect content type
        let contentType = "image/jpeg";
        if (ext === ".png") contentType = "image/png";
        if (ext === ".webp") contentType = "image/webp";

        // Upload to supabase storage
        const { data, error } = await supabase.storage
          .from(supabaseBucket)
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;
        console.log(`  Uploaded successfully. Public URL: ${publicUrl}`);

        // Update database record
        await prisma.qubartechTeamMember.update({
          where: { id: member.id },
          data: { image: publicUrl },
        });
        console.log(`  Updated database record for ${member.name}.`);

      } catch (err: any) {
        console.error(`  Error migrating image for ${member.name}:`, err.message || err);
      }
    } else {
      console.log(`- Skipping ${member.name}: image is already an external URL (${member.image})`);
    }
  }

  console.log("Migration finished.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
