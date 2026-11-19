import type { ClientId, Dimensions, Packages } from './common';

/**
 * Payment mode. FanCourier's documentation uses `expeditor`/`destinatar`;
 * some older examples and SDKs use `sender`/`recipient`. Both are sent as-is.
 */
export type AwbPayment =
  | 'expeditor'
  | 'destinatar'
  | 'sender'
  | 'recipient'
  | 'Altul';

/** Address used by internal (Romanian) shipments. */
export interface AwbAddress {
  county: string;
  locality: string;
  street: string;
  streetNo?: string;
  /** FANbox/PayPoint/FAN office id, for pickup-point deliveries. */
  pickupLocationId?: string;
  /** FANbox drop-off id, for pickup-point sendings. */
  dropOffLocationId?: string;
  zipCode?: string;
  building?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
}

/** Recipient of an internal AWB. */
export interface AwbRecipient {
  name: string;
  contactPerson?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: AwbAddress;
}

/** Sender of an internal AWB. */
export interface AwbSender {
  name: string;
  contactPerson?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: AwbAddress;
}

/** Shipment information for `POST /intern-awb`. */
export interface AwbInfo {
  service: string;
  bank?: string;
  bankAccount?: string;
  packages: Packages;
  weight: number;
  cod?: number;
  currency?: string;
  declaredValue?: number;
  payment: AwbPayment;
  refund?: number | null;
  returnPayment?: number | null;
  observation?: string;
  content?: string;
  dimensions?: Dimensions;
  costCenter?: string;
  /** Service option letters (A, B, C, D, F, M, O, P, S, V, W, X, Y, E). */
  options?: string[];
  /** Format: `ABCD-1234-EFGH-5678`. */
  uitCode?: string;
  /** Non-UE shipments only. */
  isValueUnderThreshold?: boolean;
  /** ISO country code for non-UE shipments, e.g. `PL`. */
  countryCode?: string;
  /** Non-UE shipments only. */
  vatId?: string;
  /** Non-UE shipments only. */
  company?: string;
}

/** One internal shipment. */
export interface AwbShipment {
  info: AwbInfo;
  recipient: AwbRecipient;
  sender?: AwbSender;
}

/** Body of `POST /intern-awb`. */
export interface CreateAwbRequest {
  clientId?: ClientId;
  platformId?: ClientId;
  shipments: AwbShipment[];
}

/** Per-AWB result returned by `POST /intern-awb`. */
export interface AwbResult {
  awbNumber: number | null;
  tariff?: number;
  vat?: number;
  packages?: number;
  letter?: string;
  routingCode?: string;
  office?: string;
  pickUpPointId?: string | null;
  visualCode?: string;
  estimatedDeliveryTime?: number;
  success?: boolean;
  errors?: Record<string, string> | string | null;
}

/** Response envelope of `POST /intern-awb`. */
export interface CreateAwbResponse {
  response: AwbResult[];
}

export type DeliveryMode = 'rutier' | 'aerian';
export type ExternalContentType = 'document' | 'non document';

/** Address used by external shipments. */
export interface ExternalAwbAddress {
  country: string;
  region?: string;
  locality: string;
  street: string;
  streetNo: string;
  zipCode?: string;
}

export interface ExternalAwbRecipient {
  name: string;
  contactPerson?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: ExternalAwbAddress;
}

export type ExternalAwbSender = ExternalAwbRecipient;

/** Shipment information for `POST /extern-awb`. */
export interface ExternalAwbInfo {
  service: string;
  deliveryMode: DeliveryMode;
  contentType: ExternalContentType;
  bank?: string;
  bankAccount?: string;
  packages: Packages;
  weight: number;
  cod?: number;
  declaredValue?: number;
  payment: AwbPayment;
  refund?: number | null;
  returnPayment?: number | null;
  observation?: string;
  content?: string;
  dimensions?: Dimensions;
  costCenter?: string;
  options?: string[];
  uitCode?: string;
}

export interface ExternalAwbShipment {
  info: ExternalAwbInfo;
  recipient: ExternalAwbRecipient;
  sender?: ExternalAwbSender;
}

export interface CreateExternalAwbRequest {
  clientId?: ClientId;
  shipments: ExternalAwbShipment[];
}

/** Per-AWB result returned by `POST /extern-awb` (a bare array). */
export interface ExternalAwbResult {
  awbNumber: number | null;
  errors?: Record<string, string> | string | null;
  [key: string]: unknown;
}

/** Options for label downloads. */
export interface AwbLabelOptions {
  /** Defaults to A4. */
  format?: 'A4' | 'A5' | 'A6';
  /** Defaults to `ro`. */
  language?: 'ro' | 'en';
  /** ZPL resolution; only used in ZPL mode. */
  dpi?: number;
}

/** Query parameters for `GET /awb/label`. */
export interface AwbLabelParams extends AwbLabelOptions {
  awbs: Array<string | number>;
}

export interface InternalTariffParams {
  clientId?: ClientId;
  info: {
    service: string;
    payment: AwbPayment;
    weight: number;
    packages: Packages;
    dimensions?: Dimensions;
    declaredValue?: number;
    options?: string[];
  };
  recipient: {
    locality: string;
    county: string;
  };
  sender?: {
    locality?: string;
    county?: string;
  };
}

export interface ExternalTariffParams {
  clientId?: ClientId;
  info: {
    service: string;
    deliveryMode: DeliveryMode;
    documentType: ExternalContentType;
    weight: number;
    dimensions: Dimensions;
    packages: Packages;
  };
  recipient: {
    country: string;
  };
  sender?: {
    locality?: string;
    county?: string;
  };
}
