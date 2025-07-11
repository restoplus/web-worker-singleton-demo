import LoggerSingleton from '../singletons/LoggerSingleton';

export interface WorkerMessage {
  type: 'LOG_MESSAGE' | 'GET_BUFFER_STATUS' | 'FORCE_FLUSH' | 'GET_INSTANCE_ID' | 'PING' | 'START_LOGGING' | 'STOP_LOGGING';
  payload?: any;
  timestamp?: number;
}

export interface WorkerResponse {
  type: 'BUFFER_STATUS' | 'INSTANCE_ID' | 'LOG_COMPLETE' | 'PONG' | 'FLUSH_COMPLETE' | 'WORKER_LOG' | 'LOGGING_STATUS';
  data: any;
  timestamp?: number;
}

// Initialize the logger singleton in the worker context
const loggerSingleton = LoggerSingleton.getInstance();

// Auto-logging state
let autoLoggingInterval: NodeJS.Timeout | null = null;

// Handle messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, timestamp } = event.data;
  
  // Log received message using our logger
  loggerSingleton.log(`Worker received: ${type}`, 'debug');
  
  // Also send to main thread for UI logging
  self.postMessage({
    type: 'WORKER_LOG',
    data: {
      message: `Worker received: ${type}`,
      timestamp: Date.now(),
      originalTimestamp: timestamp
    },
    timestamp: Date.now()
  } as WorkerResponse);

  switch (type) {
    case 'LOG_MESSAGE':
      loggerSingleton.log(payload.message, payload.level || 'info');
      const bufferStatus = loggerSingleton.getBufferStatus();
      self.postMessage({
        type: 'LOG_COMPLETE',
        data: {
          bufferStatus,
          instanceId: loggerSingleton.getInstanceId(),
          totalLogs: loggerSingleton.getTotalLogCount()
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'GET_BUFFER_STATUS':
      const status = loggerSingleton.getBufferStatus();
      self.postMessage({
        type: 'BUFFER_STATUS',
        data: {
          bufferStatus: status,
          instanceId: loggerSingleton.getInstanceId(),
          totalLogs: loggerSingleton.getTotalLogCount(),
          recentLogs: loggerSingleton.getRecentLogs(5)
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'FORCE_FLUSH':
      loggerSingleton.forceFlush();
      self.postMessage({
        type: 'FLUSH_COMPLETE',
        data: {
          message: 'Buffer flushed manually',
          instanceId: loggerSingleton.getInstanceId(),
          totalLogs: loggerSingleton.getTotalLogCount()
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'GET_INSTANCE_ID':
      self.postMessage({
        type: 'INSTANCE_ID',
        data: {
          instanceId: loggerSingleton.getInstanceId(),
          threadType: 'worker'
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'START_LOGGING':
      if (autoLoggingInterval) {
        clearInterval(autoLoggingInterval);
      }
      
      const interval = payload?.interval || 10; // Default 10ms
      autoLoggingInterval = setInterval(() => {
        const messages = [
          'Processing data batch',
          'Validating user input',
          'Calculating metrics',
          'Updating cache',
          'Sending notification',
          'Performing cleanup',
          'Optimizing performance',
          'Checking system health'
        ];
        
        const levels = ['info', 'warn', 'error', 'debug'] as const;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        
        loggerSingleton.log(`${randomMessage} - ${Date.now()}`, randomLevel);
      }, interval);
      
      self.postMessage({
        type: 'LOGGING_STATUS',
        data: {
          status: 'started',
          interval,
          message: `Auto-logging started with ${interval}ms interval`
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'STOP_LOGGING':
      if (autoLoggingInterval) {
        clearInterval(autoLoggingInterval);
        autoLoggingInterval = null;
      }
      
      self.postMessage({
        type: 'LOGGING_STATUS',
        data: {
          status: 'stopped',
          message: 'Auto-logging stopped'
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'PING':
      loggerSingleton.log('Received ping from main thread', 'debug');
      self.postMessage({
        type: 'PONG',
        data: {
          message: 'Hello from worker logger!',
          receivedAt: Date.now(),
          originalTimestamp: timestamp,
          bufferStatus: loggerSingleton.getBufferStatus()
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;
  }
});

// Export an empty object to make this a module
export {}; 