# 📚 Subjects Management API Documentation

Complete API reference and testing guide for the **Subjects** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/subjects`
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
| 1 | `POST` | `/api/subjects` | Create a new subject | Body: `school_id`, `name`, `code`, `subject_type`, `status` |
| 2 | `GET` | `/api/subjects` | Get all subjects across schools | None |
| 3 | `GET` | `/api/subjects/token` | Get subjects scoped to user's assigned school | None (Bearer Token) |
| 4 | `GET` | `/api/subjects/check-subject` | Check if subject name or code exists | Query: `?school_id=1&name=MATH&code=MATH101` |
| 5 | `GET` | `/api/subjects/:id` | Get single subject by ID | Param: `id` |
| 6 | `PUT` | `/api/subjects/:id` | Update subject details | Param: `id`, Body: `name`, `code`, `subject_type`, `status` |
| 7 | `DELETE` | `/api/subjects/:id` | Delete a subject | Param: `id` |

---

## 1. ➕ Create Subject

Creates a new subject under a school. Performs automatic duplicate checks for `name` and optional `code`.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/subjects`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "MATHEMATICS",
  "code": "MATH101",
  "subject_type": "theory",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Subject Type:** `theory` (default), `practical`, `both`
- **Status:** `active` (default), `inactive`
- **Automatic formatting:** `name` and `code` are automatically trimmed and capitalized.

### Response (`200 OK` or `201 Created`)
```json
{
  "message": "Subject created",
  "id": 1
}
```

---

## 2. 📋 Get All Subjects

Retrieves all subjects with their associated school name.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "name": "MATHEMATICS",
    "code": "MATH101",
    "subject_type": "theory",
    "status": "active"
  }
]
```

---

## 3. 🏫 Get Subjects By Token (School Scoped)

Fetches subjects filtered automatically to the school linked to the logged-in user's JWT token (or all subjects if user has `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "name": "MATHEMATICS",
    "code": "MATH101",
    "subject_type": "theory",
    "status": "active"
  }
]
```

---

## 4. 🔍 Check Subject Existence

Checks whether a subject `name` or `code` is already taken within a school before creating or updating.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/check-subject?school_id=1&name=MATHEMATICS&code=MATH101`

### Response (`200 OK`)
```json
{
  "available": false,
  "exists": true,
  "match": {
    "name": {
      "id": 1,
      "name": "MATHEMATICS",
      "code": "MATH101"
    },
    "code": {
      "id": 1,
      "name": "MATHEMATICS",
      "code": "MATH101"
    }
  }
}
```

---

## 5. 🏷️ Get Subject By ID

Fetches details of a specific subject by its ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subjects/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "school_name": "Springfield High",
  "name": "MATHEMATICS",
  "code": "MATH101",
  "subject_type": "theory",
  "status": "active"
}
```

---

## 6. ✏️ Update Subject

Updates the name, code, subject type, or status of an existing subject. Prevents duplicate name or code conflicts with other subjects in the same school.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/subjects/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "ADVANCED MATHEMATICS",
  "code": "MATH102",
  "subject_type": "both",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Subject updated"
}
```

---

## 7. 🗑️ Delete Subject

Deletes a subject record from the database.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/subjects/:id`

### Response (`200 OK`)
```json
{
  "message": "Subject deleted"
}
```
