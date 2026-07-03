import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Base upload folder
const baseUploadPath = path.join(__dirname, "../uploads/schools");

// create folder if not exists
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath, { recursive: true });
}

/* =========================================
   🔥 STORAGE CONFIG
========================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    // Only logo for now
    if (file.fieldname === "logo") folder = "logos";

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
  const allowedTypes = /jpg|jpeg|png/; // logo = image only
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png allowed for logo"));
  }
};

/* =========================================
   🔥 MULTER INSTANCE
========================================= */
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB (logo should be small)
  },
  fileFilter,
});

/* =========================================
   🔥 SCHOOL UPLOAD
========================================= */
export const schoolUpload = upload.fields([
  { name: "logo", maxCount: 1 },
]);