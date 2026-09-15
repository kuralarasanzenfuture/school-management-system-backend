import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getImageUrl } from "../utils/imageUrl.js";


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

    const uniqueName = `${Date.now()}-${cleanBase || file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

/* =========================================
   🔥 FILE FILTER
========================================= */
const fileFilter = (req, file, cb) => {
  const allowedExt = /jpg|jpeg|png|webp/;
  const allowedMime = /^image\/(jpeg|jpg|png|webp)$/;

  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mimeValid = allowedMime.test(file.mimetype);
  const extValid = allowedExt.test(ext);

  if (extValid && (mimeValid || !file.mimetype)) {
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
   🔥 PERMANENT FILE DELETION HELPER
========================================= */
/**
 * Permanently deletes a stored school file (e.g. logo) from the filesystem.
 * Handles relative URLs (/uploads/schools/logos/...), absolute paths, or full URLs.
 * Protects default placeholders and prevents directory traversal.
 *
 * @param {string} filePathOrUrl - The relative URL, absolute path, or filename of the file
 * @returns {boolean} true if deleted successfully, false otherwise
 */
export const deleteSchoolFile = (filePathOrUrl) => {
  if (!filePathOrUrl || typeof filePathOrUrl !== "string") {
    return false;
  }

  // 🛡️ Protect default logos / placeholders from being deleted
  if (
    filePathOrUrl.includes("default-school-logo") ||
    filePathOrUrl.includes("default-logo") ||
    filePathOrUrl.includes("placeholder")
  ) {
    return false;
  }

  try {
    let cleanPath = filePathOrUrl.trim();

    // If HTTP/HTTPS URL, extract pathname
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      try {
        cleanPath = new URL(cleanPath).pathname;
      } catch {
        // use string as-is if URL constructor fails
      }
    }

    // Strip URL query parameters or hash
    cleanPath = cleanPath.split("?")[0].split("#")[0];

    // Resolve target path on disk
    let targetPath;
    if (path.isAbsolute(cleanPath) && fs.existsSync(cleanPath)) {
      targetPath = cleanPath;
    } else {
      const relativePath = cleanPath.replace(/^[/\\]+/, "");

      if (relativePath.startsWith("uploads")) {
        targetPath = path.resolve(__dirname, "..", relativePath);
      } else {
        targetPath = path.resolve(logoUploadPath, path.basename(relativePath));
      }
    }

    // Security guard: Ensure target path resides inside the uploads directory
    const uploadsRoot = path.resolve(__dirname, "../uploads");
    const resolvedTarget = path.resolve(targetPath);
    if (!resolvedTarget.startsWith(uploadsRoot)) {
      console.warn(`[deleteSchoolFile] Prevented unauthorized file deletion outside uploads: ${resolvedTarget}`);
      return false;
    }

    if (fs.existsSync(resolvedTarget)) {
      fs.unlinkSync(resolvedTarget);
      console.log(`[deleteSchoolFile] File permanently deleted: ${resolvedTarget}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`[deleteSchoolFile] Failed to permanently delete file (${filePathOrUrl}):`, error.message);
    return false;
  }
};

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
