import { getDB } from "../../config/db.js";

export const seedStudents = async () => {
  const db = getDB();

  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found.");
    return;
  }

  const schoolId = schools[0].id;

  const firstNames = [
    "Arun",
    "Karthik",
    "Praveen",
    "Dinesh",
    "Sathish",
    "Vignesh",
    "Harish",
    "Lokesh",
    "Naveen",
    "Surya",
    "Priya",
    "Divya",
    "Nivetha",
    "Keerthana",
    "Anitha",
    "Kavya",
    "Swathi",
    "Aishwarya",
    "Madhumitha",
    "Harini",
  ];

  const lastNames = [
    "Kumar",
    "Raj",
    "Murugan",
    "Selvam",
    "Babu",
    "Lakshmi",
    "Devi",
    "Priya",
    "Rani",
    "Mohan",
  ];

  for (let i = 1; i <= 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const gender = Math.random() > 0.5 ? "male" : "female";

    const admissionNo = `ADM-2026-${String(i).padStart(4, "0")}`;

    const aadhaar = `6${String(10000000000 + i).padStart(11, "0")}`;

    const mobile = `9${String(800000000 + i).padStart(9, "0")}`;

    const parentMobile = `8${String(700000000 + i).padStart(9, "0")}`;

    await db.query(
      `
      INSERT IGNORE INTO students (
        school_id,
        admission_no,
        first_name,
        middle_name,
        last_name,
        email,
        mobile_no,
        date_of_birth,
        gender,
        blood_group,
        aadhaar_no,
        religion,
        nationality,
        mother_tongue,

        current_area,
        current_city,
        current_district,
        current_state,
        current_postal_code,
        current_address,

        current_address_same_as_permanent,
        permanent_area,
        permanent_city,
        permanent_district,
        permanent_state,
        permanent_postal_code,
        permanent_address,

        father_name,
        mother_name,
        father_occupation,
        mother_occupation,
        parent_mobile,
        alternate_mobile,
        parent_email,
        emergency_contact,
        emergency_relationship,

        allergies,
        chronic_conditions,
        status
      )
      VALUES (
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?
      )
      `,
      [
        schoolId,

        admissionNo,

        firstName,
        "",
        lastName,

        `${firstName.toLowerCase()}${i}@gmail.com`,

        mobile,

        `201${i % 10}-0${(i % 9) + 1}-15`,

        gender,

        ["A+", "B+", "O+", "AB+"][i % 4],

        aadhaar,

        "Hindu",

        "INDIAN",

        "Tamil",

        "Nallampalli",

        "Dharmapuri",

        "Dharmapuri",

        "Tamil Nadu",

        "636701",

        "Nallampalli, Dharmapuri",

        true,

        "Nallampalli",

        "Dharmapuri",

        "Dharmapuri",

        "Tamil Nadu",

        "636701",

        "Nallampalli, Dharmapuri",

        `Mr. ${lastName}`,

        `Mrs. ${lastName}`,

        "Farmer",

        "Homemaker",

        parentMobile,

        parentMobile,

        `parent${i}@gmail.com`,

        parentMobile,

        "Father",

        "",

        "",

        "active",
      ],
    );
  }

  console.log("✅ 50 students seeded");
};
