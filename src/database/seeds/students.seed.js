// import { getDB } from "../../config/db.js";

// export const seedStudents = async () => {
//   const db = getDB();

//   const getYear = () => {
//     const date = new Date();
//     return date.getFullYear();
//   };

//   const year = getYear();

//   const [schools] = await db.query("SELECT id FROM schools");

//   if (!schools.length) {
//     console.log("⚠️ No schools found.");
//     return;
//   }

//   const schoolId = schools[0].id;

//   const [rows] = await db.query(
//     `
//   SELECT student_code
//   FROM students
//   WHERE student_code LIKE ?
//   ORDER BY id DESC
//   LIMIT 1
//   `,
//     [`STD-${year}-%`],
//   );

//   let nextNumber = 1;

//   if (rows.length) {
//     const lastCode = rows[0].student_code; // STD-2026-0050
//     nextNumber = parseInt(lastCode.split("-")[2], 10) + 1;
//   }

//   const maleNames = [
//     "Aadhavan",
//     "Aakash",
//     "Abhinav",
//     "Ajay",
//     "Akash",
//     "Akilan",
//     "Aravind",
//     "Arjun",
//     "Ashwin",
//     "Bharath",
//     "Charan",
//     "Darshan",
//     "Dhanush",
//     "Dharan",
//     "Dheeran",
//     "Gokul",
//     "Hari",
//     "Harish",
//     "Jeevan",
//     "Kavin",
//     "Kishore",
//     "Lokesh",
//     "Madhan",
//     "Manikandan",
//     "Mithun",
//     "Mohan",
//     "Nandhakumar",
//     "Naren",
//     "Naveen",
//     "Pranav",
//     "Praveen",
//     "Rahul",
//     "Rakesh",
//     "Ranjith",
//     "Rithvik",
//     "Sanjay",
//     "Saravanan",
//     "Sathish",
//     "Sharan",
//     "Sivakumar",
//     "Surya",
//     "Tamilselvan",
//     "Tharun",
//     "Vignesh",
//     "Vikram",
//     "Vinoth",
//     "Vishal",
//     "Yogesh",
//     "Yuvan",
//     "Yuvaraj",
//   ];
//   const femaleNames = [
//     "Aarthi",
//     "Abinaya",
//     "Ananya",
//     "Anitha",
//     "Anjali",
//     "Aradhana",
//     "Bhavani",
//     "Darshini",
//     "Deepika",
//     "Divya",
//     "Gayathri",
//     "Harini",
//     "Janani",
//     "Keerthana",
//     "Kirthika",
//     "Kavya",
//     "Lavanya",
//     "Madhumitha",
//     "Meena",
//     "Monisha",
//     "Nandhini",
//     "Nivetha",
//     "Pavithra",
//     "Priya",
//     "Rajalakshmi",
//     "Ramya",
//     "Ranjani",
//     "Revathi",
//     "Sangeetha",
//     "Shalini",
//     "Sneha",
//     "Sowmya",
//     "Subhashini",
//     "Swathi",
//     "Vaishnavi",
//     "Varshini",
//     "Vidhya",
//     "Yazhini",
//   ];

//   const lastNames = [
//     "Kumar",
//     "Raj",
//     "Murugan",
//     "Selvam",
//     "Babu",
//     "Lakshmi",
//     "Devi",
//     "Priya",
//     "Rani",
//     "Mohan",
//   ];

//   const studentsPerSchool = 50;

//   for (const school of schools) {
//     const schoolId = school.id;

//     // Get last student code for this school
//     const [rows] = await db.query(
//       `
//     SELECT student_code
//     FROM students
//     WHERE school_id = ?
//       AND student_code LIKE ?
//     ORDER BY id DESC
//     LIMIT 1
//     `,
//       [schoolId, `STD-${year}-%`],
//     );

//     let nextNumber = 1;

//     if (rows.length) {
//       const lastCode = rows[0].student_code;
//       nextNumber = parseInt(lastCode.split("-")[2], 10) + 1;
//     }

//     for (let i = 1; i <= studentsPerSchool; i++) {
//       const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

//       const gender = Math.random() > 0.5 ? "male" : "female";

//       const firstName =
//         gender === "male"
//           ? maleNames[Math.floor(Math.random() * maleNames.length)]
//           : femaleNames[Math.floor(Math.random() * femaleNames.length)];

//       const studentCode = `STD-${year}-${String(nextNumber).padStart(4, "0")}`;

//       nextNumber++;

//       const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

//       const bloodGroup =
//         bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

//       const areas = [
//         "Nallampalli",
//         "Pennagaram",
//         "Palacode",
//         "Harur",
//         "Papparapatti",
//         "Karimangalam",
//         "Morappur",
//         "Bommidi",
//         "Kadathur",
//         "Dharmapuri Town",
//       ];

//       const area = areas[Math.floor(Math.random() * areas.length)];

//       const fatherOccupations = [
//         "Farmer",
//         "Government Employee",
//         "Businessman",
//         "Teacher",
//         "Police Officer",
//         "Electrician",
//         "Engineer",
//         "Driver",
//         "Contractor",
//         "Bank Employee",
//         "Private Employee",
//         "Textile Merchant",
//       ];

//       const motherOccupations = [
//         "Homemaker",
//         "Teacher",
//         "Nurse",
//         "Government Employee",
//         "Tailor",
//         "Businesswoman",
//         "Private Employee",
//         "Self Employed",
//       ];

//       const fatherOccupation =
//         fatherOccupations[Math.floor(Math.random() * fatherOccupations.length)];

//       const motherOccupation =
//         motherOccupations[Math.floor(Math.random() * motherOccupations.length)];

//       const statuses = [
//         "active",
//         "active",
//         "active",
//         "active",
//         "active",
//         "active",
//         "active",
//         "graduated",
//         "transferred",
//         "dropped",
//       ];

//       const status = statuses[Math.floor(Math.random() * statuses.length)];

//       const aadhaar = `${schoolId}${String(100000000000 + i).slice(1)}`;

//       await db.query(
//         `
//       INSERT IGNORE INTO students (
//         school_id,
//         student_code,
//         first_name,
//         middle_name,
//         last_name,
//         email,
//         mobile_no,
//         date_of_birth,
//         gender,
//         blood_group,
//         aadhaar_no,
//         religion,
//         nationality,
//         mother_tongue,
//         current_area,
//         current_city,
//         current_district,
//         current_state,
//         current_postal_code,
//         current_address,
//         current_address_same_as_permanent,
//         permanent_area,
//         permanent_city,
//         permanent_district,
//         permanent_state,
//         permanent_postal_code,
//         permanent_address,
//         father_name,
//         mother_name,
//         father_occupation,
//         mother_occupation,
//         parent_mobile,
//         alternate_mobile,
//         parent_email,
//         emergency_contact,
//         emergency_relationship,
//         status
//       )
//       VALUES (
//         ?,?,?,?,?,?,?,?,?,?,
//         ?,?,?,?,?,?,?,?,?,?,
//         ?,?,?,?,?,?,?,?,?,?,
//         ?,?,?,?,?,?,?
//       )
//       `,
//         [
//           schoolId,

//           studentCode,

//           firstName,
//           "",
//           lastName,

//           `${firstName.toLowerCase()}${schoolId}${i}@gmail.com`,

//           `9${String(800000000 + schoolId * 1000 + i).padStart(9, "0")}`,

//           `201${i % 10}-0${(i % 9) + 1}-15`,

//           gender,

//           bloodGroup,

//           `${schoolId}${aadhaar.substring(1)}`.substring(0, 12),

//           "Hindu",

//           "INDIAN",

//           "Tamil",

//           area,

//           "Dharmapuri",

//           "Dharmapuri",

//           "Tamil Nadu",

//           "636701",

//           `${area}, Dharmapuri`,

//           true,

//           area,

//           "Dharmapuri",

//           "Dharmapuri",

//           "Tamil Nadu",

//           "636701",

//           `${area}, Dharmapuri`,

//           `Mr. ${lastName}`,

//           `Mrs. ${lastName}`,

//           fatherOccupation,

//           motherOccupation,

//           `8${String(700000000 + schoolId * 1000 + i).padStart(9, "0")}`,

//           `8${String(700000000 + schoolId * 1000 + i).padStart(9, "0")}`,

//           `parent${schoolId}${i}@gmail.com`,

//           `8${String(700000000 + schoolId * 1000 + i).padStart(9, "0")}`,

//           "Father",

//           status,
//         ],
//       );
//     }

//     console.log(
//       `✅ ${studentsPerSchool} students seeded for school ${schoolId}`,
//     );
//   }

//   console.log("✅ 50 students seeded");
// };

// import { getDB } from "../../config/db.js";

// export const seedStudents = async () => {
//   const db = getDB();
//   const year = new Date().getFullYear();

//   // Get the target school
//   const [schools] = await db.query("SELECT id FROM schools LIMIT 1");
//   if (!schools.length) {
//     console.log("⚠️ No schools found. Please seed a school first.");
//     return;
//   }
//   const schoolId = schools[0].id;

//   // Retrieve current highest student code sequence
//   const [rows] = await db.query(
//     `SELECT student_code FROM students WHERE school_id = ? AND student_code LIKE ? ORDER BY id DESC LIMIT 1`,
//     [schoolId, `STD-${year}-%`],
//   );

//   let nextNumber = 1;
//   if (rows.length) {
//     const lastCode = rows[0].student_code;
//     const parts = lastCode.split("-");
//     if (parts.length === 3) {
//       nextNumber = parseInt(parts[2], 10) + 1;
//     }
//   }

//   // Pool lists for building distinct combinations
//   const maleFirstNames = [
//     "Aadhavan",
//     "Aakash",
//     "Abhinav",
//     "Ajay",
//     "Akash",
//     "Akilan",
//     "Aravind",
//     "Arjun",
//     "Ashwin",
//     "Bharath",
//     "Charan",
//     "Darshan",
//     "Dhanush",
//     "Dharan",
//     "Dheeran",
//     "Gokul",
//     "Hari",
//     "Harish",
//     "Jeevan",
//     "Kavin",
//     "Kishore",
//     "Lokesh",
//     "Madhan",
//     "Manikandan",
//     "Mithun",
//     "Mohan",
//     "Nandhakumar",
//     "Naren",
//     "Naveen",
//     "Pranav",
//     "Praveen",
//     "Rahul",
//     "Rakesh",
//     "Ranjith",
//     "Rithvik",
//     "Sanjay",
//     "Saravanan",
//     "Sathish",
//     "Sharan",
//     "Sivakumar",
//     "Surya",
//     "Tamilselvan",
//     "Tharun",
//     "Vignesh",
//     "Vikram",
//     "Vinoth",
//     "Vishal",
//     "Yogesh",
//     "Yuvan",
//     "Yuvaraj",
//   ];

//   const femaleFirstNames = [
//     "Aarthi",
//     "Abinaya",
//     "Ananya",
//     "Anitha",
//     "Anjali",
//     "Aradhana",
//     "Bhavani",
//     "Darshini",
//     "Deepika",
//     "Divya",
//     "Gayathri",
//     "Harini",
//     "Janani",
//     "Keerthana",
//     "Kirthika",
//     "Kavya",
//     "Lavanya",
//     "Madhumitha",
//     "Meena",
//     "Monisha",
//     "Nandhini",
//     "Nivetha",
//     "Pavithra",
//     "Priya",
//     "Rajalakshmi",
//     "Ramya",
//     "Ranjani",
//     "Revathi",
//     "Sangeetha",
//     "Shalini",
//     "Sneha",
//     "Sowmya",
//     "Subhashini",
//     "Swathi",
//     "Vaishnavi",
//     "Varshini",
//     "Vidhya",
//     "Yazhini",
//   ];

//   const lastNames = [
//     "Kumar",
//     "Raj",
//     "Murugan",
//     "Selvam",
//     "Babu",
//     "Lakshmi",
//     "Devi",
//     "Priya",
//     "Rani",
//     "Mohan",
//     "Sundaram",
//     "Natarajan",
//     "Pandi",
//     "Kannan",
//     "Venkatesh",
//     "Srinivasan",
//     "Ganesan",
//     "Chandar",
//     "Raman",
//     "Velu",
//   ];

//   const initials = [
//     "A",
//     "B",
//     "C",
//     "D",
//     "E",
//     "G",
//     "K",
//     "M",
//     "N",
//     "P",
//     "R",
//     "S",
//     "T",
//     "V",
//   ];
//   const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
//   const areas = [
//     "Nallampalli",
//     "Pennagaram",
//     "Palacode",
//     "Harur",
//     "Papparapatti",
//     "Karimangalam",
//     "Morappur",
//     "Bommidi",
//     "Kadathur",
//     "Dharmapuri Town",
//   ];
//   const fatherOccupations = [
//     "Farmer",
//     "Government Employee",
//     "Businessman",
//     "Teacher",
//     "Police Officer",
//     "Electrician",
//     "Engineer",
//     "Driver",
//     "Contractor",
//     "Bank Employee",
//     "Private Employee",
//   ];
//   const motherOccupations = [
//     "Homemaker",
//     "Teacher",
//     "Nurse",
//     "Government Employee",
//     "Tailor",
//     "Businesswoman",
//     "Private Employee",
//     "Self Employed",
//   ];
//   const statuses = [
//     "active",
//     "active",
//     "active",
//     "active",
//     "graduated",
//     "transferred",
//   ];

//   const totalStudents = 5000;
//   const batchSize = 1000;
//   let currentBatch = [];

//   console.log(`🚀 Seeding ${totalStudents} unique student records...`);

//   // Start transaction for fast bulk insertion
//   await db.query("START TRANSACTION");

//   try {
//     for (let i = 1; i <= totalStudents; i++) {
//       const gender = i % 2 === 0 ? "male" : "female";

//       // Select base names
//       const baseName =
//         gender === "male"
//           ? maleFirstNames[(i - 1) % maleFirstNames.length]
//           : femaleFirstNames[(i - 1) % femaleFirstNames.length];

//       const lastName = lastNames[(i - 1) % lastNames.length];

//       // Add a middle initial based on cycle index to keep every full name unique
//       const initialIndex = Math.floor(
//         (i - 1) / (maleFirstNames.length + femaleFirstNames.length),
//       );
//       const middleInitial = initials[initialIndex % initials.length];
//       const firstName =
//         initialIndex > 0 ? `${baseName} ${middleInitial}.` : baseName;

//       const studentCode = `STD-${year}-${String(nextNumber).padStart(5, "0")}`;
//       nextNumber++;

//       const bloodGroup = bloodGroups[i % bloodGroups.length];
//       const area = areas[i % areas.length];
//       const fatherOcc = fatherOccupations[i % fatherOccupations.length];
//       const motherOcc = motherOccupations[i % motherOccupations.length];
//       const status = statuses[i % statuses.length];

//       // Format unique Aadhaar number string
//       const fakeAadhaar = String(100000000000 + i);

//       currentBatch.push([
//         schoolId,
//         studentCode,
//         firstName,
//         "",
//         lastName,
//         `student${i}.${schoolId}@school.edu`,
//         `9${String(800000000 + (i % 90000000)).padStart(9, "0")}`,
//         `201${i % 10}-0${(i % 9) + 1}-15`,
//         gender,
//         bloodGroup,
//         fakeAadhaar,
//         "Hindu",
//         "INDIAN",
//         "Tamil",
//         area,
//         "Dharmapuri",
//         "Dharmapuri",
//         "Tamil Nadu",
//         "636701",
//         `${area}, Dharmapuri`,
//         true,
//         area,
//         "Dharmapuri",
//         "Dharmapuri",
//         "Tamil Nadu",
//         "636701",
//         `${area}, Dharmapuri`,
//         `Mr. ${lastName}`,
//         `Mrs. ${lastName}`,
//         fatherOcc,
//         motherOcc,
//         `8${String(700000000 + (i % 90000000)).padStart(9, "0")}`,
//         `8${String(700000000 + (i % 90000000)).padStart(9, "0")}`,
//         `parent${i}@mail.com`,
//         `8${String(700000000 + (i % 90000000)).padStart(9, "0")}`,
//         "Father",
//         status,
//       ]);

//       // Execute batch query when chunk reaches batchSize or at loop completion
//       if (currentBatch.length === batchSize || i === totalStudents) {
//         const query = `
//           INSERT INTO students (
//             school_id, student_code, first_name, middle_name, last_name,
//             email, mobile_no, date_of_birth, gender, blood_group,
//             aadhaar_no, religion, nationality, mother_tongue,
//             current_area, current_city, current_district, current_state, current_postal_code, current_address,
//             current_address_same_as_permanent, permanent_area, permanent_city, permanent_district, permanent_state,
//             permanent_postal_code, permanent_address, father_name, mother_name, father_occupation,
//             mother_occupation, parent_mobile, alternate_mobile, parent_email, emergency_contact,
//             emergency_relationship, status
//           ) VALUES ?`;

//         await db.query(query, [currentBatch]);
//         console.log(`  ✓ Inserted batch (${i} / ${totalStudents} completed)`);
//         currentBatch = [];
//       }
//     }

//     await db.query("COMMIT");
//     console.log("✅ Successfully inserted 5,000 unique student records.");
//   } catch (error) {
//     await db.query("ROLLBACK");
//     console.error("❌ Seeding failed. Transaction rolled back.", error);
//   }
// };
import { getDB } from "../../config/db.js";

export const seedStudents = async () => {
  const db = getDB();
  const year = new Date().getFullYear();

  // 1. Fetch all schools in the system
  const [schools] = await db.query("SELECT id FROM schools");
  if (!schools.length) {
    console.log("⚠️ No schools found. Please seed schools first.");
    return;
  }

  // Name pools for dynamic, non-repeating student generation
  const maleFirstNames = [
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

  const femaleFirstNames = [
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
    "Sundaram",
    "Natarajan",
    "Pandi",
    "Kannan",
    "Venkatesh",
    "Srinivasan",
    "Ganesan",
    "Chandar",
    "Raman",
    "Velu",
  ];

  const initials = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "G",
    "K",
    "M",
    "N",
    "P",
    "R",
    "S",
    "T",
    "V",
  ];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
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
  const statuses = [
    "active",
    "active",
    "active",
    "active",
    "graduated",
    "transferred",
  ];

  const studentsPerSchool = 5000;
  const batchSize = 1000;

  console.log(
    `🚀 Found ${schools.length} school(s). Seeding ${studentsPerSchool} students for each...`,
  );

  // Loop through EVERY school in the database independently
  for (const school of schools) {
    const schoolId = school.id;

    // Fetch highest existing numeric suffix for student_code for this specific school
    const [rows] = await db.query(
      `SELECT student_code FROM students WHERE school_id = ? AND student_code LIKE ? ORDER BY id DESC LIMIT 1`,
      [schoolId, `STD-${year}-%`],
    );

    let nextNumber = 1;
    if (rows.length) {
      const lastCode = rows[0].student_code;
      const parts = lastCode.split("-");
      if (parts.length === 3 && !isNaN(parseInt(parts[2], 10))) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    let currentBatch = [];
    console.log(`⏳ Starting seeding for School ID: ${schoolId}...`);

    await db.query("START TRANSACTION");

    try {
      for (let i = 1; i <= studentsPerSchool; i++) {
        const gender = i % 2 === 0 ? "male" : "female";

        // Generate distinct full names
        const baseName =
          gender === "male"
            ? maleFirstNames[(i - 1) % maleFirstNames.length]
            : femaleFirstNames[(i - 1) % femaleFirstNames.length];

        const lastName = lastNames[(i - 1) % lastNames.length];

        const initialIndex = Math.floor(
          (i - 1) / (maleFirstNames.length + femaleFirstNames.length),
        );
        const middleInitial = initials[initialIndex % initials.length];
        const firstName =
          initialIndex > 0 ? `${baseName} ${middleInitial}.` : baseName;

        const studentCode = `STD-${year}-${String(nextNumber).padStart(5, "0")}`;
        nextNumber++;

        const bloodGroup = bloodGroups[i % bloodGroups.length];
        const area = areas[i % areas.length];
        const fatherOcc = fatherOccupations[i % fatherOccupations.length];
        const motherOcc = motherOccupations[i % motherOccupations.length];
        const status = statuses[i % statuses.length];

        // FIXED: Enforce globally unique 12-digit mock national ID across all schools
        // Uses schoolId offset to guarantee zero collision across multi-school database tables
        const uniqueOffset = schoolId * 1000000 + i;
        const mockNationalId = String(100000000000 + uniqueOffset).substring(
          0,
          12,
        );

        currentBatch.push([
          schoolId,
          studentCode,
          firstName,
          "",
          lastName,
          `student_${schoolId}_${i}_${Date.now()}@school.edu`, // Scoped unique email
          `9${String(800000000 + ((i + schoolId) % 90000000)).padStart(9, "0")}`,
          `201${i % 10}-0${(i % 9) + 1}-15`,
          gender,
          bloodGroup,
          mockNationalId,
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
          fatherOcc,
          motherOcc,
          `8${String(700000000 + ((i + schoolId) % 90000000)).padStart(9, "0")}`,
          `8${String(700000000 + ((i + schoolId) % 90000000)).padStart(9, "0")}`,
          `parent_${schoolId}_${i}@mail.com`,
          `8${String(700000000 + ((i + schoolId) % 90000000)).padStart(9, "0")}`,
          "Father",
          status,
        ]);

        // Bulk insert batch every batchSize or at completion
        if (currentBatch.length === batchSize || i === studentsPerSchool) {
          const query = `
            INSERT INTO students (
              school_id, student_code, first_name, middle_name, last_name,
              email, mobile_no, date_of_birth, gender, blood_group,
              aadhaar_no, religion, nationality, mother_tongue,
              current_area, current_city, current_district, current_state, current_postal_code, current_address,
              current_address_same_as_permanent, permanent_area, permanent_city, permanent_district, permanent_state,
              permanent_postal_code, permanent_address, father_name, mother_name, father_occupation,
              mother_occupation, parent_mobile, alternate_mobile, parent_email, emergency_contact,
              emergency_relationship, status
            ) VALUES ?`;

          await db.query(query, [currentBatch]);
          console.log(
            `  ✓ Inserted ${i} / ${studentsPerSchool} students for School ID ${schoolId}`,
          );
          currentBatch = [];
        }
      }

      await db.query("COMMIT");
      console.log(
        `✅ Completed seeding ${studentsPerSchool} students for School ID ${schoolId}\n`,
      );
    } catch (error) {
      await db.query("ROLLBACK");
      console.error(
        `❌ Seeding failed for School ID ${schoolId}. Transaction rolled back.`,
        error,
      );
    }
  }

  console.log("🎉 All schools successfully seeded!");
};
