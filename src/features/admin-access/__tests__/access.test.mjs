import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const token = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
const plain = value => JSON.parse(JSON.stringify(value));
function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, atob, require: name => dependencies[name] ?? require(name) });
  return exports;
}
const permissionModel = loadModule('../../administrator-access/model.ts');
const model = loadModule('../model.ts', { 'features/administrator-access/model': permissionModel });
const collection = loadModule('../../../utils/api/collection.ts');
const api = {
  apiRequest: () => {
    throw new Error('Tests must use a mocked backend.');
  },
};
const permissionService = loadModule('../../administrator-access/service.ts', {
  './model': permissionModel,
  'utils/api/client': api,
  'utils/api/collection': collection,
  'utils/session/session-store': {},
});
const service = loadModule('../service.ts', {
  'features/administrator-access/model': permissionModel,
  'features/administrator-access/service': permissionService,
  'utils/api/client': api,
  'utils/api/collection': collection,
});
const access = permissions => ({ adminId: '7', isDeveloper: false, permissions });
const allows = (permissions, name, params) => model.meetsScreenRequirement(access(permissions), model.getRouteAccessRequirement(name, params));

describe('CMS web screen access parity', () => {
  it('requires exact READ access; parent access, show-menus and other action methods cannot unlock screens', () => {
    const permissions = {
      '/admin/operations': ['READ'],
      '/admin/operations/accounts/users': ['UPDATE'],
      '/admin/__settings__/show-menus-without-access': ['READ'],
    };
    assert.equal(allows(permissions, 'operation/users/index'), false);
    assert.equal(allows({ '/admin/operations/accounts/users': ['READ'] }, 'operation/users/index'), true);
    assert.equal(allows({}, 'operation/users/index'), false);
  });
  it('does not let developer access bypass non-Administrators screens', () => {
    const developer = { ...access({}), isDeveloper: true };
    assert.equal(model.hasScreenAccess(developer, '/admin/administrators', ['READ', 'UPDATE']), true);
    assert.equal(model.hasScreenAccess(developer, '/admin/operations/accounts/users'), false);
  });
  it('guards direct detail links, action routes and editor params independently', () => {
    const users = '/admin/operations/accounts/users';
    assert.equal(allows({ [users]: ['READ'] }, 'user/[id]/index', { id: '42' }), true);
    assert.equal(allows({ [users]: ['READ'] }, 'user/[id]/settings', { id: '42' }), false);
    assert.equal(allows({ [users]: ['READ'] }, 'operation/adjust-balance'), false);
    assert.equal(allows({ [users]: ['READ', 'UPDATE'] }, 'operation/adjust-balance'), true);
    const charging = '/admin/marketing/promotions/charge';
    assert.equal(allows({ [charging]: ['READ', 'CREATE'] }, 'marketing/promotions/editor', { section: 'charging', mode: 'create' }), true);
    assert.equal(allows({ [charging]: ['READ', 'CREATE'] }, 'marketing/promotions/editor', { section: 'charging', mode: 'update' }), false);
    assert.equal(allows({ [charging]: ['READ', 'CREATE', 'UPDATE'] }, 'marketing/promotions/editor', { section: 'wallet', mode: 'update' }), false);
    assert.equal(allows({ [charging]: ['READ', 'CREATE'] }, 'marketing/promotions/editor', { section: 'unknown' }), false);
  });
  it('uses the separate web permissions for MoMo/AlePay, content, promotions and subscription tabs', () => {
    assert.equal(model.getCmsSectionScreen('payments', 'momo'), '/admin/operations/payments/momo');
    assert.equal(model.getCmsSectionScreen('contents', 'privacy-policy'), '/admin/marketing/contents/policy');
    assert.equal(model.getCmsSectionScreen('promotions', 'wallet'), '/admin/marketing/promotions/money');
    assert.equal(allows({ '/admin/operations/payments/alepay': ['READ'] }, 'operation/payments/index'), true);
    assert.equal(model.hasScreenAccess(access({ '/admin/operations/payments/alepay': ['READ'] }), model.getCmsSectionScreen('payments', 'momo')), false);
  });
  it('maps every CMS section and actual route explicitly, and denies future unmapped screens', () => {
    const config = loadModule('../../../shared/cms-pages/config.ts').cmsPageConfigs;
    const catalog = JSON.parse(readFileSync(new URL('../../administrator-access/permission-catalog.json', import.meta.url), 'utf8'));
    const screens = new Set(catalog.flatMap(permissionModel.getNodePaths));
    for (const [page, value] of Object.entries(config))
      for (const section of value.sections) {
        const screen = model.getCmsSectionScreen(page, section.key);
        assert.ok(screens.has(screen), `${page}/${section.key} must use a real CMS permission`);
      }
    const appRoot = new URL('../../../app/', import.meta.url);
    for (const file of readdirSync(appRoot, { recursive: true })) {
      if (!file.endsWith('.tsx') || file.endsWith('_layout.tsx')) continue;
      const source = readFileSync(new URL(file, appRoot), 'utf8');
      if (!source.includes('export default')) continue;
      const route = file.replace(/\.tsx$/, '');
      if (route.endsWith('/editor') || route.startsWith('menu/')) continue;
      const requirement = model.getRouteAccessRequirement(route);
      assert.ok(!requirement || requirement.screens.length > 0, `${route} is unmapped`);
      for (const screen of requirement?.screens || []) assert.ok(screens.has(screen), `${route} uses an unknown permission`);
    }
    assert.equal(allows({}, 'operation/new-feature/index'), false);
  });
});

describe('current administrator access loading', () => {
  it('loads permissions for the authenticated ID and combines duplicate method records', async () => {
    const calls = [];
    const result = await service.fetchCurrentAdminAccess(token({ adminId: 7 }), async (path, options) => {
      calls.push({ path, options });
      return path === 'api/admins/7'
        ? { id: 7, roles: [] }
        : {
            member: [
              { screen: '/one', method: 'READ, UPDATE' },
              { screen: '/one', method: 'CREATE' },
            ],
          };
    });
    assert.deepEqual(plain(result), { adminId: '7', isDeveloper: false, permissions: { '/one': ['READ', 'UPDATE', 'CREATE'] } });
    assert.deepEqual(plain(calls.find(call => call.path === 'api/admin_accesses').options.params), { admin: '7', pagination: false });
  });
  it('resolves username-only tokens without using another admin account', async () => {
    const result = await service.fetchCurrentAdminAccess(token({ username: 'staff' }), async path => {
      if (path === 'api/admins')
        return [
          { id: 7, username: 'staff', roles: [] },
          { id: 8, username: 'someone-else', roles: ['ROLE_DEVELOPER'] },
        ];
      return [];
    });
    assert.equal(result.adminId, '7');
    assert.equal(result.isDeveloper, false);
    await assert.rejects(service.fetchCurrentAdminAccess(token({ username: 'missing' }), async () => []));
  });
  it('fails closed for malformed, failed and unreadable permission responses', async () => {
    await assert.rejects(service.fetchCurrentAdminAccess('malformed', async () => []));
    await assert.rejects(service.fetchCurrentAdminAccess(token({ id: 7 }), async path => (path === 'api/admins/7' ? { id: 7 } : { message: 'Forbidden' })));
    await assert.rejects(
      service.fetchCurrentAdminAccess(token({ id: 7 }), async () => {
        throw new Error('Offline');
      }),
      /Offline/,
    );
  });
  it('retains the web Administrators developer exception when permission collection access fails', async () => {
    const result = await service.fetchCurrentAdminAccess(token({ id: 7 }), async path => {
      if (path === 'api/admins/7') return { id: 7, roles: ['ROLE_DEVELOPER'] };
      throw new Error('Forbidden');
    });
    assert.equal(model.hasScreenAccess(result, '/admin/administrators'), true);
    assert.equal(model.hasScreenAccess(result, '/admin/technical/chargers'), false);
  });
});

describe('route guard rendering', () => {
  let query;
  let session;
  const ui = loadModule('../access-guard.tsx', {
    './model': model,
    './hooks': { useCurrentAdminAccess: () => ({ ...query, session }) },
    'utils/session/use-session-token': { useSessionToken: () => session },
    'expo-router': { Redirect: props => ({ type: 'redirect', props }), useRouter: () => ({ canGoBack: () => true, back: () => undefined }) },
    'react-native': { Pressable: 'button' },
    'components/base': { ThemedView: 'view', ThemedText: 'text' },
    'lucide-react-native': { LockKeyhole: 'lock', RefreshCw: 'retry' },
    themes: { Palette: {} },
  });
  function render(node) {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map(render);
    if (typeof node.type === 'function') return render(node.type(node.props));
    return { type: String(node.type), props: { ...node.props, children: render(node.props?.children) } };
  }
  function renderGuard(name = 'operation/users/index', params) {
    session = { data: 'session', isPending: false };
    let mounts = 0;
    const child = {
      type: () => {
        mounts += 1;
        return 'protected content';
      },
      props: {},
    };
    const result = render(ui.AdminRouteGuard({ routeName: name, params, children: child }));
    return { mounts, text: JSON.stringify(result) };
  }
  it('never mounts protected content before permissions resolve, on denial, offline or error', () => {
    for (const state of [
      {},
      { data: access({}) },
      { data: access({ '/admin/operations/accounts/users': ['READ'] }), isError: true },
      { fetchStatus: 'paused' },
    ]) {
      query = { refetch: async () => undefined, ...state };
      assert.equal(renderGuard().mounts, 0);
    }
    query = { data: access({}), refetch: async () => undefined };
    assert.match(renderGuard().text, /Bạn không có quyền thao tác với màn hình này/);
  });
  it('mounts allowed screens and blocks them again when READ is revoked', () => {
    query = { data: access({ '/admin/operations/accounts/users': ['READ'] }) };
    assert.equal(renderGuard().mounts, 1);
    query = { data: access({}), refetch: async () => undefined };
    assert.equal(renderGuard().mounts, 0);
  });
  it('blocks editor deep links when READ exists but the requested action is missing', () => {
    query = { data: access({ '/admin/marketing/promotions/charge': ['READ'] }), refetch: async () => undefined };
    assert.equal(renderGuard('marketing/promotions/editor', { section: 'charging', mode: 'create' }).mounts, 0);
  });
  it('keeps permission queries scoped to each login session', () => {
    const captured = [];
    const hooks = loadModule('../hooks.ts', {
      '@tanstack/react-query': {
        useQuery: options => {
          captured.push(options);
          return {};
        },
      },
      'expo-router/react-navigation': { useIsFocused: () => true },
      'utils/session/use-session-token': { useSessionToken: () => session },
      './model': model,
      './service': service,
    });
    session = { data: token({ id: 7 }) };
    hooks.useCurrentAdminAccess(true);
    session = { data: token({ id: 8 }) };
    hooks.useCurrentAdminAccess(true);
    assert.notDeepEqual(plain(captured[0].queryKey), plain(captured[1].queryKey));
    assert.equal(captured[0].refetchInterval, 30_000);
  });
});
