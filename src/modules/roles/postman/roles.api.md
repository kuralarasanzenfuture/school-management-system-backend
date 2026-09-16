# 🛡️ Roles Management API Documentation

Complete API reference and testing guide for the **Roles** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/roles`
- **Authentication:** Bearer Token required for all requests
- **Default Headers:**
  ```http
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  ```

---

## 📑 Endpoints Summary

| Method | Endpoint | Description | Content-Type | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/roles` | Create a new role | `application/json` | Yes |
| `GET` | `/api/roles` | Get all roles | None | Yes |
| `PUT` | `/api/roles/:id` | Update role name, description, and status | `application/json` | Yes |
| `PATCH` | `/api/roles/status/:id` | Toggle role status (`active` / `inactive`) | `application/json` | Yes |
| `DELETE` | `/api/roles/:id` | Delete role (if no active users assigned) | None | Yes |

---

## 1. ➕ Create Role

Creates a new system role. Role names are automatically converted to uppercase and must contain only uppercase letters and underscores (`/^[A-Z_]+$/`).

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/roles`
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`
  - `Content-Type: application/json`

### Request Body

| Field Name | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | **Yes** | Letters and `_` only (e.g. `TEACHER`, `ACCOUNTANT`). Cannot be `ADMIN`. | Unique name of the role |
| `description` | String | No | Max 500 chars | Brief description of role permissions & responsibilities |

### Sample Request
```json
{
  "name": "TEACHER",
  "description": "Manages classroom activities, attendance, and student evaluations"
}
```

### Success Response (`201 Created`)
```json
{
  "message": "Role created successfully"
}
```

### Error Responses
- **`400 Bad Request`**: Role name missing or contains invalid characters (numbers, spaces, symbols).
  ```json
  { "message": "Role must contain only uppercase letters and _" }
  ```
- **`403 Forbidden`**: Attempting to create the system-reserved `ADMIN` role.
  ```json
  { "message": "ADMIN is protected" }
  ```
- **`409 Conflict`**: Role name already exists in database.
  ```json
  { "message": "Role already exists" }
  ```

---

## 2. 📋 Get All Roles

Retrieves all roles configured in the system ordered by ID ascending.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/roles`
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`

### Success Response (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "ADMIN",
    "description": "System Super Administrator",
    "status": "active",
    "created_at": "2026-09-01T00:00:00.000Z",
    "updated_at": "2026-09-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "PRINCIPAL",
    "description": "School Principal and Academic Head",
    "status": "active",
    "created_at": "2026-09-02T10:30:00.000Z",
    "updated_at": "2026-09-02T10:30:00.000Z"
  },
  {
    "id": 3,
    "name": "TEACHER",
    "description": "Teaching faculty",
    "status": "active",
    "created_at": "2026-09-10T14:20:00.000Z",
    "updated_at": "2026-09-10T14:20:00.000Z"
  }
]
```

---

## 3. ✏️ Update Role

Updates an existing role's name, description, and status.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/roles/:id`
- **URL Params:**
  - `id`: Role ID (e.g. `3`)
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`
  - `Content-Type: application/json`

### Request Body

| Field Name | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | **Yes** | Letters and `_` only | Updated role name |
| `description` | String | No | Max 500 chars | Updated description |
| `status` | String | No | `"active"` or `"inactive"` (default: `"active"`) | Status of the role |

### Sample Request
```json
{
  "name": "SENIOR_TEACHER",
  "description": "Senior faculty managing curriculum and department guidance",
  "status": "active"
}
```

### Success Response (`200 OK`)
```json
{
  "message": "Role updated"
}
```

### Error Responses
- **`403 Forbidden`**: Attempting to modify the protected `ADMIN` role.
  ```json
  { "message": "ADMIN role cannot be modified" }
  ```
- **`404 Not Found`**: Role ID does not exist.
  ```json
  { "message": "Role not found" }
  ```
- **`409 Conflict`**: New role name conflicts with an existing role.
  ```json
  { "message": "Role already exists" }
  ```

---

## 4. ⚡ Update Role Status (Cascade to Users)

Updates the status (`active` / `inactive`) of a role. When a role's status changes, the database transaction automatically:
1. Updates the `status` column in `roles`.
2. Updates `status` on all users mapped to this role via `user_roles`.
3. Increments `token_version` on all affected users, immediately invalidating active JWT tokens.

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/roles/status/:id`
- **URL Params:**
  - `id`: Role ID (e.g. `3`)
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`
  - `Content-Type: application/json`

### Request Body
```json
{
  "status": "inactive"
}
```
*(Options: `"active"` or `"inactive"`)*

### Success Response (`200 OK`)
```json
{
  "message": "Role and users inactive successfully"
}
```

### Error Responses
- **`400 Bad Request`**: Role already has the requested status.
  ```json
  { "message": "Role already inactive" }
  ```
- **`403 Forbidden`**: Cannot change status of system `ADMIN` role.
  ```json
  { "message": "ADMIN cannot be modified" }
  ```
- **`404 Not Found`**: Role does not exist.
  ```json
  { "message": "Role not found" }
  ```

---

## 5. 🗑️ Delete Role

Permanently deletes a role. System safeguards prevent deletion if active users are currently assigned to this role.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/roles/:id`
- **URL Params:**
  - `id`: Role ID (e.g. `3`)
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`

### Success Response (`200 OK`)
```json
{
  "message": "Role deleted successfully"
}
```

### Error Responses
- **`400 Bad Request`**: Users are currently assigned to this role.
  ```json
  { "message": "5 users assigned to this role" }
  ```
- **`403 Forbidden`**: Attempting to delete `ADMIN`.
  ```json
  { "message": "Cannot delete ADMIN" }
  ```
- **`404 Not Found`**: Role does not exist.
  ```json
  { "message": "Role not found" }
  ```

---

## 🛡️ Role System Rules

1. **System Protected Admin**: The `ADMIN` role (`id: 1` or `name: "ADMIN"`) can never be renamed, deactivated, or deleted.
2. **Naming Standard**: Role names must follow the `UPPERCASE_WITH_UNDERSCORES` format (e.g., `HEAD_OF_DEPARTMENT`, `LAB_ASSISTANT`).
3. **User Protection on Deletion**: A role cannot be deleted while assigned to any active user. Reassign users before deleting.
4. **Token Invalidation on Inactivation**: When a role is marked `inactive`, all assigned users have their tokens revoked instantly via `token_version` bump.
