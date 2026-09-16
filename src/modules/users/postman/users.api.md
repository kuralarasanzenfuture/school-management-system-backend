# Users & Authentication API Documentation

Comprehensive API documentation for the **Users and Authentication Module** in the School Management System (`/api/users`). This module provides secure authentication (JWT access and refresh tokens), multi-role assignment, profile retrieval, password rotation, session management, and user lifecycle administration.

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}` (e.g., `http://localhost:5000`)
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{TOKEN}}` (Required for all protected endpoints)

---

## Endpoint Summary

### 1. Authentication & Session Management

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/login` | Authenticate user via username, email, or phone | No |
| `POST` | `/api/users/refresh-token` | Refresh access token using active refresh token | No |
| `GET` | `/api/users/me` | Get profile & permissions for authenticated user | Bearer Token |
| `GET` | `/api/users/me/:id` | Get user profile by ID | Bearer Token |
| `PUT` | `/api/users/change-password` | Update account password and invalidate old tokens | Bearer Token |
| `POST` | `/api/users/logout` | Logout current session & clear cookies | Bearer Token |
| `POST` | `/api/users/logout-all` | Invalidate all sessions across all devices | Bearer Token |

### 2. User Registration & Public Availability Checks

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register new user account with assigned roles | No / Admin |
| `GET` | `/api/users/check-username/:username` | Verify if username is available | No |
| `GET` | `/api/users/check-email/:email` | Verify if email address is available | No |
| `GET` | `/api/users/check-phone/:phone` | Verify if phone number is available | No |

### 3. User Administration

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List all users with assigned roles | Bearer Token |
| `GET` | `/api/users/token` | List users scoped to authenticated user's school | Bearer Token |
| `GET` | `/api/users/:id` | Get user by ID | Bearer Token |
| `PUT` | `/api/users/update/:id` | Update user details and roles | Bearer Token |
| `PATCH` | `/api/users/status/:id` | Update user status (`active`/`inactive`) | Bearer Token |
| `DELETE` | `/api/users/delete/:id` | Soft delete user by ID | Bearer Token |

---

## API Details

### 1. User Login

Authenticates using either `username`, `email`, or `phone` in the `login_id` field.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/users/login`
- **Headers**:
  - `Content-Type: application/json`

#### Request Body
```json
{
  "login_id": "admin",
  "password": "password123"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@school.edu",
    "phone": "9876543210",
    "school_id": 1,
    "status": "active",
    "roles": ["ADMIN"]
  }
}
```

---

### 2. Refresh Access Token

Issues a new access token and rotated refresh token.

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/users/refresh-token`
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Token refreshed",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Get My Profile

Returns full profile of the authenticated user.

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/users/me`
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@school.edu",
    "phone": "9876543210",
    "school_id": 1,
    "status": "active",
    "school_name": "Greenwood International",
    "roles": [
      {
        "id": 1,
        "name": "ADMIN",
        "description": "Full administrative privileges"
      }
    ]
  }
}
```

---

### 4. Change Password

Updates password and increments token version to revoke previous tokens.

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/users/change-password`
- **Request Body**:
```json
{
  "currentPassword": "password123",
  "newPassword": "NewStrongPass@2026",
  "confirmPassword": "NewStrongPass@2026"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### 5. Register / Create User

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/users/register`
- **Request Body**:
```json
{
  "username": "faculty_sarah",
  "email": "sarah.faculty@school.edu",
  "phone": "9876543299",
  "password": "SecurePass@123",
  "school_id": 1,
  "roles": ["TEACHER"]
}
```
- **Success Response (`201 Created`)**:
```json
{
  "message": "User created successfully",
  "userId": 5
}
```

---

### 6. Public Availability Checks

- `GET {{BASE_URL}}/api/users/check-username/:username`
- `GET {{BASE_URL}}/api/users/check-email/:email`
- `GET {{BASE_URL}}/api/users/check-phone/:phone`

#### Sample Response (`200 OK`)
```json
{
  "available": true
}
```

---

### 7. Get All Users

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/users`
- **Success Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@school.edu",
    "phone": "9876543210",
    "status": "active",
    "school_id": 1,
    "school_name": "Greenwood International",
    "roles": ["ADMIN"]
  }
]
```

---

### 8. Update User Details

- **Method**: `PUT`
- **Route**: `{{BASE_URL}}/api/users/update/:id`
- **Request Body**:
```json
{
  "email": "sarah.updated@school.edu",
  "phone": "9876543290",
  "roles": ["TEACHER", "EXAM_COORDINATOR"]
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "User updated successfully"
}
```

---

### 9. Update User Status

- **Method**: `PATCH`
- **Route**: `{{BASE_URL}}/api/users/status/:id`
- **Request Body**:
```json
{
  "status": "inactive"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "User status updated successfully"
}
```

---

### 10. Delete User by ID

- **Method**: `DELETE`
- **Route**: `{{BASE_URL}}/api/users/delete/:id`
- **Success Response (`200 OK`)**:
```json
{
  "message": "User deleted successfully"
}
```

---

## Error Handling

### 1. Invalid Credentials (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Invalid password"
}
```

### 2. Inactive User Account (`403 Forbidden`)
```json
{
  "success": false,
  "message": "User is inactive"
}
```

### 3. Duplicate Username / Email / Phone (`409 Conflict`)
```json
{
  "message": "Username already exists"
}
```

### 4. Password Mismatch (`400 Bad Request`)
```json
{
  "success": false,
  "errors": [
    "Password confirmation does not match"
  ]
}
```
