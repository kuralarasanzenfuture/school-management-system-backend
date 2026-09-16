# 🗂️ Subject Groups Management API Documentation

Complete API reference and testing guide for the **Subject Groups** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/subject-groups`
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
| 1 | `POST` | `/api/subject-groups` | Create a new subject group | Body: `school_id`, `name`, `description`, `status` |
| 2 | `GET` | `/api/subject-groups` | Get all subject groups | None |
| 3 | `GET` | `/api/subject-groups/token` | Get subject groups scoped to user's assigned school | None (Bearer Token) |
| 4 | `GET` | `/api/subject-groups/check-subject-group` | Check if a subject group name already exists | Query: `?school_id=1&name=SCIENCE` |
| 5 | `GET` | `/api/subject-groups/:id` | Get single subject group by ID | Param: `id` |
| 6 | `PUT` | `/api/subject-groups/:id` | Update subject group name, description, or status | Param: `id`, Body: updates |
| 7 | `DELETE` | `/api/subject-groups/:id` | Delete subject group | Param: `id` |

---

## 1. ➕ Create Subject Group

Creates a new subject group (e.g., `SCIENCE`, `COMMERCE`, `ARTS`) for a specific school.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/subject-groups`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "SCIENCE",
  "description": "Physics, Chemistry, Biology stream",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `name`
- **Status:** `active` (default), `inactive`
- **Automatic formatting:** `name` is automatically trimmed and converted to uppercase.
- **Duplicate check:** Prevents duplicate subject group names under the same school.

### Response (`201 Created`)
```json
{
  "message": "Subject group created",
  "id": 1
}
```

---

## 2. 📋 Get All Subject Groups

Retrieves all subject groups across all schools.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "SCIENCE",
    "description": "Physics, Chemistry, Biology stream",
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 3. 🏫 Get Subject Groups By Token (School Scoped)

Fetches subject groups scoped to the school assigned to the logged-in user's JWT token (or all groups if the user has `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "SCIENCE",
    "description": "Physics, Chemistry, Biology stream",
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 4. 🔍 Check Subject Group Existence

Checks whether a subject group name already exists for a school prior to creation.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/check-subject-group?school_id=1&name=SCIENCE`

### Response (`200 OK`)
```json
{
  "available": false,
  "exists": true,
  "subject_group": {
    "id": 1,
    "name": "SCIENCE"
  }
}
```

---

## 5. 🏷️ Get Subject Group By ID

Fetches details of a specific subject group by ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/subject-groups/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "name": "SCIENCE",
  "description": "Physics, Chemistry, Biology stream",
  "status": "active",
  "school_name": "Springfield High"
}
```

---

## 6. ✏️ Update Subject Group

Updates name, description, or status. Re-validates against duplicate names in the same school.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/subject-groups/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "ADVANCED SCIENCE",
  "description": "Updated stream description",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Subject group updated"
}
```

---

## 7. 🗑️ Delete Subject Group

Deletes a subject group record.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/subject-groups/:id`

### Response (`200 OK`)
```json
{
  "message": "Subject group deleted"
}
```
