import type { AccessMethod, AdminAccessRecord, PermissionMap, PermissionNode, PermissionPreset, PermissionSaveOperation } from './types';

export const accessMethods: AccessMethod[] = ['READ', 'UPDATE', 'CREATE', 'DELETE', 'APPROVE'];
export const administratorsScreen = '/admin/administrators';
export const showMenusWithoutAccessScreen = '/admin/__settings__/show-menus-without-access';

export function splitMethods(method?: string | null) {
  return Array.from(
    new Set(
      (method || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),
    ),
  );
}

export function hydratePermissions(records: AdminAccessRecord[]): PermissionMap {
  return records.reduce<PermissionMap>((permissions, record) => {
    if (record.screen) permissions[record.screen] = Array.from(new Set([...(permissions[record.screen] || []), ...splitMethods(record.method)]));
    return permissions;
  }, {});
}

export function getNodePaths(node: PermissionNode): string[] {
  return [node.path, ...(node.children?.flatMap(getNodePaths) || [])];
}

export function getMethodState(node: PermissionNode, permissions: PermissionMap, method: AccessMethod): boolean | 'mixed' {
  const paths = getNodePaths(node);
  const count = paths.filter(path => permissions[path]?.includes(method)).length;
  return count === paths.length ? true : count > 0 ? 'mixed' : false;
}

export function setNodeMethod(permissions: PermissionMap, node: PermissionNode, method: AccessMethod, checked: boolean): PermissionMap {
  const next = { ...permissions };
  getNodePaths(node).forEach(path => {
    const methods = next[path] || [];
    next[path] = checked ? Array.from(new Set([...methods, method])) : methods.filter(value => value !== method);
  });
  return next;
}

export function setAllMethods(permissions: PermissionMap, nodes: PermissionNode[], checked: boolean): PermissionMap {
  const next = { ...permissions };
  nodes.flatMap(getNodePaths).forEach(path => {
    const otherMethods = (permissions[path] || []).filter(method => !accessMethods.includes(method as AccessMethod));
    next[path] = checked ? [...accessMethods, ...otherMethods] : otherMethods;
  });
  return next;
}

export function resetPermissions(permissions: PermissionMap, preserveMenuSetting = false): PermissionMap {
  const next: PermissionMap = {};
  Object.entries(permissions).forEach(([path, methods]) => {
    if (preserveMenuSetting && path === showMenusWithoutAccessScreen) next[path] = [...methods];
    else next[path] = methods.filter(method => method.startsWith('PROFICIENCY:'));
  });
  return next;
}

export function applyPermissionPreset(permissions: PermissionMap, nodes: PermissionNode[], preset: PermissionPreset): PermissionMap {
  const next = resetPermissions(permissions, true);
  const visit = (node: PermissionNode) => {
    preset.accesses
      .filter(access => access.screens === node.path)
      .forEach(access => {
        getNodePaths(node).forEach(path => {
          next[path] = Array.from(new Set([...(next[path] || []), ...access.methods]));
        });
      });
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return next;
}

export function permissionsEqual(left: PermissionMap, right: PermissionMap) {
  return Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).every(path => {
    const leftMethods = new Set(left[path] || []);
    const rightMethods = new Set(right[path] || []);
    return leftMethods.size === rightMethods.size && [...leftMethods].every(method => rightMethods.has(method));
  });
}

export function buildPermissionSaveOperations(permissions: PermissionMap, records: AdminAccessRecord[], adminId: string): PermissionSaveOperation[] {
  if (!/^\d+$/.test(adminId)) throw new Error('Invalid administrator ID.');
  const existing = new Map<string, AdminAccessRecord[]>();
  records.forEach(record => {
    if (record.screen) existing.set(record.screen, [...(existing.get(record.screen) || []), record]);
  });
  const recordId = (record: AdminAccessRecord) => {
    const id = String(record.id ?? record['@id'] ?? record.iriId ?? '')
      .split('/')
      .filter(Boolean)
      .pop();
    if (!id) throw new Error('A permission record has no ID. Reload permissions before saving.');
    return id;
  };

  return Array.from(new Set([...Object.keys(permissions), ...existing.keys()])).flatMap(screen => {
    const methods = Array.from(new Set(permissions[screen] || []));
    const [primary, ...duplicates] = existing.get(screen) || [];
    const operations: PermissionSaveOperation[] = [];
    // Update the surviving record first so a failed request never drops duplicate-only methods.
    if (primary) {
      if (!methods.length) operations.push({ id: recordId(primary), method: 'DELETE' });
      else if (!permissionsEqual({ [screen]: methods }, { [screen]: splitMethods(primary.method) })) {
        operations.push({ body: { method: methods.join(',') }, id: recordId(primary), method: 'PATCH' });
      }
      duplicates.forEach(record => operations.push({ id: recordId(record), method: 'DELETE' }));
    } else if (methods.length) {
      operations.push({ body: { admin: `/api/admins/${adminId}`, method: methods.join(','), screen }, method: 'POST' });
    }
    return operations;
  });
}

export function getAdminIdentity(token: string) {
  try {
    const encoded = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!encoded) return undefined;
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))) as Record<string, unknown>;
    const id = [payload.adminId, payload.admin_id, payload.userId, payload.user_id, payload.id, payload.sub].find(value => /^\d+$/.test(String(value ?? '')));
    const username = typeof payload.username === 'string' ? payload.username : undefined;
    return {
      adminId: id === undefined ? undefined : String(id),
      username,
      isDeveloper: Array.isArray(payload.roles) && payload.roles.includes('ROLE_DEVELOPER'),
    };
  } catch {
    return undefined;
  }
}
