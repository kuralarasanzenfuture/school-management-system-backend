# Employee Shift API Documentation

Comprehensive API documentation for the **Employee Shift Module** in the School Management System (`/api/employee-shifts`). This module manages employee work shifts, timings, grace minutes, and automated daily working hour calculations.

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
| `POST` | `/api/employee-shifts` | Create a new employee shift | Bearer Token |
| `GET` | `/api/employee-shifts` | Get all employee shifts across schools | Bearer Token |
| `GET` | `/api/employee-shifts/token` | Get all shifts scoped to the authenticated user's school | Bearer Token |
| `GET` | `/api/employee-shifts/:id` | Get employee shift by ID | Bearer Token |
| `PUT` | `/api/employee-shifts/:id` | Update employee shift by ID | Bearer Token |
| `DELETE` | `/api/employee-shifts/:id` | Delete employee shift by ID | Bearer Token |

---

## Business Logic & Validations

1. **Shift Timings & Automatic Working Hours**:
   - `start_time` and `end_time` are required in `HH:mm:ss` format.
   - `start_time` must be strictly less than `end_time`.
   - The system automatically calculates and stores `working_hours` in decimal hours (e.g., `08:30:00` to `16:30:00` = `8.00` hours).
2. **Grace Minutes**:
   - Optional grace duration in minutes (defaults to `10` if omitted).
   - Used by the Employee Attendance module to determine if an employee is marked late.
3. **Uniqueness**:
   - Shift names are unique per school and are automatically capitalized (e.g., `MORNING SHIFT`).
   - Duplicate names within the same school return `409 Conflict`.

---

## API Details

### 1. Create Employee Shift

Creates a shift definition with automatic calculation of working hours.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employee-shifts`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{TOKEN}}`

#### Request Body
```json
{
  "school_id": 1,
  "name": "MORNING SHIFT",
  "start_time": "08:30:00",
  "end_time": "16:30:00",
  "grace_minutes": 15,
  "status": "active"
}
```

#### Field Specifications

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `school_id` | `Number` | Yes | Target school ID |
| `name` | `String` | Yes | Shift name (auto-uppercased) |
| `start_time` | `String (HH:mm:ss)` | Yes | Shift start time |
| `end_time` | `String (HH:mm:ss)` | Yes | Shift end time (must be > start_time) |
| `grace_minutes` | `Number` | No | Grace period in minutes for late calculation (default: 10) |
| `status` | `String` | No | `"active"` or `"inactive"` (default: `"active"`) |

#### Success Response (`201 Created`)
```json
{
  "message": "Shift created",
  "id": 1
}
```

---

### 2. Get All Shifts

Lists all employee shifts across the database.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-shifts`
- **Success Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "MORNING SHIFT",
    "start_time": "08:30:00",
    "end_time": "16:30:00",
    "working_hours": "8.00",
    "grace_minutes": 15,
    "status": "active"
  }
]
```

---

### 3. Get Shifts by Token (School Scoped)

Fetches shifts scoped automatically to the authenticated user's assigned `school_id`.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-shifts/token`
- **Success Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "MORNING SHIFT",
    "start_time": "08:30:00",
    "end_time": "16:30:00",
    "working_hours": "8.00",
    "grace_minutes": 15,
    "status": "active",
    "school_name": "Greenwood International"
  }
]
```

---

### 4. Get Shift by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employee-shifts/:id`
- **Success Response (`200 OK`)**:
```json
{
  "id": 1,
  "school_id": 1,
  "name": "MORNING SHIFT",
  "start_time": "08:30:00",
  "end_time": "16:30:00",
  "working_hours": "8.00",
  "grace_minutes": 15,
  "status": "active"
}
```

---

### 5. Update Shift by ID

Updates shift name, timings, or grace period.

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employee-shifts/:id`
- **Request Body**:
```json
{
  "name": "PRIMARY MORNING SHIFT",
  "start_time": "08:00:00",
  "end_time": "16:00:00",
  "grace_minutes": 10,
  "status": "active"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "Shift updated"
}
```

---

### 6. Delete Shift by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employee-shifts/:id`
- **Success Response (`200 OK`)**:
```json
{
  "message": "Shift deleted"
}
```

---

## Error Responses

### 1. Shift Already Exists (`409 Conflict`)
```json
{
  "message": "Shift already exists"
}
```

### 2. Invalid Time Range (`400 Bad Request`)
```json
{
  "message": "start_time must be less than end_time"
}
```

### 3. Shift Not Found (`404 Not Found`)
```json
{
  "message": "Shift not found"
}
```

### 4. Unauthorized (`401 Unauthorized`)
```json
{
  "message": "Authorization header missing"
}
```
