import { getDB } from "../../config/db.js";

/**
 * Professional, realistic Employee Attendance Seeder for the current year (2026).
 * Covers Jan 1, 2026 to today (Sep 17, 2026), including:
 * - Gazetted & Indian school holidays
 * - Week-offs (Sundays & 2nd/4th Saturdays)
 * - Punctual arrivals, late arrivals with grace-period calculations
 * - Overtime calculations on shifts
 * - Half-days, casual & medical leaves, and rare absences
 * - Realtime active in-progress check-ins for today
 */
export const seedEmployeeAttendance = async () => {
  const db = getDB();

  console.log("🌱 Starting Employee Attendance Seeding...");

  // 1. Fetch active employees
  const [employees] = await db.query(`
    SELECT id, school_id, employee_code, first_name, last_name, joining_date
    FROM employees
    WHERE status = 'active'
    ORDER BY id
  `);

  if (!employees.length) {
    console.log("⚠️ No active employees found. Please seed employees first.");
    return;
  }

  // 2. Fetch shifts grouped by school
  const [shifts] = await db.query(`
    SELECT id, school_id, name, shift_type, start_time, end_time, working_hours, grace_minutes, is_default
    FROM employee_shifts
    WHERE status = 'active'
    ORDER BY id
  `);

  const shiftsBySchool = new Map();
  for (const s of shifts) {
    if (!shiftsBySchool.has(s.school_id)) {
      shiftsBySchool.set(s.school_id, []);
    }
    shiftsBySchool.get(s.school_id).push(s);
  }

  // 3. Admin user ID for marked_by
  const [adminUsers] = await db.query(`
    SELECT id FROM users ORDER BY id LIMIT 1
  `);
  const adminId = adminUsers[0]?.id || 1;

  // 4. Public Holidays in 2026 (Tamil Nadu / Central School Calendar)
  const HOLIDAYS_2026 = new Map([
    ["2026-01-01", "New Year's Day"],
    ["2026-01-14", "Pongal / Makar Sankranti"],
    ["2026-01-15", "Thiruvalluvar Day"],
    ["2026-01-16", "Uzhavar Thirunal"],
    ["2026-01-26", "Republic Day"],
    ["2026-03-20", "Telugu New Year / Ugadi"],
    ["2026-03-31", "Mahavir Jayanti"],
    ["2026-04-03", "Good Friday"],
    ["2026-04-14", "Tamil New Year / Dr. B.R. Ambedkar Jayanti"],
    ["2026-05-01", "May Day / Labour Day"],
    ["2026-05-31", "Bakrid / Eid al-Adha"],
    ["2026-07-29", "Muharram"],
    ["2026-08-15", "Independence Day"],
    ["2026-08-28", "Milad-un-Nabi"],
    ["2026-09-04", "Krishna Jayanti"],
  ]);

  // Target year and date range
  const year = 2026;
  const todayStr = "2026-09-17"; // Current simulated system date

  const startDate = new Date(Date.UTC(year, 0, 1));
  const todayDate = new Date(Date.UTC(2026, 8, 17)); // Month is 0-indexed: 8 = September

  // Generate list of all dates
  const calendarDates = [];
  for (
    let d = new Date(startDate);
    d <= todayDate;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const dateString = `${y}-${m}-${day}`;
    const dayOfWeek = d.getUTCDay(); // 0 = Sun, 6 = Sat
    const dayOfMonth = d.getUTCDate();

    // Check if 2nd or 4th Saturday
    const isSecondSaturday =
      dayOfWeek === 6 && dayOfMonth >= 8 && dayOfMonth <= 14;
    const isFourthSaturday =
      dayOfWeek === 6 && dayOfMonth >= 22 && dayOfMonth <= 28;

    calendarDates.push({
      dateString,
      dayOfWeek,
      dayOfMonth,
      isSunday: dayOfWeek === 0,
      isSaturdayOff: isSecondSaturday || isFourthSaturday,
      isHoliday: HOLIDAYS_2026.has(dateString),
      holidayName: HOLIDAYS_2026.get(dateString) || null,
      isToday: dateString === todayStr,
    });
  }

  console.log(
    `📅 Generated ${calendarDates.length} calendar days (Jan 1, 2026 to Sep 17, 2026).`,
  );

  const BATCH_SIZE = 1000;
  let batch = [];
  let totalInserted = 0;

  // Simple pseudo-random helper with seed for consistency
  let seed = 123456789;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // Helper to format Date to MySQL datetime string
  const formatMySQLDateTime = (d) => {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  };

  for (let empIdx = 0; empIdx < employees.length; empIdx++) {
    const emp = employees[empIdx];
    const schoolShifts = shiftsBySchool.get(emp.school_id) || [];

    // Assign a consistent primary shift for this employee
    // ~75% General Shift, ~15% Morning Shift, ~10% Flexible
    let assignedShift = schoolShifts.find((s) => s.is_default) || schoolShifts[0];
    if (empIdx % 5 === 0 && schoolShifts.length > 1) {
      assignedShift =
        schoolShifts.find((s) => s.name.includes("Morning")) || assignedShift;
    } else if (empIdx % 7 === 0 && schoolShifts.length > 2) {
      assignedShift =
        schoolShifts.find((s) => s.name.includes("Flexible")) || assignedShift;
    }

    const shiftId = assignedShift?.id || null;
    const shiftStart = assignedShift?.start_time || "09:00:00";
    const [shiftStartH, shiftStartM] = shiftStart.split(":").map(Number);
    const shiftWorkingHours = assignedShift
      ? Number(assignedShift.working_hours)
      : 8.0;
    const shiftGrace = assignedShift ? Number(assignedShift.grace_minutes) : 10;

    // Employee reliability tier
    const isStrictlyPunctual = empIdx % 10 !== 3; // 90% punctual, 10% occasionally late

    for (const calDay of calendarDates) {
      const {
        dateString,
        isSunday,
        isSaturdayOff,
        isHoliday,
        holidayName,
        isToday,
      } = calDay;

      let status = "present";
      let checkInStr = null;
      let checkOutStr = null;
      let totalWorkMinutes = 0;
      let overtimeMinutes = 0;
      let lateMinutes = 0;
      let remarks = null;

      // 1. Holiday check
      if (isHoliday) {
        status = "holiday";
        remarks = `Official Holiday: ${holidayName}`;
      }
      // 2. Sunday or 2nd/4th Saturday Week-off
      else if (isSunday) {
        status = "week_off";
        remarks = "Weekly Off (Sunday)";
      } else if (isSaturdayOff) {
        status = "week_off";
        remarks = "Weekly Off (Second/Fourth Saturday)";
      }
      // 3. Realtime check for TODAY (Sep 17, 2026)
      else if (isToday) {
        const rand = pseudoRandom();

        if (rand < 0.04) {
          // 4% on approved leave today
          status = "leave";
          remarks = "Casual leave approved";
        } else if (rand < 0.08) {
          // 4% half day today (morning shift, already completed)
          status = "half_day";
          const inD = new Date(`${dateString}T09:00:00`);
          const outD = new Date(`${dateString}T13:00:00`);
          checkInStr = formatMySQLDateTime(inD);
          checkOutStr = formatMySQLDateTime(outD);
          totalWorkMinutes = 240;
          remarks = "Half day approved for personal work";
        } else if (rand < 0.14) {
          // 6% late arrival today, currently working
          status = "late";
          const lateMins = 15 + Math.floor(pseudoRandom() * 25);
          lateMinutes = lateMins;
          const inD = new Date(
            `${dateString}T${String(shiftStartH).padStart(2, "0")}:${String(shiftStartM + lateMins).padStart(2, "0")}:00`,
          );
          checkInStr = formatMySQLDateTime(inD);
          checkOutStr = null; // Currently still on duty at 15:20!
          remarks = "Late arrival due to morning transit delay";
        } else {
          // 86% present on duty today
          status = "present";
          const earlyMins = Math.floor(pseudoRandom() * 15); // Arrived 0 to 15m early
          const inH = earlyMins > 0 && shiftStartM < earlyMins ? shiftStartH - 1 : shiftStartH;
          const inM = earlyMins > 0 && shiftStartM < earlyMins ? 60 + shiftStartM - earlyMins : shiftStartM - earlyMins;
          const inD = new Date(
            `${dateString}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`,
          );
          checkInStr = formatMySQLDateTime(inD);

          // If morning shift ended at 15:30, they already checked out!
          if (assignedShift?.name?.includes("Morning")) {
            const outD = new Date(`${dateString}T15:30:00`);
            checkOutStr = formatMySQLDateTime(outD);
            totalWorkMinutes = Math.floor((outD - inD) / 60000);
            if (totalWorkMinutes > shiftWorkingHours * 60) {
              overtimeMinutes = totalWorkMinutes - shiftWorkingHours * 60;
            }
          } else {
            // General shift ends at 17:00 -> currently in progress!
            checkOutStr = null;
            totalWorkMinutes = 0;
          }
          remarks = "Regular duty on time";
        }
      }
      // 4. Past Regular Working Days
      else {
        const rand = pseudoRandom();

        if (rand < 0.015) {
          // 1.5% Absent
          status = "absent";
          remarks = "Uninformed absence";
        } else if (rand < 0.045) {
          // 3% Approved Leave
          status = "leave";
          const leaveReasons = [
            "Casual leave",
            "Medical leave",
            "Family function",
            "Personal leave",
          ];
          remarks =
            leaveReasons[Math.floor(pseudoRandom() * leaveReasons.length)];
        } else if (rand < 0.08) {
          // 3.5% Half Day
          status = "half_day";
          const inD = new Date(
            `${dateString}T${String(shiftStartH).padStart(2, "0")}:${String(shiftStartM).padStart(2, "0")}:00`,
          );
          const outD = new Date(`${dateString}T13:15:00`);
          checkInStr = formatMySQLDateTime(inD);
          checkOutStr = formatMySQLDateTime(outD);
          totalWorkMinutes = Math.floor((outD - inD) / 60000);
          remarks = "Half day permission granted";
        } else if (
          (!isStrictlyPunctual && rand < 0.22) ||
          (isStrictlyPunctual && rand < 0.12)
        ) {
          // Late arrival (5-10%)
          status = "late";
          const lateMins = shiftGrace + 5 + Math.floor(pseudoRandom() * 30);
          lateMinutes = lateMins;

          let inH = shiftStartH;
          let inM = shiftStartM + lateMins;
          if (inM >= 60) {
            inH += Math.floor(inM / 60);
            inM %= 60;
          }

          const inD = new Date(
            `${dateString}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`,
          );
          // Stayed till 17:00 - 17:20
          const outH = shiftStartH + Math.floor(shiftWorkingHours);
          const outM = Math.floor(pseudoRandom() * 20);
          const outD = new Date(
            `${dateString}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00`,
          );

          checkInStr = formatMySQLDateTime(inD);
          checkOutStr = formatMySQLDateTime(outD);
          totalWorkMinutes = Math.floor((outD - inD) / 60000);
          const lateReasons = [
            "Traffic congestion",
            "Public transport delay",
            "Late arrival",
            "Weather delay",
          ];
          remarks =
            lateReasons[Math.floor(pseudoRandom() * lateReasons.length)];
        } else {
          // ~82-87% Present on time
          status = "present";
          const earlyMins = Math.floor(pseudoRandom() * 14); // 0 to 14 mins early
          let inH = shiftStartH;
          let inM = shiftStartM - earlyMins;
          if (inM < 0) {
            inH -= 1;
            inM += 60;
          }

          const inD = new Date(
            `${dateString}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`,
          );

          // Checkout between end_time and end_time + 35m
          const outH = shiftStartH + Math.floor(shiftWorkingHours);
          const extraMins = Math.floor(pseudoRandom() * 35); // Occasional overtime
          const outD = new Date(
            `${dateString}T${String(outH).padStart(2, "0")}:${String(extraMins).padStart(2, "0")}:00`,
          );

          checkInStr = formatMySQLDateTime(inD);
          checkOutStr = formatMySQLDateTime(outD);
          totalWorkMinutes = Math.floor((outD - inD) / 60000);

          const expectedMinutes = Math.round(shiftWorkingHours * 60);
          if (totalWorkMinutes > expectedMinutes) {
            overtimeMinutes = totalWorkMinutes - expectedMinutes;
          }
          remarks = overtimeMinutes > 15 ? "Overtime duty completed" : "Regular full day duty";
        }
      }

      batch.push([
        emp.school_id,
        emp.id,
        dateString,
        status,
        shiftId,
        checkInStr,
        checkOutStr,
        totalWorkMinutes,
        overtimeMinutes,
        lateMinutes,
        remarks,
        adminId,
      ]);

      if (batch.length >= BATCH_SIZE) {
        await db.query(
          `
          INSERT IGNORE INTO employee_attendance
          (
            school_id,
            employee_id,
            attendance_date,
            status,
            shift_id,
            check_in,
            check_out,
            total_work_minutes,
            overtime_minutes,
            late_minutes,
            remarks,
            marked_by
          )
          VALUES ?
          `,
          [batch],
        );
        totalInserted += batch.length;
        batch = [];
        process.stdout.write(`\r   ⏳ Inserted ${totalInserted} attendance rows...`);
      }
    }
  }

  // Insert remaining rows
  if (batch.length > 0) {
    await db.query(
      `
      INSERT IGNORE INTO employee_attendance
      (
        school_id,
        employee_id,
        attendance_date,
        status,
        shift_id,
        check_in,
        check_out,
        total_work_minutes,
        overtime_minutes,
        late_minutes,
        remarks,
        marked_by
      )
      VALUES ?
      `,
      [batch],
    );
    totalInserted += batch.length;
  }

  console.log(
    `\n🎉 Successfully seeded ${totalInserted} employee attendance records for year ${year}!`,
  );
};
