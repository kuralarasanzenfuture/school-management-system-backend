import { getDB } from "../../../config/db.js";

export const seedEmployeeSalaryStructures = async () => {
  const db = getDB();

  const [employees] = await db.query(`
    SELECT
      id,
      school_id,
      designation
    FROM employees
    ORDER BY school_id, id
  `);

  if (!employees.length) {
    console.log("⚠️ No employees found.");
    return;
  }

  for (const employee of employees) {
    // Random effective date
    const year = 2024 + Math.floor(Math.random() * 3); // 2024-2026
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");

    const effectiveFrom = `${year}-${month}-${day}`;

    // 20% inactive records
    const status = Math.random() > 0.2 ? "active" : "inactive";

    // Structure name (same as your backend logic)
    const structureName = `${
      employee.designation || "Employee"
    } Salary ${year}`;

    await db.query(
      `
      INSERT IGNORE INTO employee_salary_structures
      (
        school_id,
        employee_id,
        structure_name,
        effective_from,
        effective_to,
        status,
        remarks,
        created_by
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        employee.school_id,
        employee.id,
        structureName,
        effectiveFrom,
        null,
        status,
        "Initial salary structure",
        employee.id,
      ],
    );
  }

  console.log(
    `✅ ${employees.length} employee salary structures seeded successfully`,
  );
};
