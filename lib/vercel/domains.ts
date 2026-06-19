const VERCEL_API = 'https://api.vercel.com';

export interface VercelDomainResult {
  added: boolean;
  verified: boolean;
  error?: string;
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
}

/** Add domain to Vercel project and return verification records */
export async function addDomainToVercel(domain: string): Promise<VercelDomainResult> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return {
      added: false,
      verified: false,
      error: 'VERCEL_API_TOKEN o VERCEL_PROJECT_ID no configurados',
    };
  }

  try {
    const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg = json.error?.message ?? json.message ?? 'Error al agregar dominio';
      if (msg.includes('already exists') || res.status === 409) {
        return checkDomainVerification(domain);
      }
      return { added: false, verified: false, error: msg };
    }

    return {
      added: true,
      verified: json.verified === true,
      verification: json.verification ?? [],
    };
  } catch (err) {
    console.error('[Vercel] addDomain error:', err);
    return { added: false, verified: false, error: 'Error de conexión con Vercel API' };
  }
}

/** Check if domain is verified on Vercel project */
export async function checkDomainVerification(domain: string): Promise<VercelDomainResult> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return { added: false, verified: false, error: 'Vercel no configurado' };
  }

  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      return { added: false, verified: false, error: 'Dominio no encontrado en Vercel' };
    }

    const json = await res.json();
    return {
      added: true,
      verified: json.verified === true,
      verification: json.verification ?? [],
    };
  } catch (err) {
    console.error('[Vercel] checkDomain error:', err);
    return { added: false, verified: false, error: 'Error al verificar dominio' };
  }
}
