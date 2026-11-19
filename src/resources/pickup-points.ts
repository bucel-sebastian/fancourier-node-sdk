import type { FancourierClient } from '../client';
import { unwrapData } from '../http/envelope';
import type { PickupPoint, PickupPointQuery } from '../types';

/**
 * FANbox, PayPoint and FAN-office locations (`GET /reports/pickup-points`).
 */
export class PickupPointsResource {
  constructor(private readonly client: FancourierClient) {}

  /**
   * Lists pickup points by type. When neither `type` nor `id` is supplied the
   * API default (`fanbox`) is used, matching the reference SDK.
   */
  async list(query: PickupPointQuery = {}): Promise<PickupPoint[]> {
    const requestQuery =
      query.id === undefined
        ? { type: query.type ?? 'fanbox' }
        : { id: query.id };

    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/pickup-points',
      query: requestQuery,
    });
    return unwrapData<PickupPoint[]>(body, 'GET /reports/pickup-points');
  }

  /** Fetches one pickup point by id, or `undefined` when it does not exist. */
  async get(id: string): Promise<PickupPoint | undefined> {
    const points = await this.list({ id });
    return points[0];
  }
}
