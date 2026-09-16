# 📋 Student Attendance Management API Documentation

Complete API reference and testing guide for the **Student Attendance** module.

---

## 📌 Base Configuration

- **Base URL:** `http://localhost:5000/api/students-attendance`
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
| 1 | `POST` | `/api/students-attendance/mark` | Mark Daily Attendance | Body: `class_section_id`, `attendance_date`, `attendance_type`, `remarks`, `students` |
| 2 | `POST` | `/api/students-attendance/mark` | Mark Period Attendance | Body: Same as above + `period_no` |
| 3 | `GET` | `/api/students-attendance` | Get all attendance records | Query: `?date=YYYY-MM-DD&class_section_id=1&student_id=1&school_id=1` |
| 4 | `GET` | `/api/students-attendance/token` | Get attendance scoped to user's assigned school | Query: `?date=&from_date=&to_date=&class_section_id=&student_id=&status=&limit=50&offset=0` |
| 5 | `GET` | `/api/students-attendance/summary` | Get attendance count summary | Query: `?date=&from_date=&to_date=&class_section_id=&school_id=&academic_year_id=` |
| 6 | `GET` | `/api/students-attendance/date` | Get attendance by date | Query: `?date=YYYY-MM-DD&class_section_id=1` |
| 7 | `GET` | `/api/students-attendance/session/:session_id` | Get all student attendance for a session | Param: `session_id` |
| 8 | `GET` | `/api/students-attendance/student/:admission_id` | Get attendance history for student | Param: `admission_id`, Query: `?from_date=&to_date=&attendance_type=daily,period` |
| 9 | `GET` | `/api/students-attendance/:id` | Get single attendance record | Param: `id` |
| 10 | `PUT` | `/api/students-attendance/:id` | Update attendance record status / remarks | Param: `id`, Body: `status`, `remarks` |
| 11 | `PATCH` | `/api/students-attendance/session/:session_id/lock` | Lock attendance session against edits | Param: `session_id` |
| 12 | `PATCH` | `/api/students-attendance/session/:session_id/unlock` | Unlock attendance session | Param: `session_id` |
| 13 | `DELETE` | `/api/students-attendance/:id` | Delete attendance record | Param: `id` |

---

## 1. ➕ Mark Daily Attendance

Creates or updates an attendance session and bulk upserts attendance for students for a whole day.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/students-attendance/mark`
- **Body:**
```json
{
  "class_section_id": 1,
  "attendance_date": "2026-09-15",
  "attendance_type": "daily",
  "remarks": "Morning roll call",
  "students": [
    {
      "admission_id": 1,
      "status": "present",
      "remarks": "On time"
    },
    {
      "admission_id": 2,
      "status": "absent",
      "remarks": "Medical leave"
    },
    {
      "admission_id": 3,
      "status": "late",
      "remarks": "Late by 15 mins"
    }
  ]
}
```

> **Allowed Status Values:** `present`, `absent`, `late`, `half_day`, `leave`

### Response (`201 Created`)
```json
{
  "message": "Attendance saved successfully",
  "attendance_session_id": 15,
  "attendance_type": "daily",
  "period_no": null,
  "total_students": 3
}
```

---

## 2. ➕ Mark Period Attendance

Mark attendance for a specific subject or period of the day. Requires `attendance_type: "period"` and `period_no`.

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/students-attendance/mark`
- **Body:**
```json
{
  "class_section_id": 1,
  "attendance_date": "2026-09-15",
  "attendance_type": "period",
  "period_no": 1,
  "remarks": "Period 1 Mathematics",
  "students": [
    {
      "admission_id": 1,
      "status": "present",
      "remarks": "Attended"
    }
  ]
}
```

### Response (`201 Created`)
```json
{
  "message": "Attendance saved successfully",
  "attendance_session_id": 16,
  "attendance_type": "period",
  "period_no": 1,
  "total_students": 1
}
```

---

## 3. 📋 Get All Attendance Records

Retrieves attendance records with optional filters.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance?date=2026-09-15&class_section_id=1`

### Response (`200 OK`)
```json
[
  {
    "id": 101,
    "attendance_status": "present",
    "remarks": "On time",
    "session_id": 15,
    "attendance_date": "2026-09-15",
    "attendance_type": "daily",
    "period_no": null,
    "is_locked": 0,
    "class_section_id": 1,
    "class_name": "Grade 10",
    "section_name": "A",
    "student_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "admission_id": 1,
    "roll_no": "101",
    "marked_by_id": 2,
    "marked_by_name": "Sarah",
    "school_id": 1,
    "school_name": "Springfield High"
  }
]
```

---

## 4. 🏫 Get Attendance By Token (School Scoped)

Fetches attendance scoped to the logged-in user's school, with pagination and date range filters.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance/token?from_date=2026-09-01&to_date=2026-09-30&limit=50&offset=0`

### Response (`200 OK`)
```json
[
  {
    "id": 101,
    "attendance_status": "present",
    "remarks": "On time",
    "session_id": 15,
    "attendance_date": "2026-09-15",
    "period_no": null,
    "attendance_type": "daily",
    "is_locked": 0,
    "school_id": 1,
    "school_name": "Springfield High",
    "class_section_id": 1,
    "class_name": "Grade 10",
    "section_name": "A",
    "student_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "roll_no": "101",
    "marked_by_id": 2,
    "marked_by_name": "Sarah"
  }
]
```

---

## 5. 📊 Get Attendance Summary

Returns aggregated attendance statistics across filters (e.g. date, class section, school).

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance/summary?date=2026-09-15&class_section_id=1`

### Response (`200 OK`)
```json
{
  "total_records": 40,
  "total_present": 35,
  "total_absent": 3,
  "total_late": 1,
  "total_half_day": 0,
  "total_leave": 1
}
```

---

## 6. 📅 Get Attendance By Date

Retrieves all attendance sessions and student lists on a given date.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance/date?date=2026-09-15&class_section_id=1`

### Response (`200 OK`)
```json
[
  {
    "id": 101,
    "attendance_status": "present",
    "remarks": "On time",
    "attendance_date": "2026-09-15",
    "period_no": null,
    "attendance_type": "daily",
    "class_section_id": 1,
    "class_name": "Grade 10",
    "section_name": "A",
    "student_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "roll_no": "101",
    "marked_by_name": "Sarah"
  }
]
```

---

## 7. 🏷️ Get Attendance By Session ID

Fetches complete session metadata and all student records for that session.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance/session/:session_id`

### Response (`200 OK`)
```json
{
  "session": {
    "id": 15,
    "school_id": 1,
    "attendance_date": "2026-09-15",
    "class_section_id": 1,
    "is_locked": 0
  },
  "students": [
    {
      "id": 101,
      "attendance_status": "present",
      "remarks": "On time",
      "admission_id": 1,
      "roll_no": "101",
      "student_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "class_section_id": 1,
      "class_name": "Grade 10",
      "section_name": "A",
      "marked_by_name": "Sarah"
    }
  ]
}
```

---

## 8. 👤 Get Student Attendance History

Fetches attendance history for a single student grouped by daily and period records.

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance/student/:admission_id?attendance_type=daily`

### Response (`200 OK`)
```json
{
  "admission_id": 1,
  "summary": {
    "total_records": 1,
    "daily_count": 1,
    "period_count": 0
  },
  "data": {
    "daily": [
      {
        "date": "2026-09-15",
        "records": [
          {
            "attendance_id": 101,
            "status": "present",
            "remarks": "On time",
            "class_section_id": 1,
            "class_name": "Grade 10",
            "section_name": "A",
            "marked_by": "Sarah"
          }
        ]
      }
    ],
    "period": []
  }
}
```

---

## 9. 🔍 Get Single Attendance Record

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/students-attendance/:id`

### Response (`200 OK`)
```json
{
  "id": 101,
  "attendance_status": "present",
  "remarks": "On time",
  "session_id": 15,
  "attendance_date": "2026-09-15",
  "period_no": null,
  "is_locked": 0,
  "admission_id": 1,
  "roll_no": "101",
  "student_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "class_section_id": 1,
  "class_name": "Grade 10",
  "section_name": "A",
  "marked_by_id": 2,
  "marked_by_name": "Sarah",
  "school_id": 1,
  "school_name": "Springfield High"
}
```

---

## 10. ✏️ Update Attendance Record

Updates the status or remarks for a single student's attendance record (fails if session is locked).

- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/students-attendance/:id`
- **Body:**
```json
{
  "status": "present",
  "remarks": "Updated attendance status"
}
```

### Response (`200 OK`)
```json
{
  "message": "Updated"
}
```

---

## 11. 🔒 Lock Attendance Session

Freezes an attendance session so that no further edits or status updates can be made.

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/students-attendance/session/:session_id/lock`

### Response (`200 OK`)
```json
{
  "message": "Session locked successfully"
}
```

---

## 12. 🔓 Unlock Attendance Session

Unlocks a previously locked attendance session for revisions.

- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/students-attendance/session/:session_id/unlock`

### Response (`200 OK`)
```json
{
  "message": "Session unlocked successfully"
}
```

---

## 13. 🗑️ Delete Attendance Record

Deletes an individual attendance entry.

- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/students-attendance/:id`

### Response (`200 OK`)
```json
{
  "message": "Deleted successfully "
}
```
