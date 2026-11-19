/** Successful `POST /login` response. */
export interface LoginResponse {
  status: string;
  data: {
    token: string;
    /** Format: `YYYY-MM-DD HH:mm:ss` (timezone not specified by the API). */
    expiresAt: string;
  };
}
