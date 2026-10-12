# 📚 Subjects Management API Documentation

Complete API reference and testing guide for the **Subjects** module (`/api/subjects`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/subjects`
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
| 1 | `POST` | `/api/subjects` | Create a new subject with audit log | Body: `school_id`, `name`, `code`, `subject_type`, `status` |
| 2 | `GET` | `/api/subjects` | Get all subjects with filters & pagination | Query: `search`, `status`, `school_id`, `subject_type`, `name`, `code`, `page`, `limit`, `sortBy`, `sortOrder`, `paginate` |
| 3 | `GET` | `/api/subjects/token` | Get subjects scoped to user's assigned school | Query: `search`, `status`, `subject_type`, `name`, `code`, `page`, `limit` |
| 4 | `GET` | `/api/subjects/check-subject` | Check if subject name or code exists | Query: `?school_id=1&name=MATH&code=MATH101` |
| 5 | `GET` | `/api/subjects/check-subject/token` | Check if subject name or code exists in token's school | Query: `?name=MATH&code=MATH101` |
| 6 | `GET` | `/api/subjects/:id` | Get single subject by ID | Param: `id` |
| 7 | `PUT` | `/api/subjects/:id` | Update subject details with audit log | Param: `id`, Body: `name`, `code`, `subject_type`, `status` |
| 8 | `PATCH` | `/api/subjects/status/:id` | Toggle status (`active` / `inactive`) | Param: `id`, Body: `status` |
| 9 | `DELETE` | `/api/subjects/:id` | Delete subject with reference checks & audit log | Param: `id` |

---

## 1. ➕ Create Subject

Creates a new subject under a school. Performs automatic duplicate checks for `name` and optional `code`. Records audit log.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/subjects`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "MATHEMATICS",
  "code": "MATH101",
  "subject_type": "theory",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Subject Type:** `theory` (default), `practical`, `both`
- **Status:** `active` (default), `inactive`
- **Automatic formatting:** `name` and `code` are automatically trimmed and capitalized.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Subject created",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "name": "MATHEMATICS",
    "code": "MATH101",
    "subject_type": "theory",
    "status": "active",
    "created_by": 2,
    "created_by_name": "admin",
    "created_at": "2026-10-12T12:00:00.000Z"
  }
}
```

---

## 2. 📋 Get All Subjects

Retrieves all subjects with rich filtering, searching, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects?search=MATH&status=active&subject_type=theory&page=1&limit=20`

### Query Parameters
- `search`: Case-insensitive search on subject `name`, `code`, or `school_name`
- `status`: Filter by `active` or `inactive`
- `subject_type`: Filter by `theory`, `practical`, or `both`
- `school_id`: Filter by specific school ID
- `name`: Filter by exact or partial name
- `code`: Filter by exact or partial code
- `page`: Page number (default: `1`)
- `limit`: Records per page (default: `20`, max: `100`)
- `sortBy`: Column to sort by (`id`, `name`, `code`, `subject_type`, `status`, `created_at`, `school_name`)
- `sortOrder`: `ASC` or `DESC` (default: `DESC`)
- `paginate`: Set `false` to fetch all unpaginated records matching filters

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
      "name": "MATHEMATICS",
      "code": "MATH101",
      "subject_type": "theory",
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

## 3. 🏫 Get Subjects By Token (School Scoped)

Fetches subjects automatically scoped to the user's school from their JWT token (or across all schools if the user is a super admin).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/token?status=active&page=1&limit=20`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "school_name": "Springfield High",
      "name": "MATHEMATICS",
      "code": "MATH101",
      "subject_type": "theory",
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 4. 🔍 Check Subject Existence

Checks whether a subject `name` or `code` is already taken within a school before creating or updating.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/check-subject?school_id=1&name=MATHEMATICS&code=MATH101`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "match": {
    "name": {
      "id": 1,
      "name": "MATHEMATICS",
      "code": "MATH101"
    },
    "code": {
      "id": 1,
      "name": "MATHEMATICS",
      "code": "MATH101"
    }
  }
}
```

---

## 5. 🔍 Check Subject Existence by Token

Checks whether a subject `name` or `code` is taken in the token-scoped school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/check-subject/token?name=MATHEMATICS&code=MATH101`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "match": {
    "name": {
      "id": 1,
      "name": "MATHEMATICS",
      "code": "MATH101"
    }
  }
}
```

---

## 6. 🏷️ Get Subject By ID

Fetches details of a specific subject by its ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "name": "MATHEMATICS",
    "code": "MATH101",
    "subject_type": "theory",
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

## 7. ✏️ Update Subject

Updates the name, code, subject type, or status of an existing subject. Validates duplicates and records audit log.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/subjects/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "ADVANCED MATHEMATICS",
  "code": "MATH102",
  "subject_type": "both",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subject updated",
  "data": {
    "id": 1,
    "name": "ADVANCED MATHEMATICS",
    "code": "MATH102",
    "subject_type": "both",
    "status": "active",
    "updated_by": 2,
    "updated_by_name": "admin"
  }
}
```

---

## 8. 🔄 Update Subject Status

Quick toggle for subject status (`active` or `inactive`).

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/subjects/status/:id`
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
  "message": "Subject status updated successfully",
  "data": {
    "id": 1,
    "name": "ADVANCED MATHEMATICS",
    "status": "inactive"
  }
}
```

---

## 9. 🗑️ Delete Subject

Safely deletes a subject. Validates foreign key references in `class_subjects` before deletion.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/subjects/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Subject deleted"
}
```

### Error Response (`409 Conflict` - Referenced)
```json
{
  "success": false,
  "message": "Cannot delete subject: It is assigned to 3 class subject(s). Please remove those mappings first."
}
```

---

## 🔒 Audit Logging

All write operations (`POST`, `PUT`, `PATCH`, `DELETE`) automatically write to the audit log:
- **Module:** `subjects`
- **Entity Type:** `subject`
- **Actions:** `CREATE`, `UPDATE`, `STATUS_CHANGE`, `DELETE`
- Full `old_data` and `new_data` state snapshots and field diffs are tracked.
