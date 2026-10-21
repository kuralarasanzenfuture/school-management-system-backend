# 📑 Employee Salary Structures Management API Documentation

Complete API reference and testing guide for the **Employee Salary Structures** module with advanced query filters, pagination, status transitions, and audit logging.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/employee-salary-structures`
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
| 1 | `POST` | `/api/employee-salary-structures` | Create Salary Structure | Body: `employee_id`, `effective_from`, `effective_to`, `remarks`, `status` |
| 2 | `GET` | `/api/employee-salary-structures` | Get all salary structures (with filters & pagination) | Query filters: `search`, `school_id`, `employee_id`, `status`, `effective_from`, `sort_by`, `page`, `limit`, `paginate` |
| 3 | `GET` | `/api/employee-salary-structures/token` | Get salary structures scoped to user's school | Query filters: same as above; non-admin auto-scoped to token school |
| 4 | `GET` | `/api/employee-salary-structures/:id` | Get single salary structure by ID | Param: `id` |
| 5 | `PUT` | `/api/employee-salary-structures/:id` | Update salary structure dates, remarks, or status | Param: `id`, Body: `effective_from`, `effective_to`, `remarks`, `status` |
| 6 | `PATCH`| `/api/employee-salary-structures/status/:id` | Update salary structure status (active / inactive) | Param: `id`, Body: `{"status": "active"}` or `{"status": "inactive"}` |
| 7 | `DELETE`| `/api/employee-salary-structures/:id` | Delete salary structure (inactive only) | Param: `id` |

---

## 🛡️ Audit Logging Specification

All mutating operations on employee salary structures are recorded in `audit_logs`:

| Action | Audit Action ENUM | Module | Entity Type | Details Recorded |
| :--- | :--- | :--- | :--- | :--- |
| Create structure | `CREATE` | `employee_salary_structures` | `employee_salary_structure` | `new_data`, employee name, school ID, creator user ID |
| Update structure | `UPDATE` | `employee_salary_structures` | `employee_salary_structure` | `old_data`, `new_data` diffs, structure name, school ID |
| Activate structure | `ACTIVATE` | `employee_salary_structures` | `employee_salary_structure` | Previous status, updated status, employee & school metadata |
| Deactivate structure | `DEACTIVATE` | `employee_salary_structures` | `employee_salary_structure` | Previous status, updated status, employee & school metadata |
| Delete structure | `DELETE` | `employee_salary_structures` | `employee_salary_structure` | `old_data` snapshot of the deleted structure record |
| Failed validation / conflicts | `CREATE` / `UPDATE` / `DELETE` | `employee_salary_structures` | `employee_salary_structure` | `status: "failed"`, `error_message`, request payload |

---

## 🔍 Query Filters & Pagination Parameters (GET `/` and GET `/token`)

The following query parameters can be used interchangeably on both GET endpoints:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `string` | `?search=Math` | Case-insensitive search across structure name, employee first/last name, employee code, designation, and school name |
| `school_id` | `number` / `list` | `?school_id=1` or `?school_id=1,2` | Filter by one or multiple school IDs (ignored for non-admins on `/token` endpoint) |
| `employee_id` | `number` / `list` | `?employee_id=5` or `?employee_id=5,8,12` | Filter by one or multiple employee IDs |
| `structure_name`| `string` | `?structure_name=Teacher Salary` | Filter by partial structure name |
| `status` | `string` | `?status=active` or `?status=active,inactive` | Filter by status (`active`, `inactive`) |
| `effective_from` | `date` | `?effective_from=2026-06-01` | Exact match for effective from date |
| `effective_from_gte` | `date` | `?effective_from_gte=2026-01-01` | Filter structures starting on or after date |
| `effective_from_lte` | `date` | `?effective_from_lte=2026-12-31` | Filter structures starting on or before date |
| `effective_to` | `date` | `?effective_to=2027-05-31` | Exact match for effective to date |
| `created_by` | `number` | `?created_by=2` | Filter by user ID who created the record |
| `sort_by` / `sortBy` | `string` | `?sort_by=effective_from` | Sort field: `id`, `structure_name`, `effective_from`, `effective_to`, `status`, `school_id`, `employee_id`, `created_at` (default: `id`) |
| `sort_order` / `order` | `string` | `?sort_order=ASC` | Sort order: `ASC` or `DESC` (default: `DESC`) |
| `page` | `number` | `?page=1` | Current page number (1-indexed, default: `1`) |
| `limit` | `number` / `string` | `?limit=20` or `?limit=all` | Records per page (default: `20`, max: `500`, or `all` / `-1` for unpaginated) |
| `paginate` / `format` | `string` | `?paginate=true` | When `true` or `format=paginated`, returns structured JSON envelope with pagination and filter summary |

### Response Headers
When pagination is calculated, the following headers are always returned:
- `X-Total-Count`: Total number of matching records
- `X-Page`: Current page number
- `X-Limit`: Current page size
- `X-Total-Pages`: Total number of pages
- `X-From`: Starting item index (1-indexed)
- `X-To`: Ending item index
- `X-Count`: Count of items in the current response

---

## 1. ➕ Create Salary Structure

Creates an overarching salary structure agreement for an employee. The backend auto-populates `school_id`, `created_by` (from token), and generates a `structure_name` (e.g., `Teacher Salary 2026`).

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "employee_id": 1,
  "effective_from": "2026-06-01",
  "effective_to": null,
  "remarks": "Annual revision salary structure",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `employee_id`, `effective_from`
- **Overlap Prevention:** An employee cannot have multiple active salary structures with overlapping effective dates.
- **Auto-Generated:** `structure_name` is automatically constructed from the employee's designation and start year.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Salary structure created successfully",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "employee_id": 1,
    "structure_name": "Teacher Salary 2026",
    "effective_from": "2026-06-01",
    "effective_to": null,
    "status": "active",
    "remarks": "Annual revision salary structure",
    "created_by": 2,
    "first_name": "Sarah",
    "last_name": "Connor",
    "employee_code": "EMP001",
    "designation": "Teacher",
    "department": "Academics",
    "school_name": "Springfield High",
    "school_code": "SPH01",
    "created_by_username": "admin"
  }
}
```

---

## 2. 📋 Get All Salary Structures (With Filters)

Retrieves all salary structures across schools with employee and school metadata. Supports both default raw array response and rich paginated envelope.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures?search=Sarah&status=active&paginate=true`

### Response (`200 OK` - Paginated Envelope)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "employee_id": 1,
      "structure_name": "Teacher Salary 2026",
      "effective_from": "2026-06-01",
      "effective_to": null,
      "status": "active",
      "remarks": "Annual revision salary structure",
      "created_by": 2,
      "created_at": "2026-06-01 10:00:00",
      "updated_at": "2026-06-01 10:00:00",
      "first_name": "Sarah",
      "last_name": "Connor",
      "employee_code": "EMP001",
      "designation": "Teacher",
      "department": "Academics",
      "school_name": "Springfield High",
      "school_code": "SPH01",
      "created_by_username": "admin"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
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
    "search": "Sarah",
    "status": "active",
    "sorted_by": "id (DESC)"
  },
  "filters": {
    "search": "Sarah",
    "status": "active",
    "page": 1,
    "limit": 20,
    "sort_by": "id",
    "sort_order": "DESC",
    "paginate": "true"
  }
}
```

---

## 3. 🏫 Get Salary Structures By Token (School Scoped)

Fetches salary structures restricted to the school assigned to the logged-in user's JWT token (or all structures for `ADMIN` role). Supports the exact same filters and pagination options.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/token?status=active&page=1&limit=10`

### Response (`200 OK` - Raw Array Default)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "employee_id": 1,
    "structure_name": "Teacher Salary 2026",
    "effective_from": "2026-06-01",
    "effective_to": null,
    "status": "active",
    "remarks": "Annual revision salary structure",
    "created_by": 2,
    "first_name": "Sarah",
    "last_name": "Connor",
    "employee_code": "EMP001",
    "designation": "Teacher",
    "department": "Academics",
    "school_name": "Springfield High",
    "school_code": "SPH01",
    "created_by_username": "admin"
  }
]
```

---

## 4. 🏷️ Get Salary Structure By ID

Fetches details for a specific salary structure by ID with employee, school, and creator metadata.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "employee_id": 1,
  "structure_name": "Teacher Salary 2026",
  "effective_from": "2026-06-01",
  "effective_to": null,
  "status": "active",
  "remarks": "Annual revision salary structure",
  "created_by": 2,
  "created_at": "2026-06-01 10:00:00",
  "updated_at": "2026-06-01 10:00:00",
  "first_name": "Sarah",
  "last_name": "Connor",
  "employee_code": "EMP001",
  "designation": "Teacher",
  "department": "Academics",
  "school_name": "Springfield High",
  "school_code": "SPH01",
  "created_by_username": "admin"
}
```

---

## 5. ✏️ Update Salary Structure

Updates the effective dates, remarks, or status of an existing salary structure. Includes date range validation and overlap conflict prevention.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "effective_to": "2027-05-31",
  "status": "active",
  "remarks": "Updated effective end date"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Salary structure updated successfully",
  "id": 1,
  "old_data": {
    "id": 1,
    "status": "active",
    "effective_to": null
  },
  "new_data": {
    "id": 1,
    "status": "active",
    "effective_to": "2027-05-31",
    "remarks": "Updated effective end date"
  }
}
```

---

## 6. 🔄 Update Salary Structure Status

Dedicated status toggling endpoint (`active` / `inactive`). Includes overlap prevention when activating a structure.

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/status/:id`
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
  "message": "Salary structure status updated to inactive",
  "id": 1,
  "status": "inactive",
  "oldSalaryStructure": {
    "id": 1,
    "status": "active",
    "structure_name": "Teacher Salary 2026"
  },
  "updatedSalaryStructure": {
    "id": 1,
    "status": "inactive",
    "structure_name": "Teacher Salary 2026"
  }
}
```

---

## 7. 🗑️ Delete Salary Structure

Deletes a salary structure record.
- **Restrictions:**
  - Active salary structures cannot be deleted (must be deactivated first).
  - Salary structures with associated component details (`employee_salary_structure_details`) cannot be deleted (all details must be deleted first).
  - Salary structures linked to payroll records cannot be deleted.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Deleted successfully",
  "deletedSalaryStructure": {
    "id": 1,
    "structure_name": "Teacher Salary 2026",
    "status": "inactive"
  }
}
```

### Error Response (`400 Bad Request - When Structure Details Exist`)
```json
{
  "success": false,
  "message": "Cannot delete salary structure 'Teacher Salary 2026'. It contains 4 structure detail(s). Please remove all associated structure details first."
}
```
