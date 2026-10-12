# 🏫 Classes Management API Documentation

Complete API reference and testing guide for the **Classes** module (`/api/classes`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/classes`
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
| 1 | `POST` | `/api/classes` | Create a new class with duplicate check & audit logging | Body: `school_id`, `name`, `status` |
| 2 | `GET` | `/api/classes` | Get all classes with filters & pagination | Query: `search`, `status`, `school_id`, `name`, `page`, `limit`, `sortBy`, `sortOrder` |
| 3 | `GET` | `/api/classes/token` | Get classes scoped to user's assigned school | Query: `search`, `status`, `name`, `page`, `limit` |
| 4 | `GET` | `/api/classes/check-class` | Check if class name exists in a school | Query: `?school_id=1&name=10` (supports `id`/`exclude_id`) |
| 5 | `GET` | `/api/classes/check-class/token` | Check if class exists in token's school | Query: `?name=10` (Bearer Token) |
| 6 | `GET` | `/api/classes/school/:school_id` | Get all classes for a specific school | Param: `school_id`, Query: filters |
| 7 | `GET` | `/api/classes/:id` | Get single class by ID with joined school details | Param: `id` |
| 8 | `PUT` | `/api/classes/:id` | Update class name or status with audit log | Param: `id`, Body: updates |
| 9 | `PATCH` | `/api/classes/status/:id` | Toggle class status (`active` / `inactive`) | Param: `id`, Body: `status` |
| 10 | `DELETE` | `/api/classes/:id` | Delete class with reference integrity checks | Param: `id` |

---

## 1. ➕ Create Class

Creates a new class level under a school. Automatically records audit log entry.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/classes`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "10",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Class Name:** Between 1 and 50 characters, letters, numbers, spaces, and hyphens (e.g., `1`, `10`, `LKG`, `UKG`, `Pre-KG`). Automatically capitalized and trimmed.
- **Status:** `active` (default), `inactive`
- **Duplicate Protection:** Prevents duplicate class names within the same school.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Class created",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active",
    "school_name": "Springfield High",
    "created_at": "2026-10-12T04:30:00.000Z",
    "updated_at": "2026-10-12T04:30:00.000Z"
  }
}
```

---

## 2. 📋 Get All Classes

Retrieves classes across schools with search, filtering, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes?search=10&status=active&page=1&limit=20`
- **Query Parameters:**
  - `search` *(optional)*: Search term matching class `name` or `school_name`
  - `status` *(optional)*: Filter by `active` or `inactive`
  - `school_id` *(optional)*: Filter by School ID
  - `name` *(optional)*: Filter by exact or partial class name
  - `page` *(optional)*: Page number (default: 1)
  - `limit` *(optional)*: Items per page (default: 20, max: 100)
  - `sortBy` *(optional)*: Sort column (`id`, `name`, `status`, `school_id`, `created_at`, `updated_at`, default: `id`)
  - `sortOrder` *(optional)*: Sort direction (`ASC` or `DESC`, default: `DESC`)
  - `paginate` *(optional)*: Set to `false` to disable pagination

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "10",
      "status": "active",
      "school_name": "Springfield High",
      "created_at": "2026-10-12T04:30:00.000Z",
      "updated_at": "2026-10-12T04:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

**Response Headers:**
- `X-Total-Count`: 1
- `X-Page`: 1
- `X-Limit`: 20

---

## 3. 🏫 Get Classes By Token (School Scoped)

Fetches classes restricted to the school assigned to the logged-in user's JWT token (or all schools for `ADMIN` role). Supports same query filters and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/token?status=active&page=1&limit=20`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "10",
      "status": "active",
      "school_name": "Springfield High",
      "created_at": "2026-10-12T04:30:00.000Z",
      "updated_at": "2026-10-12T04:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 4. 🔍 Check Class Existence (Query Params)

Checks whether a class name already exists within a specified school. Supports excluding current class ID for edit forms.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/check-class?school_id=1&name=10`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "class": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active"
  }
}
```

---

## 5. 🔐 Check Class Existence By Token

Checks whether a class name already exists within the authenticated user's school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/check-class/token?name=10`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "class": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active"
  }
}
```

---

## 6. 🏢 Get Classes By School ID

Fetches classes filtered by a specific school ID with optional query filters.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/school/:school_id?status=active`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "10",
      "status": "active",
      "school_name": "Springfield High",
      "created_at": "2026-10-12T04:30:00.000Z",
      "updated_at": "2026-10-12T04:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 7. 🏷️ Get Class By ID

Fetches details of a specific class.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active",
    "school_name": "Springfield High",
    "created_at": "2026-10-12T04:30:00.000Z",
    "updated_at": "2026-10-12T04:30:00.000Z"
  }
}
```

---

## 8. ✏️ Update Class

Updates class name or status. Automatically verifies duplicate protection and writes audit log.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/classes/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "10A",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Class updated",
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "10A",
    "status": "active",
    "school_name": "Springfield High",
    "created_at": "2026-10-12T04:30:00.000Z",
    "updated_at": "2026-10-12T04:35:00.000Z"
  }
}
```

---

## 9. 🔄 Update Class Status (Toggle)

Toggles the active / inactive status of a class. Records `ACTIVATE` / `DEACTIVATE` audit log.

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/classes/status/:id`
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
  "message": "Class status updated to inactive",
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "inactive",
    "school_name": "Springfield High"
  }
}
```

---

## 10. 🗑️ Delete Class (With Reference Protection)

Deletes a class record. Performs safety reference integrity checks to verify whether sections, class sections, or student admissions reference this class before allowing deletion.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/classes/:id`

### Error Response if Referenced (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot delete class '10'. It is currently referenced by 2 section(s). Please remove or reassign associated sections first."
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Class deleted"
}
```
