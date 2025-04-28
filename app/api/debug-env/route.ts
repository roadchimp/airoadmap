import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose non-sensitive variables!
  // Never expose secrets like API keys or passwords.
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '***set***' : '***not set***',
    DATABASE_PGHOST: process.env.DATABASE_PGHOST ? '***set***' : '***not set***',
    DATABASE_PGDATABASE: process.env.DATABASE_PGDATABASE ? '***set***' : '***not set***',
    DATABASE_PGUSER: process.env.DATABASE_PGUSER ? '***set***' : '***not set***',
    // Add more non-sensitive variables here if needed
  });
}
