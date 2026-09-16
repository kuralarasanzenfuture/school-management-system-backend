# 📬 Postman Testing Guide - Schools Module

This directory contains the complete Postman collection and reference guide for testing the Schools API.

## 📂 Files Included

1. **[`schools.postman_collection.json`](file:///c:/Users/zenfu/Desktop/school-management/backend/src/modules/schools/postman/schools.postman_collection.json)**: Ready-to-import Postman collection with tests, authorization, and requests.
2. **[`schools.api.md`](file:///c:/Users/zenfu/Desktop/school-management/backend/src/modules/schools/postman/schools.api.md)**: Full API documentation with methods, URLs, parameters, sample payloads, and responses.

---

## 🚀 Quick Setup Instructions

### 1. Import into Postman
1. Open Postman.
2. Click **Import** (top left).
3. Drag and drop `schools.postman_collection.json` (or browse to `src/modules/schools/postman/schools.postman_collection.json`).
4. The collection **"Schools Module - School Management System"** will appear in your sidebar.

---

### 2. Configure Variables
Click on the collection name in Postman, open the **Variables** tab, and set:

| Variable | Initial Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:5000` | Backend API server URL |
| `TOKEN` | *(Your JWT Token)* | Bearer token received from `/api/auth/login` |
| `SCHOOL_ID` | `1` | Default school ID for single-resource operations |

> 💡 **Tip:** Every request in the collection automatically uses `Bearer {{TOKEN}}` from collection settings.

---

## 🧪 Included Requests & Testing Scenarios

| # | Request Name | Method | URL | Description & Test Assertions |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Create School (Form-Data with Logo)** | `POST` | `{{BASE_URL}}/api/schools` | Uploads school details + logo file (`jpg`/`png`/`webp`). Asserts auto-generated code `SCH-XXXX` and returns both `logo_url` and `full_logo_url`. Sets `SCHOOL_ID` variable automatically. |
| **2** | **Create School (JSON)** | `POST` | `{{BASE_URL}}/api/schools` | Creates school with JSON body without file upload. |
| **3** | **Get All Schools** | `GET` | `{{BASE_URL}}/api/schools` | Returns array of all schools. Asserts each school has both `logo_url` and `full_logo_url`. |
| **4** | **Get Schools By Token** | `GET` | `{{BASE_URL}}/api/schools/token` | Returns all schools if ADMIN, or only assigned school for non-admin. |
| **5** | **Get School By ID** | `GET` | `{{BASE_URL}}/api/schools/{{SCHOOL_ID}}` | Retrieves single school record. |
| **6** | **Update School (New Logo)** | `PUT` | `{{BASE_URL}}/api/schools/{{SCHOOL_ID}}` | Updates details & replaces logo file. Verifies old logo is permanently unlinked from server. |
| **7** | **Update School (Remove Logo)** | `PUT` | `{{BASE_URL}}/api/schools/{{SCHOOL_ID}}` | Sends `{"remove_logo": true}`. Asserts logo is cleared and file is permanently unlinked. |
| **8** | **Delete School** | `DELETE` | `{{BASE_URL}}/api/schools/{{SCHOOL_ID}}` | Deletes school and permanently unlinks logo from storage. |

---

## 🖼️ Testing File Uploads in Postman

To test logo upload in **Request 1** or **Request 6**:
1. Open the request in Postman.
2. Go to the **Body** tab and select **form-data**.
3. Hover over the `logo` key row, click the dropdown on the right side of the key field, and select **File**.
4. In the **Value** column, click **Select Files** and choose an image (`.png`, `.jpg`, `.jpeg`, or `.webp` under 2MB).
5. Click **Send**.
