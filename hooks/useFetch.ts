import { useAuth } from './UseAuth';

interface FetchOptions extends RequestInit {
  skipCsrf?: boolean;
}

export function useFetch() {
  const { csrfToken, refreshCsrfToken } = useAuth();

  const fetchWithCsrf = async (url: string, options: FetchOptions = {}) => {
    const { skipCsrf = false, ...fetchOptions } = options;
    
    // Add CSRF token to non-GET requests unless skipped
    if (!skipCsrf && options.method && options.method !== 'GET' && csrfToken) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'x-csrf-token': csrfToken
      };
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      // If we get a 403 with CSRF error, try to refresh the token and retry once
      if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'Invalid CSRF token') {
          await refreshCsrfToken();
          // Retry the request with the new token
          return fetch(url, {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              'x-csrf-token': csrfToken || ''
            }
          });
        }
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  return fetchWithCsrf;
} 