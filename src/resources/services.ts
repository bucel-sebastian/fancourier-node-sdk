import type { FancourierClient } from '../client';
import { unwrapData } from '../http/envelope';
import type { Service, ServiceOption } from '../types';

/** Delivery-service catalogue (`GET /reports/services`). */
export class ServicesResource {
  constructor(private readonly client: FancourierClient) {}

  /** Lists all courier services. */
  async list(): Promise<Service[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/services',
    });
    return unwrapData<Service[]>(body, 'GET /reports/services');
  }

  /** Lists the option letters supported by a service. */
  async options(service: string): Promise<ServiceOption[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/service-options',
      query: { clientId: this.client.clientId, service },
    });
    return unwrapData<ServiceOption[]>(body, 'GET /reports/service-options');
  }
}
