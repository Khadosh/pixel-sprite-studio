/**
 * Detecta errores de sesión expirada / no autorizada devueltos por Supabase
 * (PostgREST, Auth o Edge Functions) para cerrar sesión de forma global.
 */
export function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };

  if (e.status === 401) return true;
  // PostgREST: JWT expirado
  if (e.code === 'PGRST301') return true;

  const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';
  return message.includes('jwt expired') || message.includes('invalid jwt') || message.includes('jwt is expired');
}
