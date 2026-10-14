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
    console.log("Insert Values:", [
      data.school_id,
      data.student_code,
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

        data.status,
        data.created_by || null,
        data.updated_by || null,
      ]);
    const [result] = await conn.query(
      `INSERT INTO students (
    school_id, student_code, first_name, middle_name, last_name,
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
    status, created_by, updated_by
  ) VALUES (
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?
)`,
      [
        data.school_id,
        data.student_code,
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

        data.status,
        data.created_by || null,
        data.updated_by || null,
      ],
    );

    return result.insertId;
  },

  findById: async (id, connection = null) => {
    const db = connection || getDB();
    const [[row]] = await db.query(
      `
      SELECT 
        st.*,
        s.name AS school_name
      FROM students st
      JOIN schools s ON st.school_id = s.id
      WHERE st.id = ?
      `,
      [id],
    );
    return row || null;
  },

  getAll: async () => {
    const db = getDB();
    const [rows] = await db.query(
      `
      SELECT 
        st.*,
        s.name AS school_name
      FROM students st
      JOIN schools s ON st.school_id = s.id
      ORDER BY st.id DESC
      `,
    );
    return rows;
  },

  findAll: async (filters = {}) => {
    const db = getDB();
    const {
      school_id,
      status,
      gender,
      blood_group,
      student_code,
      name,
      first_name,
      last_name,
      email,
      mobile_no,
      aadhaar_no,
      search,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "DESC",
      paginate = true,
    } = filters;

    const conditions = [];
    const params = [];

    if (school_id) {
      conditions.push("st.school_id = ?");
      params.push(school_id);
    }

    if (status) {
      if (status === "none") {
        conditions.push("1 = 0");
      } else if (Array.isArray(status)) {
        if (status.length === 1) {
          conditions.push("st.status = ?");
          params.push(status[0]);
        } else if (status.length > 1) {
          conditions.push(`st.status IN (${status.map(() => "?").join(", ")})`);
          params.push(...status);
        }
      } else {
        conditions.push("st.status = ?");
        params.push(status);
      }
    }

    if (gender) {
      conditions.push("st.gender = ?");
      params.push(gender);
    }

    if (blood_group) {
      conditions.push("st.blood_group = ?");
      params.push(blood_group);
    }

    if (student_code) {
      conditions.push("st.student_code LIKE ?");
      params.push(`%${student_code}%`);
    }

    if (first_name) {
      conditions.push("st.first_name LIKE ?");
      params.push(`%${first_name}%`);
    }

    if (last_name) {
      conditions.push("st.last_name LIKE ?");
      params.push(`%${last_name}%`);
    }

    if (name) {
      conditions.push(
        "(st.first_name LIKE ? OR st.last_name LIKE ? OR CONCAT(st.first_name, ' ', st.last_name) LIKE ?)",
      );
      params.push(`%${name}%`, `%${name}%`, `%${name}%`);
    }

    if (email) {
      conditions.push("st.email LIKE ?");
      params.push(`%${email}%`);
    }

    if (mobile_no) {
      conditions.push("st.mobile_no LIKE ?");
      params.push(`%${mobile_no}%`);
    }

    if (aadhaar_no) {
      conditions.push("st.aadhaar_no LIKE ?");
      params.push(`%${aadhaar_no}%`);
    }

    if (search) {
      conditions.push(
        `(
          st.first_name LIKE ? OR
          st.last_name LIKE ? OR
          CONCAT(st.first_name, ' ', st.last_name) LIKE ? OR
          st.student_code LIKE ? OR
          st.email LIKE ? OR
          st.mobile_no LIKE ? OR
          st.aadhaar_no LIKE ? OR
          s.name LIKE ?
        )`,
      );
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const allowedSortCols = {
      id: "st.id",
      student_code: "st.student_code",
      first_name: "st.first_name",
      last_name: "st.last_name",
      gender: "st.gender",
      status: "st.status",
      date_of_birth: "st.date_of_birth",
      school_id: "st.school_id",
      school_name: "s.name",
      created_at: "st.created_at",
      updated_at: "st.updated_at",
    };
    const sortCol = allowedSortCols[sortBy] || "st.id";
    const sortDir = sortOrder === "ASC" ? "ASC" : "DESC";

    const countSql = `
      SELECT COUNT(*) as total
      FROM students st
      JOIN schools s ON st.school_id = s.id
      ${whereClause}
    `;
    const [[countResult]] = await db.query(countSql, params);
    const total = Number(countResult?.total) || 0;

    let sql = `
      SELECT 
        st.*,
        s.name AS school_name
      FROM students st
      JOIN schools s ON st.school_id = s.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
    `;

    const queryParams = [...params];

    if (paginate) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
    }

    const [rows] = await db.query(sql, queryParams);

    return {
      students: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  update: async (conn, id, data) => {
    const keys = Object.keys(data);

    if (keys.length === 0) {
      throw { status: 400, message: "No fields to update" };
    }

    const fields = keys.map((key) => `${key} = ?`).join(", ");
    const values = keys.map((key) => data[key]);

    const query = `UPDATE students SET ${fields} WHERE id = ?`;

    await conn.query(query, [...values, id]);
  },

  updateStatus: async (conn, id, status, updated_by = null) => {
    const db = conn || getDB();
    if (updated_by) {
      await db.query(
        `UPDATE students SET status = ?, updated_by = ? WHERE id = ?`,
        [status, updated_by, id],
      );
    } else {
      await db.query(`UPDATE students SET status = ? WHERE id = ?`, [status, id]);
    }
  },

  delete: async (conn, id) => {
    await conn.query(`DELETE FROM students WHERE id=?`, [id]);
  },

  checkReferences: async (id, connection = null) => {
    const db = connection || getDB();
    const [[admissionsCount]] = await db.query(
      `SELECT COUNT(*) as count FROM student_admissions WHERE student_id = ?`,
      [id],
    );
    const admissions = Number(admissionsCount?.count) || 0;
    return {
      admissions,
      total: admissions,
    };
  },
};
