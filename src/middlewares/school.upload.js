import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getImageUrl } from "../utils/imageUrl.js";
import { deleteUploadedFile, deleteUploadedFiles } from "../utils/fileStorage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Base upload folder
const baseUploadPath = path.join(__dirname, "../uploads/schools");
const logoUploadPath = path.join(baseUploadPath, "logos");

// create folder if not exists
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath, { recursive: true });
}
if (!fs.existsSync(logoUploadPath)) {
  fs.mkdirSync(logoUploadPath, { recursive: true });
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
  const allowedExt = /^\.(jpg|jpeg|png|webp)$/i;
  const allowedMime = /^image\/(jpeg|jpg|png|webp)$/i;

  const ext = path.extname(file.originalname).toLowerCase();
  const extValid = allowedExt.test(ext);
  const mimeValid = !file.mimetype || allowedMime.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP image files are allowed for school logo"));
  }
};

/* =========================================
   🔥 MULTER INSTANCE
========================================= */
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter,
});

/* =========================================
   🔥 SCHOOL UPLOAD MIDDLEWARE
========================================= */
export const schoolUpload = upload.fields([
  { name: "logo", maxCount: 1 },
]);

/* =========================================
   🔥 PERMANENT FILE DELETION HELPERS
========================================= */
export const deleteSchoolFile = deleteUploadedFile;
export const deleteSchoolFiles = deleteUploadedFiles;
export const deleteSchoolLogo = deleteSchoolFile;
export const deleteFileSafe = deleteSchoolFile;


/* =========================================
   🔥 URL HELPERS (RELATIVE & FULL URLS)
========================================= */
/**
 * Resolves a full public URL for an uploaded file path.
 *
 * @param {string} relativeUrl - E.g. "/uploads/schools/logos/xxx.jpg"
 * @param {object} req - Express request object (optional)
 * @returns {string|null} Full URL (e.g. "http://localhost:5000/uploads/schools/logos/xxx.jpg")
 */
export const getFullFileUrl = (relativeUrl, req = null) => {
  if (!relativeUrl || typeof relativeUrl !== "string") return null;

  if (
    relativeUrl.startsWith("http://") ||
    relativeUrl.startsWith("https://") ||
    relativeUrl.startsWith("data:")
  ) {
    return relativeUrl;
  }

  // If request host is available and no explicit BASE_URL / BACKEND_URL configured
  if (!process.env.BASE_URL && !process.env.BACKEND_URL && req && typeof req.get === "function") {
    const protocol = req.protocol || "http";
    const host = req.get("host");
    const cleanPath = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
    return `${protocol}://${host}${cleanPath}`;
  }

  return getImageUrl(relativeUrl);
};


/**
 * Attaches both relative path (logo_url) and full absolute URL (full_logo_url / logo_full_url)
 * to a school object.
 *
 * @param {object} school - School database record
 * @param {object} req - Express request object (optional)
 * @returns {object} School object with both relative and full URLs
 */
export const formatSchoolWithLogoUrls = (school, req = null) => {
  if (!school) return null;

  const rawLogo = school.logo_url;
  const cleanLogo = rawLogo
    ? (rawLogo.startsWith("http://") || rawLogo.startsWith("https://") || rawLogo.startsWith("/")
        ? rawLogo
        : `/${rawLogo}`)
    : null;

  const fullUrl = getFullFileUrl(cleanLogo, req);

  return {
    ...school,
    logo_url: cleanLogo,         // e.g. "/uploads/schools/logos/xxx.jpg"
    full_logo_url: fullUrl,      // e.g. "http://localhost:5000/uploads/schools/logos/xxx.jpg"
    logo_full_url: fullUrl,      // alias for convenience
  };
};

