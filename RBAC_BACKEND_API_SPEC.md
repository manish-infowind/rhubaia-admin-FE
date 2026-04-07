# RBAC Backend API Spec (Frontend-Driven)

This is a **backend-only RBAC specification** derived from current frontend usage.
It covers only RBAC needs for Admin Web panel (not entire system).

---

## 1) Scope

Frontend areas using RBAC:

- Sidebar access control
- Admin Management page
- Roles Management page
- Permissions Management page
- Role -> Permission assignment dialog
- Admin -> Role assignment
- Admin -> Direct permission assignment
- Login/session permission loading

---

## 2) Auth + Base

- Auth: Admin Bearer JWT
- Prefix: `/admin`
- All RBAC endpoints must return consistent envelope and stable IDs.

---

## 3) Permission Model Required

## Permission object

```json
{
  "permissionName": "admin_management",
  "allowedActions": ["create", "read", "update", "delete"]
}
```

Rules:

- `permissionName` is immutable key (snake_case).
- `allowedActions`:
  - `null` => all actions allowed
  - array subset => limited actions

## Required permission names used by frontend guards

- `all_allowed`
- `admin_management`
- `role_management`
- `permission_management`

---

## 4) Role Model Required

Role ID must be consistent across APIs (UUID/string preferred).

```json
{
  "id": "uuid-or-id",
  "roleName": "admin",
  "description": "Admin role",
  "isActive": true
}
```

---

## 5) API Endpoints (Required)

## 5.1 Permissions Catalog

### Create permission
- `POST /admin/permissions/create`

Request:
```json
{
  "permissionName": "dashboard",
  "allowedActions": ["read"]
}
```

### List permissions
- `GET /admin/permissions`

Response:
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "uuid-or-id",
        "permissionName": "dashboard",
        "allowedActions": ["read"]
      }
    ]
  }
}
```

### Update permission actions
- `PUT /admin/permissions/:permissionId`

Request:
```json
{
  "allowedActions": ["create", "read", "update", "delete"]
}
```

### Delete permission
- `DELETE /admin/permissions/:permissionId`

---

## 5.2 Roles

### Create role
- `POST /admin/roles/create`

Request:
```json
{
  "roleName": "ops_admin",
  "description": "Operations admin"
}
```

### List roles
- `GET /admin/roles`

Response:
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid-or-id",
        "roleName": "admin",
        "description": "Admin",
        "isActive": true
      }
    ]
  }
}
```

### Update role
- `PUT /admin/roles/:roleId`

Request:
```json
{
  "roleName": "admin",
  "description": "Updated description",
  "isActive": true
}
```

### Delete role
- `DELETE /admin/roles/:roleId`

---

## 5.3 Admin <-> Role assignment

### Assign role(s) to admin
- `POST /admin/roles/assign`

Request:
```json
{
  "adminId": "admin-uuid",
  "roleIds": ["role-uuid"]
}
```

### Get admin roles
- `GET /admin/admins/:adminId/roles`

Response:
```json
{
  "success": true,
  "data": {
    "adminId": "admin-uuid",
    "isSuperAdmin": false,
    "roles": [
      {
        "id": "role-uuid",
        "roleName": "admin",
        "description": "Admin role"
      }
    ]
  }
}
```

---

## 5.4 Admin <-> Direct permission assignment

### Assign direct permissions to admin
- `POST /admin/permissions/assign`

Request:
```json
{
  "adminId": "admin-uuid",
  "permissionIds": ["perm-id-1", "perm-id-2"]
}
```

### Get admin direct permissions
- `GET /admin/admins/:adminId/permissions`

Response:
```json
{
  "success": true,
  "data": {
    "adminId": "admin-uuid",
    "isSuperAdmin": false,
    "permissions": [
      {
        "permissionName": "admin_management"
      }
    ]
  }
}
```

---

## 5.5 Role <-> Permission mapping

### Assign permissions to role
- `POST /admin/roles/permissions/assign`

Request:
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

Semantics:

- `crud: []` => all actions allowed for this permission in role context.
- Payload should be treated as **final desired state** (replace mode).

### Get role permissions
- `GET /admin/roles/:roleId/permissions`

Response:
```json
{
  "statusCode": 200,
  "responseCode": "SUCCESS",
  "message": "Role permissions fetched",
  "data": {
    "roleId": "role-uuid",
    "roleName": "admin",
    "permissions": [
      {
        "id": "perm-uuid",
        "permissionName": "admin_management",
        "permissionAllowedActions": ["create", "read", "update", "delete"],
        "roleAllowedActions": ["read", "update"]
      },
      {
        "id": "perm-uuid-2",
        "permissionName": "dashboard",
        "permissionAllowedActions": ["read"],
        "roleAllowedActions": null
      }
    ]
  }
}
```

Semantics:

- `roleAllowedActions: null` (or `[]`) => frontend shows "All".

---

## 6) Login / Session Contract (RBAC-critical)

Login response must include:

- `is_super_admin` boolean
- `permissions` as array of objects:

```json
{
  "permissionName": "admin_management",
  "allowedActions": ["create", "read", "update", "delete"]
}
```

Optional:

- `roles` array with `roleName`

This data drives all frontend guard checks.

---

## 7) Frontend Guard Logic (what backend must satisfy)

Frontend checks:

- Super admin bypass if:
  - `isSuperAdmin/is_super_admin == true`, OR
  - role name is `super_admin`
- Otherwise permission checks:
  - by `permissionName`
  - by `allowedActions` for CRUD pages/actions

Therefore backend must ensure permission names + allowed actions are accurate for each admin.

---

## 8) Required Output Consistency Rules

- Role IDs: same type everywhere (`string` UUID strongly recommended).
- Permission IDs: stable, unique.
- `permissionName` values: immutable + unique.
- Do not mix snake_case and random casing for names.
- Return arrays as `[]` (not null) for empty lists.

---

## 9) Error Contract

For all RBAC APIs return readable error envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "roleId": ["Invalid role id"]
  }
}
```

Common statuses:

- `400` bad input
- `401` auth missing/invalid
- `403` forbidden
- `404` not found
- `409` conflict (duplicate role/permission, immutable relation)
- `422` validation

---

## 10) End-to-End Flows Backend Must Support

## A) Edit Admin (Role + Direct Permissions)

1. FE gets admin list/details.
2. FE calls:
   - `GET /admins/:id/roles`
   - `GET /admins/:id/permissions`
   - `GET /roles`
   - `GET /permissions`
3. FE edits selection.
4. FE updates admin details.
5. FE calls:
   - `POST /roles/assign`
   - `POST /permissions/assign`

## B) Role Management -> Assign Permissions

1. FE opens role permission dialog.
2. FE calls:
   - `GET /permissions`
   - `GET /roles/:roleId/permissions`
3. FE saves final selected mapping.
4. FE calls:
   - `POST /roles/permissions/assign`
5. FE re-fetches:
   - `GET /roles/:roleId/permissions`

## C) Sidebar Access

After login, FE evaluates admin’s `permissions` + `allowedActions` to show/hide:

- Admin Users
- Roles
- Permissions

---

## 11) Implementation Checklist (Backend)

- [ ] All RBAC endpoints implemented under `/admin`
- [ ] UUID/string role IDs supported in all role endpoints
- [ ] Admin-role assignment endpoint accepts `roleIds: string[]`
- [ ] Role-permission mapping endpoint supports replace semantics
- [ ] `roleAllowedActions` null/[] semantics documented and stable
- [ ] Login returns permissions with allowedActions
- [ ] Permission names match frontend guard keys
- [ ] Empty arrays returned for empty collections

