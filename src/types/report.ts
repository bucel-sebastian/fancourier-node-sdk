import type { Dimensions, Packages } from './common';

/** `info` block of a shipping slip / AWB report row. */
export interface ShippingSlipInfo {
  awbNumber?: number | string;
  weight?: number;
  dimensions?: Dimensions;
  payment?: string;
  cod?: number;
  returnPayment?: number | null;
  declaredValue?: number;
  observations?: string;
  content?: string;
  date?: string;
  service?: string;
  cost?: number;
  packages?: Packages;
  costCenter?: string;
  options?: string[];
  refund?: number | null;
  currency?: string;
  [key: string]: unknown;
}

export interface ShippingSlipParty {
  name?: string;
  contactPerson?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: {
    county?: string;
    locality?: string;
    street?: string;
    streetNo?: string;
    zipCode?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Row returned by `GET /reports/awb`. */
export interface ShippingSlip {
  info: ShippingSlipInfo;
  recipient?: ShippingSlipParty;
  sender?: ShippingSlipParty;
  [key: string]: unknown;
}

export interface AwbEvent {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface AwbTrackingEvent {
  id?: number;
  name?: string;
  location?: string;
  date?: string;
  [key: string]: unknown;
}

export interface AwbConfirmation {
  name?: string;
  date?: string;
  [key: string]: unknown;
}

/** Row returned by `GET /reports/awb/tracking`. */
export interface AwbTracking {
  content?: string;
  awbNumber: number | string;
  date?: string;
  paymentDate?: string | null;
  returnAwbNumber?: number | string | null;
  redirectionAwbNumber?: number | string | null;
  reimbursementAwbNumber?: number | string | null;
  oPODAwbNumber?: number | string | null;
  confirmation?: AwbConfirmation;
  OTD?: number | string | null;
  events?: AwbTrackingEvent[];
  [key: string]: unknown;
}

export interface BankTransferInfo {
  awbNumber?: number | string;
  awbDate?: string;
  amountCollected?: number;
  content?: string;
  transferDate?: string;
  returnAwbNumber?: number | string | null;
  reimbursementAwbNumber?: number | string | null;
  transactionDate?: string;
  [key: string]: unknown;
}

/** Row returned by `GET /reports/bank-transfers`. */
export interface BankTransfer {
  info: BankTransferInfo;
  recipient?: {
    name?: string;
    contactPerson?: string;
    address?: { locality?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  sender?: {
    name?: string;
    contactPerson?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AwbConfirmationQuery {
  awb: Array<string | number>;
}

export interface AwbTrackingQuery {
  awb: Array<string | number>;
  language?: 'ro' | 'en';
}

export interface DatePageQuery {
  date: string;
  page?: number;
  perPage?: number;
}

export interface LanguageQuery {
  language?: 'ro' | 'en';
}

export interface OrderTrackingQuery {
  order: Array<string | number>;
  language?: 'ro' | 'en';
}

export interface BranchQuery {
  county?: string;
  city?: string;
}
