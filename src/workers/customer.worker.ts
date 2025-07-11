import CustomerSingleton from '../singletons/CustomerSingleton';

export interface WorkerMessage {
  type: 'GET_CUSTOMER' | 'UPDATE_CUSTOMER' | 'GET_INSTANCE_ID' | 'PING' | 'CALCULATE_AGE' | 'RESET_CUSTOMER';
  payload?: any;
  timestamp?: number;
}

export interface WorkerResponse {
  type: 'CUSTOMER_DATA' | 'INSTANCE_ID' | 'UPDATE_COMPLETE' | 'PONG' | 'AGE_CALCULATED' | 'RESET_COMPLETE' | 'WORKER_LOG';
  data: any;
  timestamp?: number;
}

// Initialize the singleton in the worker context
const customerSingleton = CustomerSingleton.getInstance();

// Handle messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, timestamp } = event.data;
  
  // Log received message
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
    case 'GET_CUSTOMER':
      const customer = customerSingleton.getCustomer();
      const response: WorkerResponse = {
        type: 'CUSTOMER_DATA',
        data: {
          customer,
          instanceId: customerSingleton.getInstanceId(),
          threadType: 'worker'
        },
        timestamp: Date.now()
      };
      self.postMessage(response);
      break;

    case 'UPDATE_CUSTOMER':
      customerSingleton.updateCustomer(payload);
      self.postMessage({
        type: 'UPDATE_COMPLETE',
        data: {
          customer: customerSingleton.getCustomer(),
          instanceId: customerSingleton.getInstanceId(),
          updatedField: payload
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'GET_INSTANCE_ID':
      self.postMessage({
        type: 'INSTANCE_ID',
        data: {
          instanceId: customerSingleton.getInstanceId(),
          threadType: 'worker'
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'PING':
      self.postMessage({
        type: 'PONG',
        data: {
          message: 'Hello from worker!',
          receivedAt: Date.now(),
          originalTimestamp: timestamp
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'CALCULATE_AGE':
      const currentCustomer = customerSingleton.getCustomer();
      const birthDate = new Date(currentCustomer.dateOfBirth);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      
      self.postMessage({
        type: 'AGE_CALCULATED',
        data: {
          calculatedAge,
          currentAge: currentCustomer.age,
          birthDate: currentCustomer.dateOfBirth,
          calculation: `${today.getFullYear()} - ${birthDate.getFullYear()} = ${calculatedAge}`
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;

    case 'RESET_CUSTOMER':
      // Reset customer to initial state
      customerSingleton.updateCustomer({
        name: 'John Doe',
        age: 30,
        dateOfBirth: new Date('1994-01-01')
      });
      
      self.postMessage({
        type: 'RESET_COMPLETE',
        data: {
          customer: customerSingleton.getCustomer(),
          instanceId: customerSingleton.getInstanceId(),
          message: 'Customer reset to initial state'
        },
        timestamp: Date.now()
      } as WorkerResponse);
      break;
  }
});

// Export an empty object to make this a module
export {}; 