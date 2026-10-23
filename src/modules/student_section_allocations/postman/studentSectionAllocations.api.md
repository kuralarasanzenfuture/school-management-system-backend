# 🏫 Student Section Allocations API Documentation

Complete API reference and testing guide for the **Student Section Allocations** module (`014_student_section_allocations.sql`).

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/student-section-allocations`
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
| `POST` | `/api/student-section-allocations` | Create section allocation or transfer student (auto-handles `effective_to` on previous active section) | Body: `admission_id` (or `student_id`), `class_section_id`, `roll_no`, `allocation_date` |
| `GET` | `/api/student-section-allocations` | Get section allocations with flexible filters (Admin: all schools or `?school_id=`; User: assigned school only) | Query: `?active_only=true&class_section_id=1&school_id=1` |
| `GET` | `/api/student-section-allocations/token` | **Token-based:** Get section allocations (Admin: all schools or optional filter; User: assigned school only) | Query: `?class_section_id=1&status=active&search=Aarav` |
| `GET` | `/api/student-section-allocations/check-allocation` | Check if student has an existing active allocation | Query: `?admission_id=1` or `?student_id=1` |
| `GET` | `/api/student-section-allocations/check-allocation/token` | **Token-based:** Check if student has active allocation in caller's school | Query: `?admission_id=1` or `?student_id=1` |
| `GET` | `/api/student-section-allocations/:id` | Get single section allocation by ID (enforces school access) | Param: `id` |
| `PUT` | `/api/student-section-allocations/:id` | Update allocation details (`roll_no`, `effective_to`, `status`, `remarks`) | Param: `id`, Body: updates |
| `DELETE` | `/api/student-section-allocations/:id` | Delete allocation record | Param: `id` |

---

## 1. ➕ Create Initial Section Allocation

Assigns a student to a section under their current admission.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/student-section-allocations`
- **Body:**
```json
{
  "admission_id": 1,
  "class_section_id": 1,
  "roll_no": "101",
  "allocation_date": "2026-06-01",
  "remarks": "Initial section allocation"
}
```

### Response (`201 Created`)
```json
{
  "message": "Student section allocated successfully.",
  "data": {
    "id": 1,
    "admission_id": 1,
    "class_section_id": 1,
    "roll_no": "101",
    "allocation_date": "2026-06-01",
    "effective_to": null,
    "status": "active",
    "remarks": "Initial section allocation",
    "first_name": "Aarav",
    "last_name": "Kumar",
    "class_name": "Grade 10",
    "section_name": "A",
    "academic_year_name": "2026-2027"
  },
  "closed_previous_allocations": []
}
```

---

## 2. 🔄 Section Transfer (Auto-Handling `effective_to`)

When allocating the student to a new section, the backend **automatically closes out** the previous active section allocation by setting `effective_to` to the new `allocation_date` and marking status as `'transferred'`.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/student-section-allocations`
- **Body:**
```json
{
  "admission_id": 1,
  "class_section_id": 2,
  "roll_no": "205",
  "allocation_date": "2026-10-22",
  "remarks": "Transferred to Section B"
}
```

### Response (`201 Created`)
```json
{
  "message": "Student successfully transferred to new section; previous section allocation closed with effective_to date.",
  "data": {
    "id": 2,
    "admission_id": 1,
    "class_section_id": 2,
    "roll_no": "205",
    "allocation_date": "2026-10-22",
    "effective_to": null,
    "status": "active",
    "remarks": "Transferred to Section B",
    "first_name": "Aarav",
    "last_name": "Kumar",
    "class_name": "Grade 10",
    "section_name": "B",
    "academic_year_name": "2026-2027"
  },
  "closed_previous_allocations": [
    {
      "id": 1,
      "previous_class_section_id": 1,
      "auto_effective_to": "2026-10-22",
      "previous_status": "active",
      "new_status": "transferred"
    }
  ]
}
```

---

## 3. 🛡️ Validation & Error Responses

### Missing IDs
- **Missing `admission_id` and `student_id`:**
  ```json
  { "message": "admission_id (or student_id) is required" } // 400 Bad Request
  ```
- **Missing `class_section_id`:**
  ```json
  { "message": "class_section_id is required and must be a valid positive number" } // 400 Bad Request
  ```

### Non-Existent IDs
- **Admission not found:**
  ```json
  { "message": "Student admission with ID 999 not found" } // 404 Not Found
  ```
- **Class section not found:**
  ```json
  { "message": "Class section with ID 999 not found" } // 404 Not Found
  ```

### Mismatched Class or School
- **Class mismatch:**
  ```json
  { "message": "Class section class 'Grade 9' (Class ID: 3) does not match student admission class (Class ID: 1)" } // 400 Bad Request
  ```

### Duplicate Active Allocation in Same Section
- **Already allocated:**
  ```json
  { "message": "Student 'Aarav Kumar' is already actively allocated to section 'A' in class 'Grade 10'." } // 409 Conflict
  ```

---

## 4. 📋 Get All Section Allocations (With Filters)

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations?active_only=true&class_section_id=2`

### Query Filters:
- `active_only`: `true` (filters records where `status = 'active'` and `effective_to IS NULL OR effective_to >= CURRENT_DATE`)
- `admission_id`: Filter by admission ID
- `student_id`: Filter by student ID
- `class_section_id`: Filter by class section mapping ID
- `class_id`: Filter by class ID
- `section_id`: Filter by section ID
- `academic_year_id`: Filter by academic year ID
- `school_id`: Filter by school ID (admin only; non-admin is restricted to assigned school)
- `status`: `active`, `transferred`, `completed`, `cancelled`
- `search`: Search across student first/last name, student code, admission number, roll number

---

## 4b. 🎟️ Get Section Allocations By Token (Role & School Scoped)

Fetches allocations using caller's JWT token credentials.

- **Admin Role:** Has access to allocations across **all schools**. Can optionally supply `?school_id=X` to filter a specific school.
- **Regular User/Staff:** Restricted **strictly to their assigned school**. Querying other school IDs is prohibited.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/token?active_only=true&class_section_id=2`

---

## 4c. 🔎 Check Existing Active Allocation

Check if a student or admission already has an active allocation before attempting to allocate.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/check-allocation?admission_id=1`
- **Token-based URL:** `{{BASE_URL}}/api/student-section-allocations/check-allocation/token?admission_id=1`

### Response
```json
{
  "exists": true,
  "isAllocated": true,
  "allocation": {
    "id": 1,
    "admission_id": 1,
    "class_section_id": 1,
    "roll_no": "101",
    "status": "active",
    "first_name": "Aarav",
    "last_name": "Kumar",
    "class_name": "Grade 10",
    "section_name": "A",
    "school_id": 1
  },
  "message": "Student 'Aarav Kumar' is currently allocated to section 'A' in class 'Grade 10'"
}
```

## 5. 🔍 Get Section Allocation By ID

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/:id`

---

## 6. ✏️ Update Section Allocation

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/:id`
- **Body:**
```json
{
  "roll_no": "115",
  "effective_to": "2026-12-31",
  "status": "completed",
  "remarks": "End of semester allocation"
}
```

> **Note:** `effective_to` must be `>= allocation_date` (enforced by DB check constraint `chk_section_allocation_dates`).

---

## 7. 🗑️ Delete Section Allocation

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/:id`
