# Web Worker Singleton Demo

A React TypeScript application demonstrating how singleton patterns work in different JavaScript execution contexts (main thread vs web worker threads).

## 🎯 Purpose

This project demonstrates a fundamental concept in web development: **JavaScript execution contexts are isolated**. Even when using the same singleton pattern, each thread (main thread and web worker) maintains its own separate instance with independent state.

### Key Learning Points:
- ✅ **Singleton Pattern Isolation**: Each thread gets its own singleton instance
- ✅ **Thread Communication**: Bidirectional messaging between main thread and workers
- ✅ **State Independence**: Updates in one thread don't affect the other
- ✅ **Modern Web Workers**: ES modules and TypeScript support

## 🚀 Features

### Core Demonstration
- **Separate Customer Singletons**: Main thread and worker thread each have their own `CustomerSingleton` instance
- **Visual Instance IDs**: Each singleton displays a unique identifier to prove separation
- **Independent State Management**: Customer data updates don't cross thread boundaries

### Communication Features
- **🏓 Ping/Pong**: Test basic communication with round-trip timing
- **🧮 Age Calculator**: Worker performs calculations and returns results
- **🔄 Reset Customer**: Worker state manipulation from main thread
- **📊 Real-time Logging**: Visual log of all messages with timestamps

### Technical Features
- **Modern Build System**: Vite for fast development and building
- **TypeScript Support**: Full type safety across threads
- **ES Module Workers**: Modern web worker implementation
- **Hot Module Replacement**: Instant updates during development

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Installation & Running

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd demo_web_worker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:5173`
   - The application will automatically reload when you make changes

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
demo_web_worker/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Application styles
│   ├── index.tsx               # Application entry point
│   ├── singletons/
│   │   └── CustomerSingleton.ts # Singleton pattern implementation
│   ├── types/
│   │   └── Customer.ts         # Customer data type definitions
│   └── workers/
│       └── customer.worker.ts  # Web worker implementation
├── index.html                  # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
└── README.md                  # This file
```

## 🧪 How to Test the Demo

### 1. Observe Singleton Separation
- Notice the different **Instance IDs** between Main Thread and Worker Thread
- Update the age in one thread and see that the other remains unchanged

### 2. Test Communication
- **Ping Worker**: Click to test basic communication and see round-trip timing
- **Calculate Age**: Let the worker perform calculations based on birth date
- **Reset Customer**: Reset the worker's customer data from the main thread
- **Clear Log**: Clean up the communication log

### 3. Monitor the Communication Log
- Watch real-time message flow between threads
- See timestamps and message directions (📤 outgoing, 📥 incoming)
- Observe worker internal processing (🔧 worker logs)

## 🔧 Technical Implementation

### Singleton Pattern
```typescript
class CustomerSingleton {
  private static instance: CustomerSingleton;
  private customer: Customer;
  private instanceId: string;

  private constructor() {
    // Singleton initialization
  }

  static getInstance(): CustomerSingleton {
    if (!CustomerSingleton.instance) {
      CustomerSingleton.instance = new CustomerSingleton();
    }
    return CustomerSingleton.instance;
  }
}
```

### Web Worker Communication
```typescript
// Main Thread → Worker
const message: WorkerMessage = {
  type: 'UPDATE_CUSTOMER',
  payload: { age: newAge },
  timestamp: Date.now()
};
worker.postMessage(message);

// Worker → Main Thread
self.postMessage({
  type: 'UPDATE_COMPLETE',
  data: { customer: updatedCustomer },
  timestamp: Date.now()
});
```

### Modern Web Worker Setup
```typescript
// ES Module Worker with TypeScript
const worker = new Worker(
  new URL('./workers/customer.worker.ts', import.meta.url),
  { type: 'module' }
);
```

## 🎓 Educational Value

This demo is perfect for understanding:

1. **JavaScript Execution Contexts**: How different threads maintain separate global scopes
2. **Singleton Pattern Limitations**: Why singletons aren't truly "global" across threads
3. **Web Worker Communication**: Modern patterns for thread communication
4. **State Management**: How to handle state in multi-threaded web applications
5. **Modern Web Development**: Vite, TypeScript, and ES modules

## 🛡️ Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (v14+)
- **Edge**: ✅ Full support

*Note: Requires browsers that support ES Module Workers*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Related Concepts

- [Web Workers MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Singleton Pattern](https://en.wikipedia.org/wiki/Singleton_pattern)
- [JavaScript Execution Context](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [Vite Documentation](https://vitejs.dev/)

---

**Built with ❤️ using React, TypeScript, and Vite** 