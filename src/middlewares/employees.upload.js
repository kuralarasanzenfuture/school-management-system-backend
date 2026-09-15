import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deleteUploadedFile, deleteUploadedFiles } from "../utils/fileStorage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 BASE UPLOAD PATH
const basePath = path.join(__dirname, "../uploads/employees");

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

// 📁 DYNAMIC FOLDERS PER DOCUMENT
const folders = [
  "photo",
  "aadhaar_card",
  "pan_card",
  "passport_size_photo",
  "degree_certificate",
  "experience_certificate",
  "signature",
];

folders.forEach((folder) => {
  const fullPath = path.join(basePath, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/* =========================================
   🔥 STORAGE CONFIG
========================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = folders.includes(file.fieldname) ? file.fieldname : "others";
    const targetPath = path.join(basePath, folder);

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    cb(null, targetPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueId}-${cleanBase || file.fieldname}${ext}`);
  },
});

/* =========================================
   🔥 FILE FILTER
========================================= */
const fileFilter = (req, file, cb) => {
  const allowedExt = /^\.(jpg|jpeg|png|pdf)$/i;
  const allowedMime = /^(image\/(jpeg|jpg|png)|application\/pdf)$/i;

  const ext = path.extname(file.originalname).toLowerCase();
  const extValid = allowedExt.test(ext);
  const mimeValid = !file.mimetype || allowedMime.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and PDF files are allowed for employee documents"));
  }
};

/* =========================================
   🔥 MULTER INSTANCE
========================================= */
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

/* =========================================
   🔥 EXPORT UPLOAD FIELDS (MATCHES DB COLUMNS)
========================================= */
export const employeeUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "aadhaar_card", maxCount: 1 },
  { name: "pan_card", maxCount: 1 },
  { name: "passport_size_photo", maxCount: 1 },
  { name: "degree_certificate", maxCount: 1 },
  { name: "experience_certificate", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

/* =========================================
   🔥 PERMANENT FILE DELETION HELPERS
========================================= */
export const deleteEmployeeFile = deleteUploadedFile;
export const deleteEmployeeFiles = deleteUploadedFiles;

