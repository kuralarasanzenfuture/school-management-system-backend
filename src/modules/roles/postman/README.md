# 📬 Postman Testing Guide - Roles Module

This directory contains the complete Postman collection and reference guide for testing the Roles API.

## 📂 Files Included

1. **[`roles.postman_collection.json`](file:///c:/Users/zenfu/Desktop/school-management/backend/src/modules/roles/postman/roles.postman_collection.json)**: Ready-to-import Postman collection with tests, authorization, and requests.
2. **[`roles.api.md`](file:///c:/Users/zenfu/Desktop/school-management/backend/src/modules/roles/postman/roles.api.md)**: Full API documentation with methods, URLs, request bodies, query/params, and error behaviors.

---

## 🚀 Quick Setup Instructions

### 1. Import into Postman
1. Open Postman.
2. Click **Import** (top left).
3. Drag and drop `roles.postman_collection.json` (or navigate to `src/modules/roles/postman/roles.postman_collection.json`).
4. The collection **"Roles Module - School Management System"** will appear in your sidebar.

---

### 2. Configure Variables
Click on the collection name in Postman, open the **Variables** tab, and set:

| Variable | Initial Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:5000` | Backend API server URL |
| `TOKEN` | *(Your JWT Token)* | Bearer token received from `/api/auth/login` |
| `ROLE_ID` | `2` | Default non-admin role ID for single-resource operations |

> 💡 **Tip:** Every request in the collection automatically inherits `Bearer {{TOKEN}}` from collection settings.

---

## 🧪 Included Requests & Testing Scenarios

| # | Request Name | Method | URL | Description & Test Assertions |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Create Role** | `POST` | `{{BASE_URL}}/api/roles` | Creates a new role (`name` uppercase letters and `_` only). Asserts 201 Created. |
| **2** | **Get All Roles** | `GET` | `{{BASE_URL}}/api/roles` | Retrieves all roles. Asserts array response and presence of `ADMIN` role. Automatically sets `ROLE_ID` to first non-admin role found. |
| **3** | **Update Role** | `PUT` | `{{BASE_URL}}/api/roles/{{ROLE_ID}}` | Updates name, description, and status. Asserts 200 OK. Protects `ADMIN` role. |
| **4** | **Update Role Status (Inactive)** | `PATCH` | `{{BASE_URL}}/api/roles/status/{{ROLE_ID}}` | Deactivates role and cascades inactive status to all assigned users, incrementing `token_version`. |
| **5** | **Update Role Status (Active)** | `PATCH` | `{{BASE_URL}}/api/roles/status/{{ROLE_ID}}` | Reactivates role and its assigned users. |
| **6** | **Delete Role** | `DELETE` | `{{BASE_URL}}/api/roles/{{ROLE_ID}}` | Deletes role if no active users are assigned. Asserts safeguard block (400) if users exist. |
