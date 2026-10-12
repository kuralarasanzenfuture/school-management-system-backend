# 🗂️ Subject Groups Management API Documentation

Complete API reference and testing guide for the **Subject Groups** module (`/api/subject-groups`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/subject-groups`
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
| 1 | `POST` | `/api/subject-groups` | Create a new subject group with audit log | Body: `school_id`, `name`, `description`, `status` |
| 2 | `GET` | `/api/subject-groups` | Get all subject groups with filters & pagination | Query: `search`, `status`, `school_id`, `name`, `page`, `limit`, `sortBy`, `sortOrder`, `paginate` |
| 3 | `GET` | `/api/subject-groups/token` | Get subject groups scoped to user's assigned school | Query: `search`, `status`, `name`, `page`, `limit` |
| 4 | `GET` | `/api/subject-groups/check-subject-group` | Check if a subject group name already exists | Query: `?school_id=1&name=SCIENCE` |
| 5 | `GET` | `/api/subject-groups/check-subject-group/token` | Check if a subject group name exists in token's school | Query: `?name=SCIENCE` |
| 6 | `GET` | `/api/subject-groups/:id` | Get single subject group by ID | Param: `id` |
| 7 | `PUT` | `/api/subject-groups/:id` | Update subject group details with audit log | Param: `id`, Body: `name`, `description`, `status` |
| 8 | `PATCH` | `/api/subject-groups/status/:id` | Toggle status (`active` / `inactive`) | Param: `id`, Body: `status` |
| 9 | `DELETE` | `/api/subject-groups/:id` | Delete subject group with reference check & audit log | Param: `id` |

---

## 1. ➕ Create Subject Group

Creates a new subject group (e.g., `SCIENCE`, `COMMERCE`, `ARTS`) for a specific school. Automatically captures `created_by` and records an audit log.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/subject-groups`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "SCIENCE",
  "description": "Physics, Chemistry, Biology stream",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Name length:** 2 to 100 characters, automatically uppercase trimmed
- **Status:** `active` (default), `inactive`
- **Duplicate check:** Prevents duplicate subject group names under the same school.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Subject group created",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "name": "SCIENCE",
    "description": "Physics, Chemistry, Biology stream",
    "status": "active",
    "created_by": 2,
    "created_by_name": "admin",
    "updated_by": null,
    "updated_by_name": null,
    "created_at": "2026-10-12T12:00:00.000Z",
    "updated_at": "2026-10-12T12:00:00.000Z"
  }
}
```

---

## 2. 📋 Get All Subject Groups

Retrieves all subject groups with filtering, searching, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups?search=SCI&status=active&page=1&limit=20`

### Query Parameters
- `search`: Search against group `name`, `description`, or `school_name`
- `status`: Filter by `active` or `inactive` (supports comma-separated `active,inactive`)
- `school_id`: Filter by specific school ID
- `name`: Filter by exact or partial name
- `page`: Page number (default: `1`)
- `limit`: Records per page (default: `20`, max: `100`)
- `sortBy`: Column to sort by (`id`, `name`, `status`, `created_at`, `school_name`)
- `sortOrder`: `ASC` or `DESC` (default: `DESC`)
- `paginate`: Set `false` to fetch all matching records unpaginated

### Response Headers
- `X-Total-Count`: Total number of matching records
- `X-Page`: Current page number
- `X-Limit`: Limit per page

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "school_name": "Springfield High",
      "name": "SCIENCE",
      "description": "Physics, Chemistry, Biology stream",
      "status": "active",
      "created_by": 2,
      "created_by_name": "admin",
      "updated_by": null,
      "updated_by_name": null,
      "created_at": "2026-10-12T12:00:00.000Z",
      "updated_at": "2026-10-12T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 3. 🏫 Get Subject Groups By Token (School Scoped)

Fetches subject groups scoped to the school assigned to the logged-in user's JWT token (or across all schools if the user has `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/token?status=active&page=1&limit=20`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "school_name": "Springfield High",
      "name": "SCIENCE",
      "description": "Physics, Chemistry, Biology stream",
      "status": "active",
      "created_by": 2,
      "created_by_name": "admin"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 4. 🔍 Check Subject Group Existence

Checks whether a subject group name already exists for a school prior to creation or update.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/check-subject-group?school_id=1&name=SCIENCE`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "subject_group": {
    "id": 1,
    "name": "SCIENCE"
  }
}
```

---

## 5. 🔍 Check Subject Group Existence by Token

Checks whether a subject group name already exists within the user's assigned school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/check-subject-group/token?name=SCIENCE`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "subject_group": {
    "id": 1,
    "name": "SCIENCE"
  }
}
```

---

## 6. 🏷️ Get Subject Group By ID

Fetches details of a specific subject group by ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "name": "SCIENCE",
    "description": "Physics, Chemistry, Biology stream",
    "status": "active",
    "created_by": 2,
    "created_by_name": "admin",
    "updated_by": null,
    "updated_by_name": null,
    "created_at": "2026-10-12T12:00:00.000Z",
    "updated_at": "2026-10-12T12:00:00.000Z"
  }
}
```

---

## 7. ✏️ Update Subject Group

Updates name, description, or status. Re-validates against duplicate names in the same school and records audit log.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/subject-groups/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "ADVANCED SCIENCE",
  "description": "Updated stream description",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subject group updated",
  "data": {
    "id": 1,
    "name": "ADVANCED SCIENCE",
    "description": "Updated stream description",
    "status": "active",
    "updated_by": 2,
    "updated_by_name": "admin"
  }
}
```

---

## 8. 🔄 Update Subject Group Status

Quick toggle for subject group status (`active` or `inactive`).

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/subject-groups/status/:id`
- **Headers:** `Content-Type: application/json`
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
  "message": "Subject group status updated to inactive",
  "data": {
    "id": 1,
    "name": "ADVANCED SCIENCE",
    "status": "inactive"
  }
}
```

---

## 9. 🗑️ Delete Subject Group

Deletes a subject group. Validates referential integrity against `class_subjects` before deletion.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/subject-groups/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subject group deleted"
}
```

### Error Response (`400 Bad Request` / `409 Conflict` - Referenced)
```json
{
  "success": false,
  "message": "Cannot delete subject group 'SCIENCE'. It is currently assigned to 4 class subject mapping(s). Please remove or reassign associated class subjects first."
}
```

---

## 🔒 Audit Logging

All write operations (`POST`, `PUT`, `PATCH`, `DELETE`) automatically write to the audit log:
- **Module:** `subject_groups`
- **Entity Type:** `subject_group`
- **Actions:** `CREATE`, `UPDATE`, `STATUS_CHANGE`, `DELETE`
- Full `old_data` and `new_data` snapshots and differences are tracked.
