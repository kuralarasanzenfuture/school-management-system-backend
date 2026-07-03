import { getDB } from "../../config/db.js";

export const seedEmployeeDesignations = async () => {
  const db = getDB();

  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found. Skipping employee designation seeding.");
    return;
  }

  const designations = [
    {
      name: "PRINCIPAL",
      description: "Head of the school responsible for overall administration.",
    },
    {
      name: "VICE PRINCIPAL",
      description: "Assists the Principal in managing school operations.",
    },
    {
      name: "HEAD MASTER",
      description: "Supervises academic activities and staff.",
    },
    {
      name: "TEACHER",
      description: "Conducts classroom teaching and student evaluation.",
    },
    {
      name: "ACCOUNTANT",
      description: "Handles school accounts, fees, and financial records.",
    },
    {
      name: "OFFICE STAFF",
      description: "Performs administrative and office-related tasks.",
    },
    {
      name: "LIBRARIAN",
      description: "Manages the school library and learning resources.",
    },
    {
      name: "LAB ASSISTANT",
      description: "Maintains laboratory equipment and assists during practical sessions.",
    },
    {
      name: "PHYSICAL EDUCATION TEACHER",
      description: "Conducts sports and physical education activities.",
    },
    {
      name: "COMPUTER OPERATOR",
      description: "Maintains computer systems and school data.",
    },
    {
      name: "RECEPTIONIST",
      description: "Handles visitors, calls, and front office operations.",
    },
    {
      name: "SECURITY GUARD",
      description: "Ensures the safety and security of the school campus.",
    },
    {
      name: "DRIVER",
      description: "Operates school buses and other vehicles.",
    },
    {
      name: "ATTENDER",
      description: "Provides assistance for daily school operations.",
    },
    {
      name: "HOUSEKEEPING",
      description: "Maintains cleanliness of classrooms and campus.",
    },
    {
      name: "WATCHMAN",
      description: "Monitors school premises during day and night.",
    },
  ];

  for (const school of schools) {
    for (const designation of designations) {
      await db.query(
        `
        INSERT INTO employee_designations
        (
          school_id,
          name,
          description,
          status
        )
        VALUES (?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          status = VALUES(status)
        `,
        [
          school.id,
          designation.name,
          designation.description,
        ]
      );
    }
  }

  console.log("✅ Employee designations seeded");
};