import type { ServerConfig } from './config';

export function securityHeaders(_config: ServerConfig): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: https://vehicleimages.ukvehicledata.co.uk",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };
}

export function withResponseHeaders(
  response: Response,
  config: ServerConfig,
  noStore = false,
): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders(config))) headers.set(name, value);
  if (noStore) headers.set('Cache-Control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
