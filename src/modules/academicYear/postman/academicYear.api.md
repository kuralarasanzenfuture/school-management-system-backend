# 📅 Academic Years Management API Documentation

Complete API reference and testing guide for the **Academic Years** module.

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
| 1 | `POST` | `/api/academic-years` | Create a new academic year | Body: `school_id`, `start_date`, `end_date`, `is_current`, `status` |
| 2 | `GET` | `/api/academic-years` | Get all academic years | Query: `?school_id=1` |
| 3 | `GET` | `/api/academic-years/token` | Get academic years scoped to user's assigned school | None (Bearer Token) |
| 4 | `GET` | `/api/academic-years/:id` | Get single academic year by ID | Param: `id` |
| 5 | `PUT` | `/api/academic-years/:id` | Update academic year dates, status, or current flag | Param: `id`, Body: updates |
| 6 | `DELETE` | `/api/academic-years/:id` | Delete academic year | Param: `id` |

---

## 1. ➕ Create Academic Year

Creates a new academic year for a school. The academic year `name` is auto-generated (e.g., `2026-2027`) from the start and end dates. Overlapping date ranges are automatically blocked.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/academic-years`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "start_date": "2026-06-01",
  "end_date": "2027-05-31",
  "is_current": true,
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `start_date`, `end_date`
- **Date constraints:** `start_date` must be strictly before `end_date`.
- **Status:** `active` (default), `inactive`.
- **Current Year:** Setting `is_current: true` automatically resets any other current year for the same school to `0`.

### Response (`201 Created`)
```json
{
  "message": "Academic year created",
  "id": 1,
  "name": "2026-2027",
  "is_current": true
}
```

---

## 2. 📋 Get All Academic Years

Retrieves all academic years across schools or filtered by `school_id`.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years?school_id=1`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "2026-2027",
    "start_date": "2026-06-01",
    "end_date": "2027-05-31",
    "is_current": 1,
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 3. 🏫 Get Academic Years By Token (School Scoped)

Fetches academic years restricted to the school assigned to the logged-in user's JWT token (or all years if the user has `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "2026-2027",
    "start_date": "2026-06-01",
    "end_date": "2027-05-31",
    "is_current": 1,
    "status": "active",
    "school_name": "Springfield High"
  }
]
```

---

## 4. 🏷️ Get Academic Year By ID

Fetches details of a specific academic year by its ID.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/academic-years/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
  "name": "2026-2027",
  "start_date": "2026-06-01",
  "end_date": "2027-05-31",
  "is_current": 1,
  "status": "active"
}
```

---

## 5. ✏️ Update Academic Year

Updates dates, status, or marks the year as current. Note: Years that have already started cannot be modified.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/academic-years/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "start_date": "2026-06-01",
  "end_date": "2027-05-31",
  "is_current": true,
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "message": "Academic year updated"
}
```

---

## 6. 🗑️ Delete Academic Year

Deletes an academic year. (Cannot delete the active `is_current` year).

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/academic-years/:id`

### Response (`200 OK`)
```json
{
  "message": "Academic year deleted"
}
```
