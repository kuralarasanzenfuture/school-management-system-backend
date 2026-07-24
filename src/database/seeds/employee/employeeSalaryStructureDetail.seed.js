import { getDB } from "../../../config/db.js";

export const seedEmployeeSalaryStructureDetails = async () => {
  const db = getDB();

  // Get all salary structures with school_id
  const [structures] = await db.query(`
    SELECT
      id,
      school_id
    FROM employee_salary_structures
    ORDER BY id
  `);

  if (!structures.length) {
    console.log("⚠️ No salary structures found.");
    return;
  }

  for (const structure of structures) {
    // Components for the same school
    const [components] = await db.query(
      `
      SELECT
        id,
        code,
        component_type,
        calculation_type
      FROM employee_salary_components
      WHERE school_id = ?
      ORDER BY id
      `,
      [structure.school_id],
    );

    for (const component of components) {
      let amount = null;
      let percentage = null;
      let basedOn = "basic";

      if (component.calculation_type === "fixed") {
        switch (component.code) {
          case "BASIC":
            amount = 25000;
            break;

          case "TA":
            amount = 2000;
            break;

          case "MEDICAL":
            amount = 1500;
            break;

          case "SPECIAL":
            amount = 3000;
            break;

          case "BONUS":
            amount = 1000;
            break;

          case "OT":
            amount = 500;
            break;

          case "PT":
            amount = 200;
            break;

          case "LOAN":
          case "LATE":
          case "LEAVE":
          case "OTHER":
            amount = 0;
            break;

          default:
            amount = 1000;
        }
      } else {
        switch (component.code) {
          case "HRA":
            percentage = 40;
            basedOn = "basic";
            break;

          case "DA":
            percentage = 12;
            basedOn = "basic";
            break;

          case "PF":
            percentage = 12;
            basedOn = "basic";
            break;

          case "ESI":
            percentage = 0.75;
            basedOn = "gross";
            break;

          case "TDS":
            percentage = 10;
            basedOn = "gross";
            break;

          default:
            percentage = 5;
            basedOn = "basic";
        }
      }

      await db.query(
        `
        INSERT IGNORE INTO employee_salary_structure_details
        (
          salary_structure_id,
          component_id,
          calculation_type,
          amount,
          percentage,
          based_on
        )
        VALUES
        (?, ?, ?, ?, ?, ?)
        `,
        [
          structure.id,
          component.id,
          component.calculation_type,
          amount,
          percentage,
          basedOn,
        ],
      );
    }

    console.log(
      `✅ Salary Structure Details seeded for Structure ID ${structure.id}`,
    );
  }

  console.log("🎉 Employee Salary Structure Details seeded successfully.");
};
