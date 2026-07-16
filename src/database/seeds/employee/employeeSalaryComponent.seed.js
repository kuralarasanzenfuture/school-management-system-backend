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

/*------------------------------------------------------------*/

// export const seedEmployeeSalaryComponents = async () => {
//   const db = getDB();

//   const [schools] = await db.query("SELECT id FROM schools ORDER BY id");

//   if (!schools.length) {
//     console.log("⚠️ No schools found.");
//     return;
//   }

//   const components = [
//     // Earnings
//     {
//       name: "BASIC PAY",
//       code: "BASIC",
//       component_type: "earning",
//       calculation_type: "fixed",
//       is_taxable: true,
//     },
//     {
//       name: "HOUSE RENT ALLOWANCE",
//       code: "HRA",
//       component_type: "earning",
//       calculation_type: "percentage",
//       is_taxable: true,
//     },
//     {
//       name: "DEARNESS ALLOWANCE",
//       code: "DA",
//       component_type: "earning",
//       calculation_type: "percentage",
//       is_taxable: true,
//     },
//     {
//       name: "TRAVEL ALLOWANCE",
//       code: "TA",
//       component_type: "earning",
//       calculation_type: "fixed",
//       is_taxable: true,
//     },
//     {
//       name: "MEDICAL ALLOWANCE",
//       code: "MEDICAL",
//       component_type: "earning",
//       calculation_type: "fixed",
//       is_taxable: true,
//     },
//     {
//       name: "SPECIAL ALLOWANCE",
//       code: "SPECIAL",
//       component_type: "earning",
//       calculation_type: "fixed",
//       is_taxable: true,
//     },
//     {
//       name: "BONUS",
//       code: "BONUS",
//       component_type: "earning",
//       calculation_type: "fixed",
//       is_taxable: true,
//     },
//     {
//       name: "OVERTIME",
//       code: "OT",
//       component_type: "earning",
//       calculation_type: "fixed",
//       is_taxable: true,
//     },

//     // Deductions
//     {
//       name: "PROVIDENT FUND",
//       code: "PF",
//       component_type: "deduction",
//       calculation_type: "percentage",
//       is_taxable: false,
//     },
//     {
//       name: "EMPLOYEE STATE INSURANCE",
//       code: "ESI",
//       component_type: "deduction",
//       calculation_type: "percentage",
//       is_taxable: false,
//     },
//     {
//       name: "PROFESSIONAL TAX",
//       code: "PT",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       is_taxable: false,
//     },
//     {
//       name: "INCOME TAX",
//       code: "TDS",
//       component_type: "deduction",
//       calculation_type: "percentage",
//       is_taxable: false,
//     },
//     {
//       name: "LOAN RECOVERY",
//       code: "LOAN",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       is_taxable: false,
//     },
//     {
//       name: "LATE PENALTY",
//       code: "LATE",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       is_taxable: false,
//     },
//     {
//       name: "LEAVE DEDUCTION",
//       code: "LEAVE",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       is_taxable: false,
//     },
//     {
//       name: "OTHER DEDUCTION",
//       code: "OTHER",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       is_taxable: false,
//     },
//   ];

//   for (const school of schools) {
//     for (const component of components) {
//       await db.query(
//         `
//         INSERT IGNORE INTO employee_salary_components
//         (
//           school_id,
//           name,
//           code,
//           component_type,
//           calculation_type,
//           is_taxable,
//           status
//         )
//         VALUES (?, ?, ?, ?, ?, ?, 'active')
//         `,
//         [
//           school.id,
//           component.name,
//           component.code,
//           component.component_type,
//           component.calculation_type,
//           component.is_taxable,
//         ],
//       );
//     }

//     console.log(`✅ Salary components seeded for School ID ${school.id}`);
//   }

//   console.log("✅ Employee salary components seeded successfully");
// };


// ---------------------------------------------------------

// export const seedEmployeeSalaryComponents = async () => {
//   const db = getDB();

//   const [schools] = await db.query(
//     "SELECT id FROM schools ORDER BY id"
//   );

//   if (!schools.length) {
//     console.log("⚠️ No schools found.");
//     return;
//   }

//   const components = [
//     // ========================
//     // Earnings
//     // ========================

//     {
//       name: "BASIC PAY",
//       code: "BASIC",
//       component_type: "earning",
//       calculation_type: "fixed",
//       default_value: 15000,
//       percentage_of: null,
//       is_taxable: true,
//       is_pf_applicable: true,
//       is_esi_applicable: true,
//       display_order: 1,
//       is_system: true,
//     },
//     {
//       name: "HOUSE RENT ALLOWANCE",
//       code: "HRA",
//       component_type: "earning",
//       calculation_type: "percentage",
//       default_value: 40,
//       percentage_of: "BASIC",
//       is_taxable: true,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 2,
//       is_system: true,
//     },
//     {
//       name: "DEARNESS ALLOWANCE",
//       code: "DA",
//       component_type: "earning",
//       calculation_type: "percentage",
//       default_value: 12,
//       percentage_of: "BASIC",
//       is_taxable: true,
//       is_pf_applicable: true,
//       is_esi_applicable: true,
//       display_order: 3,
//       is_system: true,
//     },
//     {
//       name: "TRAVEL ALLOWANCE",
//       code: "TA",
//       component_type: "earning",
//       calculation_type: "fixed",
//       default_value: 1500,
//       percentage_of: null,
//       is_taxable: true,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 4,
//       is_system: true,
//     },
//     {
//       name: "MEDICAL ALLOWANCE",
//       code: "MEDICAL",
//       component_type: "earning",
//       calculation_type: "fixed",
//       default_value: 1250,
//       percentage_of: null,
//       is_taxable: true,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 5,
//       is_system: true,
//     },
//     {
//       name: "SPECIAL ALLOWANCE",
//       code: "SPECIAL",
//       component_type: "earning",
//       calculation_type: "fixed",
//       default_value: 2000,
//       percentage_of: null,
//       is_taxable: true,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 6,
//       is_system: true,
//     },
//     {
//       name: "BONUS",
//       code: "BONUS",
//       component_type: "earning",
//       calculation_type: "fixed",
//       default_value: 0,
//       percentage_of: null,
//       is_taxable: true,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 7,
//       is_system: true,
//     },
//     {
//       name: "OVERTIME",
//       code: "OT",
//       component_type: "earning",
//       calculation_type: "fixed",
//       default_value: 0,
//       percentage_of: null,
//       is_taxable: true,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 8,
//       is_system: true,
//     },

//     // ========================
//     // Deductions
//     // ========================

//     {
//       name: "PROVIDENT FUND",
//       code: "PF",
//       component_type: "deduction",
//       calculation_type: "percentage",
//       default_value: 12,
//       percentage_of: "BASIC",
//       is_taxable: false,
//       is_pf_applicable: true,
//       is_esi_applicable: false,
//       display_order: 20,
//       is_system: true,
//     },
//     {
//       name: "EMPLOYEE STATE INSURANCE",
//       code: "ESI",
//       component_type: "deduction",
//       calculation_type: "percentage",
//       default_value: 0.75,
//       percentage_of: "GROSS",
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: true,
//       display_order: 21,
//       is_system: true,
//     },
//     {
//       name: "PROFESSIONAL TAX",
//       code: "PT",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       default_value: 200,
//       percentage_of: null,
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 22,
//       is_system: true,
//     },
//     {
//       name: "INCOME TAX",
//       code: "TDS",
//       component_type: "deduction",
//       calculation_type: "percentage",
//       default_value: 10,
//       percentage_of: "TAXABLE",
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 23,
//       is_system: true,
//     },
//     {
//       name: "LOAN RECOVERY",
//       code: "LOAN",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       default_value: 0,
//       percentage_of: null,
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 24,
//       is_system: false,
//     },
//     {
//       name: "LATE PENALTY",
//       code: "LATE",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       default_value: 0,
//       percentage_of: null,
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 25,
//       is_system: false,
//     },
//     {
//       name: "LEAVE DEDUCTION",
//       code: "LEAVE",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       default_value: 0,
//       percentage_of: null,
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 26,
//       is_system: false,
//     },
//     {
//       name: "OTHER DEDUCTION",
//       code: "OTHER",
//       component_type: "deduction",
//       calculation_type: "fixed",
//       default_value: 0,
//       percentage_of: null,
//       is_taxable: false,
//       is_pf_applicable: false,
//       is_esi_applicable: false,
//       display_order: 27,
//       is_system: false,
//     },
//   ];

//   for (const school of schools) {
//     for (const component of components) {
//       await db.query(
//         `
//         INSERT IGNORE INTO employee_salary_components
//         (
//           school_id,
//           name,
//           code,
//           component_type,
//           calculation_type,
//           default_value,
//           percentage_of,
//           is_taxable,
//           is_pf_applicable,
//           is_esi_applicable,
//           display_order,
//           is_system,
//           is_active,
//           status
//         )
//         VALUES
//         (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active')
//         `,
//         [
//           school.id,
//           component.name,
//           component.code,
//           component.component_type,
//           component.calculation_type,
//           component.default_value,
//           component.percentage_of,
//           component.is_taxable,
//           component.is_pf_applicable,
//           component.is_esi_applicable,
//           component.display_order,
//           component.is_system,
//         ]
//       );
//     }

//     console.log(`✅ Salary components seeded for School ID ${school.id}`);
//   }

//   console.log("🎉 Employee salary components seeded successfully.");
// };

