# 🏢 Departments Management API Documentation

Complete API reference and testing guide for the **Departments** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/departments`
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
| 1 | `POST` | `/api/departments` | Create a new department | Body: `school_id`, `name`, `description`, `status` |
| 2 | `GET` | `/api/departments` | Get all departments across schools | None |
| 3 | `GET` | `/api/departments/token` | Get departments scoped to user's assigned school | None (Bearer Token) |
| 4 | `GET` | `/api/departments/check-department` | Check if department name exists in school | Query: `?school_id=1&name=MATHEMATICS` |
| 5 | `GET` | `/api/departments/school/:school_id` | Get all departments for a specific school | Param: `school_id` |
| 6 | `GET` | `/api/departments/:id` | Get single department by ID | Param: `id` |
| 7 | `PUT` | `/api/departments/:id` | Update department name, description, or status | Param: `id`, Body: updates |
| 8 | `DELETE` | `/api/departments/:id` | Delete department | Param: `id` |

---

## 1. ➕ Create Department

Creates a new academic or administrative department within a school.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/departments`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "MATHEMATICS",
  "description": "Department of Mathematics and Computing",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Department Name:** Automatically trimmed and capitalized.
- **Status:** `active` (default), `inactive`.
- **Duplicate Protection:** Prevents duplicate department names within the same school.

### Response (`201 Created`)
```json
{
  "message": "Department created",
  "id": 1
}
```

---

## 2. 📋 Get All Departments

Retrieves all departments across schools with joined school names.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing",
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 3. 🏫 Get Departments By Token (School Scoped)

Fetches departments restricted to the school assigned to the logged-in user's JWT token (or all departments for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing",
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 4. 🔍 Check Department Existence

Checks whether a department name already exists within a school prior to creation.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/check-department?school_id=1&name=MATHEMATICS`

### Response (`200 OK`)
```json
{
  "available": false,
  "exists": true,
  "department": {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing"
  }
}
```

---

## 5. 🏫 Get Departments By School ID

Fetches all departments registered under a given school ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/school/:school_id`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "MATHEMATICS",
    "description": "Department of Mathematics and Computing",
    "status": "active"
  }
]
```

---

## 6. 🏷️ Get Department By ID

Fetches details of a specific department by its primary ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/departments/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "name": "MATHEMATICS",
  "description": "Department of Mathematics and Computing",
  "status": "active",
  "school_name": "Springfield High"
}
```

---

## 7. ✏️ Update Department

Updates name, description, or status of an existing department. Duplicate name checks are enforced against other departments in the same school.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/departments/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "ADVANCED MATHEMATICS",
  "description": "Updated department description",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Department updated"
}
```

---

## 8. 🗑️ Delete Department

Deletes a department record.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/departments/:id`

### Response (`200 OK`)
```json
{
  "message": "Department deleted"
}
```
