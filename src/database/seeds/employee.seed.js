import { getDB } from "../../config/db.js";

export const seedEmployees = async () => {
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
  SELECT employee_code
  FROM employees
  WHERE employee_code LIKE ?
  ORDER BY id DESC
  LIMIT 1
  `,
    [`EMP-${schoolId}-${year}-%`],
  );

  let nextNumber = 1;

  if (rows.length) {
    const lastCode = rows[0].employee_code;
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
    "Mohan",
    "Raman",
    "Krishnan",
    "Subramanian",
    "Velu",
  ];

  const designations = [
    "Principal",
    "Vice Principal",
    "PG Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Kindergarten Teacher",
    "Physical Education Teacher",
    "Computer Instructor",
    "Lab Assistant",
    "Librarian",
    "Office Assistant",
    "Receptionist",
    "Accountant",
    "Office Superintendent",
    "Clerk",
    "Driver",
    "Security Guard",
    "Attender",
    "Cleaner",
  ];

  const departments = [
    "Administration",
    "Teaching",
    "Accounts",
    "Office",
    "Transport",
    "Library",
    "Laboratory",
    "Sports",
    "Maintenance",
  ];

  const qualifications = [
    "B.Ed",
    "M.Ed",
    "B.Sc",
    "M.Sc",
    "B.A",
    "M.A",
    "B.Com",
    "M.Com",
    "MBA",
    "MCA",
    "BCA",
    "Diploma",
    "ITI",
    "Ph.D",
  ];

  const banks = [
    "State Bank of India",
    "Indian Bank",
    "Canara Bank",
    "Indian Overseas Bank",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Karur Vysya Bank",
  ];

  const areas = [
    "Nallampalli",
    "Pennagaram",
    "Palacode",
    "Harur",
    "Karimangalam",
    "Morappur",
    "Papparapatti",
    "Kadathur",
    "Bommidi",
    "Dharmapuri Town",
  ];

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const statuses = [
    "active",
    "active",
    "active",
    "active",
    "active",
    "inactive",
    "resigned",
    "terminated",
  ];

  const relationships = [
    "wife",
    "husband",
    "father",
    "mother",
    "son",
    "daughter",
    "relative",
    "friend",
    "other",
  ];

  const employeesPerSchool = 30;

  for (const school of schools) {
    const schoolId = school.id;

    // Get last employee code
    const [rows] = await db.query(
      `
SELECT employee_code
FROM employees
WHERE school_id = ?
AND employee_code LIKE ?
ORDER BY id DESC
LIMIT 1
`,
      [schoolId, `EMP-${schoolId}-${year}-%`],
    );

    let nextNumber = 1;

    if (rows.length) {
      const lastCode = rows[0].employee_code;
      nextNumber = parseInt(lastCode.split("-")[2], 10) + 1;
    }

    for (let i = 1; i <= employeesPerSchool; i++) {
      const gender = Math.random() > 0.5 ? "male" : "female";

      const firstName =
        gender === "male"
          ? maleNames[Math.floor(Math.random() * maleNames.length)]
          : femaleNames[Math.floor(Math.random() * femaleNames.length)];

      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      const employeeCode = `EMP-${schoolId}-${year}-${String(nextNumber).padStart(4, "0")}`;
      nextNumber++;

      const bloodGroup =
        bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

      const area = areas[Math.floor(Math.random() * areas.length)];

      const designation =
        designations[Math.floor(Math.random() * designations.length)];

      const department =
        departments[Math.floor(Math.random() * departments.length)];

      const qualification =
        qualifications[Math.floor(Math.random() * qualifications.length)];

      const bank = banks[Math.floor(Math.random() * banks.length)];

      const relationship =
        relationships[Math.floor(Math.random() * relationships.length)];

      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const salary = Math.floor(Math.random() * 50000) + 18000;

      const experience = (Math.random() * 20).toFixed(1);

      const joiningDate = `20${18 + (i % 8)}-0${(i % 9) + 1}-15`;

      const aadhaar = `${schoolId}${String(100000000000 + i).slice(1)}`;

      const mobile = `9${String(800000000 + schoolId * 1000 + i).padStart(
        9,
        "0",
      )}`;

      const emergency = `8${String(700000000 + schoolId * 1000 + i).padStart(
        9,
        "0",
      )}`;

      const accountNumber = `32${String(
        1000000000000 + schoolId * 1000 + i,
      ).substring(0, 12)}`;

      const ifsc = `SBIN${String(100000 + i).padStart(6, "0")}`;

      await db.query(
        `
      INSERT IGNORE INTO employees
      (
        school_id,
        employee_code,
        first_name,
        last_name,
        email,
        mobile,
        gender,
        dob,
        blood_group,
        aadhaar_no,
        joining_date,
        designation,
        department,
        qualification,
        experience_years,
        salary,

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

        emergency_contact,
        emergency_relationship,

        bank_name,
        branch_name,
        account_number,
        account_type,
        ifsc_code,

        status
      )
      VALUES
      (
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?
      )
      `,
        [
          schoolId,
          employeeCode,
          firstName,
          lastName,
          `${firstName.toLowerCase()}${schoolId}${i}@school.com`,
          mobile,
          gender,
          `198${i % 10}-0${(i % 9) + 1}-15`,
          bloodGroup,
          aadhaar,
          joiningDate,
          designation,
          department,
          qualification,
          experience,
          salary,

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

          emergency,
          relationship,

          bank,
          `${area} Branch`,
          accountNumber,
          "Savings",
          ifsc,

          status,
        ],
      );
    }

    console.log(
      `✅ ${employeesPerSchool} employees seeded for school ${schoolId}`,
    );
  }

  console.log("✅ Employees seeded successfully");
};
