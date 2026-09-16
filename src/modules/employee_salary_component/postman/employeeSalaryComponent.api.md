# 💰 Employee Salary Components Management API Documentation

Complete API reference and testing guide for the **Employee Salary Components** module.

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

| # | Method | Endpoint | Description | Query / Params / Body |
| :- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/employee-salary-components` | Create Salary Component | Body: `school_id`, `name`, `code`, `component_type`, `calculation_type`, `status` |
| 2 | `GET` | `/api/employee-salary-components` | Get all salary components | None |
| 3 | `GET` | `/api/employee-salary-components/token` | Get salary components scoped to user's school | None (Bearer Token) |
| 4 | `GET` | `/api/employee-salary-components/check-existing` | Check if component code/name exists | Query: `?school_id=1&code=BASIC_PAY&name=BASIC PAY` |
| 5 | `GET` | `/api/employee-salary-components/:id` | Get single salary component by ID | Param: `id` |
| 6 | `PUT` | `/api/employee-salary-components/:id` | Update component details | Param: `id`, Body: updates |
| 7 | `DELETE` | `/api/employee-salary-components/:id` | Delete salary component | Param: `id` |

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

### Validation Rules
- **Required fields:** `school_id`, `name`, `code`, `component_type`
- **Component Type:** `earning` or `deduction`
- **Calculation Type:** `fixed` (default) or `percentage`
- **Code Format:** Must contain only uppercase alphanumeric characters and underscores (`/^[A-Z0-9_]+$/`).
- **Status:** `active` (default), `inactive`
- **Duplicate Protection:** Prevents duplicate component codes within the same school.

### Response (`201 Created`)
```json
{
  "message": "Component created",
  "id": 1
}
```

---

## 2. 📋 Get All Salary Components

Retrieves all salary components across all schools with joined school details.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components`

### Response (`200 OK`)
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
    "school_name": "Springfield High"
  }
]
```

---

## 3. 🏫 Get Salary Components By Token (School Scoped)

Fetches salary components restricted to the school assigned to the logged-in user's JWT token (or all components for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/token`

### Response (`200 OK`)
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

---

## 4. 🔍 Check Component Existence

Checks whether a salary component name or code is already in use within a school prior to creation.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/check-existing?school_id=1&code=BASIC_PAY&name=BASIC PAY`

### Response (`200 OK`)
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

Fetches details of a specific salary component by its ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/:id`

### Response (`200 OK`)
```json
{
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
```

---

## 6. ✏️ Update Salary Component

Updates name, code, component type, calculation type, or status. Enforces duplicate code validation against other components in the same school.

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

### Response (`200 OK`)
```json
{
  "message": "Component updated"
}
```

---

## 7. 🗑️ Delete Salary Component

Deletes a salary component record.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/employee-salary-components/:id`

### Response (`200 OK`)
```json
{
  "message": "Component deleted"
}
```
