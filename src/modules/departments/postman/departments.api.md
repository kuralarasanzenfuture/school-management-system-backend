# 🏢 Departments Management API Documentation

Complete API reference and testing guide for the **Departments** module (`/api/departments`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/departments`
- **Authentication:** Bearer Token required (`Authorization: Bearer {{TOKEN}}`)
- **Default Headers:**
  ```http
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  ```

---

## 📑 Endpoints Summary

| # | Method | Endpoint | Description | Query / Params / Body |
| :- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/departments` | Create a new department | Body: `school_id`, `name`, `description`, `status` |
| 2 | `GET` | `/api/departments` | Get all departments with filters & pagination | Query: `search`, `status`, `school_id`, `page`, `limit` |
| 3 | `GET` | `/api/departments/token` | Get departments scoped to user's assigned school | Query: `search`, `status`, `page`, `limit` |
| 4 | `GET` | `/api/departments/check-department` | Check if department name exists in school | Query: `?school_id=1&name=MATHEMATICS` |
| 5 | `GET` | `/api/departments/school/:school_id` | Get all departments for a specific school | Param: `school_id`, Query: filters |
| 6 | `GET` | `/api/departments/:id` | Get single department by ID | Param: `id` |
| 7 | `PUT` | `/api/departments/:id` | Update department details | Param: `id`, Body: updates |
| 8 | `PATCH` | `/api/departments/status/:id` | Toggle department status (`active` / `inactive`) | Param: `id`, Body: `status` |
| 9 | `DELETE` | `/api/departments/:id` | Delete department | Param: `id` |

---

## 1. ➕ Create Department

Creates a new academic or administrative department within a school. Automatically records `created_by` and audit log entry.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/departments`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "MATHEMATICS",
  "description": "Department of Mathematics and Computing",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Department Name:** Automatically trimmed and capitalized (2-100 characters).
- **Description:** Max 255 characters.
- **Status:** `active` (default), `inactive`.
- **Duplicate Protection:** Prevents duplicate department names within the same school.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Department created",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing",
    "status": "active",
    "created_by": 2,
    "updated_by": null,
    "created_at": "2026-10-09T16:00:00.000Z",
    "updated_at": "2026-10-09T16:00:00.000Z",
    "school_name": "Springfield High",
    "created_by_name": "admin",
    "updated_by_name": null
  }
}
```

---

## 2. 📋 Get All Departments

Retrieves departments with search, filtering, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments?search=Math&status=active&page=1&limit=20`
- **Query Parameters:**
  - `search` *(optional)*: Search term matching `name`, `description`, or `school_name`
  - `status` *(optional)*: Filter by `active` or `inactive`
  - `school_id` *(optional)*: Filter by School ID
  - `name` *(optional)*: Filter by exact or partial department name
  - `page` *(optional)*: Page number (default: 1)
  - `limit` *(optional)*: Items per page (default: 20, max: 100)
  - `sortBy` *(optional)*: Sort column (`id`, `name`, `status`, `school_id`, `created_at`, `updated_at`, default: `id`)
  - `sortOrder` *(optional)*: Sort direction (`ASC` or `DESC`, default: `DESC`)

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "MATHEMATICS",
      "description": "Department of Mathematics and Computing",
      "status": "active",
      "created_by": 2,
      "updated_by": null,
      "created_at": "2026-10-09T16:00:00.000Z",
      "updated_at": "2026-10-09T16:00:00.000Z",
      "school_name": "Springfield High",
      "created_by_name": "admin",
      "updated_by_name": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 3. 🏫 Get Departments Scoped to Token

Fetches departments for the authenticated user. Automatically enforces `school_id` filter for non-admin users.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/token?status=active`
- **Query Parameters:** Same filters as `GET /api/departments`

---

## 4. 🔍 Check Department Availability

Checks if a department name is available within a specific school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/check-department?school_id=1&name=MATHEMATICS`
- **Query Parameters:**
  - `school_id` *(required)*: School ID
  - `name` *(required)*: Department name
  - `excludeId` *(optional)*: Department ID to exclude (for update forms)

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "department": {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing",
    "status": "active"
  }
}
```

---

## 5. 🏷️ Get Department By ID

Fetches details of a specific department with creator and updater usernames.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing",
    "status": "active",
    "created_by": 2,
    "updated_by": null,
    "created_at": "2026-10-09T16:00:00.000Z",
    "updated_at": "2026-10-09T16:00:00.000Z",
    "school_name": "Springfield High",
    "created_by_name": "admin",
    "updated_by_name": null
  }
}
```

---

## 6. ✏️ Update Department

Updates name, description, status, or school. Enforces unique name checks and records `updated_by` and audit log diff.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/departments/:id`
- **Body:**
```json
{
  "name": "ADVANCED MATHEMATICS",
  "description": "Updated department description",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Department updated",
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "ADVANCED MATHEMATICS",
    "description": "Updated department description",
    "status": "active",
    "created_by": 2,
    "updated_by": 2,
    "created_at": "2026-10-09T16:00:00.000Z",
    "updated_at": "2026-10-09T16:30:00.000Z",
    "school_name": "Springfield High",
    "created_by_name": "admin",
    "updated_by_name": "admin"
  }
}
```

---

## 7. ⚡ Update Department Status

Toggles department status between `active` and `inactive`.

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/departments/status/:id`
- **Body:**
```json
{
  "status": "inactive"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Department status updated to inactive",
  "data": {
    "id": 1,
    "status": "inactive"
  }
}
```

---

## 8. 🗑️ Delete Department

Permanently deletes a department record and logs audit deletion.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/departments/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Department deleted"
}
```
