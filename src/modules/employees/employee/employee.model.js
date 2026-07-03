import { getDB } from "../../../config/db.js";

export const EmployeeModel = {
  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO employees SET ?`,
      [data]
    );
    return result.insertId;
  },

  findAll: async () => {
    const db = getDB();
    const [rows] = await db.query(`SELECT * FROM employees`);
    return rows;
  },

  findById: async (id) => {
    const db = getDB();
    const [[row]] = await db.query(
      `SELECT * FROM employees WHERE id=?`,
      [id]
    );
    return row;
  },

  update: async (conn, id, data) => {
    await conn.query(`UPDATE employees SET ? WHERE id=?`, [data, id]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM employees WHERE id=?`, [id]);
  },
};

export const EmployeeDocumentModel = {
  createBulk: async (conn, docs) => {
    if (!docs.length) return;

    const values = docs.map((d) => [
      d.employee_id,
      d.document_type,
      d.file_name,
      d.file_url,
    ]);

    await conn.query(
      `INSERT INTO employee_documents 
      (employee_id, document_type, file_name, file_url)
      VALUES ?`,
      [values],
    );
  },
};
