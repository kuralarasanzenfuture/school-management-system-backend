# 💳 Employee Salary Structure Details Management API Documentation

Complete API reference and testing guide for the **Employee Salary Structure Details** module.

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
| 3 | `GET` | `/api/employee-salary-structures-details` | Get all structure details | None |
| 4 | `GET` | `/api/employee-salary-structures-details/token` | Get details scoped to user's assigned school | None (Bearer Token) |
| 5 | `GET` | `/api/employee-salary-structures-details/salary-calculatebyemployee/:employee_id` | Compute salary breakdown by employee | Param: `employee_id` |
| 6 | `GET` | `/api/employee-salary-structures-details/full-salary-by-employee/:employee_id` | Detailed salary with monthly & annual CTC | Param: `employee_id` |
| 7 | `GET` | `/api/employee-salary-structures-details/:id` | Get single detail record by ID | Param: `id` |
| 8 | `PUT` | `/api/employee-salary-structures-details/:id` | Update component amounts or percentages | Param: `id`, Body: updates |
| 9 | `DELETE` | `/api/employee-salary-structures-details/:id` | Remove component from structure | Param: `id` |

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

### Validation Rules
- **Required fields:** `salary_structure_id`, `component_id`, `calculation_type`
- **Calculation Type:** `fixed` (requires `amount > 0`) or `percentage` (requires `0 < percentage <= 100`).
- **Based On:** `basic` (default) or `gross`.
- **Duplicate Protection:** A component can only be added once per salary structure.

### Response (`201 Created`)
```json
{
  "message": "Created successfully",
  "id": 1
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

### Response (`200 OK` or `201 Created`)
```json
{
  "message": "Bulk upsert success"
}
```

---

## 3. 📋 Get All Structure Details

Retrieves all component breakdown records across structures.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details`

### Response (`200 OK`)
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
    "component_name": "BASIC PAY",
    "component_type": "earning"
  }
]
```

---

## 4. 🏫 Get Structure Details By Token (School Scoped)

Fetches details restricted to the school assigned to the logged-in user's JWT token.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures-details/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "salary_structure_id": 1,
    "component_id": 1,
    "calculation_type": "fixed",
    "amount": 25000,
    "component_name": "BASIC PAY",
    "component_type": "earning",
    "first_name": "Sarah",
    "last_name": "Connor"
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
      "type": "earning",
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
  "based_on": "basic"
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
  "message": "Updated successfully"
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
  "message": "Deleted successfully"
}
```
