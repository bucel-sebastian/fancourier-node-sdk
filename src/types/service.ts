/** Courier service returned by `GET /reports/services`. */
export interface Service {
  id: number;
  name: string;
  description: string | null;
  [key: string]: unknown;
}

/** Service option returned by `GET /reports/service-options`. */
export interface ServiceOption {
  id: string;
  name: string;
  [key: string]: unknown;
}
