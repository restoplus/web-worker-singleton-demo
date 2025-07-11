import React, { useState, useEffect, useRef } from 'react';
import CustomerSingleton from './singletons/CustomerSingleton';
import { Customer } from './types/Customer';
import { WorkerMessage, WorkerResponse } from './workers/customer.worker';
import './App.css';

function App() {
  const [mainThreadCustomer, setMainThreadCustomer] = useState<Customer | null>(null);
  const [mainThreadInstanceId, setMainThreadInstanceId] = useState<string>('');
  const [workerCustomer, setWorkerCustomer] = useState<Customer | null>(null);
  const [workerInstanceId, setWorkerInstanceId] = useState<string>('');
  const [communicationLog, setCommunicationLog] = useState<string[]>([]);
  const [pingResult, setPingResult] = useState<string>('');
  const [ageCalculation, setAgeCalculation] = useState<string>('');
  const workerRef = useRef<Worker | null>(null);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCommunicationLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    const singleton = CustomerSingleton.getInstance();
    setMainThreadCustomer(singleton.getCustomer());
    setMainThreadInstanceId(singleton.getInstanceId());

    const worker = new Worker(new URL('./workers/customer.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const { type, data, timestamp } = event.data;
      
      switch (type) {
        case 'CUSTOMER_DATA':
          setWorkerCustomer(data.customer);
          setWorkerInstanceId(data.instanceId);
          addToLog(`📥 Received customer data from worker`);
          break;
        case 'UPDATE_COMPLETE':
          setWorkerCustomer(data.customer);
          addToLog(`📥 Worker completed update: ${JSON.stringify(data.updatedField)}`);
          break;
        case 'INSTANCE_ID':
          setWorkerInstanceId(data.instanceId);
          addToLog(`📥 Received instance ID from worker: ${data.instanceId}`);
          break;
        case 'PONG':
          setPingResult(`🏓 Worker responded: "${data.message}" (Round trip: ${Date.now() - data.originalTimestamp}ms)`);
          addToLog(`📥 PONG received from worker`);
          break;
        case 'AGE_CALCULATED':
          setAgeCalculation(`🧮 Worker calculated age: ${data.calculatedAge} (${data.calculation})`);
          addToLog(`📥 Age calculation received from worker`);
          break;
        case 'RESET_COMPLETE':
          setWorkerCustomer(data.customer);
          addToLog(`📥 Worker reset complete: ${data.message}`);
          break;
        case 'WORKER_LOG':
          addToLog(`🔧 Worker: ${data.message}`);
          break;
      }
    });

    const message: WorkerMessage = { type: 'GET_CUSTOMER', timestamp: Date.now() };
    worker.postMessage(message);
    addToLog(`📤 Initial request sent to worker`);

    return () => {
      worker.terminate();
    };
  }, []);

  const updateMainThreadCustomer = () => {
    const singleton = CustomerSingleton.getInstance();
    const newAge = Math.floor(Math.random() * 50) + 20;
    singleton.updateCustomer({ age: newAge });
    setMainThreadCustomer(singleton.getCustomer());
    addToLog(`📤 Updated main thread customer age to ${newAge}`);
  };

  const updateWorkerCustomer = () => {
    if (workerRef.current) {
      const newAge = Math.floor(Math.random() * 50) + 20;
      const message: WorkerMessage = {
        type: 'UPDATE_CUSTOMER',
        payload: { age: newAge },
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Sent update request to worker (age: ${newAge})`);
    }
  };

  const refreshData = () => {
    const singleton = CustomerSingleton.getInstance();
    setMainThreadCustomer(singleton.getCustomer());
    
    if (workerRef.current) {
      const message: WorkerMessage = { type: 'GET_CUSTOMER', timestamp: Date.now() };
      workerRef.current.postMessage(message);
      addToLog(`📤 Requested customer data from worker`);
    }
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

  const calculateAgeInWorker = () => {
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'CALCULATE_AGE',
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Requested age calculation from worker`);
      setAgeCalculation('🧮 Calculating age in worker...');
    }
  };

  const resetWorkerCustomer = () => {
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'RESET_CUSTOMER',
        timestamp: Date.now()
      };
      workerRef.current.postMessage(message);
      addToLog(`📤 Sent reset request to worker`);
    }
  };

  const clearLog = () => {
    setCommunicationLog([]);
    setPingResult('');
    setAgeCalculation('');
  };

  return (
    <div className="App">
      <h1>Web Worker Singleton Demo</h1>
      
      <div className="container">
        <div className="thread-section">
          <h2>Main Thread</h2>
          <div className="instance-id">Instance ID: {mainThreadInstanceId}</div>
          {mainThreadCustomer && (
            <div className="customer-info">
              <p><strong>Name:</strong> {mainThreadCustomer.name}</p>
              <p><strong>Age:</strong> {mainThreadCustomer.age}</p>
              <p><strong>DOB:</strong> {new Date(mainThreadCustomer.dateOfBirth).toLocaleDateString()}</p>
            </div>
          )}
          <button onClick={updateMainThreadCustomer}>Update Age (Main Thread)</button>
        </div>

        <div className="thread-section">
          <h2>Worker Thread</h2>
          <div className="instance-id">Instance ID: {workerInstanceId}</div>
          {workerCustomer && (
            <div className="customer-info">
              <p><strong>Name:</strong> {workerCustomer.name}</p>
              <p><strong>Age:</strong> {workerCustomer.age}</p>
              <p><strong>DOB:</strong> {new Date(workerCustomer.dateOfBirth).toLocaleDateString()}</p>
            </div>
          )}
          <button onClick={updateWorkerCustomer}>Update Age (Worker Thread)</button>
        </div>
      </div>

      <button className="refresh-button" onClick={refreshData}>Refresh Both</button>

      <div className="communication-section">
        <h2>Thread Communication Demo</h2>
        <div className="communication-buttons">
          <button onClick={pingWorker}>🏓 Ping Worker</button>
          <button onClick={calculateAgeInWorker}>🧮 Calculate Age in Worker</button>
          <button onClick={resetWorkerCustomer}>🔄 Reset Worker Customer</button>
          <button onClick={clearLog}>🗑️ Clear Log</button>
        </div>
        
        <div className="communication-results">
          {pingResult && <div className="result-item">{pingResult}</div>}
          {ageCalculation && <div className="result-item">{ageCalculation}</div>}
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
        <h3>Explanation</h3>
        <p>
          This demo shows that the CustomerSingleton instances in the main thread and web worker 
          are completely separate. Notice the different instance IDs and how updating one doesn't 
          affect the other.
        </p>
        <p>
          The web worker runs in its own JavaScript context, so even though we're using the same 
          singleton pattern, each thread gets its own instance with its own state.
        </p>
        <p>
          <strong>Communication Features:</strong> Use the buttons above to see real-time 
          communication between the main thread and worker thread. The log shows all messages 
          being sent and received with timestamps.
        </p>
      </div>
    </div>
  );
}

export default App;