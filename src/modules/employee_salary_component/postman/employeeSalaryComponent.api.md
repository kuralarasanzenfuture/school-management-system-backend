# 💰 Employee Salary Components Management API Documentation

Comprehensive API reference and documentation for the **Employee Salary Components** module (`/api/employee-salary-components`). This module manages salary earnings, deductions, calculation methods (fixed or percentage), token-scoped lookups, advanced filtering, and audit logging.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/employee-salary-components`
- **Authentication:** Bearer Token required (`Authorization: Bearer {{TOKEN}}`)
- **Default Headers:**
  ```http
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  ```

---

## 📑 Endpoints Summary

| # | Method | Endpoint | Description | Auth Required |
| :- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/employee-salary-components` | Create a new salary component (audited) | Bearer Token |
| 2 | `GET` | `/api/employee-salary-components` | Get all salary components with filters & pagination | Bearer Token |
| 3 | `GET` | `/api/employee-salary-components/token` | Get salary components scoped to user's assigned school | Bearer Token |
| 4 | `GET` | `/api/employee-salary-components/check-existing` | Check component code/name uniqueness | Bearer Token |
| 5 | `GET` | `/api/employee-salary-components/:id` | Get single salary component by ID | Bearer Token |
| 6 | `PUT` | `/api/employee-salary-components/:id` | Update salary component details (audited) | Bearer Token |
| 7 | `PATCH` | `/api/employee-salary-components/status/:id` | Toggle component status (`active` / `inactive`) (audited) | Bearer Token |
| 8 | `DELETE` | `/api/employee-salary-components/:id` | Delete salary component by ID (audited) | Bearer Token |

---

## 🔍 Supported Query Filter Parameters

The `GET /api/employee-salary-components` and `GET /api/employee-salary-components/token` endpoints support rich filtering and pagination:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `String` | `?search=Basic` | Full-text search across component name, code, and school name |
| `school_id` | `Number / String` | `?school_id=1` or `?school_id=1,2` | Exact school ID or comma-separated list of schools |
| `name` | `String` | `?name=BASIC PAY` | Filter by component name (case-insensitive substring) |
| `code` | `String` | `?code=BASIC_PAY` | Filter by component code |
| `component_type` | `String` | `?component_type=earning` | Filter by type: `earning`, `deduction`, or `earning,deduction` |
| `calculation_type` | `String` | `?calculation_type=fixed` | Filter by calculation type: `fixed`, `percentage` |
| `status` | `String` | `?status=active` | Filter by status: `active`, `inactive`, or `active,inactive` |
| `sort_by` | `String` | `?sort_by=name` | Sort key: `id`, `name`, `code`, `component_type`, `calculation_type`, `status`, `school_id`, `created_at`, `updated_at` (default: `id`) |
| `sort_order` | `String` | `?sort_order=DESC` | Sort direction: `ASC` or `DESC` (default: `DESC`) |
| `page` | `Number` | `?page=1` | Page number for pagination (default: `1`) |
| `limit` | `Number` | `?limit=10` | Records per page (default: `20`, max: `500`) |
| `paginate` | `Boolean` | `?paginate=true` | When `true`, returns structured JSON envelope with pagination & filter metadata |

### Pagination Response Headers

All list requests automatically attach standard pagination HTTP headers:
- `X-Total-Count`: Total number of matching records in the database
- `X-Page`: Current page index
- `X-Limit`: Number of items requested per page
- `X-Total-Pages`: Total number of pages available
- `X-From`: 1-based start index of records in the current page
- `X-To`: 1-based end index of records in the current page
- `X-Count`: Count of records returned in the current response

---

## 🛡️ Business Logic & Validations

1. **Required Fields on Create**: `school_id`, `name`, `code`, `component_type`.
2. **Component Types**: `earning` or `deduction`.
3. **Calculation Types**: `fixed` (default) or `percentage`.
4. **Code Format**: Must contain only uppercase alphanumeric characters and underscores (`/^[A-Z0-9_]+$/`).
5. **Duplicate Protection**: Unique per school on both `code` and `name`. Duplicate codes or names return `409 Conflict`.
6. **Audit Trail**: All create, update, status change, and delete operations automatically record audit logs in `audit_logs` and `audit_log_changes` under `module: employee_salary_components` and `entity_type: employee_salary_component`.

---

## 1. ➕ Create Salary Component

Creates a salary component (e.g. Basic Pay, HRA, Provident Fund, Professional Tax).

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/employee-salary-components`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "BASIC PAY",
  "code": "BASIC_PAY",
  "component_type": "earning",
  "calculation_type": "fixed",
  "status": "active"
}
```

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Salary component created successfully",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "BASIC PAY",
    "code": "BASIC_PAY",
    "component_type": "earning",
    "calculation_type": "fixed",
    "status": "active",
    "school_name": "Springfield High",
    "school_code": "SPH"
  }
}
```

---

## 2. 📋 Get All Salary Components (With Filters & Pagination)

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components`

### A. Raw Array Response (Default for backwards compatibility):
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "BASIC PAY",
    "code": "BASIC_PAY",
    "component_type": "earning",
    "calculation_type": "fixed",
    "status": "active",
    "school_name": "Springfield High",
    "school_code": "SPH"
  }
]
```

### B. Paginated Metadata Response (`?paginate=true&page=1&limit=10`):
- **URL:** `{{BASE_URL}}/api/employee-salary-components?component_type=earning&status=active&page=1&limit=10&paginate=true`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "BASIC PAY",
      "code": "BASIC_PAY",
      "component_type": "earning",
      "calculation_type": "fixed",
      "status": "active",
      "school_name": "Springfield High"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1,
    "totalPages": 1,
    "from": 1,
    "to": 1,
    "count": 1,
    "has_next": false,
    "hasNextPage": false,
    "has_prev": false,
    "hasPrevPage": false
  },
  "filter_display": {
    "component_type": "earning",
    "status": "active"
  },
  "filters": {
    "component_type": "earning",
    "status": "active",
    "page": 1,
    "limit": 10,
    "paginate": "true"
  }
}
```

---

## 3. 🏫 Get Salary Components By Token (School Scoped)

Fetches salary components restricted to the authenticated user's assigned school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/token?status=active&paginate=true`

---

## 4. 🔍 Check Component Existence

Checks whether a salary component name or code is already in use within a school prior to creation.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/check-existing?school_id=1&code=BASIC_PAY&name=BASIC PAY`
- **Response (`200 OK`)**:
```json
{
  "available": false,
  "exists": true,
  "conflicts": [
    {
      "id": 1,
      "name": "BASIC PAY",
      "code": "BASIC_PAY"
    }
  ]
}
```

---

## 5. 🏷️ Get Salary Component By ID

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/:id`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "BASIC PAY",
    "code": "BASIC_PAY",
    "component_type": "earning",
    "calculation_type": "fixed",
    "status": "active",
    "school_name": "Springfield High",
    "school_code": "SPH",
    "created_at": "2026-06-01T08:30:00.000Z",
    "updated_at": "2026-06-01T08:30:00.000Z"
  }
}
```

---

## 6. ✏️ Update Salary Component

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "BASIC SALARY",
  "calculation_type": "fixed",
  "status": "active"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Salary component updated successfully",
  "id": 1,
  "old_data": {
    "name": "BASIC PAY"
  },
  "new_data": {
    "name": "BASIC SALARY"
  }
}
```

---

## 7. 🔄 Update Salary Component Status (Toggle Active/Inactive)

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/status/:id`
- **Body:**
```json
{
  "status": "inactive"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Salary component status updated to 'inactive'",
  "id": 1
}
```

---

## 8. 🗑️ Delete Salary Component

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/:id`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Salary component deleted successfully",
  "id": 1
}
```

---

## ⚠️ Error Responses

| Code | Status | Reason |
| :--- | :--- | :--- |
| `400` | Bad Request | Missing required fields or invalid format/values |
| `401` | Unauthorized | Missing or expired JWT bearer token |
| `404` | Not Found | Salary component ID does not exist |
| `409` | Conflict | Salary component name or code already exists in target school |
| `500` | Server Error | Unhandled database or system exception |
