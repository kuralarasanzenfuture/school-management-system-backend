# 🏫 Classes Management API Documentation

Complete API reference and testing guide for the **Classes** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/classes`
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
| 1 | `POST` | `/api/classes` | Create a new class | Body: `school_id`, `name`, `status` |
| 2 | `GET` | `/api/classes` | Get all classes across schools | None |
| 3 | `GET` | `/api/classes/token` | Get classes scoped to user's assigned school | None (Bearer Token) |
| 4 | `GET` | `/api/classes/school/:school_id` | Get all classes for a specific school | Param: `school_id` |
| 5 | `GET` | `/api/classes/check-class` | Check if class name exists in a school | Query: `?school_id=1&name=10` |
| 6 | `GET` | `/api/classes/check-class/token` | Check if class exists in token's school | Query: `?name=10` (Bearer Token) |
| 7 | `GET` | `/api/classes/:id` | Get single class by ID | Param: `id` |
| 8 | `PUT` | `/api/classes/:id` | Update class name or status | Param: `id`, Body: updates |
| 9 | `DELETE` | `/api/classes/:id` | Delete class | Param: `id` |

---

## 1. ➕ Create Class

Creates a new class level under a school.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/classes`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "10",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Class Name:** Must be alphanumeric (e.g., `1`, `10`, `LKG`, `UKG`). Automatically capitalized and trimmed.
- **Status:** `active` (default), `inactive`
- **Duplicate Protection:** Prevents duplicate class names within the same school.

### Response (`201 Created`)
```json
{
  "message": "Class created",
  "id": 1
}
```

---

## 2. 📋 Get All Classes

Retrieves all classes across all schools with joined school names.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 3. 🏫 Get Classes By Token (School Scoped)

Fetches classes restricted to the school assigned to the logged-in user's JWT token (or all classes for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 4. 🏢 Get Classes By School ID

Fetches classes filtered by a specific school ID parameter.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/school/:school_id`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active"
  }
]
```

---

## 5. 🔍 Check Class Existence (Query Params)

Checks whether a class name already exists within a specified school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/check-class?school_id=1&name=10`

### Response (`200 OK`)
```json
{
  "available": false,
  "exists": true,
  "class": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active"
  }
}
```

---

## 6. 🔐 Check Class Existence By Token

Checks whether a class name already exists within the authenticated user's school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/check-class/token?name=10`

### Response (`200 OK`)
```json
{
  "available": false,
  "exists": true,
  "class": {
    "id": 1,
    "school_id": 1,
    "name": "10",
    "status": "active"
  }
}
```

---

## 7. 🏷️ Get Class By ID

Fetches details of a specific class.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/classes/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "name": "10",
  "status": "active"
}
```

---

## 8. ✏️ Update Class

Updates class name or status. Duplicate checks ensure the new name is not already in use in the same school.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/classes/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "10A",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Class updated"
}
```

---

## 9. 🗑️ Delete Class

Deletes a class record.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/classes/:id`

### Response (`200 OK`)
```json
{
  "message": "Class deleted"
}
```
