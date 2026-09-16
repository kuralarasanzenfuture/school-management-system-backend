# Employee Attendance API Documentation

Comprehensive API documentation for the **Employee Attendance Module** in the School Management System. This module provides manual attendance tracking, self-service check-in and check-out, shifts & grace-period calculation for late arrivals, overtime computation, monthly summary metrics, and date range filters.

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}` (e.g., `http://localhost:5000`)
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{TOKEN}}` (JWT access token required for all endpoints)

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employee-attendance/manual` | Mark manual attendance (with shift, late & overtime calculations) | Bearer Token |
| `POST` | `/api/employee-attendance/check-in` | Self-service check-in for authenticated employee | Bearer Token |
| `POST` | `/api/employee-attendance/check-out` | Self-service check-out for authenticated employee | Bearer Token |
| `GET` | `/api/employee-attendance/today` | Get today's attendance for the authenticated employee | Bearer Token |
| `GET` | `/api/employee-attendance` | Get all attendance records (with filters: `status`, `school_id`) | Bearer Token |
| `GET` | `/api/employee-attendance/token` | Get attendance records auto-scoped to token user's school | Bearer Token |
| `GET` | `/api/employee-attendance/employee/:employee_id` | Get attendance history & aggregated monthly summary metrics | Bearer Token |
| `GET` | `/api/employee-attendance/range` | Get attendance records within date range (`start_date`, `end_date`) | Bearer Token |
| `GET` | `/api/employee-attendance/:id` | Get attendance entry by ID | Bearer Token |
| `PUT` | `/api/employee-attendance/:id` | Update attendance entry by ID | Bearer Token |
| `DELETE` | `/api/employee-attendance/:id` | Delete attendance entry by ID | Bearer Token |

---

## Business Logic & Rules

1. **Allowed Statuses**:
   - `present`, `absent`, `late`, `half_day`, `leave`, `holiday`, `week_off`.
2. **Time Restrictions by Status**:
   - Non-working statuses (`absent`, `holiday`, `week_off`, `leave`) must NOT have `check_in` or `check_out` times. Providing timestamps for these triggers a `400 Bad Request`.
3. **Cross-Midnight Support**:
   - If `check_out` time is earlier than `check_in` (e.g., night shift ending the next morning), the system automatically offsets the date by +1 day.
4. **Shift & Grace Period Integration**:
   - When a valid `shift_id` is supplied:
     - Shift must belong to the same school as the employee.
     - If `check_in > shift.start_time + shift.grace_minutes`, the late difference in minutes is recorded in `late_minutes`.
     - If `total_work_minutes > shift.working_hours * 60`, excess minutes are recorded in `overtime_minutes`.
5. **Duplicate Prevention**:
   - Only one attendance entry per employee per date is permitted. Attempting to mark duplicate attendance returns `409 Conflict`.
6. **Self-Service Check-In / Check-Out**:
   - Uses `req.user.id` to look up the employee.
   - Prevents duplicate check-in on the same day.
   - Requires an active check-in prior to checking out.

---

## API Details

### 1. Mark Manual Attendance

Records attendance for an employee on a specified date with optional shift calculation.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employee-attendance/manual`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{TOKEN}}`

#### Request Body (Present with Timings & Shift)
```json
{
  "employee_id": 1,
  "attendance_date": "2026-09-16",
  "status": "present",
  "shift_id": 1,
  "check_in": "2026-09-16 08:50:00",
  "check_out": "2026-09-16 17:10:00",
  "remarks": "Regular full-day duty on time"
}
```

#### Request Body (Leave / Absent without Timings)
```json
{
  "employee_id": 2,
  "attendance_date": "2026-09-16",
  "status": "leave",
  "shift_id": null,
  "check_in": null,
  "check_out": null,
  "remarks": "Casual leave approved by principal"
}
```

#### Field Specifications

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `employee_id` | `Number` | Yes | Target employee ID |
| `attendance_date` | `String (YYYY-MM-DD)` | Yes | Attendance date |
| `status` | `String` | Yes | `present`, `absent`, `late`, `half_day`, `leave`, `holiday`, `week_off` |
| `shift_id` | `Number` / `null` | No | ID of assigned employee shift |
| `check_in` | `String (YYYY-MM-DD HH:mm:ss)` / `null` | Conditional | Check-in timestamp |
| `check_out` | `String (YYYY-MM-DD HH:mm:ss)` / `null` | Conditional | Check-out timestamp |
| `remarks` | `String` / `null` | No | Supervisor or system remarks |

#### Success Response (`201 Created`)
```json
{
  "message": "Attendance marked successfully",
  "id": 105
}
```

---

### 2. Employee Self Check-In

Allows staff members to log check-in for the current date.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employee-attendance/check-in`
- **Request Body**: `{}`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Check-in successful",
    "check_in": "2026-09-16T03:30:00.000Z"
  }
}
```

---

### 3. Employee Self Check-Out

Allows staff members to punch out for the current day. Automatically calculates `total_work_minutes`.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employee-attendance/check-out`
- **Request Body**: `{}`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Check-out successful",
    "total_work_minutes": 510
  }
}
```

---

### 4. Get Today Attendance for Authenticated Employee

Fetches the current day's attendance status for the logged-in employee.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-attendance/today`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 105,
    "attendance_date": "2026-09-16T00:00:00.000Z",
    "status": "present",
    "check_in": "2026-09-16T03:20:00.000Z",
    "check_out": "2026-09-16T11:50:00.000Z",
    "total_work_minutes": 510,
    "overtime_minutes": 30,
    "late_minutes": 0,
    "remarks": "Regular full-day duty on time"
  }
}
```

---

### 5. Get All Attendance Records

Lists all attendance records across the system with joined employee and shift information.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-attendance`
- **Query Parameters**:
  - `status` (optional): Filter by attendance status.
  - `school_id` (optional): Filter by school ID.

#### Success Response (`200 OK`)
```json
[
  {
    "id": 105,
    "school_id": 1,
    "employee_id": 1,
    "attendance_date": "2026-09-16T00:00:00.000Z",
    "status": "present",
    "shift_id": 1,
    "check_in": "2026-09-16T03:20:00.000Z",
    "check_out": "2026-09-16T11:50:00.000Z",
    "total_work_minutes": 510,
    "overtime_minutes": 30,
    "late_minutes": 0,
    "remarks": "Regular full-day duty on time",
    "first_name": "Arun",
    "last_name": "Kumar",
    "photo_url": "uploads/staff/arun.png",
    "employee_mobile": "9876543210",
    "shift_name": "Morning Shift",
    "school_name": "Greenwood International"
  }
]
```

---

### 6. Get Attendance by Token (School Scoped)

Fetches attendance scoped automatically to the authenticated user's assigned `school_id`.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-attendance/token`
- **Query Parameters**:
  - `status` (optional): Filter by status.

---

### 7. Get Attendance by Employee (Summary & Logs)

Returns detailed attendance records for a specific employee alongside aggregated monthly/yearly summary metrics.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-attendance/employee/:employee_id`
- **Path Parameters**:
  - `employee_id`: Target employee ID.
- **Query Parameters**:
  - `month` (optional, 1-12): Calendar month.
  - `year` (optional): Four-digit year (e.g., `2026`).
  - `from_date` (optional): `YYYY-MM-DD`.
  - `to_date` (optional): `YYYY-MM-DD`.
  - `status` (optional): Filter by status.
  - `shift_id` (optional): Filter by shift ID.
  - `late_only` (optional): `true` to view only late entries.
  - `overtime_only` (optional): `true` to view only overtime entries.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "filters": {
      "employee_id": 1,
      "month": "9",
      "year": "2026",
      "from_date": null,
      "to_date": null,
      "status": null,
      "shift_id": null,
      "marked_by": null,
      "late_only": false,
      "overtime_only": false
    },
    "summary": {
      "total_records": 12,
      "present_days": 10,
      "absent_days": 1,
      "late_days": 1,
      "half_days": 0,
      "leave_days": 1,
      "holiday_days": 0,
      "week_off_days": 0,
      "total_work_minutes": 5100,
      "total_overtime_minutes": 120,
      "total_late_minutes": 25,
      "total_work_hours": "85.00",
      "total_overtime_hours": "2.00",
      "first_attendance": "2026-09-01T00:00:00.000Z",
      "last_attendance": "2026-09-16T00:00:00.000Z"
    },
    "logs": [
      {
        "id": 105,
        "school_id": 1,
        "employee_id": 1,
        "attendance_date": "2026-09-16T00:00:00.000Z",
        "status": "present",
        "shift_id": 1,
        "check_in": "2026-09-16T03:20:00.000Z",
        "check_out": "2026-09-16T11:50:00.000Z",
        "total_work_minutes": 510,
        "overtime_minutes": 30,
        "late_minutes": 0,
        "remarks": "Regular full-day duty on time"
      }
    ]
  }
}
```

---

### 8. Get Attendance by Date Range

Fetches records between two dates.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-attendance/range`
- **Query Parameters**:
  - `start_date` (required, `YYYY-MM-DD`): Beginning of range.
  - `end_date` (required, `YYYY-MM-DD`): End of range.
  - `employee_id` (optional): Filter for a specific employee.

---

### 9. Get Attendance by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-attendance/:id`
- **Path Parameters**:
  - `id`: Attendance record primary key.

---

### 10. Update Attendance by ID

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employee-attendance/:id`
- **Request Body**:
```json
{
  "status": "present",
  "check_in": "2026-09-16 09:00:00",
  "check_out": "2026-09-16 17:00:00",
  "remarks": "Adjusted after supervisor approval"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "Attendance updated successfully"
}
```

---

### 11. Delete Attendance by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employee-attendance/:id`
- **Success Response (`200 OK`)**:
```json
{
  "message": "Attendance deleted successfully"
}
```

---

## Error Responses

### 1. Duplicate Attendance (`409 Conflict`)
```json
{
  "message": "Attendance already marked"
}
```

### 2. Time Not Allowed for Status (`400 Bad Request`)
```json
{
  "message": "Time not allowed for this status"
}
```

### 3. Already Checked In / Not Checked In (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Already checked in today"
}
```
*or*
```json
{
  "success": false,
  "message": "No check-in found for today"
}
```

### 4. Shift School Mismatch (`400 Bad Request`)
```json
{
  "message": "Shift does not belong to employee school"
}
```

### 5. Record Not Found (`404 Not Found`)
```json
{
  "message": "Attendance not found"
}
```

### 6. Unauthorized (`401 Unauthorized`)
```json
{
  "message": "Authorization header missing"
}
```
