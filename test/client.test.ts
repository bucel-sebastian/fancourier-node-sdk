import { describe, expect, it } from 'vitest';
import { AuthenticationError, Fancourier, RateLimitError, ValidationError } from '../src';
import { formBody, jsonResponse, makeClient } from './helpers';

describe('FancourierClient authentication', () => {
  it('logs in lazily, caches the token, and sends it as a Bearer header', async () => {
    const { client, calls } = makeClient(
      (call) => {
        if (call.url.endsWith('/login')) {
          return jsonResponse({
            status: 'success',
            data: { token: 'fresh-token', expiresAt: '2099-01-01 00:00:00' },
          });
        }
        return jsonResponse({ status: 'success', data: [{ id: 1, name: 'Standard' }] });
      },
      { token: undefined },
    );

    await client.services.list();
    await client.services.list();

    expect(calls).toHaveLength(3);
    expect(calls[0]?.url).toBe('https://api.fancourier.ro/login');
    expect(formBody(calls[0]!).get('username')).toBe('clienttest');
    expect(formBody(calls[0]!).get('password')).toBe('testing');
    expect(calls[1]?.init.headers).toMatchObject({ Authorization: 'Bearer fresh-token' });
    expect(calls[2]?.init.headers).toMatchObject({ Authorization: 'Bearer fresh-token' });
  });

  it('shares a single in-flight login between concurrent callers', async () => {
    let loginCalls = 0;
    const { client } = makeClient(
      (call) => {
        if (call.url.endsWith('/login')) {
          loginCalls += 1;
          return jsonResponse({
            status: 'success',
            data: { token: 'shared-token', expiresAt: '2099-01-01 00:00:00' },
          });
        }
        return jsonResponse({ status: 'success', data: [] });
      },
      { token: undefined },
    );

    await Promise.all([client.ensureToken(), client.ensureToken(), client.ensureToken()]);
    expect(loginCalls).toBe(1);
  });

  it('re-authenticates and retries once on 401', async () => {
    let loginCalls = 0;
    let dataCalls = 0;
    const { client, calls } = makeClient((call) => {
      if (call.url.endsWith('/login')) {
        loginCalls += 1;
        return jsonResponse({
          status: 'success',
          data: { token: `token-${loginCalls}`, expiresAt: '2099-01-01 00:00:00' },
        });
      }
      dataCalls += 1;
      if (dataCalls === 1) {
        return jsonResponse({ status: 'error', message: 'expired' }, 401);
      }
      return jsonResponse({ status: 'success', data: [{ id: 1, name: 'Standard' }] });
    });

    const services = await client.services.list();

    expect(services).toEqual([{ id: 1, name: 'Standard' }]);
    expect(loginCalls).toBe(1);
    expect(calls.filter((call) => call.url.endsWith('/login'))).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });

  it('throws AuthenticationError when the login response is not successful', async () => {
    const { client } = makeClient(
      () => jsonResponse({ status: 'error', message: 'Invalid credentials' }),
      { token: undefined },
    );

    await expect(client.ensureToken()).rejects.toBeInstanceOf(AuthenticationError);
    await expect(client.ensureToken()).rejects.toThrow('Invalid credentials');
  });

  it('maps HTTP errors to typed errors', async () => {
    const { client } = makeClient(() =>
      jsonResponse({ status: 'error', message: 'Bad request' }, 400),
    );

    await expect(client.services.list()).rejects.toBeInstanceOf(ValidationError);
  });

  it('exposes Retry-After on 429 responses', async () => {
    const { client } = makeClient(
      () =>
        new Response(JSON.stringify({ message: 'Slow down' }), {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '7' },
        }),
    );

    const error = await client.services.list().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(7);
  });

  it('supports setting and clearing a token manually', async () => {
    const { client } = makeClient(() => jsonResponse({ status: 'success', data: [] }));

    expect(client.getToken()).toBe('test-token');
    client.setToken('other', new Date('2099-01-01T00:00:00Z'));
    expect(client.getToken()).toBe('other');
    expect(client.getTokenExpiresAt()?.toISOString()).toBe('2099-01-01T00:00:00.000Z');
    client.clearToken();
    expect(client.getToken()).toBeUndefined();
  });
});

describe('Fancourier constructor', () => {
  it('exposes Fancourier as an alias of FancourierClient', () => {
    const client = new Fancourier({
      clientId: 1,
      username: 'u',
      password: 'p',
      token: 'token',
    });

    expect(client).toBeInstanceOf(Fancourier);
  });

  it('strips a trailing slash from a custom base URL', async () => {
    const { client, calls } = makeClient(
      () => jsonResponse({ status: 'success', data: [] }),
      { baseUrl: 'https://example.test/' },
    );

    await client.services.list();
    expect(calls[0]?.url).toBe('https://example.test/reports/services');
  });
});
