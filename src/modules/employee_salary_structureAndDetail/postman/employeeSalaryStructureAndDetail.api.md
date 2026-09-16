# Employee Salary Structure With Details API Documentation

Comprehensive API documentation for the **Employee Salary Structure With Details** composite module in the School Management System. This module executes an atomic transaction that simultaneously creates a salary structure header row and its breakdown line items.

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
| `POST` | `/api/employee-salary-structures-with-details` | Atomically create a salary structure with all line item components | Bearer Token |
| `POST` | `/api/employee-salary-structure-with-details` | Singular alias route for structure with details creation | Bearer Token |

---

## Business Logic & Validations

1. **Atomic Transaction**:
   - Both the header record (`employee_salary_structures`) and component line items (`employee_salary_structure_details`) are written inside a single MySQL transaction. If any step fails or duplicate components are detected, the entire transaction is rolled back.
2. **Employee Verification**:
   - Validates that `employee_id` exists in the `employees` table. Retrieves `school_id` and `designation`.
3. **Overlapping Structure Check**:
   - Queries existing salary structures for the employee to ensure the effective date range `[effective_from, effective_to]` does not overlap with any existing record.
4. **Automated Structure Naming**:
   - The structure name is automatically generated using the employee's designation and effective year:
     `${designation} Salary ${year}` (e.g., `Senior Teacher Salary 2026`).
5. **Component Validation**:
   - `components` must be a non-empty array.
   - Rejects payloads containing duplicate `component_id`s with status `400`.
   - If `calculation_type` is `"fixed"`, `amount` must be a positive number and `percentage` is set to `null`.
   - If `calculation_type` is `"percentage"`, `percentage` must be a positive number and `amount` is set to `null`.
   - `based_on` defaults to `"basic"` if not specified.

---

## API Details

### 1. Create Salary Structure With Details

Creates a salary structure record and inserts multiple component rows within an ACID database transaction.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employee-salary-structures-with-details`
- **Alias Route**: `{{BASE_URL}}/api/employee-salary-structure-with-details`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{TOKEN}}`

#### Request Body
```json
{
  "employee_id": 1,
  "effective_from": "2026-04-01",
  "effective_to": null,
  "status": "active",
  "remarks": "Standard faculty salary package FY2026-27",
  "components": [
    {
      "component_id": 1,
      "calculation_type": "fixed",
      "amount": 50000,
      "percentage": null,
      "based_on": "basic"
    },
    {
      "component_id": 2,
      "calculation_type": "percentage",
      "amount": null,
      "percentage": 40,
      "based_on": "basic"
    },
    {
      "component_id": 3,
      "calculation_type": "fixed",
      "amount": 3500,
      "percentage": null,
      "based_on": "basic"
    },
    {
      "component_id": 4,
      "calculation_type": "percentage",
      "amount": null,
      "percentage": 12,
      "based_on": "basic"
    }
  ]
}
```

#### Field Specifications

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `employee_id` | `Number` | Yes | Target employee ID |
| `effective_from` | `String (YYYY-MM-DD)` | Yes | Start date of salary structure validity |
| `effective_to` | `String (YYYY-MM-DD)` / `null` | No | Optional end date (null indicates indefinitely active) |
| `status` | `String` | No | `"active"` or `"inactive"` (default: `"active"`) |
| `remarks` | `String` / `null` | No | Optional notes or justification |
| `components` | `Array<Object>` | Yes | Non-empty array of salary components |
| `components[].component_id` | `Number` | Yes | Master salary component ID |
| `components[].calculation_type` | `String` | Yes | Either `"fixed"` or `"percentage"` |
| `components[].amount` | `Number` / `null` | Conditional | Required if calculation_type is `"fixed"` (> 0) |
| `components[].percentage` | `Number` / `null` | Conditional | Required if calculation_type is `"percentage"` (> 0) |
| `components[].based_on` | `String` | No | Component base for percentage calculation (defaults to `"basic"`) |

#### Success Response (`201 Created`)
```json
{
  "message": "Salary structure created successfully",
  "structure_id": 15
}
```

---

## Error Responses

### 1. Employee Not Found (`404 Not Found`)
```json
{
  "message": "Employee not found"
}
```

### 2. Overlapping Structure (`400 Bad Request`)
```json
{
  "message": "Overlapping salary structure exists"
}
```

### 3. Duplicate Component in Request (`400 Bad Request`)
```json
{
  "message": "Duplicate component_id 2"
}
```

### 4. Missing Required Field (`400 Bad Request`)
```json
{
  "message": "employee_id required"
}
```
*or*
```json
{
  "message": "components required"
}
```

### 5. Invalid Calculation Amount / Percentage (`400 Bad Request`)
```json
{
  "message": "Valid amount required"
}
```
*or*
```json
{
  "message": "Valid percentage required"
}
```

### 6. Unauthorized (`401 Unauthorized`)
```json
{
  "message": "Authorization header missing"
}
```
