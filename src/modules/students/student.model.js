import { getDB } from "../../config/db.js";

export const StudentModel = {
  //   create: async (conn, data) => {
  //     const [result] = await conn.query(
  //       `INSERT INTO students SET ?`,
  //       [data]
  //     );
  //     return result.insertId;
  //   },

  //   create: async (conn, data) => {
  //     const allowedFields = [
  //       "school_id",
  //       "admission_no",
  //       "first_name",
  //       "middle_name",
  //       "last_name",
  //       "email",
  //       "mobile_no",
  //       "date_of_birth",
  //       "gender",
  //       "blood_group",
  //       "aadhaar_no",
  //       "religion",
  //       "nationality",
  //       "mother_tongue",
  //       "photo_url",
  //       "current_area",
  //       "current_city",
  //       "current_district",
  //       "current_state",
  //       "current_postal_code",
  //       "current_address",
  //       "current_address_same_as_permanent",
  //       "permanent_address",
  //       "permanent_area",
  //       "permanent_city",
  //       "permanent_district",
  //       "permanent_state",
  //       "permanent_postal_code",
  //       "birth_certificate_url",
  //       "aadhaar_front_url",
  //       "aadhaar_back_url",
  //       "transfer_certificate_url",
  //       "previous_marksheets_url",
  //       "passport_size_photo_url",
  //       "father_name",
  //       "mother_name",
  //       "father_occupation",
  //       "mother_occupation",
  //       "parent_mobile",
  //       "alternate_mobile",
  //       "parent_email",
  //       "emergency_contact",
  //       "emergency_relationship",
  //       "allergies",
  //       "chronic_conditions",
  //       "status",
  //     ];

  //     // 🔥 filter only allowed fields
  //     const filteredData = {};
  //     for (const key of allowedFields) {
  //       if (data[key] !== undefined) {
  //         filteredData[key] = data[key];
  //       }
  //     }

  //     const fields = Object.keys(filteredData);
  //     const values = Object.values(filteredData);
  //     const placeholders = fields.map(() => "?").join(",");

  //     const query = `
  //     INSERT INTO students (${fields.join(",")})
  //     VALUES (${placeholders})
  //   `;

  //     const [result] = await conn.query(query, values);

  //     return result.insertId;
  //   },

  create: async (conn, data) => {
    const [result] = await conn.query(
      `INSERT INTO students (
    school_id, admission_no, first_name, middle_name, last_name,
    email, mobile_no, date_of_birth, gender, blood_group,
    aadhaar_no, religion, nationality, mother_tongue, photo_url,
    current_area, current_city, current_district, current_state, current_postal_code,
    current_address, current_address_same_as_permanent,
    permanent_address, permanent_area, permanent_city, permanent_district,
    permanent_state, permanent_postal_code,
    birth_certificate_url, aadhaar_front_url, aadhaar_back_url,
    transfer_certificate_url, previous_marksheets_url,
    father_name, mother_name, father_occupation, mother_occupation,
    parent_mobile, alternate_mobile, parent_email,
    emergency_contact, emergency_relationship,
    allergies, chronic_conditions, status
  ) VALUES (
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?
)`,
      [
        data.school_id,
        data.admission_no,
        data.first_name,
        data.middle_name,
        data.last_name,
        data.email,
        data.mobile_no,
        data.date_of_birth,
        data.gender,
        data.blood_group,
        data.aadhaar_no,
        data.religion,
        data.nationality,
        data.mother_tongue,
        data.photo_url,

        data.current_area,
        data.current_city,
        data.current_district,
        data.current_state,
        data.current_postal_code,
        data.current_address,
        data.current_address_same_as_permanent,

        data.permanent_address,
        data.permanent_area,
        data.permanent_city,
        data.permanent_district,
        data.permanent_state,
        data.permanent_postal_code,

        data.birth_certificate_url,
        data.aadhaar_front_url,
        data.aadhaar_back_url,
        data.transfer_certificate_url,
        data.previous_marksheets_url,

        data.father_name,
        data.mother_name,
        data.father_occupation,
        data.mother_occupation,
        data.parent_mobile,
        data.alternate_mobile,
        data.parent_email,
        data.emergency_contact,
        data.emergency_relationship,

        data.allergies,
        data.chronic_conditions,
        data.status,
      ],
    );

    return result.insertId;
  },

  findById: async (id) => {
    const db = getDB();
    const [[row]] = await db.query(`SELECT * FROM students WHERE id=?`, [id]);
    return row;
  },

  getAll: async () => {
    const db = getDB();
    const [rows] = await db.query(`SELECT * FROM students ORDER BY id DESC`);
    return rows;
  },

  update: async (conn, id, data) => {
    await conn.query(`UPDATE students SET ? WHERE id=?`, [data, id]);
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM students WHERE id=?`, [id]);
  },
};
