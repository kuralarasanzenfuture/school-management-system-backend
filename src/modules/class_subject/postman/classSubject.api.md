# 📖 Class Subjects Management API Documentation

Complete API reference and testing guide for the **Class Subjects** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/class-subjects`
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
| 1 | `POST` | `/api/class-subjects` | Assign Subject to Class Section | Body: `class_section_id`, `subject_id`, `subject_group_id`, `employee_id`, `is_optional`, `weekly_periods` |
| 2 | `POST` | `/api/class-subjects/bulk-assign-subjects` | Bulk Assign Multiple Subjects | Body: `class_section_id`, `subjects` (array) |
| 3 | `GET` | `/api/class-subjects` | Get all assigned class subjects | None |
| 4 | `GET` | `/api/class-subjects/token` | Get class subjects scoped to user's school | None (Bearer Token) |
| 5 | `GET` | `/api/class-subjects/detailed` | Get detailed assignments with teachers & groups | None (Bearer Token) |
| 6 | `GET` | `/api/class-subjects/check-class-subject` | Check if subject is already assigned | Query: `?class_section_id=1&subject_id=1` |
| 7 | `GET` | `/api/class-subjects/:id` | Get single assignment by ID | Param: `id` |
| 8 | `PUT` | `/api/class-subjects/:id` | Update assignment (teacher, periods, optional) | Param: `id`, Body: updates |
| 9 | `DELETE` | `/api/class-subjects/:id` | Remove subject assignment | Param: `id` |

---

## 1. ➕ Create Class Subject

Assigns a subject to a specific class section with teacher mapping and weekly periods.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/class-subjects`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "class_section_id": 1,
  "subject_id": 1,
  "subject_group_id": 1,
  "employee_id": 1,
  "is_optional": false,
  "weekly_periods": 5
}
```

### Validation Rules
- **Required fields:** `class_section_id`, `subject_id`
- **Optional fields:** `subject_group_id`, `employee_id`, `is_optional` (boolean), `weekly_periods` (number)
- **Duplicate Protection:** The combination of `(class_section_id, subject_id)` must be unique.

### Response (`201 Created`)
```json
{
  "message": "Created successfully",
  "id": 1
}
```

---

## 2. 📦 Bulk Assign Subjects

Assigns multiple subjects to a class section in a single atomic transaction.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/class-subjects/bulk-assign-subjects`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "class_section_id": 1,
  "subjects": [
    {
      "subject_id": 1,
      "subject_group_id": 1,
      "employee_id": 1,
      "is_optional": false,
      "weekly_periods": 5
    },
    {
      "subject_id": 2,
      "subject_group_id": 1,
      "employee_id": 2,
      "is_optional": true,
      "weekly_periods": 3
    }
  ]
}
```

### Response (`201 Created`)
```json
{
  "message": "Bulk subjects assigned successfully",
  "count": 2
}
```

---

## 3. 📋 Get All Class Subjects

Retrieves all class-subject mappings across all schools.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-subjects`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "class_section_id": 1,
    "subject_id": 1,
    "subject_name": "MATHEMATICS",
    "subject_code": "MATH101",
    "class_name": "Class 10",
    "section_name": "A",
    "school_name": "Springfield High",
    "is_optional": 0,
    "weekly_periods": 5
  }
]
```

---

## 4. 🏫 Get Class Subjects By Token (School Scoped)

Fetches class subjects restricted to the school assigned to the logged-in user's JWT token (or all mappings for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-subjects/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "class_section_id": 1,
    "subject_id": 1,
    "subject_name": "MATHEMATICS",
    "subject_code": "MATH101",
    "class_name": "Class 10",
    "section_name": "A",
    "class_section_name": "Class 10-A",
    "school_name": "Springfield High",
    "teacher_name": "John Smith",
    "subject_group_name": "SCIENCE",
    "is_optional": 0,
    "weekly_periods": 5
  }
]
```

---

## 5. 🔍 Get Detailed Class Subjects

Retrieves extended information including teacher names, subject group details, academic years, and school associations.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-subjects/detailed`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "class_section_id": 1,
    "subject_id": 1,
    "subject_name": "MATHEMATICS",
    "subject_code": "MATH101",
    "subject_type": "theory",
    "class_id": 1,
    "class_name": "Class 10",
    "section_id": 1,
    "section_name": "A",
    "class_section_name": "Class 10-A",
    "academic_year_id": 1,
    "academic_year_name": "2026-2027",
    "subject_group_id": 1,
    "subject_group_name": "SCIENCE",
    "employee_id": 1,
    "teacher_name": "John Smith",
    "school_id": 1,
    "school_name": "Springfield High",
    "is_optional": 0,
    "weekly_periods": 5
  }
]
```

---

## 6. 🔎 Check Class Subject Existence

Checks whether a subject is already assigned to a given class section before creating an assignment.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-subjects/check-class-subject?class_section_id=1&subject_id=1`

### Response (`200 OK`)
```json
{
  "available": false,
  "exists": true,
  "data": {
    "id": 1,
    "subject_id": 1,
    "subject_name": "MATHEMATICS",
    "class_id": 1,
    "class_name": "Class 10",
    "section_id": 1,
    "section_name": "A",
    "school_id": 1,
    "school_name": "Springfield High"
  }
}
```

---

## 7. 🏷️ Get Class Subject By ID

Fetches details for a single class-subject assignment by ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-subjects/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "class_section_id": 1,
  "subject_id": 1,
  "subject_name": "MATHEMATICS",
  "employee_id": 1,
  "teacher_name": "John Smith",
  "subject_group_id": 1,
  "subject_group_name": "SCIENCE",
  "is_optional": 0,
  "weekly_periods": 5
}
```

---

## 8. ✏️ Update Class Subject

Updates the assigned teacher, subject group, optional status, or weekly periods.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/class-subjects/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "subject_group_id": 1,
  "employee_id": 2,
  "is_optional": false,
  "weekly_periods": 6
}
```

### Response (`200 OK`)
```json
{
  "message": "Updated successfully"
}
```

---

## 9. 🗑️ Delete Class Subject

Removes a subject assignment from a class section.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/class-subjects/:id`

### Response (`200 OK`)
```json
{
  "message": "Deleted successfully"
}
```
