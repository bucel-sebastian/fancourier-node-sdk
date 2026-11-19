import type { ClientId, Dimensions, Packages } from './common';

export interface CourierOrderAddress {
  county: string;
  locality: string;
  street: string;
  streetNo?: string;
  zipCode?: string;
  building?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
}

export interface CourierOrderRecipient {
  name: string;
  contactPerson?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: CourierOrderAddress;
}

export interface CourierOrderInfo {
  awbNumber?: string;
  packages: Packages;
  weight: number;
  dimensions?: Dimensions;
  orderType: string;
  pickupDate: string;
  pickupHours: {
    first: string;
    second: string;
  };
  observations?: string;
}

/** Body of `POST /order`. */
export interface CreateCourierOrderRequest {
  clientId?: ClientId;
  info: CourierOrderInfo;
  /** Required only for Express Loco 1h/2h/4h/6h orders. */
  recipient?: CourierOrderRecipient;
}

/** `data` returned by `POST /order`. */
export interface CreatedCourierOrder {
  id: number;
}

/** Row returned by `GET /reports/orders`. */
export interface CourierOrderReport {
  info: CourierOrderInfo & {
    id: number;
    [key: string]: unknown;
  };
  recipient?: CourierOrderRecipient;
  sender?: CourierOrderRecipient;
  [key: string]: unknown;
}

export interface CourierOrderEvent {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface CourierOrderTrackingEvent {
  id?: number;
  name?: string;
  location?: string;
  date?: string;
  [key: string]: unknown;
}

/** Row returned by `GET /reports/orders/tracking`. */
export interface CourierOrderTracking {
  orderId: number;
  events?: CourierOrderTrackingEvent[];
  [key: string]: unknown;
}

/** Branch returned by `GET /reports/branches`. */
export interface Branch {
  id: number | string;
  name?: string;
  [key: string]: unknown;
}
