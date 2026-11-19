/** FanCourier client id (numeric in practice, string accepted for convenience). */
export type ClientId = number | string;

/** Report language accepted by tracking/label endpoints. */
export type Language = 'ro' | 'en';

/** Parcel/envelope counts. At least one should be greater than zero. */
export interface Packages {
  parcel?: number;
  envelope?: number;
}

/** Physical dimensions in centimetres. */
export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

/** Cost breakdown returned by both tariff endpoints. */
export interface Tariff {
  extraKmCost: number;
  weightCost: number;
  insuranceCost: number;
  optionsCost: number;
  fuelCost: number;
  costNoVAT: number;
  vat: number;
  total: number;
}

/** `{ status, data }` envelope used by most catalogue/report endpoints. */
export interface StatusResponse<T> {
  status: string;
  data: T;
}

/** `{ status, message }` envelope used by failures and simple operations. */
export interface MessageResponse {
  status?: string;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

/** Paginated response shared by streets and report endpoints. */
export interface Paginated<T> {
  status: string;
  total: number;
  perPage: number;
  currentPage: number;
  data: T[];
}
