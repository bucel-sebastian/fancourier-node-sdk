export type PickupPointType = 'fanbox' | 'paypoint' | 'office';

export interface PickupPointAddress {
  locality: string;
  county: string;
  street: string;
  streetNo: string;
  zipCode?: string;
  floor?: string;
  reference?: string;
  [key: string]: unknown;
}

export interface PickupPointSchedule {
  firstHour: string;
  secondHour: string;
}

export interface PickupPointDrawer {
  type: string;
  number: number;
}

/** FANbox / PayPoint / FAN office returned by `GET /reports/pickup-points`. */
export interface PickupPoint {
  id: string;
  name: string;
  routingLocation?: string;
  description?: string;
  address: PickupPointAddress;
  latitude?: string;
  longitude?: string;
  schedule?: PickupPointSchedule[];
  drawer?: PickupPointDrawer[];
  phones?: string[];
  email?: string;
  highDemand?: boolean;
  paymentMethods?: string[];
  [key: string]: unknown;
}

export interface PickupPointQuery {
  type?: PickupPointType;
  id?: string;
}
