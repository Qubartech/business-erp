import { prisma } from "./prisma";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabase: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      throw new Error("Supabase credentials not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    }
    supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}

export type Container = {
  prisma: typeof prisma;
  supabase: typeof getSupabase;
};

export const container: Container = { prisma, supabase: getSupabase };
