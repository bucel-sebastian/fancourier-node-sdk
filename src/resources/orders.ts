import type { FancourierClient } from '../client';
import { asPaginated, assertSuccess, unwrapData } from '../http/envelope';
import type {
  CourierOrderEvent,
  CourierOrderReport,
  CourierOrderTracking,
  CreateCourierOrderRequest,
  CreatedCourierOrder,
  DatePageQuery,
  LanguageQuery,
  MessageResponse,
  OrderTrackingQuery,
  Paginated,
} from '../types';

/** Courier pickup orders and order reports. */
export class OrdersResource {
  constructor(private readonly client: FancourierClient) {}

  /** Creates a courier pickup order — `POST /order`. */
  async create(payload: CreateCourierOrderRequest): Promise<CreatedCourierOrder> {
    const body = await this.client.request<unknown>({
      method: 'POST',
      path: '/order',
      jsonBody: {
        ...payload,
        clientId: payload.clientId ?? this.client.clientId,
      },
    });
    return unwrapData<CreatedCourierOrder>(body, 'POST /order');
  }

  /** Deletes a courier order — `DELETE /order`. */
  async delete(id: string | number): Promise<MessageResponse> {
    const body = await this.client.request<MessageResponse>({
      method: 'DELETE',
      path: '/order',
      query: { clientId: this.client.clientId, id },
    });
    assertSuccess(body, 'DELETE /order');
    return body;
  }

  /** Lists courier orders for a date — `GET /reports/orders`. */
  async reports(query: DatePageQuery): Promise<Paginated<CourierOrderReport>> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/orders',
      query: { clientId: this.client.clientId, ...query },
    });
    return asPaginated<CourierOrderReport>(body, 'GET /reports/orders');
  }

  /** Lists order event definitions — `GET /reports/order-events`. */
  async events(query: LanguageQuery = {}): Promise<CourierOrderEvent[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/order-events',
      query: { clientId: this.client.clientId, ...query },
    });
    return unwrapData<CourierOrderEvent[]>(body, 'GET /reports/order-events');
  }

  /** Tracks one or more orders — `GET /reports/orders/tracking`. */
  async tracking(query: OrderTrackingQuery): Promise<CourierOrderTracking[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/orders/tracking',
      query: { clientId: this.client.clientId, ...query },
    });
    return unwrapData<CourierOrderTracking[]>(body, 'GET /reports/orders/tracking');
  }
}
