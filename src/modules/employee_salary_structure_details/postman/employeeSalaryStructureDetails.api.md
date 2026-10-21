# 💳 Employee Salary Structure Details Management API Documentation

Complete API reference and testing guide for the **Employee Salary Structure Details** module with advanced query filters, pagination, bulk operations, and audit logging.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/employee-salary-structures-details`
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
| 1 | `POST` | `/api/employee-salary-structures-details` | Create single salary component breakdown | Body: `salary_structure_id`, `component_id`, `calculation_type`, `amount`, `percentage`, `based_on` |
| 2 | `POST` | `/api/employee-salary-structures-details/bulk` | Bulk upsert all components for a structure | Body: `salary_structure_id`, `components` (array) |
| 3 | `GET` | `/api/employee-salary-structures-details` | Get all structure details (filters & pagination) | Query: `search`, `salary_structure_id`, `component_id`, `calculation_type`, `based_on`, `component_type`, `school_id`, `employee_id`, `page`, `limit`, `sort_by`, `paginate` |
| 4 | `GET` | `/api/employee-salary-structures-details/token` | Get details scoped to user's assigned school | Query filters: same as above (non-admin locked to school) |
| 5 | `GET` | `/api/employee-salary-structures-details/salary-calculatebyemployee/:employee_id` | Compute salary breakdown by employee | Param: `employee_id` |
| 6 | `GET` | `/api/employee-salary-structures-details/full-salary-by-employee/:employee_id` | Detailed salary with monthly & annual CTC | Param: `employee_id` |
| 7 | `GET` | `/api/employee-salary-structures-details/:id` | Get single detail record by ID | Param: `id` |
| 8 | `PUT` | `/api/employee-salary-structures-details/:id` | Update component amounts, percentages, or calculation type | Param: `id`, Body: updates |
| 9 | `DELETE` | `/api/employee-salary-structures-details/:id` | Remove component from structure | Param: `id` |

---

## 🛡️ Audit Logging Specification

All mutating operations on employee salary structure details are recorded in `audit_logs`:

| Action | Audit Action ENUM | Module | Entity Type | Details Recorded |
| :--- | :--- | :--- | :--- | :--- |
| Create detail | `CREATE` | `employee_salary_structure_details` | `employee_salary_structure_detail` | `new_data`, component name, structure name, school ID |
| Bulk upsert details | `UPDATE` | `employee_salary_structure_details` | `employee_salary_structure_detail` | Structure ID, component count, upserted items list, school ID |
| Update detail | `UPDATE` | `employee_salary_structure_details` | `employee_salary_structure_detail` | `old_data`, `new_data` diffs, component & structure name, school ID |
| Delete detail | `DELETE` | `employee_salary_structure_details` | `employee_salary_structure_detail` | `old_data` snapshot of the deleted component detail record |
| Failed validation / conflicts | `CREATE` / `UPDATE` / `DELETE` | `employee_salary_structure_details` | `employee_salary_structure_detail` | `status: "failed"`, `error_message`, request payload |

---

## 🔍 Query Filters & Pagination Parameters (GET `/` and GET `/token`)

The following query parameters can be used interchangeably on both GET endpoints:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `string` | `?search=HRA` | Case-insensitive search across component name, component code, structure name, employee names, employee code, and school name |
| `salary_structure_id` | `number` / `list` | `?salary_structure_id=1` or `?salary_structure_id=1,2` | Filter by one or multiple salary structure IDs |
| `component_id` | `number` / `list` | `?component_id=3` or `?component_id=3,5` | Filter by one or multiple component IDs |
| `calculation_type` | `string` | `?calculation_type=fixed` or `?calculation_type=fixed,percentage` | Filter by calculation type (`fixed`, `percentage`) |
| `based_on` | `string` | `?based_on=basic` or `?based_on=basic,gross` | Filter by basis (`basic`, `gross`) |
| `component_type` | `string` | `?component_type=earning` or `?component_type=earning,deduction` | Filter by component type (`earning`, `deduction`) |
| `school_id` | `number` / `list` | `?school_id=1` or `?school_id=1,2` | Filter by school ID (auto-scoped for non-admins on `/token`) |
| `employee_id` | `number` / `list` | `?employee_id=5` or `?employee_id=5,8` | Filter by employee ID |
| `sort_by` / `sortBy` | `string` | `?sort_by=amount` | Sort field: `id`, `salary_structure_id`, `component_id`, `calculation_type`, `amount`, `percentage`, `based_on`, `created_at`, `component_name`, `structure_name`, `school_name` (default: `id`) |
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

## 1. ➕ Create Salary Structure Detail (Single)

Adds an earning or deduction component breakdown to a salary structure.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details`
- **Headers:** `Content-Type: application/json`
- **Body (Fixed Amount):**
```json
{
  "salary_structure_id": 1,
  "component_id": 1,
  "calculation_type": "fixed",
  "amount": 25000,
  "based_on": "basic"
}
```

- **Body (Percentage of Basic/Gross):**
```json
{
  "salary_structure_id": 1,
  "component_id": 2,
  "calculation_type": "percentage",
  "percentage": 12,
  "based_on": "basic"
}
```

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Created successfully",
  "id": 1,
  "data": {
    "id": 1,
    "salary_structure_id": 1,
    "component_id": 1,
    "calculation_type": "fixed",
    "amount": 25000,
    "percentage": null,
    "based_on": "basic",
    "structure_name": "Teacher Salary 2026",
    "component_name": "BASIC PAY",
    "component_code": "BASIC",
    "component_type": "earning",
    "school_name": "Springfield High"
  }
}
```

---

## 2. 📦 Bulk Upsert Structure Details

Atomically updates or creates all salary components under a structure in a single request.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/bulk`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "salary_structure_id": 1,
  "components": [
    {
      "component_id": 1,
      "calculation_type": "fixed",
      "amount": 25000,
      "based_on": "basic"
    },
    {
      "component_id": 2,
      "calculation_type": "percentage",
      "percentage": 12,
      "based_on": "basic"
    }
  ]
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Bulk upsert success",
  "salary_structure_id": 1,
  "school_id": 1,
  "structure_name": "Teacher Salary 2026",
  "count": 2,
  "data": [
    {
      "id": 1,
      "salary_structure_id": 1,
      "component_id": 1,
      "calculation_type": "fixed",
      "amount": 25000,
      "percentage": null,
      "based_on": "basic",
      "component_name": "BASIC PAY",
      "component_code": "BASIC",
      "component_type": "earning"
    },
    {
      "id": 2,
      "salary_structure_id": 1,
      "component_id": 2,
      "calculation_type": "percentage",
      "amount": null,
      "percentage": 12,
      "based_on": "basic",
      "component_name": "PROVIDENT FUND",
      "component_code": "PF",
      "component_type": "deduction"
    }
  ]
}
```

---

## 3. 📋 Get All Structure Details (With Filters & Pagination)

Retrieves all component breakdown records across structures with joined metadata.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details?salary_structure_id=1&paginate=true`

### Response (`200 OK` - Paginated Envelope)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "salary_structure_id": 1,
      "component_id": 1,
      "calculation_type": "fixed",
      "amount": 25000,
      "percentage": null,
      "based_on": "basic",
      "structure_name": "Teacher Salary 2026",
      "employee_id": 1,
      "school_id": 1,
      "component_name": "BASIC PAY",
      "component_code": "BASIC",
      "component_type": "earning",
      "first_name": "Sarah",
      "last_name": "Connor",
      "employee_code": "EMP001",
      "designation": "Teacher",
      "school_name": "Springfield High",
      "school_code": "SPH01"
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
    "salary_structure_id": 1,
    "sorted_by": "id (DESC)"
  },
  "filters": {
    "salary_structure_id": 1,
    "page": 1,
    "limit": 20,
    "sort_by": "id",
    "sort_order": "DESC",
    "paginate": "true"
  }
}
```

---

## 4. 🏫 Get Structure Details By Token (School Scoped)

Fetches details restricted to the school assigned to the logged-in user's JWT token (or all structures for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/token?calculation_type=fixed`

### Response (`200 OK` - Raw Array Default)
```json
[
  {
    "id": 1,
    "salary_structure_id": 1,
    "component_id": 1,
    "calculation_type": "fixed",
    "amount": 25000,
    "percentage": null,
    "based_on": "basic",
    "structure_name": "Teacher Salary 2026",
    "employee_id": 1,
    "school_id": 1,
    "component_name": "BASIC PAY",
    "component_code": "BASIC",
    "component_type": "earning",
    "first_name": "Sarah",
    "last_name": "Connor",
    "employee_code": "EMP001",
    "designation": "Teacher",
    "school_name": "Springfield High",
    "school_code": "SPH01"
  }
]
```

---

## 5. 🧮 Calculate Salary By Employee ID

Computes gross, total deductions, and net salary using active structure rates for the employee.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/salary-calculatebyemployee/:employee_id`

### Response (`200 OK`)
```json
{
  "employee_id": 1,
  "structure_id": 1,
  "basic": 25000,
  "earnings": [
    { "name": "HRA", "value": 5000 }
  ],
  "gross": 30000,
  "deductions": [
    { "name": "PROVIDENT FUND", "value": 3000 }
  ],
  "total_deductions": 3000,
  "net_salary": 27000
}
```

---

## 6. 💼 Get Full Salary Breakdown By Employee ID

Returns complete employee profile, active salary structure, detailed component list, breakdowns, and monthly/annual CTC.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/full-salary-by-employee/:employee_id`

### Response (`200 OK`)
```json
{
  "employee": {
    "id": 1,
    "employee_code": "EMP001",
    "name": "Sarah Connor",
    "department": "ACADEMICS",
    "designation": "Teacher",
    "status": "active",
    "school": "Springfield High"
  },
  "structure": {
    "id": 1,
    "name": "Teacher Salary 2026",
    "effective_from": "2026-06-01",
    "effective_to": null,
    "status": "active"
  },
  "components": [
    {
      "name": "BASIC PAY",
      "component_type": "earning",
      "calculation_type": "fixed",
      "amount": 25000,
      "percentage": null,
      "based_on": "basic"
    }
  ],
  "breakdown": {
    "basic": 25000,
    "earnings": [],
    "gross": 25000,
    "deductions": [],
    "total_deductions": 0,
    "net_salary": 25000
  },
  "monthly_ctc": 25000,
  "annual_ctc": 300000
}
```

---

## 7. 🏷️ Get Structure Detail By ID

Fetches details for a single structure component breakdown.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "salary_structure_id": 1,
  "component_id": 1,
  "calculation_type": "fixed",
  "amount": 25000,
  "percentage": null,
  "based_on": "basic",
  "structure_name": "Teacher Salary 2026",
  "component_name": "BASIC PAY",
  "component_code": "BASIC",
  "component_type": "earning",
  "school_name": "Springfield High"
}
```

---

## 8. ✏️ Update Structure Detail

Updates amount, percentage, calculation type, or base calculation type.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "calculation_type": "fixed",
  "amount": 28000,
  "based_on": "basic"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Updated successfully",
  "id": 1,
  "old_data": {
    "id": 1,
    "amount": 25000
  },
  "new_data": {
    "id": 1,
    "amount": 28000
  }
}
```

---

## 9. 🗑️ Delete Structure Detail

Removes a component detail line from a salary structure.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Deleted successfully",
  "id": 1,
  "deletedDetail": {
    "id": 1,
    "salary_structure_id": 1,
    "component_id": 1,
    "component_name": "BASIC PAY"
  }
}
```
