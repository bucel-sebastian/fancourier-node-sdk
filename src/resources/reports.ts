import type { FancourierClient } from '../client';
import { asPaginated, unwrapData } from '../http/envelope';
import type {
  AwbConfirmation,
  AwbConfirmationQuery,
  AwbEvent,
  AwbTracking,
  AwbTrackingQuery,
  BankTransfer,
  Branch,
  BranchQuery,
  DatePageQuery,
  LanguageQuery,
  Paginated,
  ShippingSlip,
} from '../types';

/** AWB, bank-transfer, order and branch reports. */
export class ReportsResource {
  constructor(private readonly client: FancourierClient) {}

  /** Shipping slip / borderou — `GET /reports/awb`. */
  async shippingSlip(query: DatePageQuery): Promise<Paginated<ShippingSlip>> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/awb',
      query: { clientId: this.client.clientId, ...query },
    });
    return asPaginated<ShippingSlip>(body, 'GET /reports/awb');
  }

  /** AWB event catalogue — `GET /reports/awb-events`. */
  async awbEvents(query: LanguageQuery = {}): Promise<AwbEvent[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/awb-events',
      query: { ...query },
    });
    return unwrapData<AwbEvent[]>(body, 'GET /reports/awb-events');
  }

  /** Tracks one or more AWBs — `GET /reports/awb/tracking`. */
  async trackAwb(query: AwbTrackingQuery): Promise<AwbTracking[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/awb/tracking',
      query: { clientId: this.client.clientId, ...query },
    });
    return unwrapData<AwbTracking[]>(body, 'GET /reports/awb/tracking');
  }

  /** Bank transfers / COD collections — `GET /reports/bank-transfers`. */
  async bankTransfers(query: DatePageQuery): Promise<Paginated<BankTransfer>> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/bank-transfers',
      query: { clientId: this.client.clientId, ...query },
    });
    return asPaginated<BankTransfer>(body, 'GET /reports/bank-transfers');
  }

  /** AWB confirmations — `GET /reports/get-awb-confirmations`. */
  async awbConfirmations(query: AwbConfirmationQuery): Promise<AwbConfirmation[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/get-awb-confirmations',
      query: { clientId: this.client.clientId, ...query },
    });
    return unwrapData<AwbConfirmation[]>(body, 'GET /reports/get-awb-confirmations');
  }

  /** Branches, optionally filtered by county/city — `GET /reports/branches`. */
  async branches(query: BranchQuery = {}): Promise<Branch[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/branches',
      query: { clientId: this.client.clientId, ...query },
    });
    return unwrapData<Branch[]>(body, 'GET /reports/branches');
  }
}
