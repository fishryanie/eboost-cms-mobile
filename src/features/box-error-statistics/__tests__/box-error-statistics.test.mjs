import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => dependencies[name] ?? require(name) });
  return exports;
}

const sampleBox = {
  vehicle: 'car',
  box_id: 123,
  box_name: 'Box ô tô 123',
  vendor_id: 'Ecar_000123',
  unique_id: 'CAR0000123',
  station_id: 10,
  station_name: 'Trạm sạc A',
  total_sessions: 20,
  failed_sessions: 4,
  error_rate_percent: 20,
};
const sampleData = { start_time: 1791676800, end_time: 1791849600, error_threshold: 15, total_items: 1, boxes: [sampleBox] };
const model = loadModule('../model.ts');
const service = loadModule('../service.ts', { 'utils/api/client': {} });

describe('box error statistics API contract', () => {
  it('uses the core GET endpoint without undocumented filters and reads data.boxes with report metadata', async () => {
    let calledPath;
    let calledOptions;
    const result = await service.fetchBoxErrorStatistics(async (path, options) => {
      calledPath = path;
      calledOptions = options;
      return { success: true, data: sampleData };
    });
    assert.equal(calledPath, 'api/controller/statistic/box-error-statistics');
    assert.equal(calledOptions, undefined);
    assert.deepEqual(result, sampleData);
  });

  it('treats successful empty responses as an empty report', async () => {
    const result = await service.fetchBoxErrorStatistics(async () => ({ success: true, data: { ...sampleData, boxes: [], total_items: 0 } }));
    assert.equal(result.boxes.length, 0);
    assert.equal(result.error_threshold, 15);
  });

  it('rejects API failure and unreadable data instead of showing a false empty state', async () => {
    await assert.rejects(
      service.fetchBoxErrorStatistics(async () => ({ success: false, message: 'Forbidden' })),
      /Forbidden/,
    );
    for (const response of [null, { success: true }, { success: true, data: [] }, { success: true, data: { boxes: null } }]) {
      await assert.rejects(
        service.fetchBoxErrorStatistics(async () => response),
        /Unable to load/,
      );
    }
    await assert.rejects(
      service.fetchBoxErrorStatistics(async () => {
        throw new Error('Offline');
      }),
      /Offline/,
    );
  });
});

describe('box error list filtering', () => {
  const boxes = [sampleBox, { ...sampleBox, vehicle: 'bike', box_id: 456, error_rate_percent: 50, failed_sessions: 10 }];

  it('searches box names, both identifiers, box IDs and stations without case or whitespace sensitivity', () => {
    for (const search of [' ô TÔ ', ' ECAR_000123 ', 'car0000123', '123', '10', 'TRẠM SẠC A']) {
      assert.equal(model.filterBoxErrors(boxes, 'car', search)[0]?.box_id, 123);
    }
    assert.equal(model.filterBoxErrors(boxes, 'all', 'missing').length, 0);
  });

  it('combines vehicle and search filters and preserves the original report while prioritizing error rates', () => {
    assert.equal(model.filterBoxErrors(boxes, 'bike', 'Trạm')[0]?.box_id, 456);
    assert.equal(model.filterBoxErrors(boxes, 'all', '')[0]?.box_id, 456);
    assert.equal(boxes[0].box_id, 123);
    assert.equal(model.filterBoxErrors([{ ...sampleBox, box_name: null, vendor_id: null, unique_id: null, station_name: null }], 'all', '123').length, 1);
  });
});

describe('box error screen query states', () => {
  let query;
  let retryCount = 0;
  const retry = async () => {
    retryCount += 1;
  };
  const screen = loadModule('../box-errors-screen.tsx', {
    '@tanstack/react-query': { useQuery: () => ({ fetchStatus: 'idle', refetch: retry, ...query }) },
    'expo-router': { useRouter: () => ({ back() {} }) },
    react: { useState: value => [value, () => {}], useMemo: factory => factory() },
    'react-native': { RefreshControl: 'refresh' },
    'components/base': { ThemedView: 'view', ThemedText: 'text' },
    'components/technical/vehicle-search-toolbar': { VehicleSearchToolbar: 'search-toolbar' },
    'components/organisms/anmated-header-flatlist': { AnimatedHeaderFlatList: 'list' },
    'components/technical/common': { screenHorizontalPadding: 16 },
    'components/technical/list-ui': { LoadingBlock: 'loading', RetryBlock: 'retry' },
    'components/ui': { EmptyState: 'empty' },
    'features/admin-access/hooks': { useCurrentAdminAccess: () => ({ canAccess: () => true }) },
    themes: { Palette: {} },
    './box-error-card': { BoxErrorCard: 'card' },
    './model': model,
    './service': service,
  });
  const listProps = () => screen.default().props.children.props;
  const emptyState = () => {
    const node = listProps().ListEmptyComponent;
    return node.type(node.props);
  };

  it('distinguishes the first load, an offline pause, failure, and a resolved empty report', () => {
    query = { isLoading: true, fetchStatus: 'fetching' };
    assert.equal(emptyState().type, 'loading');
    query = { fetchStatus: 'paused' };
    assert.equal(emptyState().props.title, 'You are offline');
    query = { error: new Error('Request failed') };
    const failed = emptyState();
    assert.equal(failed.type, 'retry');
    retryCount = 0;
    failed.props.onRetry();
    assert.equal(retryCount, 1);
    query = { data: { ...sampleData, boxes: [], total_items: 0 } };
    assert.equal(emptyState().props.title, 'No charger errors');
  });

  it('keeps report rows visible after a refresh fails and exposes another retry', () => {
    query = { data: sampleData, error: new Error('Refresh failed') };
    const props = listProps();
    assert.equal(props.data.length, 1);
    assert.equal(props.renderItem({ item: props.data[0] }).props.box, sampleBox);
    const refreshError = props.ListHeaderComponent.props.children.find(child => child?.type === 'retry');
    assert.equal(refreshError.props.message, 'Refresh failed');
    retryCount = 0;
    props.refreshControl.props.onRefresh();
    assert.equal(retryCount, 1);
  });
});
