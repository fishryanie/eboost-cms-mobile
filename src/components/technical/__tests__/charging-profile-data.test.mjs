import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const collectionExports = {};
runInNewContext(
  ts.transpileModule(readFileSync(new URL('../../../utils/api/collection.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { exports: collectionExports },
);
const { getCollectionItems } = collectionExports;
const source = readFileSync(new URL('../charging-profile-data.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(compiled, {
  exports,
  require: name => {
    if (name === 'utils/api/client') return { apiRequest: () => assert.fail('A mock request is required') };
    if (name === 'utils/api/collection') return { getCollectionItems };
    assert.fail(`Unexpected dependency: ${name}`);
  },
});
const { fetchChargingProfile, getChargingProfileQueryKey, hasChargingProfileSource } = exports;

const detail = { meterValues: [{ sampledValues: [{ measurand: 'Power.Active.Import', value: '72000' }] }] };
const historySource = { carHistoryId: 9065, chargerId: 'BOX-A', invoiceId: 'INVOICE-A', transactionId: null };

describe('charging profile transaction reference resolution', () => {
  it('loads known transaction IDs directly from Hub', async () => {
    const calls = [];
    const result = await fetchChargingProfile({ ...historySource, transactionId: 'hub-123' }, async (path, options) => {
      calls.push({ path, service: options?.service });
      return detail;
    });

    assert.equal(result, detail);
    assert.deepEqual(calls, [{ path: 'api/transactions/hub-123', service: 'hub' }]);
  });

  it('refreshes the history reference if its list snapshot has no transaction ID', async () => {
    const calls = [];
    const result = await fetchChargingProfile(historySource, async (path, options) => {
      calls.push({ path, service: options?.service });
      return path.startsWith('api/car_charge_histories/') ? { transactionId: 'hub-456' } : detail;
    });

    assert.equal(result, detail);
    assert.deepEqual(calls, [
      { path: 'api/car_charge_histories/9065', service: undefined },
      { path: 'api/transactions/hub-456', service: 'hub' },
    ]);
  });

  it('resolves a numeric realtime transaction ID for the exact active invoice', async () => {
    const calls = [];
    const result = await fetchChargingProfile(historySource, async (path, options) => {
      calls.push({ path, search: options?.params?.search, service: options?.service });
      if (path.startsWith('api/car_charge_histories/')) return { transactionId: null };
      if (path === 'api/controller/statistic/car-realtime-status') {
        return {
          data: [
            { vendorId: 'BOX-A', charging_session: { invoice_id: 'INVOICE-OLD', transaction_id: 9064 } },
            { vendorId: 'BOX-A', charging_session: { invoice_id: 'INVOICE-A', transaction_id: 9065 } },
          ],
        };
      }
      return detail;
    });

    assert.equal(result, detail);
    assert.equal(calls[1].search, 'BOX-A');
    assert.equal(calls[2].path, 'api/transactions/9065');
    assert.equal(calls[2].service, 'hub');
  });

  it('does not substitute another invoice or the numeric history ID for a missing Hub reference', async () => {
    const calls = [];
    const result = await fetchChargingProfile(historySource, async path => {
      calls.push(path);
      if (path.startsWith('api/car_charge_histories/')) return { transactionId: null };
      return { data: [{ vendorId: 'BOX-A', charging_session: { invoice_id: 'INVOICE-OTHER', transaction_id: 9065 } }] };
    });

    assert.equal(result, null);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(path => !path.startsWith('api/transactions/')));
  });

  it('keeps unrelated invoices in separate query cache entries when their IDs are missing', () => {
    assert.notDeepEqual(getChargingProfileQueryKey(historySource), getChargingProfileQueryKey({ ...historySource, invoiceId: 'INVOICE-B' }));
    assert.equal(hasChargingProfileSource(historySource), true);
    assert.equal(hasChargingProfileSource({}), false);
  });

  it('accepts transaction ID zero as a reference and does not disable its request', async () => {
    let requestedPath;
    assert.equal(hasChargingProfileSource({ transactionId: 0 }), true);
    await fetchChargingProfile({ transactionId: 0 }, async path => {
      requestedPath = path;
      return detail;
    });

    assert.equal(requestedPath, 'api/transactions/0');
  });

  it('propagates lookup and Hub API failures for the error and retry UI', async () => {
    const failure = new Error('API unavailable');
    await assert.rejects(
      fetchChargingProfile(historySource, async () => {
        throw failure;
      }),
      error => error === failure,
    );
    await assert.rejects(
      fetchChargingProfile({ transactionId: 'hub-123' }, async () => {
        throw failure;
      }),
      error => error === failure,
    );
  });
});
