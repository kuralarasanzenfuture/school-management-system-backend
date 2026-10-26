# 🏫 Student Section Allocations API Documentation

Complete API reference and testing guide for the **Student Section Allocations** module (`studentSectionAllocation.routes.js`).

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

| Method | Endpoint | Description | Request Query / Params / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/student-section-allocations` | Create initial section allocation or transfer student | Body: `admission_id` or `student_id`, `class_section_id`, `roll_no`, `allocation_date`, `remarks` |
| `POST` | `/api/student-section-allocations/bulk` | Bulk create / transfer multiple student section allocations | Body: `allocations` array, `class_id`, `academic_year_id`, `school_id`, `default_class_section_id` |
| `GET` | `/api/student-section-allocations` | Get all section allocations (Admin: all schools or `?school_id=`; User: assigned school only) | Query: `?active_only=true&class_section_id=1&school_id=1&search=` |
| `GET` | `/api/student-section-allocations/token` | **Token-based:** Get section allocations strictly scoped to logged-in user's school | Query: `?active_only=true&class_section_id=1&status=active` |
| `GET` | `/api/student-section-allocations/class-students` | Get students admitted to a class for allocation assignment | Query: `?class_id=1&academic_year_id=1&status=unallocated` |
| `GET` | `/api/student-section-allocations/history` | Get complete allocation transfer history for a student | Query: `?admission_id=1` or `?student_id=1` |
| `GET` | `/api/student-section-allocations/history/:admissionId` | Get complete allocation transfer history by admission ID route param | Param: `admissionId` |
| `GET` | `/api/student-section-allocations/check-allocation` | Check if student has an existing active allocation (Non-token) | Query: `?admission_id=1` or `?student_id=1` |
| `GET` | `/api/student-section-allocations/check-allocation/token` | **Token-based:** Check if student has active allocation in caller's school | Query: `?admission_id=1` or `?student_id=1` |
| `GET` | `/api/student-section-allocations/:id` | Get single section allocation details by ID | Param: `id` |
| `PUT` | `/api/student-section-allocations/:id` | Update allocation details (`roll_no`, `effective_to`, `status`, `remarks`) | Param: `id`, Body: update fields |
| `DELETE` | `/api/student-section-allocations/:id` | Delete allocation record with audit logging | Param: `id` |

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

When allocating a student to a new section, the backend **automatically closes out** the previous active section allocation by setting `effective_to` to the new `allocation_date` and setting status to `'transferred'`.

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
    "remarks": "Transferred to Section B"
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

## 3. 📦 Bulk Create / Transfer Section Allocations

Assigns or updates sections for multiple students in a single transaction.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/bulk`
- **Body:**
```json
{
  "class_id": 1,
  "academic_year_id": 1,
  "school_id": 1,
  "default_class_section_id": 1,
  "allocation_date": "2026-06-01",
  "status": "active",
  "remarks": "Bulk class allocation batch",
  "allocations": [
    {
      "admission_id": 1,
      "student_id": 1,
      "class_section_id": 1,
      "roll_no": "101",
      "allocation_date": "2026-06-01",
      "remarks": "Initial allocation"
    },
    {
      "admission_id": 2,
      "student_id": 2,
      "class_section_id": 1,
      "roll_no": "102",
      "allocation_date": "2026-06-01",
      "remarks": "Initial allocation"
    }
  ]
}
```

### Response (`200 OK`)
```json
{
  "message": "Bulk allocation completed: 2 newly allocated, 0 transferred, 0 updated.",
  "total": 2,
  "allocated_count": 2,
  "transferred_count": 0,
  "updated_count": 0,
  "data": [
    {
      "admission_id": 1,
      "allocation_id": 1,
      "class_section_id": 1,
      "roll_no": "101",
      "action": "allocated"
    },
    {
      "admission_id": 2,
      "allocation_id": 2,
      "class_section_id": 1,
      "roll_no": "102",
      "action": "allocated"
    }
  ]
}
```

---

## 4. 📋 Get All Section Allocations (With Filters)

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations?active_only=true&class_section_id=1`

### Supported Query Filters:
- `active_only`: `true` | `false` (filters where status = 'active' and effective_to is current/null)
- `admission_id`: Number
- `student_id`: Number
- `class_section_id`: Number
- `class_id`: Number
- `section_id`: Number
- `academic_year_id`: Number
- `school_id`: Number (admin only)
- `status`: `active` | `transferred` | `completed` | `cancelled`
- `roll_no`: String
- `gender`: `male` | `female` | `other`
- `allocation_date`: `YYYY-MM-DD`
- `search`: Search student names, code, admission number, roll number

---

## 5. 🎟️ Get All Section Allocations By Token

Fetches allocations scoped to caller's school context. Non-admins cannot view other schools' data.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/token?active_only=true`

---

## 6. 🧑‍🎓 Get Class Students For Allocation

Retrieves all admitted students in a class with their current allocation status. Useful for frontend drag-and-drop or bulk assignment tables.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/class-students?class_id=1&academic_year_id=1&status=unallocated`

### Query Filters:
- `class_id`: Class ID or name
- `academic_year_id`: Academic year ID or name
- `section_id`: Filter by current section
- `status`:
  - `unallocated`: Only students who do NOT have an active section allocation
  - `allocated`: Students who currently have an active section
  - Omitted: All admitted students in that class
- `search`: Search by student name, code, admission number

---

## 7. 📜 Get Section Allocation History

Returns the chronological timeline of sections assigned to a student (sorted date descending).

- **Via Query Parameter:**
  - **Method:** `GET`
  - **URL:** `{{BASE_URL}}/api/student-section-allocations/history?admission_id=1`
  - **Alternative Query:** `{{BASE_URL}}/api/student-section-allocations/history?student_id=1`
- **Via Route Parameter:**
  - **Method:** `GET`
  - **URL:** `{{BASE_URL}}/api/student-section-allocations/history/:admissionId` (e.g. `/history/1`)

### Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 2,
      "admission_id": 1,
      "class_section_id": 2,
      "section_name": "B",
      "roll_no": "205",
      "allocation_date": "2026-10-22",
      "effective_to": null,
      "status": "active"
    },
    {
      "id": 1,
      "admission_id": 1,
      "class_section_id": 1,
      "section_name": "A",
      "roll_no": "101",
      "allocation_date": "2026-06-01",
      "effective_to": "2026-10-22",
      "status": "transferred"
    }
  ]
}
```

---

## 8. 🔎 Check Existing Active Allocation

Check whether a student already has an active section before saving.

- **Non-Token:**
  - **Method:** `GET`
  - **URL:** `{{BASE_URL}}/api/student-section-allocations/check-allocation?admission_id=1&active_only=true`
- **Token-Based:**
  - **Method:** `GET`
  - **URL:** `{{BASE_URL}}/api/student-section-allocations/check-allocation/token?admission_id=1`

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

---

## 9. 🔍 Get Section Allocation By ID

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/:id`

---

## 10. ✏️ Update Section Allocation

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/:id`
- **Body:**
```json
{
  "roll_no": "110",
  "effective_to": "2026-12-31",
  "status": "active",
  "remarks": "Updated roll number and remarks"
}
```

---

## 11. 🗑️ Delete Section Allocation

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/student-section-allocations/:id`

### Response (`200 OK`)
```json
{
  "message": "Section allocation deleted successfully",
  "old_data": {
    "id": 1,
    "admission_id": 1,
    "class_section_id": 1,
    "school_id": 1
  }
}
```
