import type { FancourierClient } from '../client';
import { assertSuccess, unwrapData } from '../http/envelope';
import { FancourierError } from '../errors';
import type {
  AwbLabelOptions,
  AwbLabelParams,
  AwbResult,
  CreateAwbRequest,
  CreateExternalAwbRequest,
  ExternalAwbResult,
  ExternalTariffParams,
  InternalTariffParams,
  MessageResponse,
  Tariff,
} from '../types';

/** AWB creation, labels, cancellation and tariffs. */
export class AwbResource {
  constructor(private readonly client: FancourierClient) {}

  /** Creates one or more internal AWBs — `POST /intern-awb`. */
  async createInternal(payload: CreateAwbRequest): Promise<AwbResult[]> {
    const body = await this.client.request<unknown>({
      method: 'POST',
      path: '/intern-awb',
      jsonBody: {
        ...payload,
        clientId: payload.clientId ?? this.client.clientId,
      },
    });

    assertSuccess(body, 'POST /intern-awb');
    if (
      typeof body === 'object' &&
      body !== null &&
      Array.isArray((body as { response?: unknown }).response)
    ) {
      return (body as { response: AwbResult[] }).response;
    }
    throw new FancourierError('POST /intern-awb response did not include AWB results', {
      raw: body,
    });
  }

  /** Alias for {@link AwbResource.createInternal}. */
  create(payload: CreateAwbRequest): Promise<AwbResult[]> {
    return this.createInternal(payload);
  }

  /** Creates one or more export AWBs — `POST /extern-awb`. */
  async createExternal(
    payload: CreateExternalAwbRequest,
  ): Promise<ExternalAwbResult[]> {
    const body = await this.client.request<unknown>({
      method: 'POST',
      path: '/extern-awb',
      jsonBody: {
        ...payload,
        clientId: payload.clientId ?? this.client.clientId,
      },
    });

    if (Array.isArray(body)) {
      return body as ExternalAwbResult[];
    }

    assertSuccess(body, 'POST /extern-awb');
    if (
      typeof body === 'object' &&
      body !== null &&
      Array.isArray((body as { response?: unknown }).response)
    ) {
      return (body as { response: ExternalAwbResult[] }).response;
    }
    throw new FancourierError('POST /extern-awb response did not include AWB results', {
      raw: body,
    });
  }

  /** Deletes an AWB — `DELETE /awb`. */
  async delete(awbNumber: string | number): Promise<MessageResponse> {
    const body = await this.client.request<MessageResponse>({
      method: 'DELETE',
      path: '/awb',
      query: { clientId: this.client.clientId, awb: awbNumber },
    });
    assertSuccess(body, 'DELETE /awb');
    return body;
  }

  /** Alias for {@link AwbResource.delete}. */
  deleteAwb(awbNumber: string | number): Promise<MessageResponse> {
    return this.delete(awbNumber);
  }

  /** Downloads PDF labels by default — `GET /awb/label?pdf=1`. */
  async label(
    params: AwbLabelParams,
    options: AwbLabelOptions = {},
  ): Promise<Buffer> {
    return this.client.request<Buffer>({
      method: 'GET',
      path: '/awb/label',
      query: this.labelQuery(params, options, { pdf: 1 }),
      responseType: 'binary',
    });
  }

  /** Downloads HTML labels — `GET /awb/label` with neither `pdf` nor `zpl`. */
  async labelHtml(
    params: AwbLabelParams,
    options: AwbLabelOptions = {},
  ): Promise<string> {
    return this.client.request<string>({
      method: 'GET',
      path: '/awb/label',
      query: this.labelQuery(params, options),
      responseType: 'text',
    });
  }

  /** Downloads ZPL labels — `GET /awb/label?zpl=1`. */
  async labelZpl(
    params: AwbLabelParams,
    options: AwbLabelOptions = {},
  ): Promise<string> {
    return this.client.request<string>({
      method: 'GET',
      path: '/awb/label',
      query: this.labelQuery(params, options, { zpl: 1 }),
      responseType: 'text',
    });
  }

  /** Estimates an internal shipment — `GET /reports/awb/internal-tariff`. */
  async internalTariff(params: InternalTariffParams): Promise<Tariff> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/awb/internal-tariff',
      query: {
        clientId: params.clientId ?? this.client.clientId,
        info: params.info,
        recipient: params.recipient,
        sender: params.sender,
      },
    });
    return unwrapData<Tariff>(body, 'GET /reports/awb/internal-tariff');
  }

  /** Estimates an export shipment — `GET /reports/awb/external-tariff`. */
  async externalTariff(params: ExternalTariffParams): Promise<Tariff> {
    const body = await this.client.request<unknown>({
      method: 'GET',
      path: '/reports/awb/external-tariff',
      query: {
        clientId: params.clientId ?? this.client.clientId,
        info: params.info,
        recipient: params.recipient,
        sender: params.sender,
      },
    });
    return unwrapData<Tariff>(body, 'GET /reports/awb/external-tariff');
  }

  private labelQuery(
    params: AwbLabelParams,
    options: AwbLabelOptions,
    formatFlag: { pdf?: number; zpl?: number } = {},
  ): Record<string, unknown> {
    return {
      clientId: this.client.clientId,
      awbs: params.awbs,
      language: options.language ?? params.language ?? 'ro',
      format: options.format ?? params.format,
      dpi: options.dpi ?? params.dpi,
      ...formatFlag,
    };
  }
}
