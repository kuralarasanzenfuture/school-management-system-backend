import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔴 BASE UPLOAD PATH
const basePath = path.join(__dirname, "../uploads/employees");

// 🔴 CREATE FOLDERS
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

// 🔴 STORAGE LOGIC (DYNAMIC FOLDER)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname; // matches DB column name
    cb(null, path.join(basePath, folder));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + cleanName);
  } ,
});

// 🔴 FILE FILTER
const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, PDF allowed"));
  }
};

// 🔴 MULTER INSTANCE
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// 🔥 EXPORT FIELDS (MATCH DB COLUMN NAMES)
export const employeeUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "aadhaar_card", maxCount: 1 },
  { name: "pan_card", maxCount: 1 },
  { name: "passport_size_photo", maxCount: 1 },
  { name: "degree_certificate", maxCount: 1 },
  { name: "experience_certificate", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);
