# Employee Leave Types API Documentation

API documentation for **Employee Leave Types** (`/api/employees-leave-types`).

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
| `POST` | `/api/employees-leave-types` | Create leave policy type | Bearer Token |
| `GET` | `/api/employees-leave-types` | Get all leave types | Bearer Token |
| `GET` | `/api/employees-leave-types/token` | Get leave types scoped to token school | Bearer Token |
| `GET` | `/api/employees-leave-types/check-leave-type` | Check name/code uniqueness | Bearer Token |
| `GET` | `/api/employees-leave-types/:id` | Get leave type by ID | Bearer Token |
| `PUT` | `/api/employees-leave-types/:id` | Update leave type by ID | Bearer Token |
| `DELETE` | `/api/employees-leave-types/:id` | Delete leave type by ID | Bearer Token |

---

## API Details

### 1. Create Leave Type

- **Method**: `POST`
- **Route**: `{{BASE_URL}}/api/employees-leave-types`
- **Request Body**:
```json
{
  "school_id": 1,
  "name": "CASUAL LEAVE",
  "code": "CL",
  "description": "Annual casual leave allowance",
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
- **Success Response (`201 Created`)**:
```json
{
  "message": "Leave type created successfully",
  "id": 1
}
```

---

### 2. Check Existing Leave Type

- **Method**: `GET`
- **Route**: `{{BASE_URL}}/api/employees-leave-types/check-leave-type?school_id=1&name=CASUAL LEAVE&code=CL`
- **Success Response (`200 OK`)**:
```json
{
  "exists": false
}
```
