import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getCsrfToken() {
  // Try to get CSRF token from cookie (universal) or meta tag (fallback for SSR)
  if (typeof document !== 'undefined') {
    // Try meta tag first
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta && meta instanceof HTMLMetaElement) {
      return meta.content;
    }
    // Fallback to cookie
    const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return '';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse error JSON for user-friendly messages
    let errorMsg = `${res.status}: ${res.statusText}`;
    try {
      const data = await res.clone().json();
      if (data && data.error) errorMsg = data.error;
    } catch {}
    if (res.status === 401 || res.status === 403) {
      throw new Error('You are not logged in or your session has expired. Please log in again.');
    }
    throw new Error(errorMsg);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const maxRetries = 3;
  let retryCount = 0;
  let delay = 1000;

  while (retryCount < maxRetries) {
    try {
      const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
      // Attach CSRF token for mutating requests
      if (["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) {
        headers["x-csrf-token"] = getCsrfToken();
      }
      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        cache: "no-cache",
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API error: ${res.status}`, errorText || res.statusText);
      }
      await throwIfResNotOk(res);
      return res;
    } catch (error: any) {
      // User-friendly error for auth/CSRF/network
      if (error.message && (error.message.includes('login') || error.message.includes('CSRF'))) {
        alert(error.message);
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Network error. Please check your connection and try again.');
      }
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed after multiple retries");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    let delay = 1000; // Start with 1s delay
    
    while (retryCount < maxRetries) {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          // Add cache control to prevent stale responses
          cache: "no-cache",
        });
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }
        
        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        retryCount++;
        
        // If we've reached max retries, throw the error
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        console.log(`Retrying API request (${retryCount}/${maxRetries})...`);
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    
    // This shouldn't be reached due to the throw in the loop
    throw new Error("Failed after multiple retries");
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
