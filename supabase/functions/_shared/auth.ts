import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

/** Cliente con service role (inyectado por la CLI/plataforma como SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY). */
export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new HttpError(500, "Error de configuración del servidor.", {
      cause: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas",
    });
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Exige un usuario autenticado. Verifica el JWT contra GoTrue (firma + expiración),
 * a diferencia de decodificarlo a mano con atob. Lanza HttpError 401 si falla.
 */
export async function requireUser(req: Request, supabaseAdmin: SupabaseClient): Promise<User> {
  const header = req.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) throw new HttpError(401, "No se proporcionó token de autorización");

  const { data, error } = await supabaseAdmin.auth.getUser(match[1]);
  if (error || !data?.user) throw new HttpError(401, "No autorizado");
  return data.user;
}
