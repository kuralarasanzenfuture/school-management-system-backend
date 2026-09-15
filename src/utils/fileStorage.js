import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const uploadsRoot = path.resolve(projectRoot, "uploads");

const isInsideUploads = (filePath) => {
  const relativePath = path.relative(uploadsRoot, filePath);
  return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
};

const resolveUploadedFilePath = (filePathOrUrl) => {
  if (typeof filePathOrUrl !== "string" || !filePathOrUrl.trim()) {
    return null;
  }

  let value = filePathOrUrl.trim();

  if (/^https?:\/\//i.test(value)) {
    try {
      value = decodeURIComponent(new URL(value).pathname);
    } catch {
      return null;
    }
  } else {
    value = value.split("?")[0].split("#")[0];
  }

  const resolvedPath = path.isAbsolute(value)
    ? path.resolve(value)
    : value.replace(/^[/\\]+/, "").startsWith("uploads")
      ? path.resolve(projectRoot, value.replace(/^[/\\]+/, ""))
      : null;

  return resolvedPath && isInsideUploads(resolvedPath) ? resolvedPath : null;
};

const isProtectedFile = (filePath) => {
  const fileName = path.basename(filePath).toLowerCase();
  return ["default-school-logo", "default-logo", "placeholder"].some((name) =>
    fileName.includes(name),
  );
};

/**
 * Deletes an uploaded file when its resolved path is inside the application
 * uploads directory. Missing files are treated as already deleted.
 */
export const deleteUploadedFile = (filePathOrUrl) => {
  const resolvedPath = resolveUploadedFilePath(filePathOrUrl);

  if (!resolvedPath || isProtectedFile(resolvedPath)) return false;

  try {
    if (!fs.existsSync(resolvedPath)) return false;
    fs.unlinkSync(resolvedPath);
    return true;
  } catch (error) {
    console.error(`[fileStorage] Failed to delete uploaded file: ${error.message}`);
    return false;
  }
};

export const deleteUploadedFiles = (filePaths = []) =>
  filePaths.reduce(
    (deletedCount, filePath) => deletedCount + (deleteUploadedFile(filePath) ? 1 : 0),
    0,
  );
