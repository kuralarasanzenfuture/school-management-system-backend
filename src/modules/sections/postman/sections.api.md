# 🗂️ Sections Management API Documentation

Complete API reference and testing guide for the **Sections** module (`/api/sections`).

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

| Method | Endpoint | Description | Query / Params / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sections` | Create a new section with duplicate check & audit logging | Body: `class_id`, `name`, `capacity`, `status` |
| `GET` | `/api/sections` | Get all sections with filters & pagination | Query: `search`, `status`, `class_id`, `school_id`, `name`, `page`, `limit` |
| `GET` | `/api/sections/token` | Get sections filtered by user's assigned school | Query: `search`, `status`, `class_id`, `page`, `limit` |
| `GET` | `/api/sections/tree` | Get hierarchical school tree (School > Class > Section) | Query: `?school_id=1` |
| `GET` | `/api/sections/check-section` | Check if a section name already exists in a class | Query: `?class_id=1&name=A` |
| `GET` | `/api/sections/check-section/token` | Check if section exists in school via token | Query: `?class_id=1&name=A` |
| `GET` | `/api/sections/class/:class_id` | Get all sections for a class (via route param) | Param: `class_id`, Query: filters |
| `GET` | `/api/sections/:id` | Get single section by ID | Param: `id` |
| `PUT` | `/api/sections/:id` | Update section name, capacity, or class | Param: `id`, Body: updates |
| `PATCH` | `/api/sections/status/:id` | Toggle section status (`active` / `inactive`) | Param: `id`, Body: `status` |
| `DELETE` | `/api/sections/:id` | Delete section with reference protection | Param: `id` |

---

## 1. ➕ Create Section

Creates a new section under a specific class. Automatically logs audit entry.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/sections`
- **Headers:** `Content-Type: application/json`
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
  "success": true,
  "message": "Section created",
  "id": 1,
  "data": {
    "id": 1,
    "class_id": 1,
    "name": "A",
    "capacity": 40,
    "status": "active",
    "created_by": 2,
    "updated_by": null,
    "class_name": "10",
    "school_id": 1,
    "school_name": "Springfield High",
    "created_by_name": "admin",
    "updated_by_name": null,
    "class_section": "10 - A"
  }
}
```

---

## 2. 📋 Get All Sections

Retrieves sections with search, filtering, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections?class_id=1&status=active&page=1&limit=20`

### Query Parameters
- `search`: Search term matching section name, class name, or school name
- `status`: Filter by `active` or `inactive`
- `class_id`: Filter by class ID
- `school_id`: Filter by school ID
- `name`: Filter by section name
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort column (`id`, `name`, `capacity`, `status`, `created_at`)
- `sortOrder`: `ASC` or `DESC`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "class_id": 1,
      "section_name": "A",
      "capacity": 40,
      "status": "active",
      "class_name": "10",
      "school_name": "Springfield High",
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

## 3. 🏫 Get Sections By Token (School Scoped)

Fetches sections restricted to the school assigned to the logged-in user's JWT token.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections/token?status=active`

---

## 4. 🌳 Get School Tree

Returns hierarchical nested structure of Schools -> Classes -> Sections.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections/tree`

---

## 5. 🔍 Check Section Existence

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections/check-section?class_id=1&name=A`

---

## 6. 🏷️ Get Section By ID

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/sections/:id`

---

## 7. ✏️ Update Section

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/sections/:id`
- **Body:**
```json
{
  "name": "B",
  "capacity": 45
}
```

---

## 8. 🔄 Update Section Status (PATCH)

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/sections/status/:id`
- **Body:**
```json
{
  "status": "inactive"
}
```

---

## 9. 🗑️ Delete Section (Reference Protected)

Prevents deletion if referenced by any class section mapping.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/sections/:id`

### Error Response if Referenced (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot delete section 'A'. It is currently referenced by 1 class section(s). Please remove or reassign associated records first."
}
```
