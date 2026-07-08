import { getDB } from "../../config/db.js";

export const seedStudents = async () => {
  const db = getDB();

  const getYear = () => {
    const date = new Date();
    return date.getFullYear();
  };

  const year = getYear();

  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found.");
    return;
  }

  const schoolId = schools[0].id;

  const [rows] = await db.query(
    `
  SELECT student_code
  FROM students
  WHERE student_code LIKE ?
  ORDER BY id DESC
  LIMIT 1
  `,
    [`STD-${year}-%`],
  );

  let nextNumber = 1;

  if (rows.length) {
    const lastCode = rows[0].student_code; // STD-2026-0050
    nextNumber = parseInt(lastCode.split("-")[2], 10) + 1;
  }

  const maleNames = [
    "Aadhavan",
    "Aakash",
    "Abhinav",
    "Ajay",
    "Akash",
    "Akilan",
    "Aravind",
    "Arjun",
    "Ashwin",
    "Bharath",
    "Charan",
    "Darshan",
    "Dhanush",
    "Dharan",
    "Dheeran",
    "Gokul",
    "Hari",
    "Harish",
    "Jeevan",
    "Kavin",
    "Kishore",
    "Lokesh",
    "Madhan",
    "Manikandan",
    "Mithun",
    "Mohan",
    "Nandhakumar",
    "Naren",
    "Naveen",
    "Pranav",
    "Praveen",
    "Rahul",
    "Rakesh",
    "Ranjith",
    "Rithvik",
    "Sanjay",
    "Saravanan",
    "Sathish",
    "Sharan",
    "Sivakumar",
    "Surya",
    "Tamilselvan",
    "Tharun",
    "Vignesh",
    "Vikram",
    "Vinoth",
    "Vishal",
    "Yogesh",
    "Yuvan",
    "Yuvaraj",
  ];
  const femaleNames = [
    "Aarthi",
    "Abinaya",
    "Ananya",
    "Anitha",
    "Anjali",
    "Aradhana",
    "Bhavani",
    "Darshini",
    "Deepika",
    "Divya",
    "Gayathri",
    "Harini",
    "Janani",
    "Keerthana",
    "Kirthika",
    "Kavya",
    "Lavanya",
    "Madhumitha",
    "Meena",
    "Monisha",
    "Nandhini",
    "Nivetha",
    "Pavithra",
    "Priya",
    "Rajalakshmi",
    "Ramya",
    "Ranjani",
    "Revathi",
    "Sangeetha",
    "Shalini",
    "Sneha",
    "Sowmya",
    "Subhashini",
    "Swathi",
    "Vaishnavi",
    "Varshini",
    "Vidhya",
    "Yazhini",
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

  const studentsPerSchool = 50;

  for (const school of schools) {
    const schoolId = school.id;

    // Get last student code for this school
    const [rows] = await db.query(
      `
    SELECT student_code
    FROM students
    WHERE school_id = ?
      AND student_code LIKE ?
    ORDER BY id DESC
    LIMIT 1
    `,
      [schoolId, `STD-${year}-%`],
    );

    let nextNumber = 1;

    if (rows.length) {
      const lastCode = rows[0].student_code;
      nextNumber = parseInt(lastCode.split("-")[2], 10) + 1;
    }

    for (let i = 1; i <= studentsPerSchool; i++) {
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      const gender = Math.random() > 0.5 ? "male" : "female";

      const firstName =
        gender === "male"
          ? maleNames[Math.floor(Math.random() * maleNames.length)]
          : femaleNames[Math.floor(Math.random() * femaleNames.length)];

      const studentCode = `STD-${year}-${String(nextNumber).padStart(4, "0")}`;

      nextNumber++;

      const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

      const bloodGroup =
        bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

      const areas = [
        "Nallampalli",
        "Pennagaram",
        "Palacode",
        "Harur",
        "Papparapatti",
        "Karimangalam",
        "Morappur",
        "Bommidi",
        "Kadathur",
        "Dharmapuri Town",
      ];

      const area = areas[Math.floor(Math.random() * areas.length)];

      const fatherOccupations = [
        "Farmer",
        "Government Employee",
        "Businessman",
        "Teacher",
        "Police Officer",
        "Electrician",
        "Engineer",
        "Driver",
        "Contractor",
        "Bank Employee",
        "Private Employee",
        "Textile Merchant",
      ];

      const motherOccupations = [
        "Homemaker",
        "Teacher",
        "Nurse",
        "Government Employee",
        "Tailor",
        "Businesswoman",
        "Private Employee",
        "Self Employed",
      ];

      const fatherOccupation =
        fatherOccupations[Math.floor(Math.random() * fatherOccupations.length)];

      const motherOccupation =
        motherOccupations[Math.floor(Math.random() * motherOccupations.length)];

      const statuses = [
        "active",
        "active",
        "active",
        "active",
        "active",
        "active",
        "active",
        "graduated",
        "transferred",
        "dropped",
      ];

      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const aadhaar = `${schoolId}${String(100000000000 + i).slice(1)}`;

      await db.query(
        `
      INSERT IGNORE INTO students (
        school_id,
        student_code,
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
        status
      )
      VALUES (
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?
      )
      `,
        [
          schoolId,

          studentCode,

          firstName,
          "",
          lastName,

          `${firstName.toLowerCase()}${schoolId}${i}@gmail.com`,

          `9${String(800000000 + schoolId * 1000 + i).padStart(9, "0")}`,

          `201${i % 10}-0${(i % 9) + 1}-15`,

          gender,

          bloodGroup,

          `${schoolId}${aadhaar.substring(1)}`.substring(0, 12),

          "Hindu",

          "INDIAN",

          "Tamil",

          area,

          "Dharmapuri",

          "Dharmapuri",

          "Tamil Nadu",

          "636701",

          `${area}, Dharmapuri`,

          true,

          area,

          "Dharmapuri",

          "Dharmapuri",

          "Tamil Nadu",

          "636701",

          `${area}, Dharmapuri`,

          `Mr. ${lastName}`,

          `Mrs. ${lastName}`,

          fatherOccupation,

          motherOccupation,

          `8${String(700000000 + schoolId * 1000 + i).padStart(9, "0")}`,

          `8${String(700000000 + schoolId * 1000 + i).padStart(9, "0")}`,

          `parent${schoolId}${i}@gmail.com`,

          `8${String(700000000 + schoolId * 1000 + i).padStart(9, "0")}`,

          "Father",

          status,
        ],
      );
    }

    console.log(
      `✅ ${studentsPerSchool} students seeded for school ${schoolId}`,
    );
  }

  console.log("✅ 50 students seeded");
};
