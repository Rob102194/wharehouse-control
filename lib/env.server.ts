import "server-only";

function readServerEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseServiceRoleKey(): string {
  return readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
}
