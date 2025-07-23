'use client';

import { useState, useEffect } from 'react';

interface ConnectionMetrics {
  systemInfo: {
    timestamp: string;
    vercelEnv: string;
    nodeEnv: string;
    vercelRegion: string;
    functionName: string;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    uptime: number;
  };
  connectionMetrics: {
    summary: {
      totalInstancesCreated: number;
      activeInstances: number;
      totalActiveQueries: number;
      totalQueries: number;
      totalKeepAliveFailures: number;
      totalHealthCheckFailures: number;
    };
    instances: Array<{
      instanceId: string;
      created: string;
      connectionState: string;
      activeQueries: number;
      totalQueries: number;
      keepAliveSuccesses: number;
      keepAliveFailures: number;
      healthCheckFailures: number;
      uptime: number;
      lastActivityAge: number;
    }>;
  };
  healthIndicators: {
    connectionIssues: boolean;
    highFailureRate: boolean;
    multipleInstances: boolean;
    stalledConnections: number;
    criticalIssues: string[];
  };
  recommendations: string[];
}

export default function ConnectionMonitorDashboard() {
  const [metrics, setMetrics] = useState<ConnectionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/connection-monitor', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Connection Monitor</h1>
        <div>Loading connection metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Connection Monitor</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={fetchMetrics}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Database Connection Monitor</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button 
            onClick={fetchMetrics}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {metrics.healthIndicators.criticalIssues.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold mb-2">🚨 Critical Issues Detected</h3>
          <ul className="list-disc list-inside">
            {metrics.healthIndicators.criticalIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-2">System Info</h3>
          <div className="text-sm space-y-1">
            <div><strong>Environment:</strong> {metrics.systemInfo.vercelEnv}</div>
            <div><strong>Region:</strong> {metrics.systemInfo.vercelRegion || 'N/A'}</div>
            <div><strong>Uptime:</strong> {formatDuration(metrics.systemInfo.uptime * 1000)}</div>
            <div><strong>Memory:</strong> {formatBytes(metrics.systemInfo.memoryUsage.heapUsed)} / {formatBytes(metrics.systemInfo.memoryUsage.heapTotal)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-2">Connection Summary</h3>
          <div className="text-sm space-y-1">
            <div><strong>Active Instances:</strong> <span className={metrics.connectionMetrics.summary.activeInstances > 1 ? 'text-orange-600 font-bold' : ''}>{metrics.connectionMetrics.summary.activeInstances}</span></div>
            <div><strong>Total Created:</strong> {metrics.connectionMetrics.summary.totalInstancesCreated}</div>
            <div><strong>Active Queries:</strong> <span className={metrics.connectionMetrics.summary.totalActiveQueries > 5 ? 'text-red-600 font-bold' : ''}>{metrics.connectionMetrics.summary.totalActiveQueries}</span></div>
            <div><strong>Total Queries:</strong> {metrics.connectionMetrics.summary.totalQueries}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-2">Health Status</h3>
          <div className="text-sm space-y-1">
            <div><strong>Keep-Alive Failures:</strong> <span className={metrics.connectionMetrics.summary.totalKeepAliveFailures > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{metrics.connectionMetrics.summary.totalKeepAliveFailures}</span></div>
            <div><strong>Health Check Failures:</strong> <span className={metrics.connectionMetrics.summary.totalHealthCheckFailures > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{metrics.connectionMetrics.summary.totalHealthCheckFailures}</span></div>
            <div><strong>Stalled Connections:</strong> <span className={metrics.healthIndicators.stalledConnections > 0 ? 'text-orange-600 font-bold' : 'text-green-600'}>{metrics.healthIndicators.stalledConnections}</span></div>
          </div>
        </div>
      </div>

      {/* Instance Details */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-bold text-gray-700 mb-4">Active Instances ({metrics.connectionMetrics.instances.length})</h3>
        {metrics.connectionMetrics.instances.length === 0 ? (
          <div className="text-gray-500 italic">No active instances</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Instance ID</th>
                  <th className="text-left p-2">State</th>
                  <th className="text-left p-2">Uptime</th>
                  <th className="text-left p-2">Last Activity</th>
                  <th className="text-left p-2">Queries</th>
                  <th className="text-left p-2">Keep-Alive</th>
                  <th className="text-left p-2">Health Checks</th>
                </tr>
              </thead>
              <tbody>
                {metrics.connectionMetrics.instances.map((instance) => (
                  <tr key={instance.instanceId} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{instance.instanceId}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        instance.connectionState === 'connected' ? 'bg-green-100 text-green-800' :
                        instance.connectionState === 'failed' ? 'bg-red-100 text-red-800' :
                        instance.connectionState === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.connectionState}
                      </span>
                    </td>
                    <td className="p-2">{formatDuration(instance.uptime)}</td>
                    <td className="p-2">
                      <span className={instance.lastActivityAge > 300000 ? 'text-red-600 font-bold' : ''}>
                        {formatDuration(instance.lastActivityAge)} ago
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={instance.activeQueries > 0 ? 'font-bold' : ''}>
                        {instance.activeQueries}
                      </span>
                      <span className="text-gray-500"> / {instance.totalQueries}</span>
                    </td>
                    <td className="p-2">
                      <span className="text-green-600">{instance.keepAliveSuccesses}</span>
                      {instance.keepAliveFailures > 0 && (
                        <span className="text-red-600"> / {instance.keepAliveFailures} fails</span>
                      )}
                    </td>
                    <td className="p-2">
                      {instance.healthCheckFailures > 0 ? (
                        <span className="text-red-600 font-bold">{instance.healthCheckFailures} failures</span>
                      ) : (
                        <span className="text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">💡 Recommendations</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            {metrics.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        Last updated: {new Date(metrics.systemInfo.timestamp).toLocaleString()}
      </div>
    </div>
  );
}