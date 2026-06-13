import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  // Show host only (hide password)
  const safeUrl = dbUrl.replace(/\/\/.*:.*@/, '//***:***@');

  try {
    // Test actual DB connection
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        url_host: safeUrl,
        userCount,
      },
      env: {
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DIRECT_URL_SET: !!process.env.DIRECT_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      database: {
        connected: false,
        url_host: safeUrl,
        error: errorMessage,
      },
      env: {
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DIRECT_URL_SET: !!process.env.DIRECT_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    }, { status: 500 });
  }
}
