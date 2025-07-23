import { NextRequest, NextResponse } from 'next/server';
import { PgStorage } from '../../../server/pg-storage';

export async function GET(request: NextRequest) {
  try {
    // Get connection metrics from all PgStorage instances
    const globalMetrics = (PgStorage as any).getGlobalConnectionMetrics();
    
    // Add additional system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      vercelEnv: process.env.VERCEL_ENV || 'local',
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
      // Memory and runtime info
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };

    // Calculate connection health indicators
    const healthIndicators = {
      connectionIssues: globalMetrics.summary.totalHealthCheckFailures > 0,
      highFailureRate: globalMetrics.summary.totalKeepAliveFailures > globalMetrics.summary.totalQueries * 0.1,
      multipleInstances: globalMetrics.summary.activeInstances > 1,
      stalledConnections: globalMetrics.instances.filter((i: any) => i.lastActivityAge > 300000).length, // 5+ minutes inactive
      criticalIssues: [] as string[]
    };

    // Identify critical issues
    if (globalMetrics.summary.activeInstances > 3) {
      healthIndicators.criticalIssues.push(`High instance count: ${globalMetrics.summary.activeInstances} active instances`);
    }
    
    if (globalMetrics.summary.totalActiveQueries > 10) {
      healthIndicators.criticalIssues.push(`High concurrent queries: ${globalMetrics.summary.totalActiveQueries} active`);
    }
    
    if (healthIndicators.stalledConnections > 0) {
      healthIndicators.criticalIssues.push(`${healthIndicators.stalledConnections} instances with no activity >5min`);
    }

    const response = {
      systemInfo,
      connectionMetrics: globalMetrics,
      healthIndicators,
      recommendations: generateRecommendations(globalMetrics, healthIndicators)
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[ConnectionMonitor API] Error fetching connection metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch connection metrics',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

function generateRecommendations(metrics: any, health: any): string[] {
  const recommendations: string[] = [];

  if (health.multipleInstances) {
    recommendations.push('Multiple PgStorage instances detected - consider implementing connection pooling limits');
  }

  if (health.highFailureRate) {
    recommendations.push('High keep-alive failure rate detected - check Neon database connectivity');
  }

  if (health.stalledConnections > 0) {
    recommendations.push('Stalled connections detected - implement connection cleanup on timeout');
  }

  if (metrics.summary.totalHealthCheckFailures > 5) {
    recommendations.push('Frequent health check failures - consider disabling DirectTCP fallback temporarily');
  }

  if (metrics.summary.activeInstances === 0) {
    recommendations.push('No active instances detected - this may indicate connection initialization issues');
  }

  return recommendations;
}

// Also support POST for triggering connection cleanup (debugging only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'cleanup') {
      // This would trigger cleanup of stalled connections
      // Implementation depends on how you want to handle cleanup
      return NextResponse.json({ 
        message: 'Connection cleanup triggered',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}