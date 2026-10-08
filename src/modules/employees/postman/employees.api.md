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
| `GET` | `/api/employees` | Get all employees with advanced filtering, search, sorting & pagination | Bearer Token |
| `GET` | `/api/employees/token` | Get employees automatically scoped to user's school | Bearer Token |
| `GET` | `/api/employees/filter-options` | Get distinct filter options (designations, departments, etc.) for UI dropdowns | Bearer Token |
| `GET` | `/api/employees/stats` | Get aggregate statistics (counts, department/gender breakdowns) | Bearer Token |
| `GET` | `/api/employees/:id` | Get employee by ID (includes documents, address & user profile) | Bearer Token |
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

### 1.4 Get All Employees (Advanced Filtering, Search & Pagination)

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees`
- **Headers**: `Authorization: Bearer {{TOKEN}}`

#### Supported Query Parameters

| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `search` / `q` | `String` | Global multi-field text search across name, code, email, mobile, aadhaar, designation, department, qualification | `?search=Kavitha` |
| `school_id` | `Number` / `String` | Filter by school ID or comma-separated school IDs | `?school_id=1` |
| `status` | `String` | Single status or comma-separated list (`active`, `inactive`, `resigned`, `terminated`) | `?status=active,inactive` |
| `designation` | `String` | Exact designation or comma-separated list | `?designation=TEACHER,PRINCIPAL` |
| `department` | `String` | Exact department or comma-separated list | `?department=SCIENCE,MATHEMATICS` |
| `gender` | `String` | Filter by gender (`male`, `female`, `other`) | `?gender=female` |
| `blood_group` | `String` | Filter by blood group (`A+`, `B+`, `O+`, `AB+`, etc.) | `?blood_group=O+` |
| `user_assigned` | `Boolean` | Filter employees with user account (`true`/`1`) or without (`false`/`0`) | `?user_assigned=false` |
| `min_experience` | `Number` | Minimum years of experience | `?min_experience=3` |
| `max_experience` | `Number` | Maximum years of experience | `?max_experience=10` |
| `min_salary` | `Number` | Minimum salary threshold | `?min_salary=30000` |
| `max_salary` | `Number` | Maximum salary threshold | `?max_salary=75000` |
| `joining_date_from` | `Date` | Filter employees joining on or after date (`YYYY-MM-DD`) | `?joining_date_from=2024-01-01` |
| `joining_date_to` | `Date` | Filter employees joining on or before date (`YYYY-MM-DD`) | `?joining_date_to=2026-12-31` |
| `joining_year` | `Number` | Filter by joining calendar year | `?joining_year=2026` |
| `city` | `String` | Partial match on current or permanent city | `?city=Chennai` |
| `district` | `String` | Partial match on current or permanent district | `?district=Coimbatore` |
| `state` | `String` | Partial match on state | `?state=Tamil Nadu` |
| `qualification` | `String` | Partial match on qualification | `?qualification=M.Sc` |
| `sort_by` | `String` | Sort field: `id`, `name`, `employee_code`, `joining_date`, `salary`, `experience_years`, `department`, `designation`, `status` | `?sort_by=joining_date` |
| `sort_order` | `String` | `ASC` or `DESC` (default `DESC`) | `?sort_order=ASC` |
| `page` | `Number` | Page number (default: 1) | `?page=1` |
| `limit` | `Number` | Items per page (default: 20) | `?limit=10` |
| `paginate` | `Boolean` | Set `true` to receive full `{ data, pagination, filters }` response wrapper | `?paginate=true` |
| `all` | `Boolean` | Return all matching records without pagination limit | `?all=true` |

#### Response Headers (Emitted on every GET request)
- `X-Total-Count`: Total number of matching records
- `X-Page`: Current page number
- `X-Limit`: Page size limit
- `X-Total-Pages`: Total number of pages

#### Success Response - Default (`200 OK`)
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
    "username": "kavitha_r",
    "user_email": "kavitha.raman@school.edu",
    "school_name": "Greenwood International",
    "school_code": "SCH001"
  }
]
```

#### Success Response - Paginated Format (`?paginate=true`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": 1,
      "employee_code": "EMP-1-2026-0001",
      "first_name": "Kavitha",
      "last_name": "Raman",
      "designation": "SENIOR TEACHER",
      "department": "SCIENCE",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "status": "active"
  }
}
```

---

#### Quick Reference: All Ready-to-Use GET API URLs

Assuming your base URL is `http://localhost:5000/api/employees` (or `{{BASE_URL}}/api/employees`):

##### 1. Get all employees
```http
GET http://localhost:5000/api/employees
```

##### 2. Get employees with global search
```http
GET http://localhost:5000/api/employees?search=John
```
or
```http
GET http://localhost:5000/api/employees?q=John
```

##### 3. Filter by school
```http
GET http://localhost:5000/api/employees?school_id=1
```
Multiple schools:
```http
GET http://localhost:5000/api/employees?school_id=1,2,3
```

##### 4. Filter by status
```http
GET http://localhost:5000/api/employees?status=active
```

##### 5. Filter by designation
```http
GET http://localhost:5000/api/employees?designation=Teacher
```
Multiple designations:
```http
GET http://localhost:5000/api/employees?designation=Teacher,Principal
```

##### 6. Filter by department
```http
GET http://localhost:5000/api/employees?department=SCIENCE
```
Multiple departments:
```http
GET http://localhost:5000/api/employees?department=SCIENCE,MATHS
```

##### 7. User assignment filter
Employees with login accounts:
```http
GET http://localhost:5000/api/employees?user_assigned=true
```
Employees without login accounts:
```http
GET http://localhost:5000/api/employees?user_assigned=false
```

##### 8. Experience range
```http
GET http://localhost:5000/api/employees?min_experience=2&max_experience=10
```

##### 9. Salary range
```http
GET http://localhost:5000/api/employees?min_salary=20000&max_salary=50000
```

##### 10. Joining date range
```http
GET http://localhost:5000/api/employees?joining_date_from=2024-01-01&joining_date_to=2025-12-31
```

##### 11. Joining year
```http
GET http://localhost:5000/api/employees?joining_year=2025
```

##### 12. Joining month
```http
GET http://localhost:5000/api/employees?joining_month=6
```

##### 13. Date of birth range
```http
GET http://localhost:5000/api/employees?dob_from=1990-01-01&dob_to=2000-12-31
```

##### 14. Gender
```http
GET http://localhost:5000/api/employees?gender=Male
```

##### 15. Blood group
```http
GET http://localhost:5000/api/employees?blood_group=O+
```

##### 16. City
```http
GET http://localhost:5000/api/employees?city=Chennai
```

##### 17. District
```http
GET http://localhost:5000/api/employees?district=Krishnagiri
```

##### 18. State
```http
GET http://localhost:5000/api/employees?state=Tamil Nadu
```

##### 19. Postal code
```http
GET http://localhost:5000/api/employees?postal_code=635001
```

##### 20. Qualification
```http
GET http://localhost:5000/api/employees?qualification=B.Ed
```

##### Sorting
Sort by name:
```http
GET http://localhost:5000/api/employees?sort_by=name&sort_order=ASC
```
Sort by salary descending:
```http
GET http://localhost:5000/api/employees?sort_by=salary&sort_order=DESC
```
Available `sort_by` values: `id`, `name`, `employee_code`, `joining_date`, `salary`, `experience_years`, `department`, `designation`, `status`, `created_at`  
Available `sort_order` values: `ASC`, `DESC`

##### Pagination
Standard page and limit:
```http
GET http://localhost:5000/api/employees?page=1&limit=10
```
With the explicit paginated response envelope:
```http
GET http://localhost:5000/api/employees?page=1&limit=10&paginate=true
```

##### Combined advanced filter
You can combine parameters freely:
```http
GET http://localhost:5000/api/employees?search=John&department=SCIENCE,MATHS&status=active&gender=Male&min_salary=20000&max_salary=50000&min_experience=2&max_experience=10&sort_by=salary&sort_order=DESC&page=1&limit=10&paginate=true
```

##### Token-based employees
```http
GET http://localhost:5000/api/employees/token
```
With filters:
```http
GET http://localhost:5000/api/employees/token?status=active
GET http://localhost:5000/api/employees/token?department=SCIENCE
GET http://localhost:5000/api/employees/token?search=John
```

##### Filter options
```http
GET http://localhost:5000/api/employees/filter-options
```
Populates frontend dropdowns:
- Designations
- Departments
- Genders
- Blood Groups
- Statuses
- Salary Range
- Experience Range

##### Employee statistics
```http
GET http://localhost:5000/api/employees/stats
```
Dashboard analytics:
- Total Employees
- Active Employees
- Inactive Employees
- Employees With Login
- Employees Without Login
- Department Distribution
- Gender Distribution

##### Get employee by ID
```http
GET http://localhost:5000/api/employees/1
```
or
```http
GET http://localhost:5000/api/employees/{employee_id}
```

---

### 1.5 Get Employees Scoped by Token (`/api/employees/token`)

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees/token`
- **Headers**: `Authorization: Bearer {{TOKEN}}`
- Automatically enforces `school_id` scoping to the logged-in user's school for non-administrators (Administrators can view all or specify `?school_id=...`).
- Supports all identical query parameters as `/api/employees`.

---

### 1.6 Get Employee Filter Options (`/api/employees/filter-options`)

Fetches distinct options to populate frontend dropdown menus dynamically.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees/filter-options`
- **Headers**: `Authorization: Bearer {{TOKEN}}`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "options": {
    "designations": ["HEAD OF DEPARTMENT", "PRINCIPAL", "SENIOR TEACHER"],
    "departments": ["ADMINISTRATION", "MATHEMATICS", "SCIENCE"],
    "genders": ["male", "female", "other"],
    "blood_groups": ["A+", "B+", "O+", "O-"],
    "statuses": ["active", "inactive", "resigned", "terminated"],
    "cities": ["Chennai", "Coimbatore", "Madurai"],
    "salary_range": {
      "min": 25000,
      "max": 95000
    },
    "experience_range": {
      "min": 1,
      "max": 18
    }
  }
}
```

---

### 1.7 Get Employee Statistics (`/api/employees/stats`)

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees/stats`
- **Headers**: `Authorization: Bearer {{TOKEN}}`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "stats": {
    "total": 45,
    "status_counts": {
      "active": 42,
      "inactive": 2,
      "resigned": 1,
      "terminated": 0
    },
    "user_assignment": {
      "assigned": 38,
      "unassigned": 7
    },
    "gender_counts": {
      "male": 18,
      "female": 27,
      "other": 0
    },
    "averages": {
      "salary": "48500.00",
      "experience_years": "5.4"
    },
    "department_counts": [
      { "department": "SCIENCE", "count": 16 },
      { "department": "MATHEMATICS", "count": 12 }
    ],
    "designation_counts": [
      { "designation": "TEACHER", "count": 30 },
      { "designation": "PRINCIPAL", "count": 1 }
    ]
  }
}
```

---

### 1.8 Get Employee by ID

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees/:id`
- **Headers**: `Authorization: Bearer {{TOKEN}}`
- **Description**: Returns detailed employee record, including linked user account, school information, and uploaded employee documents (`documents` array).

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
