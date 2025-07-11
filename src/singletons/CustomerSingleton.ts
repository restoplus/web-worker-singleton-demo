import { Customer } from '../types/Customer';

class CustomerSingleton {
  private static instance: CustomerSingleton;
  private customer: Customer;
  private instanceId: string;

  private constructor() {
    this.customer = {
      name: 'John Doe',
      age: 30,
      dateOfBirth: new Date('1994-01-15')
    };
    this.instanceId = Math.random().toString(36).substring(7);
    console.log(`CustomerSingleton created with ID: ${this.instanceId}`);
  }

  public static getInstance(): CustomerSingleton {
    if (!CustomerSingleton.instance) {
      CustomerSingleton.instance = new CustomerSingleton();
    }
    return CustomerSingleton.instance;
  }

  public getCustomer(): Customer {
    return this.customer;
  }

  public updateCustomer(updates: Partial<Customer>): void {
    this.customer = { ...this.customer, ...updates };
  }

  public getInstanceId(): string {
    return this.instanceId;
  }
}

export default CustomerSingleton;