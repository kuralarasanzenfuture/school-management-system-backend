# 🎓 Students Management API Documentation

Complete API reference and testing guide for the **Students** module (`/api/students`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/students`
- **Authentication:** Bearer Token required (`Authorization: Bearer {{TOKEN}}`)
- **Default Headers:**
  ```http
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  ```

---

## 📑 Endpoints Summary

| # | Method | Endpoint | Description | Content-Type / Payload |
| :- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/students` | Create student (JSON or form-data) with audit log | `application/json` or `multipart/form-data` |
| 2 | `GET` | `/api/students` | Get all students with filters & pagination | Query: `search`, `status`, `school_id`, `gender`, `blood_group`, `student_code`, `name`, `page`, `limit` |
| 3 | `GET` | `/api/students/token` | Get students filtered by user's assigned school | Query: `search`, `status`, `gender`, `blood_group`, `page`, `limit` |
| 4 | `GET` | `/api/students/:id` | Get single student details by ID | Param: `id` |
| 5 | `PUT` | `/api/students/:id` | Update student profile and/or documents with audit log | Param: `id`, JSON or `multipart/form-data` |
| 6 | `PATCH` | `/api/students/status/:id` | Toggle student status with audit log | Param: `id`, Body: `status` |
| 7 | `DELETE` | `/api/students/:id` | Delete student with reference check & audit log | Param: `id` |

---

## 1. ➕ Create Student (JSON)

Creates a new student record without file uploads. Auto-generates `student_code` (e.g. `STD-2026-0001`) and records an audit log.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/students`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "first_name": "Aarav",
  "middle_name": "Kumar",
  "last_name": "Sharma",
  "email": "aarav.sharma@example.com",
  "mobile_no": "9876543210",
  "date_of_birth": "2010-05-15",
  "gender": "male",
  "blood_group": "O+",
  "aadhaar_no": "123456789012",
  "religion": "HINDU",
  "nationality": "INDIAN",
  "mother_tongue": "TAMIL",
  "current_address": "123 Anna Nagar",
  "current_area": "Anna Nagar",
  "current_city": "Chennai",
  "current_district": "Chennai",
  "current_state": "Tamil Nadu",
  "current_postal_code": "600040",
  "current_address_same_as_permanent": true,
  "father_name": "Ramesh Sharma",
  "mother_name": "Priya Sharma",
  "father_occupation": "Engineer",
  "mother_occupation": "Teacher",
  "parent_mobile": "9876543211",
  "parent_email": "ramesh.sharma@example.com",
  "emergency_contact": "9876543212",
  "emergency_relationship": "UNCLE",
  "status": "active"
}
```

### Validation Rules
- **Required fields:** `school_id`, `first_name`
- **Mobile numbers (`mobile_no`, `parent_mobile`, `alternate_mobile`, `emergency_contact`):** 10-digit Indian phone number starting with `6-9`.
- **Aadhaar (`aadhaar_no`):** 12-digit numeric string.
- **Gender:** `male`, `female`, `other`.
- **Status:** `active`, `graduated`, `transferred`, `dropped`.
- **Address Copy:** When `current_address_same_as_permanent: true`, permanent address fields automatically clone the current address.

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Student created successfully",
  "id": 1,
  "student_code": "STD-2026-0001",
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "student_code": "STD-2026-0001",
    "first_name": "Aarav",
    "last_name": "Sharma",
    "status": "active"
  }
}
```

---

## 2. 📁 Create Student with Documents (`multipart/form-data`)

Create a student while uploading identity documents and photos.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/students`
- **Headers:** `Content-Type: multipart/form-data`
- **Form Fields:**
  - Standard text fields (same as JSON above)
  - `photo` (File: JPG/PNG, stored in `uploads/students/photos`)
  - `aadhaar_front` (File: JPG/PNG/PDF, stored in `uploads/students/aadhaar`)
  - `aadhaar_back` (File: JPG/PNG/PDF, stored in `uploads/students/aadhaar`)
  - `birth_certificate` (File: JPG/PNG/PDF, stored in `uploads/students/certificates`)
  - `transfer_certificate` (File: JPG/PNG/PDF, stored in `uploads/students/certificates`)
  - `previous_marksheets` (File / Multiple: stored in `uploads/students/marksheets`)

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Student created successfully",
  "id": 2,
  "student_code": "STD-2026-0002"
}
```

---

## 3. 📋 Get All Students

Retrieves students with full search, filtering, sorting, and pagination.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students?search=Sharma&status=active&gender=male&page=1&limit=20`

### Query Parameters
- `search`: Search against student name, code, email, mobile, Aadhaar, or school name
- `status`: Filter by `active`, `graduated`, `transferred`, or `dropped` (supports comma-separated list)
- `school_id`: Filter by specific school ID
- `gender`: Filter by `male`, `female`, or `other`
- `blood_group`: Filter by blood group (e.g. `O+`, `A-`)
- `student_code`: Filter by student code
- `name`: Filter by student full name or partial name
- `first_name`: Filter by first name
- `last_name`: Filter by last name
- `email`: Filter by email
- `mobile_no`: Filter by student mobile number
- `aadhaar_no`: Filter by Aadhaar number
- `page`: Page number (default: `1`)
- `limit`: Records per page (default: `20`, max: `100`)
- `sortBy`: Column to sort by (`id`, `student_code`, `first_name`, `last_name`, `gender`, `status`, `date_of_birth`, `school_name`, `created_at`)
- `sortOrder`: `ASC` or `DESC` (default: `DESC`)
- `paginate`: Set `false` to fetch all matching records unpaginated

### Response Headers
- `X-Total-Count`: Total number of matching records
- `X-Page`: Current page number
- `X-Limit`: Limit per page

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "school_name": "Springfield High",
      "student_code": "STD-2026-0001",
      "first_name": "Aarav",
      "middle_name": "Kumar",
      "last_name": "Sharma",
      "email": "aarav.sharma@example.com",
      "mobile_no": "9876543210",
      "date_of_birth": "2010-05-15",
      "gender": "male",
      "blood_group": "O+",
      "status": "active",
      "created_at": "2026-10-12T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 4. 🏫 Get Students By Token (School Scoped)

Fetches students restricted to the school assigned to the logged-in user's JWT token (or across all schools if the user has `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students/token?status=active&page=1&limit=20`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "school_name": "Springfield High",
      "student_code": "STD-2026-0001",
      "first_name": "Aarav",
      "last_name": "Sharma",
      "gender": "male",
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## 5. 🔍 Get Student By ID

Fetches full profile, guardian information, address details, and document URLs for a single student.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "school_name": "Springfield High",
    "student_code": "STD-2026-0001",
    "first_name": "Aarav",
    "middle_name": "Kumar",
    "last_name": "Sharma",
    "email": "aarav.sharma@example.com",
    "mobile_no": "9876543210",
    "date_of_birth": "2010-05-15",
    "gender": "male",
    "blood_group": "O+",
    "aadhaar_no": "123456789012",
    "religion": "HINDU",
    "nationality": "INDIAN",
    "mother_tongue": "TAMIL",
    "current_address": "123 Anna Nagar",
    "current_city": "Chennai",
    "status": "active"
  }
}
```

---

## 6. ✏️ Update Student

Updates any student profile details. Also supports uploading replacement files (old files on disk are automatically deleted) and records an audit log.

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/students/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "first_name": "Aarav",
  "last_name": "Sharma",
  "mobile_no": "9876543210",
  "blood_group": "A+",
  "current_address": "456 Gandhi Road",
  "current_city": "Chennai",
  "status": "active"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "id": 1,
    "first_name": "Aarav",
    "last_name": "Sharma",
    "status": "active"
  }
}
```

---

## 7. 🔄 Update Student Status

Quick toggle for student lifecycle status (`active`, `graduated`, `transferred`, `dropped`).

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/students/status/:id`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "status": "graduated"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Student status updated to graduated",
  "data": {
    "id": 1,
    "first_name": "Aarav",
    "last_name": "Sharma",
    "status": "graduated"
  }
}
```

---

## 8. 🗑️ Delete Student

Deletes the student record and cleans up all uploaded files from the filesystem. Validates referential integrity against `student_admissions` before deletion.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/students/:id`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

### Error Response (`400 Bad Request` - Referenced)
```json
{
  "success": false,
  "message": "Cannot delete student 'Aarav Sharma' (STD-2026-0001). It is currently linked to 2 admission record(s). Please remove or reassign associated admission records first."
}
```

---

## 🔒 Audit Logging

All write operations (`POST`, `PUT`, `PATCH`, `DELETE`) automatically write to the audit log:
- **Module:** `students`
- **Entity Type:** `student`
- **Actions:** `CREATE`, `UPDATE`, `STATUS_CHANGE`, `DELETE`
- Full `old_data` and `new_data` snapshots and differences are tracked.
