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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Base upload folder
const baseUploadPath = path.join(__dirname, "../uploads/students");

// create folder if not exists
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath, { recursive: true });
}

/* =========================================
   🔥 STORAGE CONFIG
========================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 📁 Dynamic folders per document type
    let folder = "others";

    if (file.fieldname === "photo") folder = "photos";
    else if (file.fieldname.includes("aadhaar")) folder = "aadhaar";
    else if (file.fieldname.includes("marksheet")) folder = "marksheets";
    else if (file.fieldname.includes("certificate")) folder = "certificates";

    const finalPath = path.join(baseUploadPath, folder);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

/* =========================================
   🔥 FILE FILTER
========================================= */
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, pdf allowed"));
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

  { name: "aadhaar_front", maxCount: 1 },
  { name: "aadhaar_back", maxCount: 1 },

  { name: "birth_certificate", maxCount: 1 },
  { name: "transfer_certificate", maxCount: 1 },

  { name: "marksheet_10", maxCount: 1 },
  { name: "marksheet_12", maxCount: 1 },

  { name: "previous_marksheets", maxCount: 1 },
]);