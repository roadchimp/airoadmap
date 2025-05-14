import { NextResponse } from 'next/server';

/**
 * GET /api/public/auth-status
 * A debugging endpoint to check authentication status and environment
 */
export async function GET() {
  // Return sanitized environment information and auth status
  // Do not include any sensitive information
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set', // Just indicate if it's set, don't return the actual value
    DATABASE_POSTGRES_URL: process.env.DATABASE_POSTGRES_URL ? 'set' : 'not set',
    // Add any other relevant (non-sensitive) environment variables
  };
  
  return NextResponse.json({
    status: 'success',
    message: 'You can access this public endpoint',
    environment: envInfo,
    timestamp: new Date().toISOString()
  });
} 