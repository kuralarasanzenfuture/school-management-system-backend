# 🏫 Class Sections Management API Documentation

Complete API reference and testing guide for the **Class Sections** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/class-sections`
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
| 1 | `POST` | `/api/class-sections` | Create Class Section Mapping | Body: `school_id`, `class_id`, `section_id`, `academic_year_id`, `class_teacher_id`, `capacity`, `status` |
| 2 | `GET` | `/api/class-sections` | Get all class section mappings | None |
| 3 | `GET` | `/api/class-sections/token` | Get class sections scoped to user's assigned school | None (Bearer Token) |
| 4 | `GET` | `/api/class-sections/:id` | Get single class section mapping by ID | Param: `id` |
| 5 | `PUT` | `/api/class-sections/:id` | Update class section (teacher, capacity, status) | Param: `id`, Body: updates |
| 6 | `DELETE` | `/api/class-sections/:id` | Delete class section mapping | Param: `id` |

---

## 1. ➕ Create Class Section Mapping

Associates a class and section with an academic year, assigning a class teacher and capacity.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/class-sections`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "class_id": 1,
  "section_id": 1,
  "academic_year_id": 1,
  "class_teacher_id": 1,
  "capacity": 40,
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `class_id`, `section_id`, `academic_year_id`
- **Optional fields:** `class_teacher_id`, `capacity`, `status`
- **Status values:** `active` (default), `inactive`
- **Duplicate Protection:** The combination of `(school_id, class_id, section_id, academic_year_id)` must be unique.

### Response (`200 OK` or `201 Created`)
```json
{
  "message": "Class section created",
  "id": 1
}
```

---

## 2. 📋 Get All Class Sections

Retrieves all class-section mappings joined with school, class, section, and academic year details.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "class_id": 1,
    "class_name": "Class 10",
    "section_id": 1,
    "section_name": "A",
    "academic_year_id": 1,
    "academic_year": "2026-2027",
    "class_teacher_id": 1,
    "capacity": 40,
    "status": "active",
    "created_at": "2026-06-01T08:30:00.000Z"
  }
]
```

---

## 3. 🏫 Get Class Sections By Token (School Scoped)

Fetches class sections filtered by the school linked to the logged-in user's JWT token (or all mappings for `ADMIN` role). Includes formatted `class_section` string (e.g. `Class 10-A`).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "class_id": 1,
    "class_name": "Class 10",
    "section_id": 1,
    "section_name": "A",
    "academic_year_id": 1,
    "academic_year": "2026-2027",
    "class_teacher_id": 1,
    "capacity": 40,
    "status": "active",
    "created_at": "2026-06-01T08:30:00.000Z",
    "class_section": "Class 10-A"
  }
]
```

---

## 4. 🏷️ Get Class Section By ID

Fetches full details for a specific class-section mapping.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "school_name": "Springfield High",
  "class_id": 1,
  "class_name": "Class 10",
  "section_id": 1,
  "section_name": "A",
  "academic_year_id": 1,
  "academic_year": "2026-2027",
  "class_teacher_id": 1,
  "capacity": 40,
  "status": "active",
  "created_at": "2026-06-01T08:30:00.000Z"
}
```

---

## 5. ✏️ Update Class Section

Updates teacher assignment, capacity, or status of a class-section mapping.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/class-sections/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "class_teacher_id": 2,
  "capacity": 45,
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Updated successfully"
}
```

---

## 6. 🗑️ Delete Class Section

Deletes a class-section mapping record.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/class-sections/:id`

### Response (`200 OK`)
```json
{
  "message": "Deleted successfully"
}
```
