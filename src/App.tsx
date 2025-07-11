import React, { useState, useEffect, useRef } from 'react';
import LoggerSingleton from './singletons/LoggerSingleton';
import { WorkerMessage, WorkerResponse } from './workers/customer.worker';
import './App.css';

function App() {
  const [mainThreadInstanceId, setMainThreadInstanceId] = useState<string>('');
  const [workerInstanceId, setWorkerInstanceId] = useState<string>('');
  const [communicationLog, setCommunicationLog] = useState<string[]>([]);
  const [pingResult, setPingResult] = useState<string>('');
  const [mainBufferStatus, setMainBufferStatus] = useState<{count: number, capacity: number, percentage: number}>({count: 0, capacity: 1000, percentage: 0});
  const [workerBufferStatus, setWorkerBufferStatus] = useState<{count: number, capacity: number, percentage: number}>({count: 0, capacity: 1000, percentage: 0});
  const [isAutoLogging, setIsAutoLogging] = useState<boolean>(false);
  const [mainTotalLogs, setMainTotalLogs] = useState<number>(0);
  const [workerTotalLogs, setWorkerTotalLogs] = useState<number>(0);
  const workerRef = useRef<Worker | null>(null);
  const mainLoggingInterval = useRef<NodeJS.Timeout | null>(null);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCommunicationLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    const loggerSingleton = LoggerSingleton.getInstance();
    setMainThreadInstanceId(loggerSingleton.getInstanceId());

    const worker = new Worker(new URL('./workers/customer.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const { type, data, timestamp } = event.data;
      
      switch (type) {
        case 'BUFFER_STATUS':
          setWorkerBufferStatus(data.bufferStatus);
          setWorkerInstanceId(data.instanceId);
          setWorkerTotalLogs(data.totalLogs);
          addToLog(`📥 Received buffer status from worker: ${data.bufferStatus.count}/${data.bufferStatus.capacity}`);
          break;
        case 'LOG_COMPLETE':
          setWorkerBufferStatus(data.bufferStatus);
          setWorkerTotalLogs(data.totalLogs);
          addToLog(`📥 Worker logged message. Buffer: ${data.bufferStatus.count}/${data.bufferStatus.capacity}`);
          break;
        case 'INSTANCE_ID':
          setWorkerInstanceId(data.instanceId);
          addToLog(`📥 Received instance ID from worker: ${data.instanceId}`);
          break;
        case 'PONG':
          setPingResult(`🏓 Worker responded: "${data.message}" (Round trip: ${Date.now() - data.originalTimestamp}ms) - Buffer: ${data.bufferStatus.count}/${data.bufferStatus.capacity}`);
          addToLog(`📥 PONG received from worker`);
          break;
        case 'FLUSH_COMPLETE':
          addToLog(`📥 Worker buffer flushed: ${data.message}`);
          break;
        case 'LOGGING_STATUS':
          setIsAutoLogging(data.status === 'started');
          addToLog(`📥 Worker logging ${data.status}: ${data.message}`);
          break;
        case 'WORKER_LOG':
          addToLog(`🔧 Worker: ${data.message}`);
          break;
      }
    });

    const message: WorkerMessage = { type: 'GET_BUFFER_STATUS', timestamp: Date.now() };
    worker.postMessage(message);
    addToLog(`📤 Initial buffer status request sent to worker`);

    // Update main thread buffer status periodically
    const statusInterval = setInterval(() => {
      const status = loggerSingleton.getBufferStatus();
      setMainBufferStatus(status);
      setMainTotalLogs(loggerSingleton.getTotalLogCount());
    }, 100);

    return () => {
      worker.terminate();
      clearInterval(statusInterval);
      if (mainLoggingInterval.current) {
        clearInterval(mainLoggingInterval.current);
      }
    };
  }, []);

  const logToMainThread = () => {
    const loggerSingleton = LoggerSingleton.getInstance();
    const messages = [
      'User clicked button',
      'Processing form data',
      'Updating UI state',
      'Fetching user data',
      'Validating input',
      'Saving preferences',
      'Loading resources',
      'Rendering component'
    ];
    
    const levels = ['info', 'warn', 'error', 'debug'] as const;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    
    loggerSingleton.log(`${randomMessage} - ${Date.now()}`, randomLevel);
    addToLog(`📤 Logged to main thread: ${randomMessage}`);
  };

  const logToWorker = () => {
    if (workerRef.current) {
      const messages = [
        'Processing background task',
        'Calculating heavy computation',
        'Validating data integrity',
        'Performing batch operation',
        'Updating cache entries',
        'Cleaning up resources',
        'Optimizing performance',
        'Checking system status'
      ];
      
      const levels = ['info', 'warn', 'error', 'debug'] as const;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      
      const message: WorkerMessage = {
        type: 'LOG_MESSAGE',
        payload: { message: `${randomMessage} - ${Date.now()}`, level: randomLevel },
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Sent log to worker: ${randomMessage}`);
    }
  };

  const startAutoLogging = () => {
    // Start main thread auto-logging
    if (mainLoggingInterval.current) {
      clearInterval(mainLoggingInterval.current);
    }
    
    mainLoggingInterval.current = setInterval(() => {
      logToMainThread();
    }, 10);
    
    // Start worker auto-logging
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'START_LOGGING',
        payload: { interval: 10 },
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Started auto-logging in both threads`);
    }
  };

  const stopAutoLogging = () => {
    // Stop main thread auto-logging
    if (mainLoggingInterval.current) {
      clearInterval(mainLoggingInterval.current);
      mainLoggingInterval.current = null;
    }
    
    // Stop worker auto-logging
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'STOP_LOGGING',
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Stopped auto-logging in both threads`);
    }
    
    setIsAutoLogging(false);
  };

  const pingWorker = () => {
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'PING',
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 PING sent to worker`);
      setPingResult('🏓 Pinging worker...');
    }
  };

  const forceFlushWorker = () => {
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'FORCE_FLUSH',
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Force flush sent to worker`);
    }
  };

  const forceFlushMain = () => {
    const loggerSingleton = LoggerSingleton.getInstance();
    loggerSingleton.forceFlush();
    addToLog(`📤 Force flushed main thread buffer`);
  };

  const clearLog = () => {
    setCommunicationLog([]);
    setPingResult('');
  };

  return (
    <div className="App">
      <h1>Web Worker Logger Singleton Demo</h1>
      
      <div className="container">
        <div className="thread-section">
          <h2>Main Thread Logger</h2>
          <div className="instance-id">Instance ID: {mainThreadInstanceId}</div>
          <div className="logger-info">
            <div className="buffer-status">
              <p><strong>Buffer:</strong> {mainBufferStatus.count} / {mainBufferStatus.capacity} ({mainBufferStatus.percentage}%)</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${mainBufferStatus.percentage}%` }}
                ></div>
              </div>
            </div>
            <p><strong>Total Logs:</strong> {mainTotalLogs}</p>
          </div>
          <div className="button-group">
            <button onClick={logToMainThread}>📝 Log Message</button>
            <button onClick={forceFlushMain}>🚽 Force Flush</button>
          </div>
        </div>

        <div className="thread-section">
          <h2>Worker Thread Logger</h2>
          <div className="instance-id">Instance ID: {workerInstanceId}</div>
          <div className="logger-info">
            <div className="buffer-status">
              <p><strong>Buffer:</strong> {workerBufferStatus.count} / {workerBufferStatus.capacity} ({workerBufferStatus.percentage}%)</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${workerBufferStatus.percentage}%` }}
                ></div>
              </div>
            </div>
            <p><strong>Total Logs:</strong> {workerTotalLogs}</p>
          </div>
          <div className="button-group">
            <button onClick={logToWorker}>📝 Log Message</button>
            <button onClick={forceFlushWorker}>🚽 Force Flush</button>
          </div>
        </div>
      </div>

      <div className="auto-logging-section">
        <h2>🚀 Auto-Logging Demo</h2>
        <p>This will continuously send logs to both threads until buffers reach 1000 messages and flush to console.</p>
        <div className="auto-logging-controls">
          {!isAutoLogging ? (
            <button onClick={startAutoLogging} className="start-button">
              ▶️ Start Auto-Logging (Both Threads)
            </button>
          ) : (
            <button onClick={stopAutoLogging} className="stop-button">
              ⏹️ Stop Auto-Logging
            </button>
          )}
        </div>
        <div className="auto-logging-status">
          {isAutoLogging && (
            <p className="status-active">🔄 Auto-logging active - Check console for buffer flushes!</p>
          )}
        </div>
      </div>

      <div className="communication-section">
        <h2>Thread Communication</h2>
        <div className="communication-buttons">
          <button onClick={pingWorker}>🏓 Ping Worker</button>
          <button onClick={clearLog}>🗑️ Clear Log</button>
        </div>
        
        <div className="communication-results">
          {pingResult && <div className="result-item">{pingResult}</div>}
        </div>

        <div className="communication-log">
          <h3>Communication Log</h3>
          <div className="log-content">
            {communicationLog.length === 0 ? (
              <p className="log-empty">No messages yet...</p>
            ) : (
              communicationLog.map((log, index) => (
                <div key={index} className="log-entry">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="explanation">
        <h3>Logger Singleton Demo Explanation</h3>
        <p>
          This demo shows how <strong>LoggerSingleton</strong> instances work in different JavaScript execution contexts. 
          Each thread (main and worker) maintains its own separate logger instance with independent buffers.
        </p>
        <p>
          <strong>Key Features:</strong>
        </p>
        <ul>
          <li>🔄 <strong>Separate Buffers:</strong> Each thread has its own 1000-message buffer</li>
          <li>🚽 <strong>Auto-Flush:</strong> Buffers automatically flush to console when full</li>
          <li>📊 <strong>Real-time Status:</strong> Watch buffer fill progress in real-time</li>
          <li>🎯 <strong>Thread Isolation:</strong> Logs in one thread don't affect the other</li>
        </ul>
        <p>
          <strong>Try This:</strong> Start auto-logging and watch the console. When either buffer reaches 1000 messages, 
          it will flush all logs to the console with organized grouping by log level.
        </p>
      </div>
    </div>
  );
}

export default App;