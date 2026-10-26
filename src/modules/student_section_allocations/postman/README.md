# 📬 Postman Testing Guide - Student Section Allocations Module

This directory contains the complete Postman collection and reference guide for testing the Student Section Allocations API.

## 📂 Files Included

1. **[`studentSectionAllocations.postman_collection.json`](file:///c:/Users/zenfu/Desktop/school-management/backend/src/modules/student_section_allocations/postman/studentSectionAllocations.postman_collection.json)**: Ready-to-import Postman collection (v2.1) covering all routes with automated test assertions and token authorization.
2. **[`studentSectionAllocations.api.md`](file:///c:/Users/zenfu/Desktop/school-management/backend/src/modules/student_section_allocations/postman/studentSectionAllocations.api.md)**: Comprehensive API documentation with request bodies, query filters, URL params, and responses.

---

## 🚀 Quick Setup Instructions

### 1. Import into Postman
1. Open Postman.
2. Click **Import** (top left).
3. Select or drag-and-drop `studentSectionAllocations.postman_collection.json`.
4. The collection **"Student Section Allocations Module - School Management System"** will appear in your sidebar.

---

### 2. Configure Variables
Click on the collection name in Postman, open the **Variables** tab, and customize:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:5000` | Backend server URL |
| `TOKEN` | *(Your JWT Token)* | Bearer token received from login |
| `ALLOCATION_ID` | `1` | Default allocation ID for single-resource operations |
| `ADMISSION_ID` | `1` | Student admission record ID |
| `STUDENT_ID` | `1` | Student ID |
| `CLASS_SECTION_ID` | `1` | Class section ID (e.g., Section A) |
| `NEW_CLASS_SECTION_ID` | `2` | Target class section ID for transfer tests (e.g., Section B) |
| `CLASS_ID` | `1` | Class ID |
| `ACADEMIC_YEAR_ID` | `1` | Academic year ID |
| `SCHOOL_ID` | `1` | School ID |

> 💡 **Tip:** Every request in the collection automatically inherits `Bearer {{TOKEN}}` from collection settings.

---

## 🧪 Included Requests & Testing Scenarios

| # | Request Name | Method | URL | Description & Test Assertions |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Create Initial Section Allocation** | `POST` | `{{BASE_URL}}/api/student-section-allocations` | Allocates student to initial section. Automatically saves returned ID to `ALLOCATION_ID`. Asserts 201 Created. |
| **2** | **Transfer Section (Auto-Closes Previous)** | `POST` | `{{BASE_URL}}/api/student-section-allocations` | Transfers student to new section; automatically closes previous section with `effective_to`. Asserts 201 Created. |
| **3** | **Create Allocation By Student ID** | `POST` | `{{BASE_URL}}/api/student-section-allocations` | Allocates section resolving via `student_id`. Asserts 201 Created. |
| **4** | **Bulk Create / Transfer Allocations** | `POST` | `{{BASE_URL}}/api/student-section-allocations/bulk` | Allocates multiple students in a single transaction. Asserts 200 OK and valid summary counts. |
| **5** | **Get All Allocations (Active Only)** | `GET` | `{{BASE_URL}}/api/student-section-allocations?active_only=true` | Lists all active allocations. Asserts 200 OK array. |
| **6** | **Get All Allocations (Multi-Filter)** | `GET` | `{{BASE_URL}}/api/student-section-allocations?class_section_id=...` | Filters by class section, admission, status, and search keyword. |
| **7** | **Get All Allocations By Token** | `GET` | `{{BASE_URL}}/api/student-section-allocations/token?active_only=true` | Fetches allocations scoped to authenticated user's school. |
| **8** | **Get Class Students For Allocation** | `GET` | `{{BASE_URL}}/api/student-section-allocations/class-students?class_id=1&status=unallocated` | Fetches admitted students with their current section allocation status for assignment UI. |
| **9** | **Get Allocation History (Query Param)** | `GET` | `{{BASE_URL}}/api/student-section-allocations/history?admission_id=1` | Retrieves full section transfer history for a student via query parameter. |
| **10** | **Get Allocation History (Route Param)** | `GET` | `{{BASE_URL}}/api/student-section-allocations/history/:admissionId` | Retrieves student section history using route parameter `/history/{{ADMISSION_ID}}`. |
| **11** | **Check Existing Allocation (Non-Token)** | `GET` | `{{BASE_URL}}/api/student-section-allocations/check-allocation?admission_id=1` | Checks if student has an active allocation. |
| **12** | **Check Existing Allocation By Token** | `GET` | `{{BASE_URL}}/api/student-section-allocations/check-allocation/token?admission_id=1` | Token-scoped allocation check within caller's school. |
| **13** | **Get Section Allocation By ID** | `GET` | `{{BASE_URL}}/api/student-section-allocations/{{ALLOCATION_ID}}` | Retrieves single allocation record by ID. Asserts matching ID in response. |
| **14** | **Update Section Allocation** | `PUT` | `{{BASE_URL}}/api/student-section-allocations/{{ALLOCATION_ID}}` | Updates roll number, remarks, status, or effective dates. |
| **15** | **Delete Section Allocation** | `DELETE` | `{{BASE_URL}}/api/student-section-allocations/{{ALLOCATION_ID}}` | Deletes allocation record and verifies audit log entry. |
