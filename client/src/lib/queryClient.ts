import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add retry logic with exponential backoff
  const maxRetries = 3;
  let retryCount = 0;
  let delay = 1000; // Start with 1s delay
  
  while (retryCount < maxRetries) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        // Add cache control to prevent stale responses
        cache: "no-cache",
      });
      
      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      retryCount++;
      
      // If we've reached max retries, throw the error
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  // This shouldn't be reached due to the throw in the loop
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
