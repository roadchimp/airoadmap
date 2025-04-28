import React, { useState, useEffect } from 'react';

function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnvVars() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/debug-env');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEnvVars(data);
      } catch (e: any) {
        console.error('Error fetching debug env vars:', e);
        setError(e.message || 'Failed to fetch environment variables');
      } finally {
        setLoading(false);
      }
    }

    fetchEnvVars();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Debug Environment Variables (Production - Non-Sensitive)</h1>
      <p>
        This page fetches non-sensitive variables from the <code>/api/debug-env</code> endpoint.
        <br />
        <strong>Remember to remove this page and the API route after debugging!</strong>
      </p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {envVars && (
        <pre style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default DebugEnvPage; 