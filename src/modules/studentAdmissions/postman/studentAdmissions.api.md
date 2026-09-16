# 🎓 Student Admissions API Documentation

Complete API reference and testing guide for the **Student Admissions** module.

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
| `POST` | `/api/student-admissions` | Create a new student admission | Body: student, academic year, class details |
| `GET` | `/api/student-admissions` | Get all admissions with filters | Query: `?student_id=1&class_id=1&academic_year_id=1` |
| `GET` | `/api/student-admissions/token` | Get admissions filtered by user's assigned school | None |
| `GET` | `/api/student-admissions/token/class-summary`| Class-wise student summary count by token | Query: `?academic_year_id=1` |
| `GET` | `/api/student-admissions/report` | Comprehensive admission report with date/status filters | Query: `?school_id=1&status=active&from_date=2026-01-01` |
| `GET` | `/api/student-admissions/:id` | Get single admission record by ID | Param: `id` |
| `PUT` | `/api/student-admissions/:id` | Update admission details (section, transport, etc.) | Param: `id`, Body: updates |
| `DELETE` | `/api/student-admissions/:id` | Delete admission record | Param: `id` |

---

## 1. ➕ Create Student Admission

Admits an existing student into an academic year and class.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/student-admissions`
- **Body:**
```json
{
  "student_id": 1,
  "academic_year_id": 1,
  "class_id": 1,
  "section": "A",
  "joining_date": "2026-06-01",
  "subject_group": "Science",
  "transport_required": true,
  "hostel_required": false,
  "admission_type": "new"
}
```

### Response (`201 Created`)
```json
{
  "message": "Student admitted successfully",
  "id": 1
}
```

---

## 2. 📋 Get All Admissions (With Filters)

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-admissions?academic_year_id=1&class_id=1`

### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "student_id": 1,
    "student_code": "STD-2026-0001",
    "first_name": "Aarav",
    "last_name": "Kumar",
    "class_name": "Grade 10",
    "section": "A",
    "status": "active"
  }
]
```

---

## 3. 📊 Get Class Student Summary By Token

Provides student count aggregated per class.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-admissions/token/class-summary`

---

## 4. 📈 Get Admissions Report

Generates detailed admission reports with flexible filters (`from_date`, `to_date`, `status`, `class_id`).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-admissions/report?status=active`

---

## 5. ✏️ Update Admission

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/student-admissions/:id`
- **Body:**
```json
{
  "section": "B",
  "transport_required": false,
  "status": "active"
}
```

---

## 6. 🗑️ Delete Admission

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/student-admissions/:id`
