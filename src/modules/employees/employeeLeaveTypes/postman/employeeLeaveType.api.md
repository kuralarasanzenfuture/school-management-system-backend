# Employee Leave Types API Documentation

Comprehensive API documentation for the **Employee Leave Types Module** in the School Management System (`/api/employees-leave-types`). This module defines leave policies, entitlements, carry-forward rules, approval/attachment conditions, token-scoped access, advanced filtering, and audit logging.

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}` (e.g., `http://localhost:5000`)
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{TOKEN}}` (JWT access token required for all endpoints)

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees-leave-types` | Create a new leave type policy (audited) | Bearer Token |
| `GET` | `/api/employees-leave-types` | Get all leave types with advanced filters & pagination | Bearer Token |
| `GET` | `/api/employees-leave-types/token` | Get leave types scoped to the authenticated user's school | Bearer Token |
| `GET` | `/api/employees-leave-types/check-leave-type` | Real-time conflict check for name and code uniqueness | Bearer Token |
| `GET` | `/api/employees-leave-types/:id` | Get employee leave type details by ID | Bearer Token |
| `PUT` | `/api/employees-leave-types/:id` | Update leave type details (audited) | Bearer Token |
| `PATCH` | `/api/employees-leave-types/status/:id` | Toggle leave type status (`active` / `inactive`) (audited) | Bearer Token |
| `DELETE` | `/api/employees-leave-types/:id` | Delete leave type by ID (audited) | Bearer Token |

---

## Supported Query Filter Parameters

The `GET /api/employees-leave-types` and `GET /api/employees-leave-types/token` endpoints support rich filtering and pagination:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `String` | `?search=Casual` | Search across leave type name, code, description, and school name |
| `school_id` | `Number / String` | `?school_id=1` or `?school_id=1,2` | Exact school ID or comma-separated list of schools |
| `name` | `String` | `?name=CASUAL` | Filter by leave type name (case-insensitive substring) |
| `code` | `String` | `?code=CL` | Filter by leave type code |
| `status` | `String` | `?status=active` | Filter by status: `active`, `inactive`, or `active,inactive` |
| `applicable_gender` | `String` | `?applicable_gender=all` | Filter by gender: `all`, `male`, `female` |
| `is_paid` | `Boolean` | `?is_paid=true` | Filter paid leave types (`true` / `false`) |
| `carry_forward` | `Boolean` | `?carry_forward=true` | Filter carry-forward leave types (`true` / `false`) |
| `requires_approval` | `Boolean` | `?requires_approval=true` | Filter policies requiring manager/admin approval |
| `requires_attachment`| `Boolean` | `?requires_attachment=true` | Filter policies requiring supporting medical/document attachments |
| `allow_half_day` | `Boolean` | `?allow_half_day=true` | Filter policies that permit half-day leave deductions |
| `created_by` | `Number / String` | `?created_by=2` or `?created_by=2,3` | Filter by user ID who created the leave type |
| `updated_by` | `Number / String` | `?updated_by=2` or `?updated_by=2,3` | Filter by user ID who last updated the leave type |
| `sort_by` | `String` | `?sort_by=days_per_year` | Sort key: `id`, `name`, `code`, `days_per_year`, `max_days_per_request`, `is_paid`, `carry_forward`, `max_carry_forward_days`, `status`, `school_id`, `created_by`, `updated_by`, `created_at`, `updated_at` (default: `id`) |
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

## Business Logic & Validations

1. **Leave Entitlements**:
   - `days_per_year`: Must be between `0` and `365`.
   - `max_days_per_request`: Optional limit per request. Cannot exceed `days_per_year`.
2. **Carry Forward Rules**:
   - If `carry_forward = false`, `max_carry_forward_days` must be `0`.
   - `max_carry_forward_days` cannot exceed `days_per_year`.
3. **Uniqueness**:
   - Both `code` and `name` are unique per school and automatically normalized to uppercase.
   - Duplicate code or name within the same school returns `409 Conflict`.
4. **Audit User Tracking (`created_by`, `updated_by`)**:
   - `created_by` (BIGINT UNSIGNED): Automatically captured from authenticated user token (`req.user.id`) or explicitly provided in payload (validated as positive integer).
   - `updated_by` (BIGINT UNSIGNED): Automatically captured on leave type update and status toggle operations from authenticated user token (`req.user.id`).
   - Responses automatically join and include `created_by_name` and `updated_by_name`.
5. **Audit Trail**:
   - All create, update, status change, and delete operations automatically record audit logs in `audit_logs` and `audit_log_changes` under `module: employee_leave_types` and `entity_type: employee_leave_type`.

---

## API Details

### 1. Create Leave Type

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees-leave-types`
- **Request Body**:
```json
{
  "school_id": 1,
  "name": "CASUAL LEAVE",
  "code": "CL",
  "description": "Annual casual leave allowance",
  "days_per_year": 12,
  "max_days_per_request": 3,
  "is_paid": true,
  "carry_forward": false,
  "max_carry_forward_days": 0,
  "allow_half_day": true,
  "requires_approval": true,
  "requires_attachment": false,
  "applicable_gender": "all",
  "status": "active"
}
```

- **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Leave type created successfully",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "CASUAL LEAVE",
    "code": "CL",
    "description": "Annual casual leave allowance",
    "days_per_year": "12.00",
    "max_days_per_request": "3.00",
    "is_paid": 1,
    "carry_forward": 0,
    "max_carry_forward_days": "0.00",
    "allow_half_day": 1,
    "requires_approval": 1,
    "requires_attachment": 0,
    "applicable_gender": "all",
    "status": "active",
    "created_by": 2,
    "updated_by": null,
    "created_by_name": "admin",
    "updated_by_name": null,
    "school_name": "Greenwood High",
    "school_code": "GWH001"
  }
}
```

---

### 2. Get All Leave Types (With Advanced Filters)

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types`

#### A. Raw Array Response (Default for backwards compatibility):
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "CASUAL LEAVE",
    "code": "CL",
    "description": "Annual casual leave allowance",
    "days_per_year": "12.00",
    "max_days_per_request": "3.00",
    "is_paid": 1,
    "carry_forward": 0,
    "max_carry_forward_days": "0.00",
    "allow_half_day": 1,
    "requires_approval": 1,
    "requires_attachment": 0,
    "applicable_gender": "all",
    "status": "active",
    "created_by": 2,
    "updated_by": null,
    "created_by_name": "admin",
    "updated_by_name": null,
    "school_name": "Greenwood High",
    "school_code": "GWH001"
  }
]
```

#### B. Paginated Metadata Response (`?paginate=true&page=1&limit=10`):
- **Route**: `{{BASE_URL}}/api/employees-leave-types?search=Casual&status=active&page=1&limit=10&paginate=true`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "CASUAL LEAVE",
      "code": "CL",
      "days_per_year": "12.00",
      "status": "active",
      "created_by": 2,
      "created_by_name": "admin",
      "school_name": "Greenwood High"
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
    "search": "Casual",
    "status": "active"
  },
  "filters": {
    "search": "Casual",
    "status": "active",
    "page": 1,
    "limit": 10,
    "paginate": "true"
  }
}
```

---

### 3. Get Leave Types by Token (School Scoped)

Fetches leave types automatically restricted to the authenticated user's assigned school.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/token?status=active&paginate=true`

---

### 4. Check Existing Leave Type (Realtime Conflict Check)

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/check-leave-type?school_id=1&name=CASUAL LEAVE&code=CL`
- **Success Response (`200 OK`)**:
```json
{
  "available": false,
  "exists": true,
  "conflicts": [
    {
      "id": 1,
      "name": "CASUAL LEAVE",
      "code": "CL"
    }
  ]
}
```

---

### 5. Get Leave Type by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/:id`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "CASUAL LEAVE",
    "code": "CL",
    "days_per_year": "12.00",
    "status": "active",
    "created_by": 2,
    "updated_by": null,
    "created_by_name": "admin",
    "updated_by_name": null,
    "school_name": "Greenwood High"
  }
}
```

---

### 6. Update Leave Type by ID

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/:id`
- **Request Body**:
```json
{
  "days_per_year": 14,
  "max_days_per_request": 4
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Leave type updated successfully",
  "id": 1,
  "old_data": {
    "days_per_year": "12.00"
  },
  "new_data": {
    "days_per_year": "14.00"
  }
}
```

---

### 7. Update Leave Type Status (Toggle Active/Inactive)

- **Method**: `PATCH`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/status/:id`
- **Request Body**:
```json
{
  "status": "inactive"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Leave type status updated to 'inactive'",
  "id": 1
}
```

---

### 8. Delete Leave Type by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/:id`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Leave type deleted successfully",
  "id": 1
}
```

---

## Error Responses

| Code | Status | Reason |
| :--- | :--- | :--- |
| `400` | Bad Request | Missing required fields, invalid format, or carry-forward days exceeding annual allowance |
| `401` | Unauthorized | Missing or expired JWT bearer token |
| `404` | Not Found | Leave type ID does not exist |
| `409` | Conflict | Leave type name or code already exists within the target school |
| `500` | Server Error | Unhandled database or system exception |
