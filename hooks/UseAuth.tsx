import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@../../utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  organizationId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  csrfToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, organizationName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshCsrfToken: () => Promise<void>;
}

interface UserMetadata {
  organization_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Function to fetch a new CSRF token
  const refreshCsrfToken = async (userToUse?: User | null) => {
    const currentUser = userToUse || user;
    console.log('refreshCsrfToken called, user:', currentUser?.id);
    
    if (!currentUser) {
      console.log('No user found, setting CSRF token to null');
      setCsrfToken(null);
      return;
    }

    try {
      console.log('Fetching CSRF token for user:', currentUser.id);
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
      });

      console.log('CSRF token response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CSRF token fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const { token } = await response.json();
      console.log('CSRF token received:', token ? 'yes' : 'no');
      setCsrfToken(token);
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      setCsrfToken(null);
    }
  };

  // Check initial auth status and set up auth state listener
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          // Extract organization ID from user metadata
          const metadata = session.user.user_metadata as UserMetadata;
          setOrganizationId(metadata?.organization_id || null);
          // Fetch initial CSRF token with the actual user
          await refreshCsrfToken(session.user);
        } else {
          setUser(null);
          setOrganizationId(null);
          setCsrfToken(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setOrganizationId(null);
        setCsrfToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Extract organization ID from user metadata
          const metadata = session.user.user_metadata as UserMetadata;
          setOrganizationId(metadata?.organization_id || null);
          // Refresh CSRF token on auth state change with the actual user
          await refreshCsrfToken(session.user);
        } else {
          setUser(null);
          setOrganizationId(null);
          setCsrfToken(null);
        }
        setIsLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const metadata = data.user.user_metadata as UserMetadata;
        setOrganizationId(metadata?.organization_id || null);
        // Refresh CSRF token after login with the actual user
        await refreshCsrfToken(data.user);
      }

      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, organizationName: string) => {
    setIsLoading(true);
    try {
      // Call your API endpoint that handles organization creation and user signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          organizationName
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      // Refresh CSRF token after signup
      await refreshCsrfToken();
      return { success: true };
    } catch (error) {
      console.error("Signup failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Signup failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setOrganizationId(null);
      setCsrfToken(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data.user) {
        setUser(data.user);
        const metadata = data.user.user_metadata as UserMetadata;
        setOrganizationId(metadata?.organization_id || null);
        // Refresh CSRF token after session refresh
        await refreshCsrfToken();
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
    }
  };

  const value = {
    user,
    organizationId,
    isLoading,
    isAuthenticated: !!user && !isLoading,
    csrfToken,
    login,
    signup,
    logout,
    refreshSession,
    refreshCsrfToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

