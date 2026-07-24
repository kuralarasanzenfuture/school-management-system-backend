export const createSalaryStructureWithDetails = async (data, user) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const validated = validateCreateStructureWithDetails(data);

    await conn.beginTransaction();

    // =========================
    // 1️⃣ Employee check
    // =========================
    const [[emp]] = await conn.query(
      `SELECT id, school_id, designation 
       FROM employees WHERE id=?`,
      [validated.employee_id],
    );

    if (!emp) {
      throw { status: 404, message: "Employee not found" };
    }

    // =========================
    // 2️⃣ Overlap check
    // =========================
    const [overlap] = await conn.query(
      `
      SELECT id FROM employee_salary_structures
      WHERE employee_id=?
      AND (
        (? BETWEEN effective_from AND IFNULL(effective_to,'9999-12-31'))
        OR
        (effective_from BETWEEN ? AND IFNULL(?, '9999-12-31'))
      )
      `,
      [
        validated.employee_id,
        validated.effective_from,
        validated.effective_from,
        validated.effective_to,
      ],
    );

    if (overlap.length) {
      throw {
        status: 400,
        message: "Overlapping salary structure exists",
      };
    }

    // =========================
    // 3️⃣ Auto structure name
    // =========================
    const structure_name = `${emp.designation} Salary ${new Date(
      validated.effective_from,
    ).getFullYear()}`;

    // =========================
    // 4️⃣ Create structure
    // =========================
    const [res] = await conn.query(
      `INSERT INTO employee_salary_structures SET ?`,
      [
        {
          school_id: emp.school_id,
          employee_id: validated.employee_id,
          structure_name,
          effective_from: validated.effective_from,
          effective_to: validated.effective_to,
          status: validated.status,
          remarks: validated.remarks,
          created_by: user?.employee_id || null,
        },
      ],
    );

    const structureId = res.insertId;

    // =========================
    // 5️⃣ Insert components
    // =========================
    const seen = new Set();

    for (const comp of validated.components) {
      // 🔴 duplicate component in request
      if (seen.has(comp.component_id)) {
        throw {
          status: 400,
          message: `Duplicate component_id ${comp.component_id}`,
        };
      }
      seen.add(comp.component_id);

      await conn.query(
        `
        INSERT INTO employee_salary_structure_details
        SET ?
        `,
        [
          {
            salary_structure_id: structureId,
            component_id: comp.component_id,
            calculation_type: comp.calculation_type,
            amount: comp.amount,
            percentage: comp.percentage,
            based_on: comp.based_on,
          },
        ],
      );
    }

    await conn.commit();

    return {
      message: "Salary structure created successfully",
      structure_id: structureId,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
