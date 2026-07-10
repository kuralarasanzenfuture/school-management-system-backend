import { getDB } from "../../config/db.js";

export const seedClassSubjects = async () => {
  const db = getDB();

  const [classSections] = await db.query(`
    SELECT id, school_id
    FROM class_sections
    ORDER BY school_id, id
  `);

  if (!classSections.length) {
    console.log("⚠️ No class sections found.");
    return;
  }

  let inserted = 0;

  for (const classSection of classSections) {
    const classSectionId = classSection.id;
    const schoolId = classSection.school_id;

    // Subjects of this school
    const [subjects] = await db.query(
      `
      SELECT id
      FROM subjects
      WHERE school_id = ?
      ORDER BY id
      `,
      [schoolId],
    );

    if (!subjects.length) continue;

    // Subject Groups
    const [groups] = await db.query(
      `
      SELECT id
      FROM subject_groups
      WHERE school_id = ?
      ORDER BY id
      `,
      [schoolId],
    );

    // Employees (Teachers)
    const [teachers] = await db.query(
      `
      SELECT id
      FROM employees
      WHERE school_id = ?
      AND designation IN (
        'Principal',
        'Vice Principal',
        'PG Teacher',
        'TGT Teacher',
        'PRT Teacher',
        'Kindergarten Teacher',
        'Computer Instructor',
        'Physical Education Teacher'
      )
      ORDER BY id
      `,
      [schoolId],
    );

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];

      const subjectGroupId =
        groups.length > 0 ? groups[i % groups.length].id : null;

      const employeeId =
        teachers.length > 0 ? teachers[i % teachers.length].id : null;

      await db.query(
        `
        INSERT IGNORE INTO class_subjects
        (
          class_section_id,
          subject_id,
          subject_group_id,
          employee_id,
          is_optional,
          weekly_periods
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          classSectionId,
          subject.id,
          subjectGroupId,
          employeeId,
          Math.random() < 0.15,
          Math.floor(Math.random() * 4) + 4,
        ],
      );

      inserted++;
    }
  }

  console.log(`✅ ${inserted} class subjects seeded successfully`);
};
