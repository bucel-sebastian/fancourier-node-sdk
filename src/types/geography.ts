/** Romanian county returned by `GET /reports/counties`. */
export interface County {
  id: number;
  name: string;
  [key: string]: unknown;
}

/** Romanian locality returned by `GET /reports/localities`. */
export interface Locality {
  id: number;
  name: string;
  county: string;
  agency?: string;
  exteriorKm?: number;
  [key: string]: unknown;
}

/** Street number-range details. */
export interface StreetDetails {
  fromNo?: number | string;
  toNo?: number | string;
  parityNo?: string;
  zipCode?: string;
  visualCode?: string;
  routingCode?: string;
  [key: string]: unknown;
}

/** Street returned by `GET /reports/streets`. */
export interface Street {
  id: number;
  street: string;
  type?: string;
  locality: string;
  county: string;
  details?: StreetDetails;
  [key: string]: unknown;
}

/** Country returned by `GET /reports/countries`. */
export interface Country {
  id: number;
  name: string;
  deliveryMode?: string;
  code?: string;
  [key: string]: unknown;
}

/** External county returned by `GET /reports/external-counties`. */
export interface ExternalCounty {
  id: number;
  name: string;
  [key: string]: unknown;
}

/** External locality returned by `GET /reports/external-localities`. */
export interface ExternalLocality {
  id: number;
  name: string;
  county: string;
  country: string;
  [key: string]: unknown;
}

export interface LocalityQuery {
  /** County name. */
  county?: string;
}

export interface StreetQuery {
  county: string;
  locality: string;
  page?: number;
  /** Maximum 1000. */
  perPage?: number;
}

export interface ExternalCountyQuery {
  country: string;
}

export interface ExternalLocalityQuery {
  country: string;
  county?: string;
  page?: number;
  perPage?: number;
}
