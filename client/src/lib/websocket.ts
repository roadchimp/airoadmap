// WebSocket connection manager
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;

type MessageHandler = (data: any) => void;
const messageHandlers: { [key: string]: MessageHandler[] } = {};

/**
 * Initialize WebSocket connection
 */
export function initializeWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    console.log('WebSocket connection already exists');
    return;
  }

  try {
    // Determine the correct WebSocket URL based on the current protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      reconnectAttempts = 0;
      
      // Send an initial handshake message
      send({
        type: 'handshake',
        client: 'browser',
        timestamp: Date.now()
      });
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // If this is a heartbeat message, respond to keep the connection alive
        if (data.type === 'heartbeat') {
          send({
            type: 'heartbeat_response',
            timestamp: Date.now()
          });
          return;
        }
        
        // Dispatch message to registered handlers
        if (data.type && messageHandlers[data.type]) {
          messageHandlers[data.type].forEach(handler => handler(data));
        }
        
        // Dispatch to '*' handlers that receive all messages
        if (messageHandlers['*']) {
          messageHandlers['*'].forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      socket = null;
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms...`);
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          initializeWebSocket();
        }, delay);
      } else {
        console.error('Maximum reconnection attempts reached');
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
  }
}

/**
 * Send a message through the WebSocket
 */
export function send(data: any): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }
  
  try {
    socket.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
}

/**
 * Register a message handler
 */
export function on(messageType: string, handler: MessageHandler): () => void {
  if (!messageHandlers[messageType]) {
    messageHandlers[messageType] = [];
  }
  
  messageHandlers[messageType].push(handler);
  
  // Return a function to unregister this handler
  return () => {
    messageHandlers[messageType] = messageHandlers[messageType].filter(h => h !== handler);
  };
}

/**
 * Check if WebSocket is connected
 */
export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

/**
 * Close WebSocket connection
 */
export function closeConnection() {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Clear all message handlers
  Object.keys(messageHandlers).forEach(key => {
    messageHandlers[key] = [];
  });
}