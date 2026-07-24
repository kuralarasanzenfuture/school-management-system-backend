import { getDB } from "../../../config/db.js";

// export const EmployeeModel = {
//   create: async (conn, data) => {
//     const [result] = await conn.query(`INSERT INTO employees SET ?`, [data]);
//     return result.insertId;
//   },

//   findAll: async () => {
//     const db = getDB();
//     const [rows] = await db.query(`SELECT * FROM employees`);
//     return rows;
//   },

//   findById: async (id) => {
//     const db = getDB();
//     const [[row]] = await db.query(`SELECT * FROM employees WHERE id=?`, [id]);
//     return row;
//   },

//   update: async (conn, id, data) => {
//     await conn.query(`UPDATE employees SET ? WHERE id=?`, [data, id]);
//   },

//   delete: async (conn, id) => {
//     await conn.query(`DELETE FROM employees WHERE id=?`, [id]);
//   },
// };

/*===============================================*/

export const EmployeeModel = {
  /* =================================================================
     CREATE
     Uses the clean 'SET ?' mapping feature. Make sure your payload
     object fields match your MySQL table column names exactly.
  ================================================================= */
  async create(conn, data) {
    const [result] = await conn.query(`INSERT INTO employees SET ?`, [data]);
    return result.insertId;
  },

  /* =================================================================
     FIND ALL (WITH RELATIONS)
  ================================================================= */
  async findAll() {
    const db = getDB();
    const [rows] = await db.query(`
      SELECT 
        e.*,
        u.username,
        u.email AS user_email,
        s.name AS school_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      JOIN schools s ON e.school_id = s.id
      ORDER BY e.id DESC
    `);
    return rows;
  },

  /* =================================================================
     FIND BY ID (DETAILED)
     Fixed context: Uses standard 'conn/db' instance parameter passed 
     consistently down from the parent controller route layer.
  ================================================================= */
  async findById(conn, id) {
    const [[row]] = await conn.query(
      `
      SELECT 
        e.*,
        u.username,
        u.email AS user_email,
        s.name AS school_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      JOIN schools s ON e.school_id = s.id
      WHERE e.id = ?
    `,
      [id],
    );
    return row;
  },

  /* =================================================================
     LOCKED FETCH (FOR UPDATE)
  ================================================================= */
  async findByIdForUpdate(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM employees WHERE id = ? FOR UPDATE`,
      [id],
    );
    return row;
  },

  /* =================================================================
     FIND BY USER
  ================================================================= */
  async findByUserId(conn, user_id) {
    const [[row]] = await conn.query(
      `SELECT id, user_id FROM employees WHERE user_id = ?`,
      [user_id],
    );
    return row;
  },

  /* =================================================================
     UPDATE (SAFE)
  ================================================================= */
  async update(conn, id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (!fields.length) return;

    values.push(id);

    await conn.query(
      `
      UPDATE employees
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values,
    );
  },

  /* =================================================================
     DELETE
  ================================================================= */
  async delete(conn, id) {
    await conn.query(`DELETE FROM employees WHERE id = ?`, [id]);
  },

  /* =================================================================
     ASSIGN USER / UNASSIGN USER
  ================================================================= */
  async assignUser(conn, employee_id, user_id) {
    await conn.query(`UPDATE employees SET user_id = ? WHERE id = ?`, [
      user_id,
      employee_id,
    ]);
  },

  async unassignUser(conn, employee_id) {
    await conn.query(`UPDATE employees SET user_id = NULL WHERE id = ?`, [
      employee_id,
    ]);
  },
};

/*==================================================================================================*/

// export const EmployeeDocumentModel = {
//   createBulk: async (conn, docs) => {
//     if (!docs.length) return;

//     const values = docs.map((d) => [
//       d.employee_id,
//       d.document_type,
//       d.file_name,
//       d.file_url,
//     ]);

//     await conn.query(
//       `INSERT INTO employee_documents
//       (employee_id, document_type, file_name, file_url)
//       VALUES ?`,
//       [values],
//     );
//   },
// };

/*==================================================================================================*/

export const EmployeeDocumentModel = {
  async createBulk(conn, docs) {
    if (!Array.isArray(docs) || docs.length === 0) return;

    const values = docs.map((d) => [
      d.employee_id,
      d.document_type,
      d.file_name,
      d.file_url,
    ]);

    await conn.query(
      `
      INSERT INTO employee_documents
      (employee_id, document_type, file_name, file_url)
      VALUES ?
      `,
      [values],
    );
  },

  async findByEmployeeId(db, employee_id) {
    const [rows] = await db.query(
      `SELECT * FROM employee_documents WHERE employee_id=?`,
      [employee_id],
    );
    return rows;
  },

  async deleteByEmployeeId(conn, employee_id) {
    await conn.query(`DELETE FROM employee_documents WHERE employee_id=?`, [
      employee_id,
    ]);
  },
};
