// types/errors.ts
export interface SessionError {
    code: string;
    message: string;
    severity: 'warning' | 'error' | 'fatal';
    recoverable: boolean;
    timestamp: string;
    context?: Record<string, any>;
  }
  
  export interface RecoveryStrategy {
    type: 'retry' | 'fallback' | 'reset' | 'migrate';
    maxAttempts: number;
    delay: number;
    fallbackData?: any;
  }
  
  export interface StorageManager {
    save: <T>(key: string, data: T, storage?: 'session' | 'local') => Promise<void>;
    load: <T>(key: string, storage?: 'session' | 'local') => Promise<T | null>;
    remove: (key: string, storage?: 'session' | 'local') => Promise<void>;
    clear: (storage?: 'session' | 'local') => Promise<void>;
    isAvailable: (storage?: 'session' | 'local') => boolean;
    onError: (error: SessionError) => void;
  }
  