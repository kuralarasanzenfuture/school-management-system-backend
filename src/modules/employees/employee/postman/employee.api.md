# Employee Management API Documentation

API documentation for the core **Employee Management Module** in the School Management System (`/api/employees`).

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}` (e.g., `http://localhost:5000`)
- **Headers**:
  - `Content-Type`: `application/json` or `multipart/form-data`
  - `Authorization`: `Bearer {{TOKEN}}` (JWT access token required)

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees` | Register new employee (JSON or multipart file upload) | Bearer Token |
| `POST` | `/api/employees/assign-user` | Link an existing user login to an employee | Bearer Token |
| `POST` | `/api/employees/unassign-user` | Unlink user login account from an employee | Bearer Token |
| `GET` | `/api/employees` | List all employees | Bearer Token |
| `GET` | `/api/employees/:id` | Get employee profile by ID | Bearer Token |
| `PUT` | `/api/employees/:id` | Update employee profile by ID | Bearer Token |
| `DELETE` | `/api/employees/:id` | Soft delete employee record | Bearer Token |

---

## API Details

### 1. Create Employee

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees`
- **Request Body (JSON)**:
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
- **Success Response (`201 Created`)**:
```json
{
  "message": "Employee created successfully",
  "employee_id": 1,
  "employee_code": "EMP-1-2026-0001"
}
```

---

### 2. Assign User Account to Employee

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees/assign-user`
- **Request Body**:
```json
{
  "employee_id": 1,
  "user_id": 2
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "User assigned to employee successfully"
}
```

---

### 3. Unassign User Account from Employee

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

### 4. Get All Employees

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees`

---

### 5. Get Employee by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees/:id`

---

### 6. Update Employee by ID

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/employees/:id`
- **Request Body**:
```json
{
  "first_name": "Kavitha",
  "last_name": "Ramanathan",
  "salary": 48000,
  "designation": "HEAD OF DEPARTMENT"
}
```

---

### 7. Delete Employee by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/employees/:id`
```json
{
  "message": "Employee deleted successfully"
}
```
