const HEADER = 'authorization';

export function isPraktoIntegrationAuthorized(request: Request): boolean {
  const secret = process.env.PRAKTO_INTEGRATION_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get(HEADER);
  return auth === `Bearer ${secret}`;
}

export function praktoIntegrationNotConfiguredResponse() {
  return Response.json(
    { success: false, error: 'PRAKTO_INTEGRATION_SECRET no configurado' },
    { status: 503 }
  );
}

export function praktoIntegrationUnauthorizedResponse() {
  return Response.json({ success: false, error: 'No autorizado' }, { status: 401 });
}
