# Employee Shift API Documentation

Comprehensive API documentation for the **Employee Shift Module** in the School Management System (`/api/employee-shifts`). This module manages employee work shifts, timings, grace minutes, day/night shifts, automated daily working hour calculations, advanced filtering, token-scoped lookups, and audit logging.

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
| `POST` | `/api/employee-shifts` | Create a new employee shift (audited) | Bearer Token |
| `GET` | `/api/employee-shifts` | Get all employee shifts with advanced filters & pagination | Bearer Token |
| `GET` | `/api/employee-shifts/token` | Get shifts scoped to the authenticated user's school | Bearer Token |
| `GET` | `/api/employee-shifts/:id` | Get employee shift details by ID | Bearer Token |
| `PUT` | `/api/employee-shifts/:id` | Update employee shift details (audited) | Bearer Token |
| `PATCH` | `/api/employee-shifts/status/:id` | Toggle shift status (`active` / `inactive`) (audited) | Bearer Token |
| `DELETE` | `/api/employee-shifts/:id` | Delete employee shift by ID (audited) | Bearer Token |

---

## Supported Query Filter Parameters

The `GET /api/employee-shifts` and `GET /api/employee-shifts/token` endpoints support rich filtering and pagination:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `String` | `?search=Morning` | Full-text search across shift name and school name |
| `school_id` | `Number / String` | `?school_id=1` or `?school_id=1,2` | Exact school ID or comma-separated list of schools |
| `name` | `String` | `?name=MORNING` | Filter by shift name (case-insensitive substring) |
| `shift_type` | `String` | `?shift_type=day` | Filter by shift type: `day`, `evening`, `night`, `flexible` |
| `status` | `String` | `?status=active` | Filter by status: `active`, `inactive`, or `active,inactive` |
| `is_default` | `Boolean` | `?is_default=true` | Filter institution default shifts (`true` / `false`) |
| `created_by` | `Number / String` | `?created_by=2` or `?created_by=2,3` | Filter by user ID who created the shift |
| `updated_by` | `Number / String` | `?updated_by=2` or `?updated_by=2,3` | Filter by user ID who last updated the shift |
| `sort_by` | `String` | `?sort_by=working_hours` | Sort key: `id`, `name`, `shift_type`, `start_time`, `end_time`, `working_hours`, `grace_minutes`, `is_default`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `school_id` (default: `id`) |
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

1. **Shift Timings & Overnight Shifts**:
   - `start_time` and `end_time` are required in `HH:mm:ss` format.
   - For standard day shifts, `start_time` must be strictly earlier than `end_time`.
   - Overnight / night shifts (`crosses_midnight = true`) allow `start_time > end_time` (e.g. `22:00:00` to `06:00:00`). The system automatically handles 24-hour rollover and calculates `working_hours` accurately (e.g., `8.00`).
2. **Grace Minutes**:
   - Grace period in minutes for late arrival evaluation (defaults to `10` minutes if not supplied).
3. **Audit User Tracking (`created_by`, `updated_by`)**:
   - `created_by` (BIGINT UNSIGNED): Automatically resolved from authenticated user token (`req.user.id`) or explicitly provided in payload (validated as positive integer).
   - `updated_by` (BIGINT UNSIGNED): Automatically captured on shift update and status toggle operations from authenticated user token (`req.user.id`).
   - Responses automatically join and include `created_by_name` and `updated_by_name`.
4. **Uniqueness**:
   - Shift names are unique per school and automatically normalized to uppercase.
   - Duplicate names within the same school return `409 Conflict`.
5. **Audit Trail**:
   - All create, update, status change, and delete operations automatically record audit logs in `audit_logs` and `audit_log_changes` under `module: employee_shifts` and `entity_type: employee_shift`.

---

## API Details

### 1. Create Employee Shift

Creates a shift definition with automatic working hours computation.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employee-shifts`
- **Request Body (Standard Day Shift)**:
```json
{
  "school_id": 1,
  "name": "MORNING SHIFT",
  "shift_type": "day",
  "start_time": "08:30:00",
  "end_time": "16:30:00",
  "grace_minutes": 15,
  "is_default": true,
  "status": "active"
}
```

- **Request Body (Night Shift Crossing Midnight)**:
```json
{
  "school_id": 1,
  "name": "NIGHT SECURITY SHIFT",
  "shift_type": "night",
  "start_time": "22:00:00",
  "end_time": "06:00:00",
  "crosses_midnight": true,
  "grace_minutes": 10,
  "is_default": false,
  "status": "active"
}
```

- **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Shift created successfully",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "MORNING SHIFT",
    "shift_type": "day",
    "start_time": "08:30:00",
    "end_time": "16:30:00",
    "crosses_midnight": 0,
    "grace_minutes": 15,
    "working_hours": "8.00",
    "is_default": 1,
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

### 2. Get All Shifts (With Advanced Filters)

Lists shifts across all schools or filtered by query parameters.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-shifts`

#### A. Raw Array Response (Default for backwards compatibility):
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "MORNING SHIFT",
    "shift_type": "day",
    "start_time": "08:30:00",
    "end_time": "16:30:00",
    "crosses_midnight": 0,
    "grace_minutes": 15,
    "working_hours": "8.00",
    "is_default": 1,
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

#### B. Paginated Metadata Response (`?page=1&limit=10&paginate=true`):
- **Route**: `{{BASE_URL}}/api/employee-shifts?search=Morning&status=active&page=1&limit=10&paginate=true`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "MORNING SHIFT",
      "shift_type": "day",
      "start_time": "08:30:00",
      "end_time": "16:30:00",
      "crosses_midnight": 0,
      "grace_minutes": 15,
      "working_hours": "8.00",
      "is_default": 1,
      "status": "active",
      "school_name": "Greenwood High",
      "school_code": "GWH001"
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
    "search": "Morning",
    "status": "active"
  },
  "filters": {
    "search": "Morning",
    "status": "active",
    "page": 1,
    "limit": 10,
    "paginate": "true"
  }
}
```

---

### 3. Get Shifts by Token (School Scoped)

Fetches shifts scoped automatically to the authenticated user's assigned school.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-shifts/token?status=active&paginate=true`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "MORNING SHIFT",
      "shift_type": "day",
      "start_time": "08:30:00",
      "end_time": "16:30:00",
      "working_hours": "8.00",
      "grace_minutes": 15,
      "status": "active",
      "school_name": "Greenwood High"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 4. Get Shift by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-shifts/:id`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "MORNING SHIFT",
    "shift_type": "day",
    "start_time": "08:30:00",
    "end_time": "16:30:00",
    "crosses_midnight": 0,
    "grace_minutes": 15,
    "working_hours": "8.00",
    "is_default": 1,
    "status": "active",
    "school_name": "Greenwood High"
  }
}
```

---

### 5. Update Shift by ID

Updates shift attributes. Working hours are automatically re-computed when start or end times change.

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employee-shifts/:id`
- **Request Body**:
```json
{
  "name": "PRIMARY MORNING SHIFT",
  "start_time": "08:00:00",
  "end_time": "16:00:00",
  "grace_minutes": 10,
  "status": "active"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Shift updated successfully",
  "id": 1,
  "old_data": {
    "name": "MORNING SHIFT",
    "start_time": "08:30:00"
  },
  "new_data": {
    "name": "PRIMARY MORNING SHIFT",
    "start_time": "08:00:00"
  }
}
```

---

### 6. Update Shift Status (Toggle Active/Inactive)

- **Method**: `PATCH`
- **Route**: `{{BASE_URL}}/api/employee-shifts/status/:id`
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
  "message": "Shift status updated to 'inactive'",
  "id": 1
}
```

---

### 7. Delete Shift by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employee-shifts/:id`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Shift deleted successfully",
  "id": 1
}
```

---

## Error Responses

| Code | Status | Reason |
| :--- | :--- | :--- |
| `400` | Bad Request | Missing required fields, invalid format, or `start_time >= end_time` without `crosses_midnight` |
| `401` | Unauthorized | Missing or expired JWT bearer token |
| `404` | Not Found | Shift ID does not exist |
| `409` | Conflict | Shift name already exists within the target school |
| `500` | Server Error | Unhandled database or system exception |
