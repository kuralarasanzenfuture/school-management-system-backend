# 🎓 Student Admissions API Documentation

Complete API reference and testing guide for the **Student Admissions** module (`014_student_admissions.sql`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/student-admissions`
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
| `POST` | `/api/student-admissions` | Create a new student admission (enforces **1 admission per student per academic year**) | Body: `student_id`, `academic_year_id`, `class_id`, `subject_group_id`, etc. |
| `GET` | `/api/student-admissions` | Get all admissions with filters | Query: `?student_id=1&class_id=1&academic_year_id=1` |
| `GET` | `/api/student-admissions/token` | Get admissions filtered by user's assigned school with optional filters | Query: `?class_id=1&academic_year_id=1&status=active&section=A` |
| `GET` | `/api/student-admissions/token/class-summary`| Class & section student summary count by token | Query: `?academic_year_id=1&include_students=true` |
| `GET` | `/api/student-admissions/report` | Comprehensive admission report with date/status filters | Query: `?school_id=1&status=active&from_date=2026-01-01` |
| `GET` | `/api/student-admissions/:id` | Get single admission record by ID | Param: `id` |
| `PUT` | `/api/student-admissions/:id` | Update admission details | Param: `id`, Body: updates |
| `DELETE` | `/api/student-admissions/:id` | Delete admission record and its section allocations | Param: `id` |

---

## 1. ➕ Create Student Admission

Admits an existing student into an academic year and class. Automatically enforces the constraint that **only one admission is permitted per student per academic year**.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/student-admissions`
- **Body (Standard):**
```json
{
  "student_id": 1,
  "academic_year_id": 1,
  "class_id": 1,
  "subject_group_id": 1,
  "subject_group": "Science",
  "joining_date": "2026-06-01",
  "admission_date": "2026-06-01",
  "transport_required": true,
  "hostel_required": false,
  "admission_type": "new",
  "status": "active"
}
```

> **Smart Synchronization:**
> - If `subject_group_id` is supplied, the backend validates it and automatically fills `subject_group` with the group name.
> - If only `subject_group` (name) is supplied, the backend looks up `subject_groups` in the school to automatically resolve and link `subject_group_id`.

- **Body (With Optional Initial Section Allocation):**
```json
{
  "student_id": 1,
  "academic_year_id": 1,
  "class_id": 1,
  "class_section_id": 1,
  "roll_no": "101",
  "subject_group_id": 1,
  "joining_date": "2026-06-01",
  "transport_required": true,
  "hostel_required": false,
  "admission_type": "new"
}
```

### Response (`201 Created`)
```json
{
  "message": "Student admitted successfully",
  "data": {
    "id": 1,
    "school_id": 1,
    "student_id": 1,
    "admission_number": "ADM-20262027-0001",
    "admission_date": "2026-06-01",
    "academic_year_id": 1,
    "class_id": 1,
    "joining_date": "2026-06-01",
    "subject_group_id": 1,
    "transport_required": 1,
    "hostel_required": 0,
    "admission_type": "new",
    "status": "active",
    "class_name": "Grade 10",
    "academic_year": "2026-2027",
    "student_name": "Aarav Kumar",
    "section_allocation": {
      "id": 1,
      "class_section_id": 1,
      "section_name": "A",
      "roll_no": "101",
      "allocation_date": "2026-06-01",
      "effective_to": null,
      "status": "active"
    }
  }
}
```

---

## 2. 🛡️ Validation & Duplicate Admission Rules

### One Admission per Student per Academic Year (`409 Conflict`)
When an admission already exists for the given student and academic year:
```json
{
  "message": "Student 'Aarav Kumar' is already admitted for academic year '2026-2027' (Admission No: ADM-20262027-0001). Only one admission per student per academic year is permitted."
}
```

### Required Field Missing (`400 Bad Request`)
- **Missing `student_id`:**
  ```json
  { "message": "student_id is required and must be a valid positive number" }
  ```
- **Missing `academic_year_id`:**
  ```json
  { "message": "academic_year_id is required and must be a valid positive number" }
  ```
- **Missing `class_id`:**
  ```json
  { "message": "class_id is required and must be a valid positive number" }
  ```

### Non-Existent IDs (`404 Not Found`)
- **Student not found:**
  ```json
  { "message": "Student with ID 999 not found" }
  ```
- **Academic year not found:**
  ```json
  { "message": "Academic year with ID 999 not found" }
  ```
- **Class not found:**
  ```json
  { "message": "Class with ID 999 not found" }
  ```

---

## 3. 📋 Get All Admissions (With Filters)

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-admissions?academic_year_id=1&class_id=1`

---

## 4. 📊 Get Class Student Summary By Token

Provides student count aggregated per class and section, with optional student list.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-admissions/token/class-summary?include_students=true`

---

## 5. 📈 Get Admissions Report

Generates detailed admission reports with flexible filters (`from_date`, `to_date`, `status`, `class_id`).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-admissions/report?status=active`

---

## 6. ✏️ Update Admission

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/student-admissions/:id`
- **Body:**
```json
{
  "transport_required": false,
  "hostel_required": true,
  "status": "active"
}
```

---

## 7. 🗑️ Delete Admission

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/student-admissions/:id`
