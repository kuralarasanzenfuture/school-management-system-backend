import { getDB } from "../../config/db.js";

export const seedEmployeeLeaveTypes = async () => {
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

  const leaveTypes = [
    {
      name: "Casual Leave",
      code: "CL",
      description: "Casual leave for personal work.",
      days: 12,
      maxRequest: 3,
      paid: true,
      carryForward: false,
      carryDays: 0,
      halfDay: true,
      approval: true,
      attachment: false,
      gender: "all",
      status: "active",
    },
    {
      name: "Sick Leave",
      code: "SL",
      description: "Medical leave due to illness.",
      days: 12,
      maxRequest: 15,
      paid: true,
      carryForward: true,
      carryDays: 10,
      halfDay: true,
      approval: true,
      attachment: true,
      gender: "all",
      status: "active",
    },
    {
      name: "Earned Leave",
      code: "EL",
      description: "Annual earned leave.",
      days: 18,
      maxRequest: 30,
      paid: true,
      carryForward: true,
      carryDays: 30,
      halfDay: false,
      approval: true,
      attachment: false,
      gender: "all",
      status: "active",
    },
    {
      name: "Maternity Leave",
      code: "ML",
      description: "Leave for female employees after childbirth.",
      days: 180,
      maxRequest: 180,
      paid: true,
      carryForward: false,
      carryDays: 0,
      halfDay: false,
      approval: true,
      attachment: true,
      gender: "female",
      status: "active",
    },
    {
      name: "Paternity Leave",
      code: "PL",
      description: "Leave for male employees after childbirth.",
      days: 15,
      maxRequest: 15,
      paid: true,
      carryForward: false,
      carryDays: 0,
      halfDay: false,
      approval: true,
      attachment: true,
      gender: "male",
      status: "active",
    },
    {
      name: "Compensatory Off",
      code: "CO",
      description: "Compensatory leave for working on holidays.",
      days: 5,
      maxRequest: 2,
      paid: true,
      carryForward: false,
      carryDays: 0,
      halfDay: true,
      approval: true,
      attachment: false,
      gender: "all",
      status: "active",
    },
    {
      name: "Loss of Pay",
      code: "LOP",
      description: "Unpaid leave.",
      days: 365,
      maxRequest: 365,
      paid: false,
      carryForward: false,
      carryDays: 0,
      halfDay: true,
      approval: true,
      attachment: false,
      gender: "all",
      status: "active",
    },
    {
      name: "On Duty",
      code: "OD",
      description: "Official duty outside the campus.",
      days: 30,
      maxRequest: 10,
      paid: true,
      carryForward: false,
      carryDays: 0,
      halfDay: true,
      approval: true,
      attachment: false,
      gender: "all",
      status: "active",
    },
  ];

  let totalInserted = 0;

  for (const school of schools) {
    for (const leave of leaveTypes) {
      await db.query(
        `
        INSERT IGNORE INTO employee_leave_types
        (
          school_id,
          name,
          code,
          description,
          days_per_year,
          max_days_per_request,
          is_paid,
          carry_forward,
          max_carry_forward_days,
          allow_half_day,
          requires_approval,
          requires_attachment,
          applicable_gender,
          status
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          school.id,
          leave.name,
          leave.code,
          leave.description,
          leave.days,
          leave.maxRequest,
          leave.paid,
          leave.carryForward,
          leave.carryDays,
          leave.halfDay,
          leave.approval,
          leave.attachment,
          leave.gender,
          leave.status,
        ],
      );

      totalInserted++;
    }

    console.log(`✅ Employee leave types seeded for School ID ${school.id}`);
  }

  console.log(`🎉 ${totalInserted} employee leave types seeded successfully.`);
};
