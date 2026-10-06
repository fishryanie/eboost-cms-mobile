import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const token = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

function loadModule(relativePath, dependencies = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, atob, require: name => dependencies[name] ?? require(name) });
  return exports;
}

const model = loadModule('../model.ts');
const collection = loadModule('../../../utils/api/collection.ts');
const service = loadModule('../service.ts', {
  './model': model,
  'utils/api/client': {
    apiRequest: () => {
      throw new Error('Tests must use the mocked backend.');
    },
  },
  'utils/api/collection': collection,
  'utils/session/session-store': { sessionStore: { getToken: async () => token({ adminId: 7 }) } },
});
const plain = value => JSON.parse(JSON.stringify(value));
const group = {
  name: 'Operations',
  path: '/admin/operations',
  children: [{ name: 'Users', path: '/admin/operations/accounts', children: [{ name: 'Groups', path: '/admin/operations/accounts/groups' }] }],
};

describe('administrator permission editing', () => {
  it('hydrates duplicate comma-separated methods and retains proficiency', () => {
    assert.deepEqual(
      plain(
        model.hydratePermissions([
          { screen: group.path, method: 'READ, UPDATE ,READ' },
          { screen: group.path, method: 'APPROVE,PROFICIENCY:85' },
        ]),
      ),
      { [group.path]: ['READ', 'UPDATE', 'APPROVE', 'PROFICIENCY:85'] },
    );
  });

  it('propagates a group method to all descendants without changing other methods', () => {
    const before = { [group.children[0].path]: ['UPDATE', 'PROFICIENCY:90'] };
    assert.equal(model.getMethodState(group, before, 'UPDATE'), 'mixed');
    const after = model.setNodeMethod(before, group, 'READ', true);
    assert.equal(model.getMethodState(group, after, 'READ'), true);
    assert.deepEqual(plain(after[group.children[0].path]), ['UPDATE', 'PROFICIENCY:90', 'READ']);
    assert.deepEqual(plain(model.setNodeMethod(after, group, 'READ', false)[group.children[0].path]), ['UPDATE', 'PROFICIENCY:90']);
    assert.deepEqual(before, { [group.children[0].path]: ['UPDATE', 'PROFICIENCY:90'] });
  });

  it('selects and clears all screen actions without dropping settings, unknown screens or proficiency', () => {
    const before = { [group.path]: ['PROFICIENCY:80'], '/custom': ['READ'], [model.showMenusWithoutAccessScreen]: ['READ'] };
    const selected = model.setAllMethods(before, [group], true);
    assert.equal(
      model.getNodePaths(group).every(path => model.accessMethods.every(method => selected[path].includes(method))),
      true,
    );
    const cleared = model.setAllMethods(selected, [group], false);
    assert.deepEqual(plain(cleared[group.path]), ['PROFICIENCY:80']);
    assert.deepEqual(plain(cleared['/custom']), ['READ']);
    assert.deepEqual(plain(cleared[model.showMenusWithoutAccessScreen]), ['READ']);
  });

  it('applies exclusive web presets to descendants and preserves all proficiency scores and menu setting', () => {
    const before = { '/custom': ['DELETE', 'PROFICIENCY:30'], [group.path]: ['DELETE', 'PROFICIENCY:80'], [model.showMenusWithoutAccessScreen]: ['READ'] };
    const after = model.applyPermissionPreset(before, [group], { name: 'Test', accesses: [{ screens: group.children[0].path, methods: ['READ', 'UPDATE'] }] });
    assert.deepEqual(plain(after[group.path]), ['PROFICIENCY:80']);
    assert.deepEqual(plain(after[group.children[0].children[0].path]), ['READ', 'UPDATE']);
    assert.deepEqual(plain(after['/custom']), ['PROFICIENCY:30']);
    assert.deepEqual(plain(after[model.showMenusWithoutAccessScreen]), ['READ']);
    assert.deepEqual(plain(model.resetPermissions(after)[model.showMenusWithoutAccessScreen]), []);
  });

  it('uses POST, PATCH and DELETE with the web IRI contract and consolidates duplicates safely', () => {
    const operations = model.buildPermissionSaveOperations(
      { '/one': ['READ', 'UPDATE'], '/new': ['APPROVE'], '/empty': [] },
      [
        { '@id': '/api/admin_accesses/11', screen: '/one', method: 'READ' },
        { id: 12, screen: '/one', method: 'UPDATE' },
        { id: 13, screen: '/empty', method: 'READ' },
      ],
      '42',
    );
    assert.deepEqual(plain(operations), [
      { body: { method: 'READ,UPDATE' }, id: '11', method: 'PATCH' },
      { id: '12', method: 'DELETE' },
      { body: { admin: '/api/admins/42', screen: '/new', method: 'APPROVE' }, method: 'POST' },
      { id: '13', method: 'DELETE' },
    ]);
  });

  it('ignores ordering and empty map entries when finding changes', () => {
    assert.equal(model.permissionsEqual({ '/one': ['READ', 'UPDATE'], '/empty': [] }, { '/one': ['UPDATE', 'READ'] }), true);
    assert.deepEqual(plain(model.buildPermissionSaveOperations({ '/one': ['UPDATE', 'READ'] }, [{ id: 1, screen: '/one', method: 'READ,UPDATE' }], '42')), []);
  });

  it('rejects invalid administrator IDs and records without IDs before emitting writes', () => {
    assert.throws(() => model.buildPermissionSaveOperations({}, [], '../42'), /Invalid administrator/);
    assert.throws(() => model.buildPermissionSaveOperations({}, [{ screen: '/one', method: 'READ' }], '42'), /no ID/);
  });

  it('recognizes the web token ID variants and fails closed for malformed tokens', () => {
    for (const key of ['adminId', 'admin_id', 'userId', 'user_id', 'id', 'sub']) assert.equal(model.getAdminIdentity(token({ [key]: 42 })).adminId, '42');
    assert.equal(model.getAdminIdentity('malformed'), undefined);
    assert.equal(model.getAdminIdentity(token({ username: 'developer', roles: ['ROLE_DEVELOPER'] })).isDeveloper, true);
  });
});

describe('administrator access backend integration', () => {
  it('loads the authenticated core collection filtered by admin without pagination', async () => {
    const rows = [{ id: 1, screen: '/one', method: 'READ' }];
    const result = await service.fetchAdminAccesses('42', async (path, options) => {
      assert.equal(path, 'api/admin_accesses');
      assert.deepEqual(plain(options.params), { admin: '42', pagination: false });
      return { 'hydra:member': rows };
    });
    assert.deepEqual(plain(result), rows);
    for (const response of [rows, { data: rows }, { member: rows }]) assert.deepEqual(plain(service.parseAccessCollection(response)), rows);
    for (const response of [null, { data: null }, { 'hydra:member': {} }]) assert.throws(() => service.parseAccessCollection(response), /could not be read/);
    await assert.rejects(
      service.fetchAdminAccesses('42', async () => ({ message: 'Forbidden' })),
      /could not be read/,
    );
    await assert.rejects(
      service.fetchAdminAccesses('42', async () => {
        throw new Error('Offline');
      }),
      /Offline/,
    );
  });

  it('requires exact Update access and supports the web developer exception', async () => {
    const request = async path => (path === 'api/admins/7' ? { id: 7, roles: [] } : [{ screen: '/admin/administrators', method: 'READ' }]);
    assert.equal((await service.fetchManagementAccess(token({ adminId: 7 }), request)).canUpdate, false);
    assert.equal((await service.fetchManagementAccess(token({ adminId: 7, roles: ['ROLE_DEVELOPER'] }), request)).canUpdate, true);
    assert.equal(
      (
        await service.fetchManagementAccess(token({ adminId: 7 }), async path =>
          path === 'api/admins/7' ? { id: 7, roles: [] } : [{ screen: '/admin/administrators', method: 'READ, UPDATE' }],
        )
      ).canUpdate,
      true,
    );
  });

  it('resolves username-only tokens to the exact backend administrator', async () => {
    const result = await service.fetchManagementAccess(token({ username: 'developer' }), async () => [
      { id: 8, username: 'developer-old', roles: ['ROLE_DEVELOPER'] },
      { id: 7, username: 'developer', roles: ['ROLE_DEVELOPER'] },
    ]);
    assert.deepEqual(plain(result), { adminId: '7', canUpdate: true });
    await assert.rejects(
      service.fetchManagementAccess(token({ username: 'missing' }), async () => []),
      /could not be identified/,
    );
  });

  it('prevents all target reads and writes when the current admin lacks Update access', async () => {
    const calls = [];
    await assert.rejects(
      service.saveAdminAccesses('42', { '/new': ['READ'] }, async (path, options) => {
        calls.push({ path, options });
        return path === 'api/admins/7' ? { id: 7, roles: [] } : [];
      }),
      /do not have permission/,
    );
    assert.equal(calls.length, 2);
    assert.equal(
      calls.some(call => call.options?.method),
      false,
    );
    assert.equal(
      calls.some(call => call.options?.params?.admin === '42'),
      false,
    );
  });

  it('preserves the draft after partial failure and reloads records so retry creates no duplicates', async () => {
    const rows = [];
    const writes = [];
    let failSecondCreate = true;
    const request = async (path, options = {}) => {
      if (path === 'api/admins/7') return { id: 7, roles: ['ROLE_DEVELOPER'] };
      if (!options.method) return structuredClone(rows);
      writes.push({ path, options: plain(options) });
      if (options.method === 'POST') {
        if (options.data.screen === '/two' && failSecondCreate) {
          failSecondCreate = false;
          throw new Error('Connection lost');
        }
        rows.push({ id: rows.length + 1, screen: options.data.screen, method: options.data.method });
      }
      return {};
    };
    const draft = { '/one': ['READ'], '/two': ['UPDATE'] };
    await assert.rejects(service.saveAdminAccesses('42', draft, request), /Connection lost/);
    assert.deepEqual(draft, { '/one': ['READ'], '/two': ['UPDATE'] });
    const result = await service.saveAdminAccesses('42', draft, request);
    assert.equal(result.length, 2);
    assert.equal(writes.filter(write => write.options.data.screen === '/one').length, 1);
    assert.equal(rows.filter(row => row.screen === '/one').length, 1);
  });
});
