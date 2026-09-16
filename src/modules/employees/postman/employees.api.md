# Employees Module Suite API Documentation

Comprehensive API documentation for the entire **Employees Ecosystem** in the School Management System. This suite comprises three core sub-modules:
1. **Employee Management** (`/api/employees`): Staff onboarding, profile management, document uploads, and user login account linking.
2. **Employee Designations** (`/api/employees-designations`): Staff roles, titles, and designation hierarchies.
3. **Employee Leave Types** (`/api/employees-leave-types`): Annual leave allowances, carry-forward policies, gender applicability, and approval workflows.

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}` (e.g., `http://localhost:5000`)
- **Headers**:
  - `Content-Type`: `application/json` (or `multipart/form-data` for file uploads)
  - `Authorization`: `Bearer {{TOKEN}}` (JWT access token required for all endpoints)

---

## Endpoint Summary

### 1. Employee Management (`/api/employees`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees` | Create employee (JSON or multipart with files) | Bearer Token |
| `POST` | `/api/employees/assign-user` | Link an existing user login account to an employee | Bearer Token |
| `POST` | `/api/employees/unassign-user` | Unlink the user login account from an employee | Bearer Token |
| `GET` | `/api/employees` | Get all employees | Bearer Token |
| `GET` | `/api/employees/:id` | Get employee by ID (includes documents & address) | Bearer Token |
| `PUT` | `/api/employees/:id` | Update employee profile or upload updated files | Bearer Token |
| `DELETE` | `/api/employees/:id` | Soft delete employee and unlink user account | Bearer Token |

### 2. Employee Designations (`/api/employees-designations`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees-designations` | Create a new employee designation | Bearer Token |
| `GET` | `/api/employees-designations` | Get all designations (filter by `school_id`, `status`) | Bearer Token |
| `GET` | `/api/employees-designations/token` | Get designations scoped to authenticated user's school | Bearer Token |
| `GET` | `/api/employees-designations/:id` | Get designation by ID | Bearer Token |
| `PUT` | `/api/employees-designations/:id` | Update designation by ID | Bearer Token |
| `DELETE` | `/api/employees-designations/:id` | Delete designation by ID | Bearer Token |

### 3. Employee Leave Types (`/api/employees-leave-types`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees-leave-types` | Create leave policy type with quota & rules | Bearer Token |
| `GET` | `/api/employees-leave-types` | Get all leave types (filters: `school_id`, `status`, `search`) | Bearer Token |
| `GET` | `/api/employees-leave-types/token` | Get leave types scoped to token user's school | Bearer Token |
| `GET` | `/api/employees-leave-types/check-leave-type` | Check if leave type name or code is already taken | Bearer Token |
| `GET` | `/api/employees-leave-types/:id` | Get leave type by ID | Bearer Token |
| `PUT` | `/api/employees-leave-types/:id` | Update leave type configuration | Bearer Token |
| `DELETE` | `/api/employees-leave-types/:id` | Delete leave type by ID | Bearer Token |

---

## 1. Employee Management API Details

### 1.1 Create Employee

Creates an employee record. Supports either `application/json` or `multipart/form-data`. Auto-generates sequential employee code `EMP-{school_id}-{year}-{0001}`.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees`

#### Supported Multipart Document Upload Fields
- `photo` (Max: 1, JPG/PNG)
- `aadhaar_card` (Max: 1, PDF/JPG/PNG)
- `pan_card` (Max: 1, PDF/JPG/PNG)
- `passport_size_photo` (Max: 1, JPG/PNG)
- `degree_certificate` (Max: 1, PDF/JPG/PNG)
- `experience_certificate` (Max: 1, PDF/JPG/PNG)
- `signature` (Max: 1, JPG/PNG)

#### Request Body (JSON)
```json
{
  "school_id": 1,
  "first_name": "Kavitha",
  "last_name": "Raman",
  "email": "kavitha.raman@school.edu",
  "mobile": "9876543210",
  "gender": "female",
  "dob": "1990-05-15",
  "blood_group": "O+",
  "aadhaar_no": "123456789012",
  "joining_date": "2026-06-01",
  "designation": "SENIOR TEACHER",
  "department": "SCIENCE",
  "qualification": "M.Sc., B.Ed.",
  "experience_years": 6,
  "salary": 45000,
  "current_address": "123 Anna Nagar 2nd Street",
  "current_city": "Chennai",
  "current_district": "Chennai",
  "current_state": "Tamil Nadu",
  "current_postal_code": "600040",
  "current_address_same_as_permanent": true,
  "emergency_contact": "9876543211",
  "emergency_relationship": "husband",
  "bank_name": "STATE BANK OF INDIA",
  "branch_name": "ANNA NAGAR",
  "account_number": "30123456789",
  "account_type": "SAVINGS",
  "ifsc_code": "SBIN0001234",
  "status": "active"
}
```

#### Success Response (`201 Created`)
```json
{
  "message": "Employee created successfully",
  "employee_id": 1,
  "employee_code": "EMP-1-2026-0001"
}
```

---

### 1.2 Assign User Account to Employee

Links an existing user login account (`users` table) with an employee record.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees/assign-user`
- **Request Body**:
```json
{
  "employee_id": 1,
  "user_id": 2
}
```
- **Validation**:
  - Both employee and user must exist.
  - Both employee and user must belong to the same `school_id`.
  - Rejects if employee or user is already linked (`409 Conflict`).
- **Success Response (`200 OK`)**:
```json
{
  "message": "User assigned to employee successfully"
}
```

---

### 1.3 Unassign User Account from Employee

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees/unassign-user`
- **Request Body**:
```json
{
  "employee_id": 1
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "User unassigned successfully"
}
```

---

### 1.4 Get All Employees

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees`
- **Success Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "school_id": 1,
    "employee_code": "EMP-1-2026-0001",
    "first_name": "Kavitha",
    "last_name": "Raman",
    "email": "kavitha.raman@school.edu",
    "mobile": "9876543210",
    "gender": "female",
    "designation": "SENIOR TEACHER",
    "department": "SCIENCE",
    "salary": "45000.00",
    "status": "active",
    "user_id": 2,
    "school_name": "Greenwood International"
  }
]
```

---

### 1.5 Get Employee by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees/:id`

---

### 1.6 Update Employee by ID

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employees/:id`
- **Request Body**:
```json
{
  "first_name": "Kavitha",
  "last_name": "Ramanathan",
  "salary": 48000,
  "designation": "HEAD OF DEPARTMENT",
  "status": "active"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "Employee updated successfully"
}
```

---

### 1.7 Delete Employee by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employees/:id`
- **Success Response (`200 OK`)**:
```json
{
  "message": "Employee deleted successfully"
}
```

---

## 2. Employee Designations API Details

### 2.1 Create Designation

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees-designations`
- **Request Body**:
```json
{
  "school_id": 1,
  "name": "SENIOR TEACHER",
  "description": "High school grade educator and department lead",
  "status": "active"
}
```
- **Success Response (`201 Created`)**:
```json
{
  "message": "Designation created successfully",
  "id": 1
}
```

---

### 2.2 Get All Designations

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-designations`
- **Query Parameters**:
  - `school_id` (optional): Filter by school ID.
  - `status` (optional): `active` or `inactive`.

---

### 2.3 Get All Designations by Token

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-designations/token`

---

### 2.4 Update & Delete Designation

- **PUT**: `{{BASE_URL}}/api/employees-designations/:id`
- **DELETE**: `{{BASE_URL}}/api/employees-designations/:id`

---

## 3. Employee Leave Types API Details

### 3.1 Create Leave Type

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees-leave-types`
- **Request Body**:
```json
{
  "school_id": 1,
  "name": "CASUAL LEAVE",
  "code": "CL",
  "description": "Standard annual casual leave quota",
  "days_per_year": 12,
  "max_days_per_request": 3,
  "is_paid": true,
  "carry_forward": false,
  "max_carry_forward_days": 0,
  "allow_half_day": true,
  "requires_approval": true,
  "requires_attachment": false,
  "applicable_gender": "all",
  "status": "active"
}
```

#### Field Specifications

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `school_id` | `Number` | Yes | Target school ID |
| `name` | `String` | Yes | Leave type name (e.g. CASUAL LEAVE, SICK LEAVE) |
| `code` | `String` | Yes | Unique short code (e.g. CL, SL, ML) |
| `days_per_year` | `Number` | No | Annual quota entitlement (default: 0) |
| `max_days_per_request` | `Number` / `null` | No | Maximum consecutive days allowed per leave application |
| `is_paid` | `Boolean` | No | Whether days are paid leave (default: true) |
| `carry_forward` | `Boolean` | No | Whether unused balance rolls into next academic year |
| `max_carry_forward_days` | `Number` | No | Maximum carry-forward limit |
| `allow_half_day` | `Boolean` | No | Whether half-day leaves are permissible |
| `requires_approval` | `Boolean` | No | Whether supervisor approval is mandatory |
| `requires_attachment` | `Boolean` | No | Whether medical/supporting proof is mandatory |
| `applicable_gender` | `String` | No | `"all"`, `"male"`, `"female"`, or `"other"` |
| `status` | `String` | No | `"active"` or `"inactive"` |

#### Success Response (`201 Created`)
```json
{
  "message": "Leave type created successfully",
  "id": 1
}
```

---

### 3.2 Check Existing Leave Type

Validates whether a leave type name or code is already in use within a school.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/check-leave-type`
- **Query Parameters**:
  - `school_id`: Target school ID.
  - `name`: Leave name to check.
  - `code`: Leave code to check.
- **Success Response (`200 OK`)**:
```json
{
  "exists": false
}
```

---

### 3.3 Get All Leave Types by Token

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/token`

---

## Error Handling

### 1. Duplicate Employee Mobile or Email (`409 Conflict`)
```json
{
  "message": "Employee already exists"
}
```

### 2. User & Employee School Mismatch (`400 Bad Request`)
```json
{
  "message": "User and employee must belong to same school"
}
```

### 3. Employee Already Assigned (`409 Conflict`)
```json
{
  "message": "Employee already assigned to a user"
}
```

### 4. Duplicate Leave Code/Name (`409 Conflict`)
```json
{
  "message": "Leave type name or code already exists in this school"
}
```
