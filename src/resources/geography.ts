import type { FancourierClient } from '../client';
import { asPaginated, unwrapData } from '../http/envelope';
import type {
  Country,
  County,
  ExternalCounty,
  ExternalCountyQuery,
  ExternalLocality,
  ExternalLocalityQuery,
  Locality,
  LocalityQuery,
  Paginated,
  Street,
  StreetQuery,
} from '../types';

/** Romanian and international geography lookups. */
export class GeographyResource {
  constructor(private readonly client: FancourierClient) {}

  /** Lists Romanian counties — `GET /reports/counties`. */
  async counties(): Promise<County[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/counties',
    });
    return unwrapData<County[]>(body, 'GET /reports/counties');
  }

  /** Lists localities, optionally filtered by county — `GET /reports/localities`. */
  async localities(query: LocalityQuery = {}): Promise<Locality[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/localities',
      query: { ...query },
    });
    return unwrapData<Locality[]>(body, 'GET /reports/localities');
  }

  /** Lists streets in a locality — `GET /reports/streets`. */
  async streets(query: StreetQuery): Promise<Paginated<Street>> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/streets',
      query: { ...query },
    });
    return asPaginated<Street>(body, 'GET /reports/streets');
  }

  /** Lists countries supported for export — `GET /reports/countries`. */
  async countries(): Promise<Country[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/countries',
    });
    return unwrapData<Country[]>(body, 'GET /reports/countries');
  }

  /** Lists counties of an external country — `GET /reports/external-counties`. */
  async externalCounties(query: ExternalCountyQuery): Promise<ExternalCounty[]> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/external-counties',
      query: { ...query },
    });
    return unwrapData<ExternalCounty[]>(body, 'GET /reports/external-counties');
  }

  /** Lists localities of an external county — `GET /reports/external-localities`. */
  async externalLocalities(
    query: ExternalLocalityQuery,
  ): Promise<Paginated<ExternalLocality>> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/external-localities',
      query: { ...query },
    });
    return asPaginated<ExternalLocality>(body, 'GET /reports/external-localities');
  }
}
