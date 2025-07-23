import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

/**
 * Health check endpoint that also serves as a database keep-alive mechanism
 * This can be called by external monitoring services to prevent database suspension
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Perform a simple database operation to test connectivity  
    const organizations = await storage.listOrganizations();
    const orgCount = organizations.length;
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      organizationCount: orgCount,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'local',
      message: 'Database connection is operational'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'local'
    }, { status: 503 });
  }
} 