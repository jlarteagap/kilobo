/**
 * Wrapper de fetch para llamadas a las rutas de API propias del app.
 * La autenticación usa session cookie (no header de token); solo se fija
 * el Content-Type por defecto para simplificar los cuerpos JSON.
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const { headers, ...rest } = options ?? {}
  return fetch(url, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}