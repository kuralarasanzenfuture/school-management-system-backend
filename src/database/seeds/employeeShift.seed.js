import { getDB } from "../../config/db.js";

export const seedEmployeeShifts = async () => {
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

  const shifts = [
    {
      name: "General Shift",
      shift_type: "day",
      start_time: "09:00:00",
      end_time: "17:00:00",
      crosses_midnight: false,
      grace_minutes: 10,
      working_hours: 8.0,
      is_default: true,
      status: "active",
    },
    {
      name: "Morning Shift",
      shift_type: "day",
      start_time: "07:30:00",
      end_time: "15:30:00",
      crosses_midnight: false,
      grace_minutes: 10,
      working_hours: 8.0,
      is_default: false,
      status: "active",
    },
    {
      name: "Evening Shift",
      shift_type: "evening",
      start_time: "13:00:00",
      end_time: "21:00:00",
      crosses_midnight: false,
      grace_minutes: 10,
      working_hours: 8.0,
      is_default: false,
      status: "active",
    },
    {
      name: "Night Shift",
      shift_type: "night",
      start_time: "22:00:00",
      end_time: "06:00:00",
      crosses_midnight: true,
      grace_minutes: 15,
      working_hours: 8.0,
      is_default: false,
      status: "active",
    },
    {
      name: "Flexible Shift",
      shift_type: "flexible",
      start_time: "10:00:00",
      end_time: "18:00:00",
      crosses_midnight: false,
      grace_minutes: 20,
      working_hours: 8.0,
      is_default: false,
      status: "active",
    },
  ];

  let inserted = 0;

  for (const school of schools) {
    for (const shift of shifts) {
      await db.query(
        `
        INSERT IGNORE INTO employee_shifts
        (
          school_id,
          name,
          shift_type,
          start_time,
          end_time,
          crosses_midnight,
          grace_minutes,
          working_hours,
          is_default,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          school.id,
          shift.name,
          shift.shift_type,
          shift.start_time,
          shift.end_time,
          shift.crosses_midnight,
          shift.grace_minutes,
          shift.working_hours,
          shift.is_default,
          shift.status,
        ],
      );

      inserted++;
    }

    console.log(`✅ Employee shifts seeded for School ID ${school.id}`);
  }

  console.log(`🎉 ${inserted} employee shifts seeded successfully.`);
};
