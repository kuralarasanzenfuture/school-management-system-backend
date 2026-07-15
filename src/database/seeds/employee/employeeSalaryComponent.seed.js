import { getDB } from "../../../config/db.js";

export const seedEmployeeSalaryComponents = async () => {
  const db = getDB();

  const [schools] = await db.query(`
    SELECT id
    FROM schools
    ORDER BY id
  `);

  if (!schools.length) {
    console.log("⚠️ No schools found.");
    return;
  }

  const components = [
    // Earnings
    {
      name: "Basic Pay",
      code: "BASIC",
      component_type: "earning",
      calculation_type: "fixed",
    },
    {
      name: "House Rent Allowance",
      code: "HRA",
      component_type: "earning",
      calculation_type: "percentage",
    },
    {
      name: "Dearness Allowance",
      code: "DA",
      component_type: "earning",
      calculation_type: "percentage",
    },
    {
      name: "Travel Allowance",
      code: "TA",
      component_type: "earning",
      calculation_type: "fixed",
    },
    {
      name: "Medical Allowance",
      code: "MA",
      component_type: "earning",
      calculation_type: "fixed",
    },
    {
      name: "Special Allowance",
      code: "SA",
      component_type: "earning",
      calculation_type: "fixed",
    },
    {
      name: "Performance Bonus",
      code: "BONUS",
      component_type: "earning",
      calculation_type: "fixed",
    },
    {
      name: "Overtime",
      code: "OT",
      component_type: "earning",
      calculation_type: "fixed",
    },

    // Deductions
    {
      name: "Provident Fund",
      code: "PF",
      component_type: "deduction",
      calculation_type: "percentage",
    },
    {
      name: "Employee State Insurance",
      code: "ESI",
      component_type: "deduction",
      calculation_type: "percentage",
    },
    {
      name: "Professional Tax",
      code: "PT",
      component_type: "deduction",
      calculation_type: "fixed",
    },
    {
      name: "Income Tax",
      code: "TDS",
      component_type: "deduction",
      calculation_type: "percentage",
    },
    {
      name: "Loan Recovery",
      code: "LOAN",
      component_type: "deduction",
      calculation_type: "fixed",
    },
    {
      name: "Late Attendance",
      code: "LATE",
      component_type: "deduction",
      calculation_type: "fixed",
    },
    {
      name: "Leave Deduction",
      code: "LEAVE",
      component_type: "deduction",
      calculation_type: "fixed",
    },
    {
      name: "Other Deduction",
      code: "OTHER",
      component_type: "deduction",
      calculation_type: "fixed",
    },
  ];

  for (const school of schools) {
    for (const component of components) {
      await db.query(
        `
        INSERT IGNORE INTO employee_salary_components
        (
          school_id,
          name,
          code,
          component_type,
          calculation_type,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'active')
        `,
        [
          school.id,
          component.name,
          component.code,
          component.component_type,
          component.calculation_type,
        ],
      );
    }

    console.log(
      `✅ ${components.length} salary components seeded for School ID ${school.id}`,
    );
  }

  console.log("🎉 Employee salary components seeded successfully.");
};
