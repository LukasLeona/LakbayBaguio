import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

export function isCommunityConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  browserClient = url && key ? createClient(url, key) : null;
  return browserClient;
}

const adjectives = ["Cloud", "Cozy", "Foggy", "Gentle", "Misty", "Pine", "Quiet", "Sage", "Sunny", "Wandering"];
const nouns = ["Deer", "Finch", "Fox", "Hiker", "Owl", "Panda", "Robin", "Spruce", "Taho", "Trail"];

function randomAlias() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${adjective}${noun}${number}`;
}

export async function ensureAnonymousIdentity(client: SupabaseClient): Promise<{ user: User; alias: string; avatarSeed: number }> {
  let { data: { user } } = await client.auth.getUser();
  if (!user) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error || !data.user) throw error || new Error("Anonymous sign-in failed.");
    user = data.user;
  }

  const { data: current, error: readError } = await client.from("profiles").select("alias, avatar_seed").eq("user_id", user.id).maybeSingle();
  if (readError) throw readError;
  if (current) return { user, alias: current.alias, avatarSeed: current.avatar_seed };

  const alias = randomAlias();
  const avatarSeed = Math.floor(Math.random() * 8);
  const { error: insertError } = await client.from("profiles").insert({ user_id: user.id, alias, avatar_seed: avatarSeed });
  if (insertError) throw insertError;
  return { user, alias, avatarSeed };
}
