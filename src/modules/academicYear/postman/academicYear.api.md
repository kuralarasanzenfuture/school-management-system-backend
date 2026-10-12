# 📅 Academic Years Management API Documentation

Complete API reference and testing guide for the **Academic Years** module (`/api/academic-years`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/academic-years`
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
| 1 | `POST` | `/api/academic-years` | Create a new academic year with date overlap check & audit logging | Body: `school_id`, `name`, `start_date`, `end_date`, `status`, `remarks` |
| 2 | `GET` | `/api/academic-years` | Get all academic years with filters & pagination | Query: `search`, `status`, `school_id`, `name`, `page`, `limit`, `sortBy`, `sortOrder` |
| 3 | `GET` | `/api/academic-years/token` | Get academic years scoped to user's school | Query: `search`, `status`, `page`, `limit` |
| 4 | `GET` | `/api/academic-years/check-year` | Check if academic year name exists in school | Query: `?school_id=1&name=2026-2027` |
| 5 | `GET` | `/api/academic-years/check-year/token` | Check if academic year exists in token's school | Query: `?name=2026-2027` (Bearer Token) |
| 6 | `GET` | `/api/academic-years/school/:school_id` | Get all academic years for a specific school | Param: `school_id`, Query: filters |
| 7 | `GET` | `/api/academic-years/:id` | Get single academic year by ID | Param: `id` |
| 8 | `PUT` | `/api/academic-years/:id` | Update academic year dates, name, or remarks with audit log | Param: `id`, Body: updates |
| 9 | `PATCH` | `/api/academic-years/status/:id` | Update academic year status (`active`, `inactive`, `archived`) | Param: `id`, Body: `status` |
| 10 | `DELETE` | `/api/academic-years/:id` | Delete academic year with reference protection | Param: `id` |

---

## 1. ➕ Create Academic Year

Creates a new academic year for a school. The academic year `name` is auto-generated (e.g., `2026-2027`) if omitted. Overlapping date ranges within the same school are automatically rejected.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/academic-years`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "name": "2026-2027",
  "start_date": "2026-06-01",
  "end_date": "2027-05-31",
  "status": "active",
  "remarks": "Standard Academic Calendar"
}
```

### Validation Rules
- **Required fields:** `school_id`, `start_date`, `end_date` (format: `YYYY-MM-DD`)
- **Date constraints:** `start_date` must be strictly before `end_date`.
- **Status:** `active` (default), `inactive`, `archived`.
- **Remarks:** Max 255 characters.
- **Overlap Protection:** Rejects date ranges overlapping existing academic years in the same school.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Academic year created",
  "id": 1,
  "data": {
    "id": 1,
    "school_id": 1,
    "name": "2026-2027",
    "start_date": "2026-06-01",
    "end_date": "2027-05-31",
    "status": "active",
    "remarks": "Standard Academic Calendar",
    "created_by": 2,
    "updated_by": null,
    "school_name": "Springfield High",
    "created_by_name": "admin",
    "updated_by_name": null
  }
}
```

---

## 2. 📋 Get All Academic Years

Retrieves all academic years across schools with search, filtering, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years?status=active&page=1&limit=20`

### Query Parameters
- `search`: Search term matching `name`, `remarks`, or `school_name`
- `status`: Filter by `active`, `inactive`, or `archived`
- `school_id`: Filter by school ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Sort column (`start_date`, `end_date`, `name`, `status`, `id`)
- `sortOrder`: `ASC` or `DESC`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "name": "2026-2027",
      "start_date": "2026-06-01",
      "end_date": "2027-05-31",
      "status": "active",
      "remarks": "Standard Academic Calendar",
      "school_name": "Springfield High"
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

## 3. 🏫 Get Academic Years By Token (School Scoped)

Fetches academic years restricted to the school assigned to the logged-in user's token (or all schools for `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years/token?status=active`

---

## 4. 🔍 Check Academic Year Existence

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years/check-year?school_id=1&name=2026-2027`

### Response (`200 OK`)
```json
{
  "success": true,
  "available": false,
  "exists": true,
  "academicYear": {
    "id": 1,
    "school_id": 1,
    "name": "2026-2027",
    "status": "active"
  }
}
```

---

## 5. 🏷️ Get Academic Year By ID

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years/:id`

---

## 6. ✏️ Update Academic Year

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/academic-years/:id`
- **Body:**
```json
{
  "remarks": "Updated calendar details",
  "status": "active"
}
```

---

## 7. 🔄 Update Academic Year Status (PATCH)

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/academic-years/status/:id`
- **Body:**
```json
{
  "status": "archived"
}
```

---

## 8. 🗑️ Delete Academic Year (Reference Protected)

Prevents deletion if referenced by admissions or class sections.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/academic-years/:id`

### Response if Referenced (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot delete academic year '2026-2027'. It is currently referenced by 3 class section(s). Please remove or reassign associated records first."
}
```
