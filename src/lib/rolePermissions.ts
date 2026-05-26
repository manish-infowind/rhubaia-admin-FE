export type RolePermissionRow = {
  permissionName: string;
  roleAllowedActions?: string[] | null;
  isAssigned?: boolean;
};

export function isAssignedOnlyRolePermissionsResponse(
  rolePermissions: RolePermissionRow[],
  catalogLength: number,
): boolean {
  return (
    rolePermissions.length > 0 &&
    catalogLength > 0 &&
    rolePermissions.length < catalogLength
  );
}

export function isRolePermissionAssigned(
  row: RolePermissionRow | undefined,
  isAssignedOnlyResponse: boolean,
): boolean {
  if (!row) return false;
  if (isAssignedOnlyResponse) return true;
  if (row.isAssigned === true) return true;
  if (row.isAssigned === false) return false;
  // null means full access for an assigned permission (RBAC API contract)
  if (row.roleAllowedActions === null) return true;
  if (Array.isArray(row.roleAllowedActions) && row.roleAllowedActions.length > 0) {
    return true;
  }
  return false;
}

export function getEffectiveRoleGrantedActions(
  row: RolePermissionRow | undefined,
  permissionMaxActions: string[],
  isAssigned: boolean,
): string[] {
  if (!isAssigned) return [];
  if (row?.roleAllowedActions === null) {
    return permissionMaxActions;
  }
  const roleGranted = Array.isArray(row?.roleAllowedActions)
    ? row.roleAllowedActions
    : [];
  if (roleGranted.length > 0) {
    return roleGranted;
  }
  // Empty array on an assigned row means full access (see PermissionCards UI)
  return permissionMaxActions;
}

export function getAssignedRolePermissions(
  permissionsList: RolePermissionRow[] | undefined,
  catalogLength: number,
): RolePermissionRow[] {
  if (!permissionsList) return [];
  const isAssignedOnlyResponse = isAssignedOnlyRolePermissionsResponse(
    permissionsList,
    catalogLength,
  );
  if (isAssignedOnlyResponse) {
    return permissionsList;
  }
  return permissionsList.filter((permission) =>
    isRolePermissionAssigned(permission, false),
  );
}

export function buildRolePermissionAssignPayload(
  states: Array<{
    permissionName: string;
    selected: boolean;
    permissionMaxActions: string[];
    crud: { create: boolean; read: boolean; update: boolean; delete: boolean };
  }>,
): Array<{ permissionName: string; crud: string[] }> {
  return states
    .filter((p) => p.selected)
    .map((p) => {
      const selectedActions: string[] = [];
      if (p.crud.create) selectedActions.push("create");
      if (p.crud.read) selectedActions.push("read");
      if (p.crud.update) selectedActions.push("update");
      if (p.crud.delete) selectedActions.push("delete");

      if (selectedActions.length === 0) {
        return null;
      }

      const allMaxSelected =
        p.permissionMaxActions.length > 0 &&
        p.permissionMaxActions.every((action) => selectedActions.includes(action));

      return {
        permissionName: p.permissionName,
        // API contract: empty crud array means full access for that permission
        crud: allMaxSelected ? [] : selectedActions,
      };
    })
    .filter((p): p is { permissionName: string; crud: string[] } => p !== null);
}
