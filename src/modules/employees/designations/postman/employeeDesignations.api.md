# Employee Designations API Documentation

API documentation for **Employee Designations** (`/api/employees-designations`).

---

## Base Configuration

- **Base URL**: `{{BASE_URL}}`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{TOKEN}}`

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees-designations` | Create new designation | Bearer Token |
| `GET` | `/api/employees-designations` | Get all designations | Bearer Token |
| `GET` | `/api/employees-designations/token` | Get designations scoped to token school | Bearer Token |
| `GET` | `/api/employees-designations/:id` | Get designation by ID | Bearer Token |
| `PUT` | `/api/employees-designations/:id` | Update designation by ID | Bearer Token |
| `DELETE` | `/api/employees-designations/:id` | Delete designation by ID | Bearer Token |

---

## API Details

### 1. Create Designation

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees-designations`
- **Request Body**:
```json
{
  "school_id": 1,
  "name": "SENIOR TEACHER",
  "description": "High school faculty",
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

### 2. Get All Designations

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-designations?school_id=1&status=active`
