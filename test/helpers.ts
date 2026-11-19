import { FancourierClient } from '../src';
import type { FancourierClientOptions } from '../src';

export interface RecordedCall {
  url: string;
  init: RequestInit;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export function binaryResponse(bytes: number[], contentType = 'application/pdf'): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { 'content-type': contentType },
  });
}

export type Handler = (call: RecordedCall) => Response | Promise<Response>;

export function makeClient(
  handler: Handler,
  overrides: Partial<FancourierClientOptions> = {},
): { client: FancourierClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const call = { url: String(input), init: init ?? {} };
    calls.push(call);
    return handler(call);
  };

  const client = new FancourierClient({
    clientId: 7032158,
    username: 'clienttest',
    password: 'testing',
    token: 'test-token',
    fetchImpl,
    ...overrides,
  });

  return { client, calls };
}

export function formBody(call: RecordedCall): URLSearchParams {
  return new URLSearchParams(String(call.init.body ?? ''));
}

export function jsonBody<T = unknown>(call: RecordedCall): T {
  return JSON.parse(String(call.init.body)) as T;
}
