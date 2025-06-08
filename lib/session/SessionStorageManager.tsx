// lib/storage-manager.ts
import { StorageManager, SessionError} from './errorTypes';
import { CacheEntry, StorageConfig } from './sessionTypes';


class SessionStorageManager implements StorageManager {
  private config: StorageConfig;
  private errorHandlers: ((error: SessionError) => void)[] = [];

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async save<T>(key: string, data: T, storage: 'session' | 'local' = 'session'): Promise<void> {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      
      if (!this.isAvailable(storage)) {
        throw new Error(`${storage}Storage is not available`);
      }

      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (this.config.expirationHours * 60 * 60 * 1000),
        version: '1.0.0'
      };

      let serializedData = JSON.stringify(cacheEntry);
      
      if (this.config.compressionEnabled) {
        // Implement compression if needed
        serializedData = this.compress(serializedData);
      }

      if (this.config.encryptionEnabled) {
        // Implement encryption if needed
        serializedData = this.encrypt(serializedData);
      }

      storageObj.setItem(this.getStorageKey(key, storage), serializedData);
      
    } catch (error) {
      const sessionError: SessionError = {
        code: 'STORAGE_SAVE_ERROR',
        message: `Failed to save data to ${storage}Storage: ${error}`,
        severity: 'error',
        recoverable: true,
        timestamp: new Date().toISOString(),
        context: { key, storage, dataType: typeof data }
      };
      this.onError(sessionError);
      throw error;
    }
  }

  async load<T>(key: string, storage: 'session' | 'local' = 'session'): Promise<T | null> {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      
      if (!this.isAvailable(storage)) {
        return null;
      }

      const storedData = storageObj.getItem(this.getStorageKey(key, storage));
      
      if (!storedData) {
        return null;
      }

      let deserializedData = storedData;

      if (this.config.encryptionEnabled) {
        deserializedData = this.decrypt(deserializedData);
      }

      if (this.config.compressionEnabled) {
        deserializedData = this.decompress(deserializedData);
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(deserializedData);

      // Check if data has expired
      if (Date.now() > cacheEntry.expiresAt) {
        await this.remove(key, storage);
        return null;
      }

      return cacheEntry.data;
      
    } catch (error) {
      const sessionError: SessionError = {
        code: 'STORAGE_LOAD_ERROR',
        message: `Failed to load data from ${storage}Storage: ${error}`,
        severity: 'warning',
        recoverable: true,
        timestamp: new Date().toISOString(),
        context: { key, storage }
      };
      this.onError(sessionError);
      return null;
    }
  }

  async remove(key: string, storage: 'session' | 'local' = 'session'): Promise<void> {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      storageObj.removeItem(this.getStorageKey(key, storage));
    } catch (error) {
      this.onError({
        code: 'STORAGE_REMOVE_ERROR',
        message: `Failed to remove data from ${storage}Storage: ${error}`,
        severity: 'warning',
        recoverable: true,
        timestamp: new Date().toISOString(),
        context: { key, storage }
      });
    }
  }

  async clear(storage: 'session' | 'local' = 'session'): Promise<void> {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key?.startsWith('assessment_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      this.onError({
        code: 'STORAGE_CLEAR_ERROR',
        message: `Failed to clear ${storage}Storage: ${error}`,
        severity: 'error',
        recoverable: true,
        timestamp: new Date().toISOString(),
        context: { storage }
      });
    }
  }

  isAvailable(storage: 'session' | 'local' = 'session'): boolean {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const testKey = `__${storage}_test__`;
      storageObj.setItem(testKey, 'test');
      storageObj.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  onError(error: SessionError): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  addErrorHandler(handler: (error: SessionError) => void): void {
    this.errorHandlers.push(handler);
  }

  private getStorageKey(key: string, storage: 'session' | 'local'): string {
    const prefix = storage === 'session' ? this.config.sessionStorageKey : this.config.localStorageKey;
    return `${prefix}_${key}`;
  }

  private compress(data: string): string {
    // Simple compression implementation - in production, use a proper compression library
    return btoa(data);
  }

  private decompress(data: string): string {
    return atob(data);
  }

  private encrypt(data: string): string {
    // Simple encryption implementation - in production, use proper encryption
    return btoa(unescape(encodeURIComponent(data)));
  }

  private decrypt(data: string): string {
    return decodeURIComponent(escape(atob(data)));
  }
}

export default SessionStorageManager;
