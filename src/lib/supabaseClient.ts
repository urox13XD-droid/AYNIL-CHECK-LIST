import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null when the env vars aren't configured — shared sessions are simply unavailable, the app still works fully locally */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
