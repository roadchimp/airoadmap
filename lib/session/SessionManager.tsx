// Central session management with dual storage strategy
import { useEffect, useState } from 'react';
import { StorageManager, SessionError, CacheEntry, StorageConfig } from './ErrorTypes';

type SessionState = {
    currentStep: number;
    formData: Record<string, any>;
    roles: string[];
    departments: string[];
  };
  
const SESSION_KEY = 'tk-session';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Add cache validation logic to getFromLocalCache
const getFromLocalCache = (assessmentId: number | undefined): Partial<WizardStepData> | null => {
    if (!assessmentId) return null;
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${assessmentId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${assessmentId}`);
      }
    } catch (e) {
      console.error('[Cache] Failed to retrieve assessment data from cache:', e);
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${assessmentId}`);
    }
    return null;
  };


export const useSessionManager = () => {
    const [session, setSession] = useState<SessionState>(() => {
      if (typeof window === 'undefined') return initialSession;
      const saved = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : initialSession;
    });

 // Auto-save with debouncing
 useEffect(() => {
    const timeout = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      if (session.currentStep > 1) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [session]);

    // Add Neon connection pooling setup here
    const neonConfig = {
        connectionString: process.env.DATABASE_URL,
        pool: { min: 2, max: 10 }
      };

    return { session, setSession, neonConfig };
};

const initialSession: SessionState = {
    currentStep: 1,
    formData: {},
    roles: [],
    departments: []
  };