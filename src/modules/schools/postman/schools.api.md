# 🏫 School Management API Documentation

Complete API reference and testing guide for the **Schools** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/schools`
- **Authentication:** Bearer Token required for all requests (except health checks)
- **Default Headers:**
  ```http
  Authorization: Bearer {{TOKEN}}
  ```

---

## 📑 Endpoints Summary

| Method | Endpoint | Description | Content-Type | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/schools` | Create new school (with optional logo) | `multipart/form-data` or `application/json` | Yes |
| `GET` | `/api/schools` | Get all schools | None | Yes |
| `GET` | `/api/schools/token` | Get schools by authenticated user token / role | None | Yes |
| `GET` | `/api/schools/:id` | Get single school by ID | None | Yes |
| `PUT` | `/api/schools/:id` | Update school details & logo | `multipart/form-data` or `application/json` | Yes |
| `DELETE` | `/api/schools/:id` | Delete school and permanently delete stored logo | None | Yes |

---

## 1. ➕ Create School

Creates a new school. School code (e.g. `SCH-0001`) is **automatically generated** by the backend. If a logo file is provided, it is uploaded and saved to `uploads/schools/logos/`.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/schools`
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`
- **Body Type:** `multipart/form-data` (or `application/json` if not uploading a file)

### Form-Data Fields

| Field Name | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `name` | Text | **Yes** | School name | `Springfield International School` |
| `logo` | File | No | School logo image (`jpg`, `jpeg`, `png`, `webp` max 2MB) | `logo.png` |
| `email` | Text | No | Official school email | `contact@springfield.edu` |
| `phone` | Text | No | Contact phone number | `+91 9876543210` |
| `address_line1` | Text | No | Address line 1 | `123 Knowledge Park` |
| `address_line2` | Text | No | Address line 2 | `Near Tech Zone` |
| `city` | Text | No | City | `Chennai` |
| `district` | Text | No | District | `Chennai` |
| `state` | Text | No | State | `Tamil Nadu` |
| `country` | Text | No | Country (default: `"India"`) | `India` |
| `postal_code` | Text | No | PIN / Postal Code | `600001` |
| `website` | Text | No | Website URL (must start with `http://` or `https://`) | `https://springfield.edu` |
| `status` | Text | No | `"active"` or `"inactive"` (default: `"active"`) | `active` |

> ⚠️ **Note:** Do NOT send `code` in the request body. School codes are auto-generated.

### Sample JSON Body (without file upload)
```json
{
  "name": "Springfield International School",
  "email": "contact@springfield.edu",
  "phone": "9876543210",
  "address_line1": "123 Knowledge Park",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "country": "India",
  "postal_code": "600001",
  "website": "https://springfield.edu",
  "status": "active"
}
```

### Success Response (`200 OK` or `201 Created`)
```json
{
  "message": "School created",
  "id": 1,
  "code": "SCH-0001",
  "logo_url": "/uploads/schools/logos/1726390000000-847291048-logo.png",
  "full_logo_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
  "logo_full_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png"
}
```

---

## 2. 📋 Get All Schools

Retrieves all schools in the system ordered by ID descending.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/schools`
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`

### Success Response (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "Springfield International School",
    "code": "SCH-0001",
    "email": "contact@springfield.edu",
    "phone": "9876543210",
    "address_line1": "123 Knowledge Park",
    "address_line2": null,
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "postal_code": "600001",
    "logo_url": "/uploads/schools/logos/1726390000000-847291048-logo.png",
    "full_logo_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
    "logo_full_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
    "website": "https://springfield.edu",
    "status": "active",
    "created_at": "2026-09-15T09:00:00.000Z",
    "updated_at": "2026-09-15T09:00:00.000Z"
  }
]
```

---

## 3. 🔑 Get Schools By Token (Role-Based)

Retrieves schools according to the authenticated user's permissions:
- If user has role **`ADMIN`**: returns **all schools**.
- If user is non-admin: returns **only the school assigned to their user account** (`school_id`).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/schools/token`
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`

### Success Response (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "Springfield International School",
    "code": "SCH-0001",
    "logo_url": "/uploads/schools/logos/1726390000000-847291048-logo.png",
    "full_logo_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
    "logo_full_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
    "status": "active"
  }
]
```

---

## 4. 🔍 Get School By ID

Retrieves detailed record for a specific school.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/schools/:id`
- **URL Params:**
  - `id`: School ID (e.g. `1`)
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`

### Success Response (`200 OK`)
```json
{
  "id": 1,
  "name": "Springfield International School",
  "code": "SCH-0001",
  "email": "contact@springfield.edu",
  "phone": "9876543210",
  "address_line1": "123 Knowledge Park",
  "city": "Chennai",
  "district": "Chennai",
  "state": "Tamil Nadu",
  "country": "India",
  "postal_code": "600001",
  "logo_url": "/uploads/schools/logos/1726390000000-847291048-logo.png",
  "full_logo_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
  "logo_full_url": "http://localhost:5000/uploads/schools/logos/1726390000000-847291048-logo.png",
  "website": "https://springfield.edu",
  "status": "active"
}
```

### Error Response (`404 Not Found`)
```json
{
  "message": "School not found"
}
```

---

## 5. ✏️ Update School

Updates school information and handles logo replacement or removal:
- **Uploading a new logo file**: Old logo is permanently deleted from server storage.
- **Removing existing logo**: Pass `remove_logo: "true"` to remove the logo from DB and permanently delete the file from storage.
- **Failure rollback**: If DB query fails, newly uploaded file is deleted automatically.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/schools/:id`
- **URL Params:**
  - `id`: School ID (e.g. `1`)
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`
- **Body Type:** `multipart/form-data` or `application/json`

### Form-Data Fields

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `name` | Text | Updated school name |
| `logo` | File | (Optional) New logo file |
| `remove_logo` | Text / Boolean | Set to `"true"` to remove the logo completely |
| `email` | Text | Updated email |
| `phone` | Text | Updated phone |
| `city` | Text | Updated city |
| `status` | Text | `"active"` or `"inactive"` |

### Sample JSON Body (Update text fields only)
```json
{
  "name": "Springfield Academy of Excellence",
  "phone": "9876500000",
  "status": "active"
}
```

### Sample JSON Body (Remove logo)
```json
{
  "name": "Springfield International School",
  "remove_logo": true
}
```

### Success Response (`200 OK`)
```json
{
  "message": "School updated",
  "logo_url": "/uploads/schools/logos/1726395555555-738291039-newlogo.png",
  "full_logo_url": "http://localhost:5000/uploads/schools/logos/1726395555555-738291039-newlogo.png",
  "logo_full_url": "http://localhost:5000/uploads/schools/logos/1726395555555-738291039-newlogo.png"
}
```

---

## 6. 🗑️ Delete School

Deletes a school from the database. Upon successful database deletion, the school's logo stored on disk is **permanently deleted**.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/schools/:id`
- **URL Params:**
  - `id`: School ID (e.g. `1`)
- **Headers:**
  - `Authorization: Bearer {{TOKEN}}`

### Success Response (`200 OK`)
```json
{
  "message": "School deleted"
}
```

### Foreign Key Constraint Error (`500` / `400`)
If the school is linked to existing students, employees, classes, or attendance:
```json
{
  "success": false,
  "message": "Cannot delete or update a parent row: a foreign key constraint fails (`school_management_system`.`employees`, CONSTRAINT ...)"
}
```
*(In this case, the frontend modal gracefully alerts the user to remove or reassign associated records first).*

---

## 🛡️ Error Codes & Common Responses

| Status Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| `400 Bad Request` | Missing required field | `School name is required` or invalid email/website format |
| `401 Unauthorized` | Invalid or missing token | Missing `Bearer <token>` in `Authorization` header |
| `404 Not Found` | Entity not found | School ID does not exist in the database |
| `409 Conflict` | Unique conflict | Auto-generated code collision or duplicate entry |
| `500 Internal Server Error` | Database or Server error | Foreign key constraint or unhandled exception |
