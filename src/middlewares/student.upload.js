// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/students/");
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, unique + path.extname(file.originalname));
//   },
// });

// export const uploadStudentFiles = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "aadhaar_front", maxCount: 1 },
//   { name: "aadhaar_back", maxCount: 1 },
//   { name: "birth_certificate", maxCount: 1 },
//   { name: "transfer_certificate", maxCount: 1 },
//   { name: "marksheets", maxCount: 1 },
// ]);


import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deleteUploadedFile, deleteUploadedFiles } from "../utils/fileStorage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Base upload folder
const baseUploadPath = path.join(__dirname, "../uploads/students");

// Create base folder if not exists
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath, { recursive: true });
}

// 📁 Document folder mapping
const STUDENT_FOLDERS = {
  photo: "photos",
  passport_size_photo: "photos",
  aadhaar_front: "aadhaar",
  aadhaar_back: "aadhaar",
  birth_certificate: "certificates",
  transfer_certificate: "certificates",
  marksheet_10: "marksheets",
  marksheet_12: "marksheets",
  previous_marksheets: "marksheets",
};

// Pre-create common subfolders
Object.values(STUDENT_FOLDERS).forEach((folder) => {
  const fullPath = path.join(baseUploadPath, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/* =========================================
   🔥 STORAGE CONFIG
========================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = STUDENT_FOLDERS[file.fieldname];

    if (!folder) {
      if (file.fieldname.includes("aadhaar")) folder = "aadhaar";
      else if (file.fieldname.includes("marksheet")) folder = "marksheets";
      else if (file.fieldname.includes("certificate")) folder = "certificates";
      else folder = "others";
    }

    const finalPath = path.join(baseUploadPath, folder);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
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
    cb(new Error("Only JPG, JPEG, PNG, and PDF files are allowed for student documents"));
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
   🔥 STUDENT DOCUMENTS
========================================= */
export const studentDocsUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "passport_size_photo", maxCount: 1 },
  { name: "aadhaar_front", maxCount: 1 },
  { name: "aadhaar_back", maxCount: 1 },
  { name: "birth_certificate", maxCount: 1 },
  { name: "transfer_certificate", maxCount: 1 },
  { name: "marksheet_10", maxCount: 1 },
  { name: "marksheet_12", maxCount: 1 },
  { name: "previous_marksheets", maxCount: 10 },
]);

/* =========================================
   🔥 PERMANENT FILE DELETION HELPERS
========================================= */
export const deleteStudentFile = deleteUploadedFile;
export const deleteStudentFiles = deleteUploadedFiles;