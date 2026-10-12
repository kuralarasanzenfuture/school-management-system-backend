# 🏫 Class Sections Management API Documentation

Complete API reference and testing guide for the **Class Sections** module (`/api/class-sections`).

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
| 1 | `POST` | `/api/class-sections` | Create Class Section Mapping with audit log | Body: `school_id`, `class_id`, `section_id`, `academic_year_id`, `class_teacher_id`, `capacity`, `status` |
| 2 | `GET` | `/api/class-sections` | Get all class section mappings with filters & pagination | Query: `search`, `status`, `school_id`, `class_id`, `section_id`, `academic_year_id`, `page`, `limit` |
| 3 | `GET` | `/api/class-sections/token` | Get class sections scoped to user's assigned school | Query: `search`, `status`, `class_id`, `section_id`, `page`, `limit` |
| 4 | `GET` | `/api/class-sections/check-mapping` | Check if mapping exists for school, class, section, & year | Query: `?school_id=1&class_id=1&section_id=1&academic_year_id=1` |
| 5 | `GET` | `/api/class-sections/check-mapping/token` | Check if mapping exists in token's school | Query: `?class_id=1&section_id=1&academic_year_id=1` |
| 6 | `GET` | `/api/class-sections/:id` | Get single class section mapping by ID | Param: `id` |
| 7 | `PUT` | `/api/class-sections/:id` | Update class section mapping | Param: `id`, Body: updates |
| 8 | `PATCH` | `/api/class-sections/status/:id` | Toggle status (`active` / `inactive`) | Param: `id`, Body: `status` |
| 9 | `DELETE` | `/api/class-sections/:id` | Delete class section with reference checks | Param: `id` |

---

## 1. ➕ Create Class Section Mapping

Associates a class and section with an academic year, assigning an optional class teacher and capacity. Automatically records audit log.

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

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Class section created",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "class_id": 1,
    "class_name": "10",
    "section_id": 1,
    "section_name": "A",
    "academic_year_id": 1,
    "academic_year": "2026-2027",
    "class_teacher_id": 1,
    "class_teacher_name": "John Doe",
    "capacity": 40,
    "status": "active",
    "created_by": 2,
    "created_by_name": "admin",
    "class_section": "10 - A"
  }
}
```

---

## 2. 📋 Get All Class Sections

Retrieves class sections with search, filtering, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections?academic_year_id=1&status=active&page=1&limit=20`

### Query Parameters
- `search`: Search matching class, section, school, academic year, or teacher name
- `status`: Filter by `active` or `inactive`
- `school_id`: Filter by school ID
- `class_id`: Filter by class ID
- `section_id`: Filter by section ID
- `academic_year_id`: Filter by academic year ID
- `class_teacher_id`: Filter by teacher/employee ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort column (`id`, `class_name`, `section_name`, `academic_year`, `capacity`, `status`, `created_at`)
- `sortOrder`: `ASC` or `DESC`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "school_name": "Springfield High",
      "class_id": 1,
      "class_name": "10",
      "section_id": 1,
      "section_name": "A",
      "academic_year_id": 1,
      "academic_year": "2026-2027",
      "class_teacher_id": 1,
      "class_teacher_name": "John Doe",
      "capacity": 40,
      "status": "active",
      "class_section": "10 - A"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

**Response Headers:**
- `X-Total-Count`: 1
- `X-Page`: 1
- `X-Limit`: 20

---

## 3. 🏫 Get Class Sections By Token (School Scoped)

Fetches class sections filtered by the school linked to the logged-in user's JWT token (or all mappings for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections/token?academic_year_id=1`

---

## 4. 🔍 Check Class Section Mapping

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections/check-mapping?school_id=1&class_id=1&section_id=1&academic_year_id=1`

---

## 5. 🏷️ Get Class Section By ID

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/class-sections/:id`

---

## 6. ✏️ Update Class Section

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/class-sections/:id`
- **Body:**
```json
{
  "class_teacher_id": 2,
  "capacity": 45
}
```

---

## 7. 🔄 Update Class Section Status (PATCH)

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/class-sections/status/:id`
- **Body:**
```json
{
  "status": "inactive"
}
```

---

## 8. 🗑️ Delete Class Section (Reference Protected)

Prevents deletion if mapped to class subjects or student attendance sessions.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/class-sections/:id`
