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
        'SET_STEP_DATA',
        'SET_CURRENT_STEP',
        'INITIALIZE_SESSION'
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
  
            // Save role selection data to localStorage for persistence
            const roleSelectionStep = currentState.steps.find(step => step.id === 'role-selection');
            if (roleSelectionStep?.data?.roleSelection?.selectedRoles && roleSelectionStep.data.roleSelection.selectedRoles.length > 0) {
              await (context.storage as SessionStorageManager).save(
                'user_preferences',
                {
                  selectedRoles: roleSelectionStep.data.roleSelection.selectedRoles,
                  lastUpdated: new Date().toISOString()
                },
                'local'
              );
            }
  
            lastSaveTime = Date.now();
            context.dispatch({ 
              type: 'SESSION_SAVED', 
              payload: { timestamp: Date.now() } 
            });
  
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            context.dispatch({ type: 'SET_AUTO_SAVING', payload: false });
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