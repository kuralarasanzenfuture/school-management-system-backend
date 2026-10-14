# Employee Designations API Documentation

Comprehensive API documentation for the **Employee Designations Module** in the School Management System (`/api/employees-designations`). This module manages employee roles and job titles (e.g., Principal, Senior Teacher, Lab Assistant, Accountant), multi-dimensional filtering, token-scoped institution lookups, pagination, status toggling, and complete audit logging.

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}` (e.g., `http://localhost:5000`)
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{TOKEN}}` (JWT access token required for all endpoints)
- **Environment Variables**:
  - `{{BASE_URL}}`: Server root URL
  - `{{TOKEN}}`: JWT authentication token
  - `{{SCHOOL_ID}}`: Target school identifier
  - `{{DESIGNATION_ID}}`: ID of the designation to query, update, toggle status, or delete

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees-designations` | Create a new designation (audited) | Bearer Token |
| `GET` | `/api/employees-designations` | Get all designations with multi-field filters & pagination | Bearer Token |
| `GET` | `/api/employees-designations/token` | Get designations scoped to the authenticated user's school | Bearer Token |
| `GET` | `/api/employees-designations/:id` | Get designation details by ID | Bearer Token |
| `PUT` | `/api/employees-designations/:id` | Update designation details (audited) | Bearer Token |
| `PATCH` | `/api/employees-designations/status/:id` | Toggle designation status (`active` / `inactive`) (audited) | Bearer Token |
| `DELETE` | `/api/employees-designations/:id` | Delete designation by ID (audited) | Bearer Token |

---

## Supported Query Filter Parameters

The `GET /api/employees-designations` and `GET /api/employees-designations/token` endpoints support rich filtering and pagination:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `String` | `?search=Teacher` | Full-text search across designation name, description, and school name |
| `school_id` | `Number / String` | `?school_id=1` or `?school_id=1,2` | Exact school ID or comma-separated list of schools *(ignored on token-scoped endpoint)* |
| `name` | `String` | `?name=SENIOR` | Filter by designation title (case-insensitive substring) |
| `status` | `String` | `?status=active` | Filter by status: `active`, `inactive`, or comma-separated `active,inactive` |
| `sort_by` | `String` | `?sort_by=name` | Sort column: `id`, `name`, `status`, `school_id`, `description`, `created_at`, `updated_at` (default: `id`) |
| `sort_order` | `String` | `?sort_order=ASC` | Sort direction: `ASC` or `DESC` (default: `DESC`) |
| `page` | `Number` | `?page=1` | Page number for pagination (default: `1`) |
| `limit` | `Number` | `?limit=10` | Records per page (default: `20`, max: `500`) |
| `paginate` | `Boolean` | `?paginate=true` | When `true` (or `format=paginated` / `meta=true`), returns structured JSON envelope with pagination & filter metadata |

### Pagination Response Headers

All list requests automatically attach standard pagination HTTP response headers:
- `X-Total-Count`: Total number of matching records in the database
- `X-Page`: Current page index
- `X-Limit`: Number of items requested per page
- `X-Total-Pages`: Total number of pages available
- `X-From`: 1-based start index of records in the current page
- `X-To`: 1-based end index of records in the current page
- `X-Count`: Count of records returned in the current response

---

## Business Logic & Validations

1. **Naming & Normalization**:
   - Designation names are trimmed, validated, and converted to uppercase automatically.
   - Names must be unique within a given school. Duplicate names in the same school return `409 Conflict`.
2. **Status Management**:
   - Status defaults to `active`. Valid statuses are `active` and `inactive`.
   - The dedicated `PATCH /api/employees-designations/status/:id` allows fast status toggling without altering title or description.
3. **Foreign Key Protection**:
   - Designations cannot be deleted if active employee profiles are currently assigned to them. Returns `400 Bad Request` with guidance to reassign employees first.
4. **Audit Trail**:
   - All create, update, status change, and delete operations automatically record audit logs in `audit_logs` and `audit_log_changes` under `module: employee_designations` and `entity_type: employee_designation`.
   - Before/after states are logged during updates and status transitions.

---

## API Details

### 1. Create Designation

Creates a new staff designation.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees-designations`
- **Request Body**:
```json
{
  "school_id": 1,
  "name": "SENIOR TEACHER",
  "description": "Responsible for high school instruction, curriculum planning, and mentoring",
  "status": "active"
}
```

- **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Designation created successfully",
  "id": 1,
  "designation": {
    "id": 1,
    "school_id": 1,
    "name": "SENIOR TEACHER",
    "description": "Responsible for high school instruction, curriculum planning, and mentoring",
    "status": "active",
    "created_by": 2,
    "updated_by": 2,
    "created_at": "2026-10-13T10:00:00.000Z",
    "updated_at": "2026-10-13T10:00:00.000Z"
  }
}
```

- **Conflict Response (`409 Conflict`)**:
```json
{
  "success": false,
  "message": "Designation with name 'SENIOR TEACHER' already exists for this school"
}
```

---

### 2. Get All Designations (With Filters & Pagination)

Lists designations across all schools or filtered by query parameters.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-designations`

#### A. Raw Array Response (Default for backwards compatibility):
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "SENIOR TEACHER",
    "description": "Responsible for high school instruction, curriculum planning, and mentoring",
    "status": "active",
    "created_by": 2,
    "updated_by": 2,
    "created_at": "2026-10-13T10:00:00.000Z",
    "updated_at": "2026-10-13T10:00:00.000Z",
    "school_name": "Springfield Public School",
    "school_code": "SPS01"
  }
]
```

#### B. Paginated Metadata Response (`?page=1&limit=10&paginate=true`):
- **Route**: `{{BASE_URL}}/api/employees-designations?search=Teacher&status=active&page=1&limit=10&paginate=true`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "SENIOR TEACHER",
      "description": "Responsible for high school instruction, curriculum planning, and mentoring",
      "status": "active",
      "created_by": 2,
      "updated_by": 2,
      "created_at": "2026-10-13T10:00:00.000Z",
      "updated_at": "2026-10-13T10:00:00.000Z",
      "school_name": "Springfield Public School",
      "school_code": "SPS01"
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
    "totalPages": 1,
    "hasPrevPage": false,
    "hasNextPage": false,
    "prevPage": null,
    "nextPage": null,
    "from": 1,
    "to": 1,
    "count": 1
  },
  "filter_display": {
    "search": "Teacher",
    "status": "active"
  },
  "filters": {
    "page": 1,
    "limit": 10,
    "sort_by": "id",
    "sort_order": "DESC",
    "search": "Teacher",
    "status": "active"
  }
}
```

---

### 3. Get Designations by Token (School Bound)

Fetches designations automatically scoped to the logged-in user's school.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-designations/token`
- **Query Parameters**: All filters (`search`, `status`, `name`, `sort_by`, `page`, `limit`, `paginate`) work identical to `/api/employees-designations`, except `school_id` is automatically locked to `req.user.school_id`.

#### Example Request:
`GET {{BASE_URL}}/api/employees-designations/token?status=active&sort_by=name&sort_order=ASC`

---

### 4. Get Designation by ID

Fetches details of a specific designation along with its associated school name and school code.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-designations/{{DESIGNATION_ID}}`

- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "SENIOR TEACHER",
    "description": "Responsible for high school instruction, curriculum planning, and mentoring",
    "status": "active",
    "created_by": 2,
    "updated_by": 2,
    "created_at": "2026-10-13T10:00:00.000Z",
    "updated_at": "2026-10-13T10:00:00.000Z",
    "school_name": "Springfield Public School",
    "school_code": "SPS01"
  },
  "designation": {
    "id": 1,
    "school_id": 1,
    "name": "SENIOR TEACHER",
    "description": "Responsible for high school instruction, curriculum planning, and mentoring",
    "status": "active",
    "created_by": 2,
    "updated_by": 2,
    "created_at": "2026-10-13T10:00:00.000Z",
    "updated_at": "2026-10-13T10:00:00.000Z",
    "school_name": "Springfield Public School",
    "school_code": "SPS01"
  }
}
```

---

### 5. Update Designation by ID

Updates designation details and tracks full audit history.

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employees-designations/{{DESIGNATION_ID}}`
- **Request Body**:
```json
{
  "name": "LEAD SENIOR TEACHER",
  "description": "Department head, curriculum lead, and senior educator",
  "status": "active"
}
```

- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Designation updated successfully",
  "old_data": {
    "id": 1,
    "school_id": 1,
    "name": "SENIOR TEACHER",
    "description": "Responsible for high school instruction, curriculum planning, and mentoring",
    "status": "active"
  },
  "new_data": {
    "id": 1,
    "school_id": 1,
    "name": "LEAD SENIOR TEACHER",
    "description": "Department head, curriculum lead, and senior educator",
    "status": "active",
    "updated_by": 2
  }
}
```

---

### 6. Update Designation Status (Toggle Active/Inactive)

Quick status modification with `ACTIVATE` or `DEACTIVATE` audit action.

- **Method**: `PATCH`
- **Route**: `{{BASE_URL}}/api/employees-designations/status/{{DESIGNATION_ID}}`
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
  "message": "Designation status updated successfully to 'inactive'",
  "oldDesignation": {
    "id": 1,
    "name": "LEAD SENIOR TEACHER",
    "status": "active",
    "school_id": 1
  },
  "updatedDesignation": {
    "id": 1,
    "name": "LEAD SENIOR TEACHER",
    "status": "inactive",
    "school_id": 1,
    "updated_by": 2
  }
}
```

---

### 7. Delete Designation by ID

Removes a designation record if not referenced by any employees.

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employees-designations/{{DESIGNATION_ID}}`

- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Designation deleted successfully",
  "deletedDesignation": {
    "id": 1,
    "school_id": 1,
    "name": "LEAD SENIOR TEACHER",
    "description": "Department head, curriculum lead, and senior educator",
    "status": "inactive"
  }
}
```

- **Blocked by Dependency Response (`400 Bad Request`)**:
```json
{
  "success": false,
  "message": "Cannot delete designation. 5 employee(s) are currently assigned to this designation. Please reassign them first."
}
```

---

## Audit Trail Logging Specification

Every write operation on this module records an audit log in `audit_logs` and field-level diffs in `audit_log_changes`:

| Operation | Audit Action | Module | Entity Type | Data Recorded |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/employees-designations` | `CREATE` | `employee_designations` | `employee_designation` | Initial state in `new_data` |
| `PUT /api/employees-designations/:id` | `UPDATE` | `employee_designations` | `employee_designation` | Field-level diff (`old_data` vs `new_data`) |
| `PATCH /api/employees-designations/status/:id` | `ACTIVATE` / `DEACTIVATE` | `employee_designations` | `employee_designation` | Status transition snapshot |
| `DELETE /api/employees-designations/:id` | `DELETE` | `employee_designations` | `employee_designation` | Snapshot of deleted record |
