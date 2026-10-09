import { sanitizeData } from "./audit.sanitizer.js";
import { formatFieldLabel, stringifyValue, getDataType } from "./audit.helper.js";

const DEFAULT_IGNORED_FIELDS = ["updated_at", "created_at"];

/**
 * Builds a clean, sanitized snapshot of a data record
 *
 * @param {object | null} record
 * @returns {object | null}
 */
export const buildSnapshot = (record) => {
  if (!record || typeof record !== "object") return null;
  return sanitizeData(JSON.parse(JSON.stringify(record)));
};

/**
 * Compares old and new records to calculate field-level diffs
 *
 * @param {object | null} oldRecord - Snapshot before modification
 * @param {object | null} newRecord - Snapshot after modification
 * @param {object} [options={}]
 * @param {string[]} [options.ignoreFields] - Fields to skip (e.g. ['updated_at'])
 * @returns {{
 *   changes: Array<{
 *     field_name: string,
 *     field_label: string,
 *     data_type: string,
 *     old_value: string | null,
 *     new_value: string | null
 *   }>,
 *   change_data: Record<string, { old: any, new: any }>
 * }}
 */
export const calculateDiff = (oldRecord, newRecord, options = {}) => {
  const ignored = new Set([...DEFAULT_IGNORED_FIELDS, ...(options.ignoreFields || [])]);

  const sanitizedOld = oldRecord ? sanitizeData(JSON.parse(JSON.stringify(oldRecord))) : {};
  const sanitizedNew = newRecord ? sanitizeData(JSON.parse(JSON.stringify(newRecord))) : {};

  const allKeys = new Set([
    ...Object.keys(sanitizedOld || {}),
    ...Object.keys(sanitizedNew || {}),
  ]);

  const changes = [];
  const changeData = {};

  for (const key of allKeys) {
    if (ignored.has(key)) continue;

    const oldVal = sanitizedOld ? sanitizedOld[key] : undefined;
    const newVal = sanitizedNew ? sanitizedNew[key] : undefined;

    // Normalize comparison: stringify objects/arrays or loose compare primitive values
    const oldStr = stringifyValue(oldVal);
    const newStr = stringifyValue(newVal);

    if (oldStr !== newStr) {
      changes.push({
        field_name: key,
        field_label: formatFieldLabel(key),
        data_type: getDataType(newVal !== undefined ? newVal : oldVal),
        old_value: oldStr,
        new_value: newStr,
      });

      changeData[key] = {
        old: oldVal !== undefined ? oldVal : null,
        new: newVal !== undefined ? newVal : null,
      };
    }
  }

  return {
    changes,
    change_data: Object.keys(changeData).length > 0 ? changeData : null,
  };
};

export default {
  buildSnapshot,
  calculateDiff,
};
