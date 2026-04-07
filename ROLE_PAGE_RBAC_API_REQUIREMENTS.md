# Role Page RBAC API Requirements (Frontend Call Flow)

This is the exact API call contract the frontend now follows for Roles screen behavior.

## Base

- Auth: Admin Bearer JWT
- Prefix: `/admin`

## 1) Roles list page load

When user opens Roles page, frontend calls only:

- `GET /admin/roles`

Expected response:

```json
{
  "statusCode": 200,
  "responseCode": "SUCCESS",
  "data": {
    "roles": [
      {
        "id": "role-uuid",
        "roleName": "admin",
        "description": "Admin role",
        "isActive": true
      }
    ]
  }
}
```

## 2) Edit role click (initial data load)

When user clicks **Edit** for a role, frontend preloads two APIs:

- `GET /admin/permissions`
- `GET /admin/roles/:roleId/permissions`

Purpose:

- Permissions API provides full permission catalog for checkbox list.
- Role permissions API provides currently assigned permissions/actions for pre-selection.

## 3) Edit dialog -> Permissions tab click

When user opens the **Permissions** tab inside Edit Role dialog, frontend refetches:

- `GET /admin/roles/:roleId/permissions`

Purpose:

- Ensure tab always shows latest assigned permissions before user changes and saves.

## 4) Save role permission updates

When user updates permission selection and clicks save, frontend calls:

- `POST /admin/roles/permissions/assign`

Request body:

```json
{
  "roleId": "role-uuid",
  "permissions": [
    {
      "permissionName": "admin_management",
      "crud": ["read", "update"]
    },
    {
      "permissionName": "dashboard",
      "crud": []
    }
  ]
}
```

Payload rules (frontend implemented):

- Send only currently selected permissions.
- Do not send unselected permissions.
- For each selected permission:
  - send selected actions in `crud`, OR
  - send `crud: []` when all allowed actions are selected (full access contract).

## 5) Separate endpoints required (no merged endpoint)

Backend should keep these as separate APIs:

- `GET /admin/roles`
- `GET /admin/permissions`
- `GET /admin/roles/:roleId/permissions`
- `POST /admin/roles/permissions/assign`

## 6) Response behavior required for role permissions preload

For `GET /admin/roles/:roleId/permissions`, backend must support one of these clear assignment signals:

- Preferred: include `isAssigned: true|false` per permission row.
- Alternative: return only assigned permissions in `permissions[]`.

If backend returns full permission catalog, frontend needs `isAssigned` to avoid ambiguity between:

- unassigned permission
- full-access assigned permission

Recommended row shape:

```json
{
  "id": "perm-uuid",
  "permissionName": "admin_management",
  "permissionAllowedActions": ["create", "read", "update", "delete"],
  "roleAllowedActions": ["read", "update"],
  "isAssigned": true
}
```

