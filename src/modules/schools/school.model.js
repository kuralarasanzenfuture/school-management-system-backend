import { getDB } from "../../config/db.js";

export const SchoolModel = {

//   async create(connection, data) {
//     const [result] = await connection.query(
//       `
//       INSERT INTO schools
//       (name, code, email, phone, city, state, country, status)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//       `,
//       [
//         data.name,
//         data.code,
//         data.email,
//         data.phone,
//         data.city,
//         data.state,
//         data.country,
//         data.status,
//       ]
//     );

//     return result.insertId;
//   },

async create(connection, data) {
  const [result] = await connection.query(
    `
    INSERT INTO schools (
      name, code, email, phone,
      address_line1, address_line2,
      city, district, state, country, postal_code,
      logo_url, website, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.name,
      data.code,
      data.email,
      data.phone,
      data.address_line1,
      data.address_line2,
      data.city,
      data.district,
      data.state,
      data.country,
      data.postal_code,
      data.logo_url,
      data.website,
      data.status
    ]
  );

  return result.insertId;
},

  async findByCode(code) {
    const db = getDB();

    const [[school]] = await db.query(
      `SELECT id FROM schools WHERE code = ?`,
      [code]
    );

    return school;
  },

  async findById(id) {
    const db = getDB();

    const [[school]] = await db.query(
      `SELECT * FROM schools WHERE id = ?`,
      [id]
    );

    return school;
  },

  async getAll() {
    const db = getDB();

    const [rows] = await db.query(
      `SELECT * FROM schools ORDER BY id DESC`
    );

    return rows;
  },

  async update(connection, id, fields, values) {
    await connection.query(
      `UPDATE schools SET ${fields.join(", ")} WHERE id=?`,
      [...values, id]
    );
  },

  async delete(connection, id) {
    await connection.query(
      `DELETE FROM schools WHERE id=?`,
      [id]
    );
  }

};