import { NextRequest, NextResponse } from 'next/server';
import {
  isPraktoIntegrationAuthorized,
  praktoIntegrationNotConfiguredResponse,
  praktoIntegrationUnauthorizedResponse,
} from '@/lib/integrations/prakto-auth';
import { currentFinanceYearMonth, getPraktoFinanceReport } from '@/lib/integrations/prakto-finance';

export const dynamic = 'force-dynamic';

/**
 * Finance snapshot for Prakto admin.
 *
 * Auth: Authorization: Bearer <PRAKTO_INTEGRATION_SECRET>
 * Query: ?month=YYYY-MM (optional, defaults to current month in America/Bogota)
 */
export async function GET(request: NextRequest) {
  if (!process.env.PRAKTO_INTEGRATION_SECRET?.trim()) {
    return praktoIntegrationNotConfiguredResponse();
  }
  if (!isPraktoIntegrationAuthorized(request)) {
    return praktoIntegrationUnauthorizedResponse();
  }

  try {
    const month = request.nextUrl.searchParams.get('month') ?? currentFinanceYearMonth();
    const data = await getPraktoFinanceReport(month);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[integrations/prakto/finance GET]', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte de finanzas' },
      { status: 500 }
    );
  }
}
