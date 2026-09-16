# 🎓 Students Management API Documentation

Complete API reference and testing guide for the **Students** module.

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
| 1 | `POST` | `/api/students` | Create student (JSON or form-data) | `application/json` or `multipart/form-data` |
| 2 | `GET` | `/api/students` | Get all students | `None` |
| 3 | `GET` | `/api/students/token` | Get students filtered by user's assigned school | `None` (Bearer Token) |
| 4 | `GET` | `/api/students/:id` | Get student details by ID | Param: `id` |
| 5 | `PUT` | `/api/students/:id` | Update student profile and/or documents | Param: `id`, JSON or `multipart/form-data` |
| 6 | `DELETE` | `/api/students/:id` | Delete student and associated uploaded files | Param: `id` |

---

## 1. ➕ Create Student (JSON)

Creates a new student record without file uploads. Auto-generates `student_code` (e.g. `STD-2026-0001`).

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
  "student_code": "STD-2026-0001"
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

Retrieves all students across the system (primarily for super-admins).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
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
    "photo_url": "/uploads/students/photos/1726462800000-photo.jpg",
    "current_city": "Chennai",
    "status": "active"
  }
]
```

---

## 4. 🏫 Get Students By Token (School Scoped)

Fetches students restricted to the school assigned to the logged-in user's JWT token (or all students if user has `ADMIN` role).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students/token`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "school_id": 1,
    "student_code": "STD-2026-0001",
    "first_name": "Aarav",
    "last_name": "Sharma",
    "email": "aarav.sharma@example.com",
    "mobile_no": "9876543210",
    "gender": "male",
    "status": "active"
  }
]
```

---

## 5. 🔍 Get Student By ID

Fetches full profile, guardian information, address details, and document URLs for a single student.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students/:id`

### Response (`200 OK`)
```json
{
  "id": 1,
  "school_id": 1,
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
  "current_area": "Anna Nagar",
  "current_city": "Chennai",
  "current_district": "Chennai",
  "current_state": "Tamil Nadu",
  "current_postal_code": "600040",
  "permanent_address": "123 Anna Nagar",
  "father_name": "Ramesh Sharma",
  "mother_name": "Priya Sharma",
  "father_occupation": "Engineer",
  "mother_occupation": "Teacher",
  "parent_mobile": "9876543211",
  "parent_email": "ramesh.sharma@example.com",
  "emergency_contact": "9876543212",
  "emergency_relationship": "UNCLE",
  "photo_url": "/uploads/students/photos/1726462800000-photo.jpg",
  "status": "active"
}
```

---

## 6. ✏️ Update Student

Updates any student profile details. Also supports uploading replacement files (old files on disk will be cleanly removed).

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
  "message": "Student updated successfully"
}
```

---

## 7. 🗑️ Delete Student

Deletes the student record and cleans up all uploaded physical files from the filesystem.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/students/:id`

### Response (`200 OK`)
```json
{
  "message": "Student deleted successfully"
}
```
