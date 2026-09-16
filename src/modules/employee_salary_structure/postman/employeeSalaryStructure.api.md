# 📑 Employee Salary Structures Management API Documentation

Complete API reference and testing guide for the **Employee Salary Structures** module.

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
| 2 | `GET` | `/api/employee-salary-structures` | Get all salary structures | None |
| 3 | `GET` | `/api/employee-salary-structures/token` | Get salary structures scoped to user's school | None (Bearer Token) |
| 4 | `GET` | `/api/employee-salary-structures/:id` | Get single salary structure by ID | Param: `id` |
| 5 | `PUT` | `/api/employee-salary-structures/:id` | Update salary structure dates, remarks, or status | Param: `id`, Body: updates |
| 6 | `DELETE` | `/api/employee-salary-structures/:id` | Delete salary structure | Param: `id` |

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
  "message": "Salary structure created",
  "id": 1
}
```

---

## 2. 📋 Get All Salary Structures

Retrieves all salary structures across schools with employee and school metadata.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures`

### Response (`200 OK`)
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
    "first_name": "Sarah",
    "last_name": "Connor",
    "designation": "Teacher",
    "school_name": "Springfield High"
  }
]
```

---

## 3. 🏫 Get Salary Structures By Token (School Scoped)

Fetches salary structures restricted to the school assigned to the logged-in user's JWT token (or all structures for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/token`

### Response (`200 OK`)
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
    "first_name": "Sarah",
    "last_name": "Connor",
    "designation": "Teacher",
    "school_name": "Springfield High"
  }
]
```

---

## 4. 🏷️ Get Salary Structure By ID

Fetches details for a specific salary structure by ID.

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
  "first_name": "Sarah",
  "last_name": "Connor",
  "designation": "Teacher",
  "school_name": "Springfield High"
}
```

---

## 5. ✏️ Update Salary Structure

Updates the effective dates, status, or remarks.

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
  "message": "Updated"
}
```

---

## 6. 🗑️ Delete Salary Structure

Deletes a salary structure record. (Active salary structures are protected from accidental deletion).

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/employee-salary-structures/:id`

### Response (`200 OK`)
```json
{
  "message": "Deleted successfully"
}
```
