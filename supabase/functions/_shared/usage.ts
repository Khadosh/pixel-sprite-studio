import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

export const DAILY_LIMIT = 10;

export function quotaExceededMessage(limit: number): string {
  return `Límite diario de IA alcanzado (${limit}/${limit}). Vuelve mañana para seguir creando.`;
}

/**
 * Consume una unidad de la cuota diaria del usuario de forma atómica
 * (RPC `increment_ai_usage`, ver migración *_atomic_ai_usage.sql).
 * Debe llamarse ANTES de invocar al modelo. Devuelve el contador actual
 * o lanza HttpError 429 si el usuario ya alcanzó el límite.
 */
export async function consumeQuota(
  supabaseAdmin: SupabaseClient,
  userId: string,
  limit: number = DAILY_LIMIT,
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    throw new HttpError(500, "No se pudo verificar tu cuota de IA. Intenta de nuevo.", { cause: error });
  }
  const count = typeof data === "number" ? data : Number(data);
  if (!Number.isInteger(count)) {
    throw new HttpError(500, "No se pudo verificar tu cuota de IA. Intenta de nuevo.", {
      cause: `respuesta inesperada de increment_ai_usage: ${JSON.stringify(data)}`,
    });
  }
  if (count < 0) throw new HttpError(429, quotaExceededMessage(limit));
  return count;
}
