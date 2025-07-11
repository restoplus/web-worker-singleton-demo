export interface LogEntry {
  id: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: Date;
  threadType: 'main' | 'worker';
}

class LoggerSingleton {
  private static instance: LoggerSingleton;
  private logBuffer: LogEntry[] = [];
  private instanceId: string;
  private readonly BUFFER_SIZE = 1000;
  private logCount = 0;

  private constructor() {
    this.instanceId = Math.random().toString(36).substring(7);
    const threadType = typeof window !== 'undefined' ? 'main' : 'worker';
    console.log(`LoggerSingleton created with ID: ${this.instanceId} in ${threadType} thread`);
  }

  public static getInstance(): LoggerSingleton {
    if (!LoggerSingleton.instance) {
      LoggerSingleton.instance = new LoggerSingleton();
    }
    return LoggerSingleton.instance;
  }

  public log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    const threadType = typeof window !== 'undefined' ? 'main' : 'worker';
    const logEntry: LogEntry = {
      id: `${this.instanceId}-${++this.logCount}`,
      message,
      level,
      timestamp: new Date(),
      threadType
    };

    this.logBuffer.push(logEntry);

    // Check if buffer is full
    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      this.flushBuffer();
    }
  }

  private flushBuffer(): void {
    if (this.logBuffer.length === 0) return;

    const threadType = typeof window !== 'undefined' ? 'main' : 'worker';
    console.log(`\n🚀 [${threadType.toUpperCase()} THREAD] Logger Buffer Flush - Instance: ${this.instanceId}`);
    console.log(`📊 Flushing ${this.logBuffer.length} log entries:`);
    
    // Group logs by level for better readability
    const logsByLevel = this.logBuffer.reduce((acc, log) => {
      acc[log.level] = acc[log.level] || [];
      acc[log.level].push(log);
      return acc;
    }, {} as Record<string, LogEntry[]>);

    Object.entries(logsByLevel).forEach(([level, logs]) => {
      console.group(`${this.getLevelEmoji(level)} ${level.toUpperCase()} (${logs.length} entries)`);
      logs.forEach(log => {
        console.log(`[${log.timestamp.toLocaleTimeString()}] ${log.message} (ID: ${log.id})`);
      });
      console.groupEnd();
    });

    console.log(`✅ Buffer cleared. Total logs processed: ${this.logCount}`);
    console.log('─'.repeat(80));

    // Clear the buffer
    this.logBuffer = [];
  }

  private getLevelEmoji(level: string): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🐛';
      default: return '📝';
    }
  }

  public getBufferStatus(): { count: number; capacity: number; percentage: number } {
    return {
      count: this.logBuffer.length,
      capacity: this.BUFFER_SIZE,
      percentage: Math.round((this.logBuffer.length / this.BUFFER_SIZE) * 100)
    };
  }

  public getInstanceId(): string {
    return this.instanceId;
  }

  public getTotalLogCount(): number {
    return this.logCount;
  }

  public forceFlush(): void {
    this.flushBuffer();
  }

  public getRecentLogs(count: number = 10): LogEntry[] {
    return this.logBuffer.slice(-count);
  }
}

export default LoggerSingleton; 