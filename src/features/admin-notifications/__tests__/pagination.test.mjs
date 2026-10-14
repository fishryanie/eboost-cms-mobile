import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../admin-notification-service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;

function loadService(apiRequest = async () => []) {
  const module = { exports: {} };
  const resolve = name => {
    if (name === 'utils/api/client') return { apiRequest };
    if (name === '@tanstack/react-query') return { useInfiniteQuery: options => options, useQuery: options => options };
    return require(name);
  };
  new Function('require', 'module', 'exports', compiled)(resolve, module, module.exports);
  return module.exports;
}

function records(count, start = 1) {
  return Array.from({ length: count }, (_, index) => ({
    createdAt: `2026-10-09T${String(23 - index).padStart(2, '0')}:00:00`,
    id: start + index,
    isRead: false,
    message: 'Notification message',
    title: `Notification ${start + index}`,
  }));
}

const service = loadService();

describe('admin notification pagination', () => {
  it('sends the documented pagination and optional filters', async () => {
    const requests = [];
    const api = loadService(async (path, options) => {
      requests.push({ path, ...options });
      return { inbox: records(5) };
    });
    const filters = { createdFrom: '2026-09-01', createdTo: '2026-09-12', title: 'test', type: 'TEST' };
    await api.fetchAdminNotificationsPage(filters, 2);
    assert.deepEqual(requests, [{ path: 'api/controller/admin-notification/get-data', params: { ...filters, itemsPerPage: 5, page: 2 } }]);
  });

  it('maps day filters to inclusive calendar dates across month boundaries', () => {
    const now = dayjs('2026-10-09T12:00:00');
    assert.deepEqual(service.getAdminNotificationDateFilters(1, now), { createdFrom: '2026-10-09', createdTo: '2026-10-09' });
    assert.deepEqual(service.getAdminNotificationDateFilters(3, now), { createdFrom: '2026-10-07', createdTo: '2026-10-09' });
    assert.deepEqual(service.getAdminNotificationDateFilters(30, now), { createdFrom: '2026-09-10', createdTo: '2026-10-09' });
  });

  it('continues full pages and stops short or empty pages without metadata', () => {
    assert.equal(service.parseAdminNotificationsPage({ inbox: records(5) }, 1, 5).nextPage, 2);
    assert.equal(service.parseAdminNotificationsPage(records(2), 2, 5).nextPage, undefined);
    assert.equal(service.parseAdminNotificationsPage({ inbox: [] }, 3, 5).nextPage, undefined);
  });

  it('stops an exactly full final page using server totals', () => {
    assert.equal(service.parseAdminNotificationsPage({ inbox: records(5), totalItems: 10 }, 1, 5).nextPage, 2);
    assert.equal(service.parseAdminNotificationsPage({ inbox: records(5, 6), totalItems: 10 }, 2, 5).nextPage, undefined);
    assert.equal(service.parseAdminNotificationsPage({ 'hydra:member': records(5), 'hydra:totalItems': 5 }, 1, 5).nextPage, undefined);
    assert.equal(service.parseAdminNotificationsPage({ data: records(5), pagination: { total_pages: 2 } }, 1, 5).nextPage, 2);
    assert.equal(service.parseAdminNotificationsPage({ data: records(5), pagination: { total_items: 5 } }, 1, 5).nextPage, undefined);
  });

  it('respects Hydra next links and a final view without a next link', () => {
    const payload = { 'hydra:member': records(5), 'hydra:view': { 'hydra:next': '/api/notifications?itemsPerPage=5&page=2' } };
    assert.equal(service.parseAdminNotificationsPage(payload, 1, 5).nextPage, 2);
    assert.equal(service.parseAdminNotificationsPage({ ...payload, 'hydra:view': {} }, 2, 5).nextPage, undefined);
    assert.equal(service.parseAdminNotificationsPage(payload, 2, 5).nextPage, undefined);
  });

  it('uses the server record count even when a malformed notification is excluded', () => {
    const page = service.parseAdminNotificationsPage({ inbox: [...records(4), { title: 'Missing ID' }] }, 1, 5);
    assert.equal(page.items.length, 4);
    assert.equal(page.nextPage, 2);
  });

  it('deduplicates numeric and string IDs and stops a repeated page', () => {
    const first = service.parseAdminNotificationsPage(records(5), 1, 5);
    const repeated = service.parseAdminNotificationsPage(
      records(5).map(item => ({ ...item, id: String(item.id) })),
      2,
      5,
    );
    assert.equal(service.mergeAdminNotificationPages([first, repeated]).length, 5);
    assert.equal(service.getNextAdminNotificationsPage(repeated, [first, repeated]), undefined);
    const overlapping = service.parseAdminNotificationsPage(records(5, 5), 2, 5);
    assert.equal(service.mergeAdminNotificationPages([first, overlapping]).length, 9);
    assert.equal(service.getNextAdminNotificationsPage(overlapping, [first, overlapping]), 3);
  });

  it('updates every cached page and the badge without mutating the rollback snapshot', () => {
    const first = service.parseAdminNotificationsPage(records(5), 1, 5);
    const second = service.parseAdminNotificationsPage(records(2, 6), 2, 5);
    const cached = { pages: [first, second], pageParams: [1, 2] };
    const markRead = items => items.map(item => (String(item.id) === '6' ? { ...item, isRead: true } : item));
    const updated = service.updateAdminNotificationCache(cached, markRead);
    assert.equal(updated.pages[1].items[0].isRead, true);
    assert.equal(cached.pages[1].items[0].isRead, false);
    assert.deepEqual(updated.pageParams, [1, 2]);
    assert.equal(updated.pages[0].nextPage, 2);
    const deleted = service.updateAdminNotificationCache(updated, items => items.filter(item => String(item.id) !== '6'));
    assert.deepEqual(
      deleted.pages[1].items.map(item => item.id),
      [7],
    );
    assert.equal(service.updateAdminNotificationCache(second.items, markRead)[0].isRead, true);
    assert.equal(service.updateAdminNotificationCache(undefined, markRead), undefined);
  });
});

describe('infinite notification query', () => {
  function setup(request) {
    const api = loadService(request);
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    const filters = { createdFrom: '2026-10-09', createdTo: '2026-10-09' };
    const options = api.useInfiniteAdminNotifications(filters);
    return { api, client, filters, observer: new InfiniteQueryObserver(client, options) };
  }

  it('appends pages, deduplicates concurrent load more and refetches from page one', async () => {
    const requests = [];
    const { client, observer } = setup(async (_path, { params }) => {
      requests.push(params.page);
      return { inbox: records(5, (params.page - 1) * 5 + 1), totalItems: 10 };
    });
    try {
      await observer.fetchNextPage();
      await Promise.all([observer.fetchNextPage({ cancelRefetch: false }), observer.fetchNextPage({ cancelRefetch: false })]);
      assert.deepEqual(requests, [1, 2]);
      assert.equal(service.mergeAdminNotificationPages(observer.getCurrentResult().data.pages).length, 10);
      assert.equal(observer.getCurrentResult().hasNextPage, false);
      await observer.refetch();
      assert.deepEqual(requests, [1, 2, 1, 2]);
    } finally {
      client.clear();
    }
  });

  it('keeps loaded content after a load more failure and retries the same page', async () => {
    const requests = [];
    let failNextPage = true;
    const { client, observer } = setup(async (_path, { params }) => {
      requests.push(params.page);
      if (params.page === 2 && failNextPage) throw new Error('Network unavailable');
      return { inbox: records(params.page === 1 ? 5 : 2, (params.page - 1) * 5 + 1) };
    });
    try {
      await observer.fetchNextPage();
      await observer.fetchNextPage();
      assert.equal(observer.getCurrentResult().isFetchNextPageError, true);
      assert.equal(observer.getCurrentResult().data.pages[0].items.length, 5);
      failNextPage = false;
      await observer.fetchNextPage();
      assert.deepEqual(requests, [1, 2, 2]);
      assert.equal(service.mergeAdminNotificationPages(observer.getCurrentResult().data.pages).length, 7);
      assert.equal(observer.getCurrentResult().hasNextPage, false);
    } finally {
      client.clear();
    }
  });

  it('starts at page one when the date filter changes', async () => {
    const requests = [];
    const { api, client, observer } = setup(async (_path, { params }) => {
      requests.push({ page: params.page, createdFrom: params.createdFrom });
      return { inbox: records(5, (params.page - 1) * 5 + 1) };
    });
    try {
      await observer.fetchNextPage();
      await observer.fetchNextPage();
      observer.setOptions(api.useInfiniteAdminNotifications({ createdFrom: '2026-10-07', createdTo: '2026-10-09' }));
      await observer.fetchNextPage();
      assert.deepEqual(requests, [
        { page: 1, createdFrom: '2026-10-09' },
        { page: 2, createdFrom: '2026-10-09' },
        { page: 1, createdFrom: '2026-10-07' },
      ]);
      assert.deepEqual(observer.getCurrentResult().data.pageParams, [1]);
    } finally {
      client.clear();
    }
  });
});
