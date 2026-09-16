# 🗂️ Sections Management API Documentation

Complete API reference and testing guide for the **Sections** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/sections`
- **Authentication:** Bearer Token required (`Authorization: Bearer {{TOKEN}}`)
- **Default Headers:**
  ```http
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  ```

---

## 📑 Endpoints Summary

| Method | Endpoint | Description | Query / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sections` | Create a new section | Body: `class_id`, `name`, `capacity`, `status` |
| `GET` | `/api/sections` | Get all sections | Query: `?class_id=1&school_id=1` |
| `GET` | `/api/sections/token` | Get sections filtered by user's assigned school | None |
| `GET` | `/api/sections/tree` | Get hierarchical school tree (School > Class > Section) | None |
| `GET` | `/api/sections/check-section` | Check if a section name already exists in a class | Query: `?class_id=1&name=A` |
| `GET` | `/api/sections/class/:class_id` | Get all sections for a class (via route param) | Param: `class_id` |
| `GET` | `/api/sections/class` | Get all sections for a class (via query param) | Query: `?class_id=1` |
| `GET` | `/api/sections/:id` | Get single section by ID | Param: `id` |
| `PUT` | `/api/sections/:id` | Update section name, capacity, or status | Param: `id`, Body: updates |
| `DELETE` | `/api/sections/:id` | Delete section | Param: `id` |

---

## 1. ➕ Create Section

Creates a new section under a specific class. Section name must be alphanumeric (e.g., `A`, `B`, `A1`).

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/sections`
- **Body:**
```json
{
  "class_id": 1,
  "name": "A",
  "capacity": 40,
  "status": "active"
}
```

### Response (`201 Created`)
```json
{
  "message": "Section created successfully",
  "id": 1
}
```

---

## 2. 📋 Get All Sections

Retrieves sections with optional filters by `class_id` or `school_id`.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections?class_id=1`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "class_id": 1,
    "class_name": "Class 10",
    "name": "A",
    "capacity": 40,
    "status": "active"
  }
]
```

---

## 3. 🌳 Get School Tree

Returns a hierarchical nested structure of Schools -> Classes -> Sections.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections/tree`

### Response (`200 OK`)
```json
[
  {
    "school_id": 1,
    "school_name": "Springfield High",
    "classes": [
      {
        "class_id": 1,
        "class_name": "Grade 10",
        "sections": [
          { "section_id": 1, "section_name": "A" }
        ]
      }
    ]
  }
]
```

---

## 4. 🔍 Check Section Existence

Checks whether a section name is already registered for a specific class.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections/check-section?class_id=1&name=A`

### Response (`200 OK`)
```json
{
  "exists": true,
  "message": "Section already exists"
}
```

---

## 5. ✏️ Update Section

Updates section name, capacity, or status.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/sections/:id`
- **Body:**
```json
{
  "name": "A1",
  "capacity": 45,
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Section updated successfully"
}
```

---

## 6. 🗑️ Delete Section

Deletes a section record.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/sections/:id`

### Response (`200 OK`)
```json
{
  "message": "Section deleted successfully"
}
```
