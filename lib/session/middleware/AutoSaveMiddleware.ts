import { Middleware, MiddlewareContext, SessionAction } from '../sessionTypes';
import SessionStorageManager from '../SessionStorageManager';


export const createAutoSaveMiddleware = (
    saveInterval: number = 5000,
    debounceDelay: number = 1000
  ): Middleware => {
    let saveTimer: NodeJS.Timeout | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    let lastSaveTime = 0;
  
    return (context: MiddlewareContext) => (next) => (action: SessionAction) => {
      // Call the next middleware/reducer first
      next(action);
  
      // Actions that should trigger auto-save
      const autoSaveActions = [
        'UPDATE_STEP_DATA',
        'SELECT_DEPARTMENT', 
        'SELECT_JOB_ROLE',
        'MARK_STEP_COMPLETED',
        'SET_CURRENT_STEP'
      ];
  
      if (autoSaveActions.includes(action.type)) {
        // Clear existing timers
        if (debounceTimer) clearTimeout(debounceTimer);
        if (saveTimer) clearTimeout(saveTimer);
  
        // Set debounced save
        debounceTimer = setTimeout(async () => {
          const currentState = context.getState();
          
          try {
            context.dispatch({ type: 'SET_AUTO_SAVING', payload: true });
            
            // Save session data to sessionStorage
            await (context.storage as SessionStorageManager).save(
              'current_session', 
              currentState, 
              'session'
            );
  
            // Save department/role data to localStorage for persistence
            if (currentState.selectedDepartment || currentState.selectedJobRole) {
              await (context.storage as SessionStorageManager).save(
                'user_preferences',
                {
                  department: currentState.selectedDepartment,
                  jobRole: currentState.selectedJobRole,
                  lastUpdated: new Date().toISOString()
                },
                'local'
              );
            }
  
            lastSaveTime = Date.now();
            context.dispatch({ 
              type: 'SESSION_SAVED', 
              payload: new Date().toISOString() 
            });
  
          } catch (error) {
            context.dispatch({ 
              type: 'SESSION_LOAD_ERROR', 
              payload: `Auto-save failed: ${error}` 
            });
          }
        }, debounceDelay);
  
        // Set interval save as backup
        saveTimer = setTimeout(() => {
          if (Date.now() - lastSaveTime >= saveInterval) {
            debounceTimer && clearTimeout(debounceTimer);
            // Trigger immediate save
            setTimeout(() => {
              if (debounceTimer) clearTimeout(debounceTimer);
            }, 0);
          }
        }, saveInterval);
      }
    };
  };